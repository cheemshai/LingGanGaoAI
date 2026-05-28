# 灵感稿 AI

SwiftUI + SwiftData 的 iOS 17+ 本地 AI 生成助手源码。DeepSeek API Key 保存到 Keychain，历史记录保存到 SwiftData，不需要登录系统或后端服务器。

## 目录结构

```text
project.yml
.github/workflows/ios-testflight.yml
ci/GITHUB_ACTIONS_IOS_SIGNING.md
LingGanGaoAI/
  App/
    LingGanGaoAIApp.swift
    RootView.swift
    AppRoute.swift
  Models/
    AppSettings.swift
    GenerationRecord.swift
    GenerationType.swift
  Services/
    DeepSeekService.swift
    KeychainService.swift
    PromptBuilder.swift
  Utilities/
    DateFormatter+App.swift
    String+Trimmed.swift
  Views/
    Common/
    Generators/
    History/
    Home/
    Settings/
  Supporting/
    Info.plist
  Assets.xcassets/
```

## 在 Xcode 中运行

1. Xcode 新建 iOS App 项目，Product Name 建议填 `LingGanGaoAI`，Interface 选择 SwiftUI，Minimum Deployments 设为 iOS 17.0。
2. 勾选 SwiftData，或创建项目后在 target 里保持 SwiftData 可用。
3. 将本目录下的 `LingGanGaoAI/` 源码文件夹拖入 Xcode 项目，勾选 `Copy items if needed` 和 App target。
4. 在 target 的 Build Settings 中确认：
   - `iOS Deployment Target` 为 `17.0` 或更高。
   - `Generate Info.plist File` 设为 `No`。
   - `Info.plist File` 指向 `LingGanGaoAI/Supporting/Info.plist`。
   - Bundle Identifier 改成你自己的反向域名。
5. 在 `Assets.xcassets` 中补齐 AppIcon。TestFlight 必须有合规 App 图标。
6. 运行到模拟器或真机，进入设置页填写 DeepSeek API Key，点击“测试连接”。

## Info.plist 注意事项

- DeepSeek 默认走 HTTPS，不需要 App Transport Security 例外。
- `ITSAppUsesNonExemptEncryption` 已设置为 `false`，表示仅使用系统 HTTPS/TLS 能力，没有自研加密。
- TestFlight 前请按你的团队信息调整 Bundle Identifier、版本号和构建号。

## Archive 并上传 TestFlight

1. 在 Xcode 选择 App target，Signing & Capabilities 中选择 Apple Developer Team。
2. 选择真机或 `Any iOS Device`。
3. 菜单选择 `Product > Archive`。
4. Archive 完成后打开 Organizer，选择 `Distribute App`。
5. 选择 `App Store Connect`，再选择 `Upload`。
6. 上传成功后到 App Store Connect 的 TestFlight 页面等待处理完成。
7. 添加内部测试员或外部测试员；外部测试需要提交 Beta App Review。

## GitHub Actions 自动打包

本项目已包含：

- `project.yml`：GitHub Actions 上用 XcodeGen 生成 Xcode 工程。
- `.github/workflows/ios-testflight.yml`：macOS runner 自动签名、Archive、导出 IPA、可选上传 TestFlight。
- `ci/GITHUB_ACTIONS_IOS_SIGNING.md`：证书、provisioning profile、App Store Connect API Key 和 GitHub Secrets 配置说明。

快速流程：

1. 把整个目录推送到 GitHub 仓库。
2. 按 `ci/GITHUB_ACTIONS_IOS_SIGNING.md` 配好 GitHub Secrets。
3. 到 GitHub 仓库 `Actions > iOS TestFlight > Run workflow`。
4. `upload_to_testflight` 选择 `true` 时，workflow 会上传到 App Store Connect。
5. App Store Connect 处理完成后，在 TestFlight 添加你的 Apple ID 邮箱为测试员。

## DeepSeek 配置

默认 Base URL：`https://api.deepseek.com`

默认接口：`POST /chat/completions`

默认模型：`deepseek-v4-flash`

可选高质量模型：`deepseek-v4-pro`
