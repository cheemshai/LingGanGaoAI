import SwiftData
import SwiftUI

struct PromptGeneratorView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(AppSettings.self) private var settings

    @State private var goal = ""
    @State private var platform = "通用"
    @State private var targetStyle = ""
    @State private var detailLevel = "标准"
    @State private var result = ""
    @State private var errorMessage: String?
    @State private var isGenerating = false

    private let platforms = ["Codex", "Canva", "豆包", "Gemini", "ChatGPT", "通用"]
    private let detailLevels = ["简短", "标准", "超详细"]

    private var canGenerate: Bool {
        !goal.trimmed.isEmpty
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionCard("输入", systemImage: "wand.and.stars") {
                    TextField("想生成什么内容", text: $goal, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...6)

                    Picker("使用平台", selection: $platform) {
                        ForEach(platforms, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                    .pickerStyle(.menu)

                    TextField("目标风格", text: $targetStyle)
                        .textFieldStyle(.roundedBorder)

                    Picker("详细程度", selection: $detailLevel) {
                        ForEach(detailLevels, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                LoadingButton(title: "生成提示词", systemImage: "sparkles", isLoading: isGenerating) {
                    Task { await generate() }
                }
                .disabled(!canGenerate || isGenerating)

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                if !result.isEmpty {
                    GeneratedResultSection(content: result)
                }
            }
            .padding()
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("提示词生成")
        .navigationBarTitleDisplayMode(.inline)
    }

    @MainActor
    private func generate() async {
        guard canGenerate else {
            errorMessage = "请输入想生成的内容"
            return
        }

        isGenerating = true
        errorMessage = nil
        defer { isGenerating = false }

        let userPrompt = PromptBuilder.buildPromptGeneratorPrompt(
            goal: goal.trimmed,
            platform: platform,
            targetStyle: targetStyle.trimmed.isEmpty ? "不限" : targetStyle.trimmed,
            detailLevel: detailLevel
        )

        do {
            let service = DeepSeekService(configuration: settings.makeDeepSeekConfiguration())
            let output = try await service.sendMessage(
                systemPrompt: PromptBuilder.promptSystemPrompt,
                userPrompt: userPrompt
            )
            result = output
            saveRecord(inputPrompt: userPrompt, output: output)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func saveRecord(inputPrompt: String, output: String) {
        let record = GenerationRecord(
            type: .prompt,
            title: goal.trimmed,
            inputPrompt: inputPrompt,
            outputContent: output,
            modelName: settings.modelName
        )
        modelContext.insert(record)
        try? modelContext.save()
    }
}
