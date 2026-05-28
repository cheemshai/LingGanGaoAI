# 灵感稿 AI

AI PPT 大纲、文案、提示词生成助手。仓库同时包含 iOS SwiftUI 版和静态 Web PWA 版。

## Web PWA

网页版在 `web-pwa/` 目录，可以直接部署到 GitHub Pages、Cloudflare Pages、Vercel 或任意静态站点服务。

本地运行：

```powershell
cd web-pwa
python -m http.server 5173
```

然后打开：

```text
http://localhost:5173
```

手机使用：

- iPhone Safari 打开 HTTPS 部署地址后，点分享按钮，选择“添加到主屏幕”。
- Android Chrome 打开 HTTPS 部署地址后，菜单里选择“添加到主屏幕”。

注意：Web 版把 DeepSeek API Key 保存在浏览器本地 `localStorage`。纯前端直连 DeepSeek API 可能遇到浏览器 CORS 限制，如果测试连接一直失败，可以把设置里的 `API Base URL` 改成自己的代理地址。

## iOS SwiftUI

iOS 原生版在 `LingGanGaoAI/` 目录，使用：

- SwiftUI
- iOS 17+
- SwiftData 本地历史记录
- URLSession 调用 DeepSeek API
- Keychain 保存 DeepSeek API Key
- 无登录系统
- 无后端服务器

## GitHub Actions

`.github/workflows/ios-testflight.yml` 包含 iOS 自动化流程：

- push 到 `main` 时运行免签名构建检查
- 手动 `Run workflow` 时执行 Archive、导出 IPA、可选上传 TestFlight

TestFlight 仍需要 Apple Developer Program、证书、Provisioning Profile 和 App Store Connect API Key。配置说明见 `ci/GITHUB_ACTIONS_IOS_SIGNING.md`。

## DeepSeek 默认配置

```text
API Base URL: https://api.deepseek.com
接口: POST /chat/completions
默认模型: deepseek-v4-flash
高质量模型: deepseek-v4-pro
```
