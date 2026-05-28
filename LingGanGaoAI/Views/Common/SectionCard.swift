import SwiftUI

struct SectionCard<Content: View>: View {
    let title: String?
    let systemImage: String?
    @ViewBuilder let content: Content

    init(
        _ title: String? = nil,
        systemImage: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.systemImage = systemImage
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let title {
                Label {
                    Text(title)
                        .font(.headline)
                } icon: {
                    if let systemImage {
                        Image(systemName: systemImage)
                    }
                }
            }

            content
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}
