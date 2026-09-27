import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ACTIONS, assertAction, normalizeMove, normalizeWindow } from "../lib/winctl.js";

describe("action guard", () => {
  it("accepts every documented action", () => {
    for (const a of ACTIONS) assert.equal(assertAction(a), a);
  });
  it("refuses an unknown action", () => {
    assert.throws(() => assertAction("destroy"), /unsupported action/);
  });
});

describe("normalizeMove", () => {
  it("accepts a complete move", () => {
    assert.deepEqual(normalizeMove({ x: 1, y: 2, width: 3, height: 4 }), { x: 1, y: 2, width: 3, height: 4 });
  });
  it("refuses a move with no position", () => {
    assert.throws(() => normalizeMove({ width: 3, height: 4 }), /requires x and y/);
  });
  it("refuses a move with no size", () => {
    assert.throws(() => normalizeMove({ x: 1, y: 2 }), /positive width and height/);
  });
  it("refuses a zero or negative size rather than guessing", () => {
    assert.throws(() => normalizeMove({ x: 1, y: 2, width: 0, height: 4 }), /positive width and height/);
    assert.throws(() => normalizeMove({ x: 1, y: 2, width: 3, height: -1 }), /positive width and height/);
  });
});

describe("normalizeWindow", () => {
  it("coerces and defaults", () => {
    const w = normalizeWindow({ pid: "9", title: "x" });
    assert.equal(w.pid, 9);
    assert.equal(w.title, "x");
    assert.equal(w.width, 0);
    assert.equal(w.minimized, false);
  });
  it("survives an empty object", () => {
    assert.equal(normalizeWindow({}).pid, 0);
    assert.equal(normalizeWindow(undefined).handle, "");
  });
});
