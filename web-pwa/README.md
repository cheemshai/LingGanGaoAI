# 灵感稿 AI Web PWA

这是 `灵感稿 AI` 的静态网页版，可以部署到 GitHub Pages、Cloudflare Pages、Vercel 或任意静态站点服务。

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

API Key 保存在浏览器本地 `localStorage`。纯前端直连 DeepSeek API 可能受到浏览器 CORS 限制；如果测试连接一直失败，可以把 `API Base URL` 改成你自己的代理地址。
