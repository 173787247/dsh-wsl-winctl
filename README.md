# dsh-wsl-winctl

DeepSeek Harness plugin: Enumerate and control Windows top-level windows from WSL: activate, minimize, restore, move and resize.

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-winctl
```

## Usage

```
win_windows action=windows
win_windows action=activate titleContains="Notepad"
win_windows action=move pid=1234 x=0 y=0 width=1280 height=800
```

## Notes

Every action names its target by `pid` or `titleContains`; nothing acts on
whatever happens to be focused. `move` requires a position **and** a positive size —
a half-specified move is refused rather than guessed at.

## Requirements

- Windows with WSL, and DeepSeek Harness running inside it.
- PowerShell reachable at the standard path (the plugin finds it itself).

## Tests

```sh
npm test
```

The unit tests run anywhere. The live tests are skipped outside WSL.

## Compatibility

| Field | Value |
|-------|-------|
| **Plugin** | `dsh-wsl-winctl` **0.1.0** |
| **Minimum dsh** | ≥ **0.1.2** (web UI one-shot `?token=` on Windows relay `:3081`) |
| **Latest verified** | See [dsh-wsl-kit Compatibility](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) (currently **`0.2.0-rc.2`**) — single source of truth for the suite |
| **Kit set** | `full` or install alone |

## License

MIT
