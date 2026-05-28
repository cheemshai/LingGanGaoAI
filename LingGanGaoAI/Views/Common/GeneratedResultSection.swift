import SwiftUI

struct GeneratedResultSection: View {
    let content: String

    var body: some View {
        SectionCard("生成结果", systemImage: "doc.text") {
            HStack {
                Text("Markdown")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Spacer()

                CopyButton(text: content)
            }

            MarkdownTextView(markdown: content)
                .padding(14)
                .background(Color(uiColor: .systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }
}
