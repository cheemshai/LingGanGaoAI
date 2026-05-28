import SwiftUI

struct RecordDetailView: View {
    let record: GenerationRecord

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionCard(record.title, systemImage: record.type.systemImage) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(record.type.fullTitle)
                        Text(record.modelName)
                        Text(DateFormatter.recordDateTime.string(from: record.createdAt))
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }

                SectionCard("输入提示词", systemImage: "text.alignleft") {
                    MarkdownTextView(markdown: record.inputPrompt)
                }

                SectionCard("生成结果", systemImage: "doc.text") {
                    HStack {
                        Text("全文")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        Spacer()

                        CopyButton(text: record.outputContent)
                    }

                    MarkdownTextView(markdown: record.outputContent)
                        .padding(14)
                        .background(Color(uiColor: .systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
            .padding()
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("详情")
        .navigationBarTitleDisplayMode(.inline)
    }
}
