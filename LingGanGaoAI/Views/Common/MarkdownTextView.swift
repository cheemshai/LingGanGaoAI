import SwiftUI

struct MarkdownTextView: View {
    let markdown: String

    var body: some View {
        Text(attributedText)
            .font(.body)
            .textSelection(.enabled)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var attributedText: AttributedString {
        if let value = try? AttributedString(markdown: markdown) {
            return value
        }

        return AttributedString(markdown)
    }
}
