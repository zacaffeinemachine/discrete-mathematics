import { useMemo } from "react";
import katex from "katex";

/**
 * Math inside a React island.
 *
 * KaTeX runs at BUILD time, over MDX only. A `$x$` written inside an island
 * therefore ships to the browser as two literal dollar signs. The
 * MathematicalThinking site sidesteps this with a small `*emphasis*` parser,
 * which was enough because its chapter used no symbols; these puzzles need
 * real math -- 2^n - 1, the inversion count I, board dimensions -- so the
 * island renders KaTeX itself.
 *
 * The cost is that katex's JS joins the island bundle. That is acceptable
 * here: the stylesheet is already loaded globally, and the alternative is
 * shipping mathematics as ASCII.
 */
interface Props {
  /** TeX source, without delimiters. */
  children: string;
  /** Display (centred, larger) rather than inline. */
  display?: boolean;
}

export default function Tex({ children, display = false }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        output: "html",
      });
    } catch {
      // Never let a malformed formula take the whole puzzle down with it.
      return children;
    }
  }, [children, display]);

  return (
    <span
      // eslint-disable-next-line react/no-danger -- KaTeX output, from a
      // literal in our own source; no user input reaches this.
      dangerouslySetInnerHTML={{ __html: html }}
      style={display ? { display: "block", textAlign: "center" } : undefined}
    />
  );
}
