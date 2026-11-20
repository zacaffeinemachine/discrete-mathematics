#!/usr/bin/env bash
# All the site's tests. Model tests run straight through node's type
# stripping; the widget tests need bundling first, because node cannot
# strip JSX.
set -euo pipefail
cd "$(dirname "$0")/.."

status=0
for f in boggle hanoi restless tromino; do
  node --experimental-strip-types "scripts/test-$f.ts" || status=1
done

# The Automata chapter's machine builder: every problem's language, its
# smallest machine, the check, and every <Tests> string on every page.
# Ported from the MathematicalThinking site; takes about two and a half
# minutes, almost all of it the suffix sweeps over 26 letters.
node --experimental-strip-types --no-warnings=ExperimentalWarning --test \
  --test-reporter=dot scripts/test-machines.ts || status=1

# The nondeterministic builder: sets of states, and the exact NFA check.
node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/test-nfa.ts || status=1

mkdir -p .testbuild
./node_modules/.bin/esbuild scripts/test-widgets.tsx \
  --bundle --platform=node --format=esm --jsx=automatic \
  --outfile=.testbuild/widgets.mjs --external:jsdom --log-level=error
node .testbuild/widgets.mjs || status=1

exit $status
