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

// ── state / topmost / close, added after the first release ──────────────────
import { normalizeState } from "../lib/winctl.js";

describe("the action set", () => {
  it("covers every action the parameter enum advertises", () => {
    assert.deepEqual(ACTIONS, ["windows", "state", "activate", "minimize", "maximize", "restore", "move", "topmost", "close"]);
  });
});

describe("normalizeState", () => {
  it("carries the flags a caller checks after acting", () => {
    const s = normalizeState({ pid: 1, minimized: true, maximized: false, topmost: true, foreground: false });
    assert.equal(s.minimized, true);
    assert.equal(s.topmost, true);
    assert.equal(s.maximized, false);
  });
  it("defaults every flag to false rather than undefined", () => {
    const s = normalizeState({ pid: 1 });
    for (const k of ["minimized", "maximized", "topmost", "foreground"]) assert.equal(s[k], false, k);
  });
  it("keeps the geometry fields from normalizeWindow", () => {
    const s = normalizeState({ pid: 1, width: "800", height: 600, title: "x" });
    assert.equal(s.width, 800);
    assert.equal(s.height, 600);
    assert.equal(s.title, "x");
  });
});
