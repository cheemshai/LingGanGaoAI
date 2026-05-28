import SwiftData
import SwiftUI

struct PPTOutlineView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(AppSettings.self) private var settings

    @State private var topic = ""
    @State private var pageCount = 10
    @State private var scenario = "课堂汇报"
    @State private var customScenario = ""
    @State private var style = "商务"
    @State private var needsSpeakerNotes = false
    @State private var result = ""
    @State private var errorMessage: String?
    @State private var isGenerating = false

    private let scenarios = ["课堂汇报", "毕设答辩", "商业路演", "社会实践", "行业分析", "自定义"]
    private let styles = ["商务", "学术", "红色主题", "科技风", "简洁风", "高级感"]

    private var finalScenario: String {
        scenario == "自定义" ? customScenario.trimmed : scenario
    }

    private var canGenerate: Bool {
        !topic.trimmed.isEmpty && !finalScenario.isEmpty
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionCard("输入", systemImage: "square.and.pencil") {
                    TextField("PPT 主题", text: $topic, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(2...4)

                    Stepper("页数：\(pageCount)", value: $pageCount, in: 4...30)

                    Picker("使用场景", selection: $scenario) {
                        ForEach(scenarios, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                    .pickerStyle(.menu)

                    if scenario == "自定义" {
                        TextField("自定义使用场景", text: $customScenario)
                            .textFieldStyle(.roundedBorder)
                    }

                    Picker("风格", selection: $style) {
                        ForEach(styles, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                    .pickerStyle(.menu)

                    Toggle("需要演讲稿", isOn: $needsSpeakerNotes)
                }

                LoadingButton(title: "生成 PPT 大纲", systemImage: "sparkles", isLoading: isGenerating) {
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
        .navigationTitle("PPT 大纲生成")
        .navigationBarTitleDisplayMode(.inline)
    }

    @MainActor
    private func generate() async {
        guard canGenerate else {
            errorMessage = "请填写 PPT 主题和使用场景"
            return
        }

        isGenerating = true
        errorMessage = nil
        defer { isGenerating = false }

        let userPrompt = PromptBuilder.buildPPTPrompt(
            topic: topic.trimmed,
            pageCount: pageCount,
            scenario: finalScenario,
            style: style,
            needsSpeakerNotes: needsSpeakerNotes
        )

        do {
            let service = DeepSeekService(configuration: settings.makeDeepSeekConfiguration())
            let output = try await service.sendMessage(
                systemPrompt: PromptBuilder.pptSystemPrompt,
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
            type: .ppt,
            title: topic.trimmed,
            inputPrompt: inputPrompt,
            outputContent: output,
            modelName: settings.modelName
        )
        modelContext.insert(record)
        try? modelContext.save()
    }
}
