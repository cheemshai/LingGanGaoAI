import SwiftUI

struct LoadingButton: View {
    let title: String
    let systemImage: String
    let isLoading: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: systemImage)
                }

                Text(isLoading ? "生成中" : title)
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .disabled(isLoading)
    }
}
