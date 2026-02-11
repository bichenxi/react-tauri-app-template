# AI Nexus

基于 Tauri 2 + React 的桌面智能助手：支持与 AI 对话、文件操作（创建/读取/列出/删除）、系统设置（黑暗模式、亮度、屏保）等，通过 OpenAI 兼容 API 进行流式对话与工具调用。

## 功能概览

- **对话**：多轮对话、流式回复、支持切换模型与 API 配置。
- **文件能力**：在桌面、文档、下载目录下创建、读取、列出、删除文件及文件夹（删除会移至回收站）。
- **系统设置**：切换系统黑暗/浅色模式、调节屏幕亮度（Windows/Linux）、启动屏保或打开屏保设置。
- **设置页**：配置 API 地址与密钥、选择模型、切换应用主题；在「电脑设置」中可一键切换系统外观、亮度与屏保。

## 技术栈

- **前端**：React 19、TypeScript、Vite 7、UnoCSS、Zustand、React Router
- **桌面**：Tauri 2（Rust 后端）
- **AI**：OpenAI 兼容 API（流式 Chat Completions + Function Calling）

## 环境要求

- [Bun](https://bun.sh/)（推荐）或 Node.js 18+
- [Rust](https://www.rust-lang.org/)（Tauri 构建）
- **macOS**：Xcode Command Line Tools  
- **Windows**：Visual Studio 构建工具、WebView2  
- **Linux**：`libwebkit2gtk-4.1-dev` 等（见下方）

## 快速开始

### 安装依赖

```bash
bun install
```

### 开发模式

```bash
bun tauri dev
```

前端热更新，Tauri 窗口会加载 `http://localhost:1420`。

### 构建安装包

```bash
bun run build    # 构建前端
bun tauri build  # 构建 Tauri 应用并生成安装包
```

产物在 `src-tauri/target/release/bundle/`（如 `.dmg`、`.msi`、`.AppImage` 等）。

## 使用说明

### 1. 配置 AI 模型

首次使用需在 **设置** 中填写：

- **API 地址**：OpenAI 兼容的 base URL（如 `https://api.deepseek.com`），会自动补全 `/chat/completions`。
- **API Key**：对应服务的密钥。
- **模型**：如 `deepseek-chat`、`gpt-4o` 等，按你的服务选择。

保存后即可在对话页发起请求。

### 2. 对话与工具

- 在 **对话** 页输入问题或指令，AI 会流式回复。
- 当涉及文件或系统设置时，AI 会调用工具执行，例如：
  - 「在桌面创建一个 todo.txt」
  - 「把桌面上的 readme 删掉」
  - 「切换成暗色模式」「调亮一点」「打开屏保」
- 工具执行结果会以系统消息形式展示在对话中。

### 3. 电脑设置（设置页）

在 **设置** 的「电脑设置」区域可：

- **系统外观**：开关切换系统级黑暗/浅色模式（macOS / Windows）。
- **屏幕亮度**：滑块调节亮度（仅 Windows/Linux；macOS 需用系统设置或快捷键）。
- **屏保**：「启动屏保」立即进入屏保（Windows 为锁屏），「屏保设置」打开系统屏保/锁屏设置。

### 4. 应用主题

设置页底部可切换 **应用内** 的浅色/深色主题，与系统外观独立。

## Linux 依赖（Ubuntu / Debian）

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

其他发行版请参考 [Tauri 文档](https://v2.tauri.app/start/install/linux/)。

## 项目结构（简要）

```
├── src/                    # 前端 (React + Vite)
│   ├── pages/              # 对话、设置等页面
│   ├── skills/builtin/     # 内置工具：文件、系统外观、亮度、屏保
│   ├── lib/                # AI 流式请求、工具定义与执行
│   └── stores/             # 配置、对话、应用状态
├── src-tauri/              # Tauri 2 后端 (Rust)
│   ├── src/commands/       # 前端可调用的命令：文件、系统设置
│   └── tauri.conf.json     # 应用与构建配置
├── .github/workflows/      # GitHub Actions CI
└── README.md
```

## CI（GitHub Actions）

仓库内已配置 `.github/workflows/ci.yml`：

- **触发**：推送到 `master` / `main` 或向该分支提 PR 时运行。
- **内容**：在 Ubuntu、macOS、Windows 上安装依赖并执行 `bun run build` 与 `bun tauri build`，用于检查多平台能否正常构建。

如需在推送时自动打 Release 安装包，可参考 [Tauri 官方 GitHub 发布文档](https://v2.tauri.app/distribute/pipelines/github/) 增加基于 `tauri-action` 的发布流程。

## 推荐 IDE

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 许可证

与项目根目录所选许可证一致（见仓库说明）。
