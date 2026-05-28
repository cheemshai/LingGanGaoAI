# GitHub Actions 自动打包和 TestFlight 上传

这个项目使用 GitHub Actions 的 macOS runner 完成：

1. 安装 XcodeGen。
2. 根据 `project.yml` 生成 `LingGanGaoAI.xcodeproj`。
3. 导入 iOS Distribution 证书。
4. 导入 App Store provisioning profile。
5. Archive。
6. 导出 `.ipa`。
7. 手动触发时可上传到 App Store Connect/TestFlight。

## 需要准备

- Apple Developer Program 账号。
- App Store Connect 中已创建 App，Bundle ID 与 `APP_BUNDLE_ID` 一致。
- App Store Connect API Key，权限建议至少包含 App Manager 或 Developer。
- iOS Distribution 证书，导出为 `.p12`。
- App Store 类型的 provisioning profile，下载为 `.mobileprovision`。

## GitHub Secrets

在 GitHub 仓库进入 `Settings > Secrets and variables > Actions > New repository secret`，添加：

```text
APP_BUNDLE_ID
APPLE_TEAM_ID
IOS_BUILD_KEYCHAIN_PASSWORD
IOS_DISTRIBUTION_CERTIFICATE_BASE64
IOS_DISTRIBUTION_CERTIFICATE_PASSWORD
IOS_PROVISIONING_PROFILE_BASE64
APP_STORE_CONNECT_API_KEY_ID
APP_STORE_CONNECT_API_ISSUER_ID
APP_STORE_CONNECT_API_KEY_BASE64
```

说明：

- `APP_BUNDLE_ID`：例如 `com.yourname.LingGanGaoAI`。
- `APPLE_TEAM_ID`：Apple Developer Team ID。
- `IOS_BUILD_KEYCHAIN_PASSWORD`：CI 临时 keychain 密码，自定义一串强密码即可。
- `IOS_DISTRIBUTION_CERTIFICATE_BASE64`：`.p12` 文件转 Base64。
- `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`：导出 `.p12` 时设置的密码。
- `IOS_PROVISIONING_PROFILE_BASE64`：`.mobileprovision` 文件转 Base64。
- `APP_STORE_CONNECT_API_KEY_ID`：App Store Connect API Key ID。
- `APP_STORE_CONNECT_API_ISSUER_ID`：Issuer ID。
- `APP_STORE_CONNECT_API_KEY_BASE64`：`.p8` 私钥文件转 Base64。

## 在 Windows 11 上生成 Base64

PowerShell 示例：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\distribution.p12")) | Set-Clipboard
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\profile.mobileprovision")) | Set-Clipboard
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\AuthKey_XXXXXXXXXX.p8")) | Set-Clipboard
```

执行后到 GitHub Secret 输入框中粘贴。

## 触发打包

1. 把本项目推送到 GitHub 仓库的 `main` 分支。
2. 打开 GitHub 仓库的 `Actions` 页。
3. 选择 `iOS TestFlight` workflow。
4. 点击 `Run workflow`。
5. `upload_to_testflight` 选 `true` 时，成功导出的 IPA 会上传 App Store Connect。
6. App Store Connect 处理完成后，在 TestFlight 页面添加测试员。

## 只导出 IPA，不上传

手动触发时将 `upload_to_testflight` 设为 `false`。workflow 会生成 artifact：`LingGanGaoAI-ipa`。

## 常见失败

- `No profiles for ... were found`：provisioning profile 的 Bundle ID 不匹配。
- `No signing certificate "iOS Distribution" found`：`.p12` 不是发布证书，或密码不对。
- `Authentication failed`：App Store Connect API Key ID / Issuer ID / `.p8` 不匹配。
- `Asset validation failed`：App Store Connect 里没有创建对应 Bundle ID 的 App，或版本号/构建号重复。
