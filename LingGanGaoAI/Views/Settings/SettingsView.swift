import SwiftData
import SwiftUI

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(AppSettings.self) private var settings
    @Query private var records: [GenerationRecord]

    @State private var apiKey = ""
    @State private var statusMessage: String?
    @State private var isTesting = false
    @State private var showClearConfirmation = false

    private let keychain = KeychainService.shared

    var body: some View {
        @Bindable var settings = settings

        Form {
            Section("DeepSeek") {
                SecureField("DeepSeek API Key", text: $apiKey)
                    .textContentType(.password)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                Button {
                    saveAPIKey()
                } label: {
                    Label("保存 API Key", systemImage: "key")
                }

                TextField("API Base URL", text: $settings.apiBaseURL)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                Picker("模型", selection: $settings.modelName) {
                    ForEach(DeepSeekModel.allCases) { model in
                        Text(model.displayName).tag(model.rawValue)
                    }
                }

                LabeledContent("当前模型状态", value: settings.modelStatusText)
            }

            Section("连接") {
                Button {
                    Task { await testConnection() }
                } label: {
                    HStack {
                        if isTesting {
                            ProgressView()
                        } else {
                            Image(systemName: "antenna.radiowaves.left.and.right")
                        }

                        Text(isTesting ? "测试中" : "测试连接")
                    }
                }
                .disabled(isTesting)

                if let statusMessage {
                    Text(statusMessage)
                        .font(.footnote)
                        .foregroundStyle(statusMessage.contains("成功") || statusMessage.contains("保存") ? .green : .red)
                }
            }

            Section("历史记录") {
                LabeledContent("当前记录", value: "\(records.count) 条")

                Button(role: .destructive) {
                    showClearConfirmation = true
                } label: {
                    Label("清空历史记录", systemImage: "trash")
                }
                .disabled(records.isEmpty)
            }
        }
        .navigationTitle("设置")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            loadAPIKey()
        }
        .confirmationDialog("清空历史记录？", isPresented: $showClearConfirmation, titleVisibility: .visible) {
            Button("清空", role: .destructive) {
                clearHistory()
            }

            Button("取消", role: .cancel) {}
        } message: {
            Text("此操作不会删除 API Key。")
        }
    }

    private func loadAPIKey() {
        apiKey = (try? keychain.readAPIKey()) ?? ""
    }

    private func saveAPIKey() {
        do {
            try keychain.saveAPIKey(apiKey)
            apiKey = apiKey.trimmed
            statusMessage = apiKey.isEmpty ? "API Key 已删除" : "API Key 已保存"
        } catch {
            statusMessage = error.localizedDescription
        }
    }

    @MainActor
    private func testConnection() async {
        isTesting = true
        statusMessage = nil
        defer { isTesting = false }

        do {
            try keychain.saveAPIKey(apiKey)
            let service = DeepSeekService(configuration: settings.makeDeepSeekConfiguration())
            _ = try await service.testConnection()
            statusMessage = "连接成功，当前模型可用"
        } catch {
            statusMessage = error.localizedDescription
        }
    }

    private func clearHistory() {
        for record in records {
            modelContext.delete(record)
        }

        do {
            try modelContext.save()
            statusMessage = "历史记录已清空"
        } catch {
            statusMessage = error.localizedDescription
        }
    }
}
