import { runPowerShell } from "./wsl-host.js";
import { normalizeWindow, normalizeState, normalizeMove, assertAction, safeInt } from "./winctl.js";

const PRELUDE = `$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type @"
using System;using System.Runtime.InteropServices;
public class DshCtl {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h, int x, int y, int w, int ht, bool repaint);
  [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int index);
  [DllImport("user32.dll")] public static extern int SetWindowLong(IntPtr h, int index, int value);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int ht, uint flags);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
}
"@
# $pid is a read-only automatic variable in PowerShell (the current process
# id) - using it as a parameter name makes the function uncallable.
function Dsh-Find([int]$targetPid, [string]$title) {
  Add-Type -AssemblyName UIAutomationClient; Add-Type -AssemblyName UIAutomationTypes
  $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)
  $wins = [System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children, $cond)
  foreach ($w in $wins) {
    if ($w.Current.NativeWindowHandle -eq 0) { continue }
    if ($targetPid -gt 0 -and $w.Current.ProcessId -ne $targetPid) { continue }
    if ($title -ne '' -and $w.Current.Name -notlike "*$title*") { continue }
    return $w
  }
  return $null
}
function Dsh-I([double]$v) { if ([double]::IsNaN($v) -or [double]::IsInfinity($v)) { 0 } else { [int]$v } }
function Dsh-Info($w, $fg) {
  $r = $w.Current.BoundingRectangle
  $hw = [IntPtr]$w.Current.NativeWindowHandle
  # WS_EX_TOPMOST is 0x8 in the extended style.
  $ex = [DshCtl]::GetWindowLong($hw, -20)
  @{ pid = $w.Current.ProcessId; handle = $w.Current.NativeWindowHandle.ToString(); title = $w.Current.Name;
     minimized = [DshCtl]::IsIconic($hw); maximized = [DshCtl]::IsZoomed($hw); topmost = (($ex -band 0x8) -ne 0);
     x = (Dsh-I $r.X); y = (Dsh-I $r.Y); width = (Dsh-I $r.Width); height = (Dsh-I $r.Height);
     foreground = ($w.Current.NativeWindowHandle -eq $fg.ToInt64()) }
}
`;

export function buildScript(action, opts) {
  const fg = "$fg = [DshCtl]::GetForegroundWindow()";
  if (action === "windows") {
    return `${PRELUDE}
${fg}
Add-Type -AssemblyName UIAutomationClient; Add-Type -AssemblyName UIAutomationTypes
$cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)
$wins = [System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children, $cond)
$out = @()
foreach ($w in $wins) { if ($w.Current.NativeWindowHandle -eq 0) { continue } ; $out += (Dsh-Info $w $fg) }
ConvertTo-Json -Compress -Depth 4 @{ windows = @($out) }
`;
  }
  if (action === "state") {
    return `${PRELUDE}
${fg}
$w = Dsh-Find ${opts.pid} '${String(opts.titleContains).replace(/'/g, "''")}'
if ($null -eq $w) { ConvertTo-Json -Compress @{ error = 'no matching window' }; exit }
ConvertTo-Json -Compress -Depth 4 @{ window = (Dsh-Info $w $fg) }
`;
  }
  const SW = { activate: 5, minimize: 6, maximize: 3, restore: 9 };
  if (action !== "move" && action !== "topmost" && action !== "close" && SW[action] === undefined) {
    throw new Error(`no ShowWindow flag for action: ${action}`);
  }
  // Topmost has to go through SetWindowPos: the WS_EX_TOPMOST style bit alone is
  // a request the window manager may ignore, and reading it back then reports a
  // state the window is not actually in. HWND_TOPMOST is -1, HWND_NOTOPMOST -2.
  const call = action === "move"
    ? `[void][DshCtl]::MoveWindow($h, ${opts.x}, ${opts.y}, ${opts.width}, ${opts.height}, $true)`
    : action === "topmost"
      ? `[void][DshCtl]::SetWindowPos($h, [IntPtr]${opts.on ? -1 : -2}, 0, 0, 0, 0, 0x0003)`
      // Closing is a message, not a ShowWindow flag: WM_CLOSE asks the window to
      // close, which is what lets an application prompt to save first.
      : action === "close"
        ? `[void][DshCtl]::PostMessage($h, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)`
        : `[void][DshCtl]::ShowWindow($h, ${SW[action]})`;
  return `${PRELUDE}
${fg}
$w = Dsh-Find ${opts.pid} '${String(opts.titleContains).replace(/'/g, "''")}'
if ($null -eq $w) { ConvertTo-Json -Compress @{ error = 'no matching window' }; exit }
$h = [IntPtr]$w.Current.NativeWindowHandle
${call}
Start-Sleep -Milliseconds 200
$w2 = $w
ConvertTo-Json -Compress -Depth 4 @{ window = (Dsh-Info $w2 $fg) }
`;
}

export async function execute(args, config = {}) {
  const action = assertAction(args?.action ?? "windows");
  const opts = {
    pid: safeInt(args?.pid),
    titleContains: typeof args?.titleContains === "string" ? args.titleContains : "",
  };
  if (action === "move") Object.assign(opts, normalizeMove(args));
  if (action === "topmost") opts.on = args?.on !== false;
  const timeoutMs = Math.min(120_000, Math.max(1000, Number(config.timeoutMs) || 30_000));
  const { stdout } = await runPowerShell(buildScript(action, opts), { timeoutMs });
  const raw = JSON.parse(stdout.trim() || "{}");
  if (raw.error) return { ok: false, action, error: String(raw.error) };
  if (action === "windows") {
    const windows = (raw.windows ?? []).map(normalizeWindow);
    return { ok: true, action, count: windows.length, windows };
  }
  if (action === "state") return { ok: true, action, window: normalizeState(raw.window) };
  return { ok: true, action, window: normalizeState(raw.window) };
}
