import SwiftUI

struct ErrorBanner: View {
    let message: String

    var body: some View {
        Label(message, systemImage: "exclamationmark.triangle.fill")
            .font(.callout)
            .foregroundStyle(.red)
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.red.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}
