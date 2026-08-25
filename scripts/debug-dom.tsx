import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window; g.document = dom.window.document;
Object.defineProperty(g, "navigator", { value: dom.window.navigator, configurable: true, writable: true });
g.HTMLElement = dom.window.HTMLElement; g.Element = dom.window.Element; g.Node = dom.window.Node;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (cb: any) => dom.window.setTimeout(() => cb(0), 0);
g.cancelAnimationFrame = (id: any) => dom.window.clearTimeout(id);
g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
g.IS_REACT_ACT_ENVIRONMENT = true;

const { render } = await import("@testing-library/react");
const { act } = await import("react");
const React = (await import("react")).default;
const T = (await import("../src/components/games/TigersAndSheep.tsx")).default;

await act(async () => { render(React.createElement(T)); });
const spans = [...document.querySelectorAll("span")];
console.log("span count:", spans.length);
spans.slice(0, 14).forEach((s, i) =>
  console.log(i, JSON.stringify(s.textContent?.slice(0, 30)), "| parent:", s.parentElement?.className.slice(0, 30))
);

process.exit(0);
