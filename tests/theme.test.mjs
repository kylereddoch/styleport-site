import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "parse5";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../dist/assets/theme.js", import.meta.url), "utf8");
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function all(node, tag) {
  return [...(node.tagName === tag ? [node] : []),
    ...(node.childNodes ?? []).flatMap(child => all(child, tag))];
}

test("renders a branded accessible appearance menu instead of a native select", () => {
  const document = parse(html);
  const buttons = all(document, "button");
  const trigger = buttons.find(node => attr(node, "id") === "appearance");
  const menu = all(document, "div").find(node => attr(node, "id") === "appearance-menu");
  const options = buttons.filter(node => attr(node, "role") === "menuitemradio");

  assert.ok(trigger);
  assert.equal(attr(trigger, "aria-haspopup"), "menu");
  assert.equal(attr(trigger, "aria-expanded"), "false");
  assert.equal(attr(trigger, "aria-controls"), "appearance-menu");
  assert.ok(menu);
  assert.equal(attr(menu, "role"), "menu");
  assert.notEqual(attr(menu, "hidden"), undefined);
  assert.deepEqual(options.map(node => attr(node, "data-appearance-value")),
    ["system", "light", "dark"]);
  assert.deepEqual(options.map(node => attr(node, "aria-checked")),
    ["true", "false", "false"]);
  assert.equal(all(document, "select").length, 0);
});

test("appearance script supports persistence, menu dismissal, and keyboard navigation", () => {
  for (const behavior of [
    "styleport-appearance",
    "aria-checked",
    "aria-expanded",
    "ArrowDown",
    "ArrowUp",
    "Escape",
    "pointerdown",
    "focusin",
  ]) assert.ok(script.includes(behavior), behavior);
  assert.match(script, /localStorage\.removeItem\(key\)/);
  assert.match(script, /localStorage\.setItem\(key, preference\)/);
  assert.match(script, /system\.addEventListener\("change", apply\)/);
});
