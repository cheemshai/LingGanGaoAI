import SwiftUI

struct RootView: View {
    @State private var path: [AppRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .pptOutline:
                        PPTOutlineView()
                    case .copywriting:
                        CopywritingView()
                    case .promptGenerator:
                        PromptGeneratorView()
                    case .history:
                        HistoryView()
                    case .settings:
                        SettingsView()
                    }
                }
        }
    }
}
