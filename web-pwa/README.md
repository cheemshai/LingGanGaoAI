# 海叔叔 Web PWA

这是 `海叔叔` 的静态网页版，可以部署到 GitHub Pages、Cloudflare Pages、Vercel 或任意静态站点服务。

已包含：

- PPT 大纲、文案、提示词生成
- AI 对话聊天
- 图片生成接口预留 OpenAI `gpt-image-2`
- 视频生成接入火山方舟 Ark Seedance 2.0 异步任务流程
- 热点追踪假数据和一键创作入口
- 结果版本历史和继续修改
- 历史、收藏、草稿、任务记录持久化
- 中文 / 英文切换
- 浅色 / 深色 / 跟随系统主题

## 本地运行

在 `web-pwa` 目录启动静态服务器：

```powershell
python -m http.server 5173
```

然后打开：

```text
http://localhost:5173
```

## 手机使用

部署到 HTTPS 地址后，用手机浏览器打开：

- iPhone Safari：分享按钮 > 添加到主屏幕
- Android Chrome：菜单 > 添加到主屏幕

## 注意

简单配置和 API Key 保存在浏览器本地 `localStorage`，历史记录、草稿、版本、图片/视频任务保存在 IndexedDB。纯前端直连模型 API 可能受到浏览器 CORS 限制；如果测试连接一直失败，可以把对应的 `API Base URL` 改成你自己的代理地址。

视频默认配置为火山方舟 Ark：

- Base URL: `https://ark.cn-beijing.volces.com/api/v3`
- Model: `doubao-seedance-2-0-260128`

不要把真实 API Key 写进源码或提交到公开仓库；请在设置页填写并保存到本机浏览器。
