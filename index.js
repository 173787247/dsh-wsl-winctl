import { detectWsl } from "./lib/wsl-host.js";
import * as core from "./lib/winctl.js";
import { execute } from "./lib/winctl-exec.js";

export const name = "dsh-wsl-winctl";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:win_windows",
    order: 213,
    text: "Use win_windows to enumerate and control Windows top-level windows from WSL. Every action names its target by pid or title substring; nothing acts on whatever happens to be focused unless you ask for the foreground window.",
  });

  ctx.tools.register({
    name: "win_windows",
    description: "Enumerate and control Windows top-level windows from WSL: activate, minimize, maximize, restore, move and resize.",
    parameters: core.parameters(),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.format(value) }],
    },
    timeoutMs: Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 30_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) return { ok: false, action: args?.action ?? "windows", error: "not running in WSL" };
      try {
        return await execute(args, config);
      } catch (error) {
        return { ok: false, action: args?.action ?? "windows", error: String(error?.message ?? error) };
      }
    },
    presentCall: (args) => ({ card: "generic", title: `win_windows ${args?.action ?? "windows"}` }),
    presentResult: (_args, result) => ({ card: "generic", title: "win_windows", content: result?.content }),
  });
}
