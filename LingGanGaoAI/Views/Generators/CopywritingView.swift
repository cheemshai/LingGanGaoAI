import SwiftData
import SwiftUI

struct CopywritingView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(AppSettings.self) private var settings

    @State private var topic = ""
    @State private var copyType = "小红书"
    @State private var length = "中"
    @State private var style = "正式"
    @State private var result = ""
    @State private var errorMessage: String?
    @State private var isGenerating = false

    private let copyTypes = ["小红书", "抖音", "朋友圈", "商品带货", "视频脚本", "论文润色", "演讲稿"]
    private let lengths = ["短", "中", "长"]
    private let styles = ["正式", "活泼", "高级", "接地气", "学术", "犀利"]

    private var canGenerate: Bool {
        !topic.trimmed.isEmpty
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionCard("输入", systemImage: "text.cursor") {
                    TextField("主题", text: $topic, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(2...4)

                    Picker("文案类型", selection: $copyType) {
                        ForEach(copyTypes, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                    .pickerStyle(.menu)

                    Picker("字数", selection: $length) {
                        ForEach(lengths, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                    .pickerStyle(.segmented)

                    Picker("风格", selection: $style) {
                        ForEach(styles, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                    .pickerStyle(.menu)
                }

                LoadingButton(title: "生成文案", systemImage: "sparkles", isLoading: isGenerating) {
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
        .navigationTitle("文案生成")
        .navigationBarTitleDisplayMode(.inline)
    }

    @MainActor
    private func generate() async {
        guard canGenerate else {
            errorMessage = "请输入文案主题"
            return
        }

        isGenerating = true
        errorMessage = nil
        defer { isGenerating = false }

        let userPrompt = PromptBuilder.buildCopywritingPrompt(
            topic: topic.trimmed,
            copyType: copyType,
            length: length,
            style: style
        )

        do {
            let service = DeepSeekService(configuration: settings.makeDeepSeekConfiguration())
            let output = try await service.sendMessage(
                systemPrompt: PromptBuilder.copywritingSystemPrompt,
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
            type: .copywriting,
            title: topic.trimmed,
            inputPrompt: inputPrompt,
            outputContent: output,
            modelName: settings.modelName
        )
        modelContext.insert(record)
        try? modelContext.save()
    }
}
