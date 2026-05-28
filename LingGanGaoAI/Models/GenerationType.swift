import SwiftUI

enum GenerationType: String, Codable, CaseIterable, Identifiable {
    case ppt
    case copywriting
    case prompt

    var id: String { rawValue }

    var title: String {
        switch self {
        case .ppt:
            return "PPT"
        case .copywriting:
            return "文案"
        case .prompt:
            return "提示词"
        }
    }

    var fullTitle: String {
        switch self {
        case .ppt:
            return "PPT 大纲"
        case .copywriting:
            return "文案生成"
        case .prompt:
            return "提示词生成"
        }
    }

    var systemImage: String {
        switch self {
        case .ppt:
            return "rectangle.on.rectangle.angled"
        case .copywriting:
            return "text.quote"
        case .prompt:
            return "sparkles"
        }
    }

    var accentColor: Color {
        switch self {
        case .ppt:
            return .blue
        case .copywriting:
            return .green
        case .prompt:
            return .orange
        }
    }
}
