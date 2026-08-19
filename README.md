# dsh-jump-to-top

[![npm version](https://img.shields.io/npm/v/dsh-jump-to-top)](https://www.npmjs.com/package/dsh-jump-to-top)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个极简的 DeepSeek Harness (DSH) **Web 客户端插件**:在聊天视图右下角、官方「回到底部」按钮的**左侧**,增加**两个**悬浮按钮:「回到最顶部」和「回到上次发消息处」。

A tiny DeepSeek Harness web plugin: adds two floating buttons — **back-to-top** and **back-to-last-message** — to the chat view, placed immediately **left of** the official "back to bottom" button.

## 功能 / Features

- 当你**向上滚动**聊天记录(离开底部)时,两个按钮自动浮现,位于官方「回到底部」按钮左边;
  Both buttons appear as soon as you scroll up into history — left of the built-in toBottom button.
- **回到最顶部**:点击后平滑滚动回聊天最顶端(最早的消息);
  **Back to top**: smoothly scrolls to the very top (the oldest message).
- **回到上次发消息处**:跳回你当前阅读位置之前最近的那条消息——在读 AI 长回复时,它带你回到引出这段回复的那条提问;
  **Back to last message**: jumps to the closest user message above your current position — while reading a long reply, it takes you back to the question that produced it.
- **连续点击向上回溯**:不滚动界面,再点一次就回到上一条你发的消息(3 → 2 → 1);手动滚动后重新基于新位置定位;
  **Walk up by repeated clicks**: click again without scrolling to jump one message further up (3 → 2 → 1); manual scrolling resets to the viewport-relative target.
- 回到顶部后按钮自动隐藏;
  Hides again at the top.
- 纯前端实现:不访问任何主机服务,不做任何文件/进程/网络操作;
  Pure client-side: no host services, no file/process/network access.
- 遵循系统 `prefers-reduced-motion` 设置。
  Respects `prefers-reduced-motion`.

## 安装 / Install

```sh
# 从 npm 安装(推荐)
dsh plugin --profile web add dsh-jump-to-top

# 或直接从 GitHub 安装
dsh plugin --profile web add github:rjm1130/dsh-jump-to-top

# 或 clone 后本地安装(注意路径不要含空格)
git clone https://github.com/rjm1130/dsh-jump-to-top.git
dsh plugin --profile web add <克隆路径>
```

装完**重启 `dsh web`**(或按 Ctrl+F5 强制刷新页面重新加载 client bundle),打开任意聊天会话,向上滚动即可看到按钮。

卸载:

```sh
dsh plugin --profile web remove dsh-jump-to-top
```

## 工作原理 / How it works

- **主机端** (`lib/index.js`):空壳,保证 bundle 是合法的 profile 层,无任何主机行为;
- **浏览器端** (`lib/client.js`):把按钮作为第一个子元素插入官方 `.Md3f7G_toBottomSlot` 容器,因此天然位于「回到底部」按钮左侧,并复用官方 sticky 定位(自动避让输入框、右对齐);
- 滚动容器自适应两种布局:独立聊天的 `.Md3f7G_scroll`,以及外壳集成布局中带 `[data-conversation-scroll]` 的真实滚动容器;
- 通过 `MutationObserver` 跟随聊天视图懒加载与 React 重渲染,按钮始终保持在正确位置。

## 兼容性 / Compatibility

- 目标:DSH `0.1.0-rc.6`+ web 界面;
- 无运行时依赖、无 peer 依赖。

## 开发 / Development

```sh
git clone https://github.com/rjm1130/dsh-jump-to-top.git
dsh plugin --profile web add <克隆路径>
```

提交前请确保 `npm pack --dry-run` 与 `node --check` 通过。

## License

[MIT](LICENSE) © 2026 rjm1130
