import SwiftUI
import UIKit

struct CopyButton: View {
    let text: String
    @State private var copied = false

    var body: some View {
        Button {
            copy()
        } label: {
            Label(copied ? "已复制" : "一键复制", systemImage: copied ? "checkmark" : "doc.on.doc")
        }
        .buttonStyle(.bordered)
        .controlSize(.small)
        .disabled(text.trimmed.isEmpty)
    }

    private func copy() {
        UIPasteboard.general.string = text
        copied = true

        Task {
            try? await Task.sleep(for: .seconds(1.4))
            await MainActor.run {
                copied = false
            }
        }
    }
}
