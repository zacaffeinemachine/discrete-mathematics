import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Math is rendered at BUILD time: remark-math parses `$...$` in MDX and
// rehype-katex turns it into KaTeX markup, so no math JS ships with the
// page. One consequence worth knowing: a React island cannot use `$...$`,
// because the build never looks inside it -- islands use `<Tex>` instead.
//
// Astro 7 takes these through a shared processor rather than through
// per-integration plugin arrays; MDX then inherits them.
const processor = unified({
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
});

// Deployed to GitHub Pages under a project path, so `base` is set and every
// internal link in the site must be written as `${base}/...`. A bare `/foo`
// href works in dev and 404s in production.
export default defineConfig({
  site: "https://zacaffeinemachine.github.io",
  base: "/discrete-mathematics",
  integrations: [mdx(), react()],
  // The dev toolbar is fixed to the bottom centre of the viewport, which is
  // exactly where the puzzle boards sit -- it covers the tromino grid and the
  // Restless Row tiles and swallows clicks on them. It is worth more to be
  // able to use the puzzles in dev than to have the toolbar.
  devToolbar: { enabled: false },
  markdown: { processor },
  vite: { plugins: [tailwindcss()] },
});
