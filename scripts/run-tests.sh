#!/usr/bin/env bash
# All the site's tests. Model tests run straight through node's type
# stripping; the widget tests need bundling first, because node cannot
# strip JSX.
set -euo pipefail
cd "$(dirname "$0")/.."

status=0
for f in hanoi restless tromino; do
  node --experimental-strip-types "scripts/test-$f.ts" || status=1
done

mkdir -p .testbuild
./node_modules/.bin/esbuild scripts/test-widgets.tsx \
  --bundle --platform=node --format=esm --jsx=automatic \
  --outfile=.testbuild/widgets.mjs --external:jsdom --log-level=error
node .testbuild/widgets.mjs || status=1

exit $status
