import SwiftData
import SwiftUI

@main
struct LingGanGaoAIApp: App {
    @State private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(settings)
        }
        .modelContainer(for: GenerationRecord.self)
    }
}
