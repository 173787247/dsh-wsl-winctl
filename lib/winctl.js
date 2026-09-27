// Window lifecycle control. Every command names its target explicitly; nothing
// here acts on "whatever happens to be focused".
export const ACTIONS = ["windows", "activate", "minimize", "maximize", "restore", "move", "close"];

export const ALLOWED_ACTIONS = new Set(ACTIONS);

export function assertAction(action) {
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error(`unsupported action: ${String(action)} (expected one of ${ACTIONS.join(", ")})`);
  }
  return action;
}

export function safeInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/** Moving a window needs both a position and a size; a half-specified move is refused. */
export function normalizeMove(args) {
  const x = safeInt(args?.x, NaN), y = safeInt(args?.y, NaN);
  const width = safeInt(args?.width, NaN), height = safeInt(args?.height, NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("move requires x and y");
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error("move requires a positive width and height");
  }
  return { x, y, width, height };
}

export function normalizeWindow(w) {
  const pid = Number(w?.pid);
  return {
    pid: Number.isFinite(pid) ? pid : 0,
    handle: String(w?.handle ?? ""),
    title: String(w?.title ?? ""),
    minimized: Boolean(w?.minimized),
    x: safeInt(w?.x), y: safeInt(w?.y),
    width: safeInt(w?.width), height: safeInt(w?.height),
    foreground: Boolean(w?.foreground),
  };
}

export function format(v) {
  const lines = [`win_windows ok=${v.ok} action=${v.action}${v.count !== undefined ? ` count=${v.count}` : ""}`];
  for (const w of v.windows ?? []) {
    lines.push(`  pid=${w.pid} ${w.foreground ? "[fg]" : "    "} ${w.minimized ? "[min] " : ""}${w.width}x${w.height} ${w.title || "(untitled)"}`);
  }
  if (v.window) lines.push(`  target: pid=${v.window.pid} "${v.window.title}"`);
  if (v.error) lines.push(`error: ${v.error}`);
  return lines.join("\n");
}

export function parameters() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      action: { type: "string", enum: ACTIONS, description: "windows: list. activate/minimize/maximize/restore/close: act on the target. move: reposition and resize." },
      pid: { type: "number", description: "Target process id. Defaults to the foreground window." },
      titleContains: { type: "string", description: "Pick the target by window title instead of pid." },
      x: { type: "number", description: "move: left edge in screen pixels." },
      y: { type: "number", description: "move: top edge in screen pixels." },
      width: { type: "number", description: "move: width in pixels." },
      height: { type: "number", description: "move: height in pixels." },
    },
  };
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}
