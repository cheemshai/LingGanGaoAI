import SwiftUI

struct HomeView: View {
    @Environment(AppSettings.self) private var settings

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    private let entries: [HomeEntry] = [
        .init(title: "PPT 大纲生成", icon: "rectangle.on.rectangle.angled", color: .blue, route: .pptOutline),
        .init(title: "文案生成", icon: "text.quote", color: .green, route: .copywriting),
        .init(title: "提示词生成", icon: "sparkles", color: .orange, route: .promptGenerator),
        .init(title: "历史记录", icon: "clock.arrow.circlepath", color: .purple, route: .history)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("灵感稿 AI")
                        .font(.largeTitle.bold())

                    HStack(spacing: 8) {
                        Image(systemName: "cpu")
                        Text(settings.modelName)
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(entries) { entry in
                        NavigationLink(value: entry.route) {
                            HomeCard(entry: entry)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding()
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("首页")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: AppRoute.settings) {
                    Image(systemName: "gearshape")
                }
                .accessibilityLabel("设置")
            }
        }
    }
}

private struct HomeEntry: Identifiable {
    let title: String
    let icon: String
    let color: Color
    let route: AppRoute

    var id: AppRoute { route }
}

private struct HomeCard: View {
    let entry: HomeEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Image(systemName: entry.icon)
                .font(.title2)
                .foregroundStyle(entry.color)
                .frame(width: 40, height: 40)
                .background(entry.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            Text(entry.title)
                .font(.headline)
                .foregroundStyle(.primary)
                .multilineTextAlignment(.leading)

            Spacer(minLength: 0)
        }
        .padding(16)
        .frame(maxWidth: .infinity, minHeight: 132, alignment: .leading)
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}
