# dsh-wsl-winctl

> 从 WSL 枚举与控制 Windows 顶层窗口：激活、最小化、还原、移动与调整大小。

DeepSeek Harness 插件：Enumerate and control Windows top-level windows from WSL: activate, minimize, restore, move and resize.

属于 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)** 的一部分。

[English → README.md](./README.md)

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-winctl
```

## 用法

```
win_windows action=windows
win_windows action=activate titleContains="Notepad"
win_windows action=move pid=1234 x=0 y=0 width=1280 height=800
```

## 说明

Every action names its target by `pid` or `titleContains`; nothing acts on
whatever happens to be focused. `move` requires a position **and** a positive size —
a half-specified move is refused rather than guessed at.

## 依赖

- Windows + WSL，DeepSeek Harness 跑在 WSL 里。
- PowerShell 位于标准路径（插件自己会找）。

## 测试

```sh
npm test
```

单元测试在任何平台都能跑；实时测试在 WSL 之外自动跳过。

## 兼容性

| 字段 | 值 |
|------|----|
| **插件** | `dsh-wsl-winctl` **0.1.0** |
| **最低 dsh** | ≥ **0.1.2**（Web UI 一次性 `?token=`，Windows 中继 `:3081`） |
| **最新验证** | 以 [dsh-wsl-kit 兼容性](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) 为准（当前 **`0.2.0-rc.2`**）— 套件唯一真源 |
| **套件档位** | `full` 或单独安装 |

## 许可

MIT
