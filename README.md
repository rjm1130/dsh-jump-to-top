# dsh-jump-to-top

一个极简的 DeepSeek Harness(DSH)Web 客户端插件:在聊天视图右下角、官方「回到底部」按钮的**左侧**,增加一个悬浮的「回到最顶部」按钮。

![dsh-jump-to-top](https://img.shields.io/badge/dsh--jump--to--top-0.1.0-blue)

## 功能

- 当你**向上滚动**聊天记录(离开底部)时,按钮自动浮现,位置在官方「回到底部」按钮左边;
- 点击后平滑滚动回聊天最顶端(最早的消息);
- 回到顶部后按钮自动隐藏;
- 纯前端实现:不访问任何主机服务,不做任何文件/进程/网络操作;
- 遵循系统 `prefers-reduced-motion` 设置。

## 安装

```sh
dsh plugin --profile web add dsh-jump-to-top
```

> 也可以从插件市场安装,或把本仓库 clone 到本地后 `dsh plugin --profile web add <路径>`(注意路径不要含空格)。

装完**重启 `dsh web`**(或按 Ctrl+F5 强制刷新页面重新加载 client bundle),打开任意聊天会话,向上滚动即可看到按钮。

卸载:

```sh
dsh plugin --profile web remove dsh-jump-to-top
```

## 工作原理

- **主机端**(`lib/index.js`)只是一个空壳,保证 bundle 是合法的 profile 层,无任何主机行为;
- **浏览器端**(`lib/client.js`)把按钮作为第一个子元素插入官方 `.Md3f7G_toBottomSlot` 容器,因此天然位于「回到底部」按钮左侧,并复用官方 sticky 定位(自动避让输入框、右对齐);
- 滚动容器自适应两种布局:独立聊天的 `.Md3f7G_scroll`,以及外壳集成布局中带 `[data-conversation-scroll]` 的真实滚动容器;
- 通过 `MutationObserver` 跟随聊天视图懒加载与 React 重渲染,按钮始终保持在正确位置。

## 兼容性

- 目标:DSH `0.1.0-rc.6`+ web 界面;
- 无运行时依赖、无 peer 依赖。

## 开发

```sh
git clone https://github.com/rjm1130/dsh-jump-to-top.git
dsh plugin --profile web add <克隆路径>
```

## License

MIT
