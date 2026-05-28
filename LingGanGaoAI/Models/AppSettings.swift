import Foundation
import Observation

enum DeepSeekModel: String, CaseIterable, Identifiable {
    case flash = "deepseek-v4-flash"
    case pro = "deepseek-v4-pro"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .flash:
            return "deepseek-v4-flash"
        case .pro:
            return "deepseek-v4-pro"
        }
    }

    var statusText: String {
        switch self {
        case .flash:
            return "当前为默认高速模型"
        case .pro:
            return "当前为高质量模型"
        }
    }
}

@Observable
final class AppSettings {
    var apiBaseURL: String {
        didSet { defaults.set(apiBaseURL.trimmed, forKey: Keys.apiBaseURL) }
    }

    var modelName: String {
        didSet { defaults.set(modelName, forKey: Keys.modelName) }
    }

    @ObservationIgnored private let defaults: UserDefaults

    private enum Keys {
        static let apiBaseURL = "settings.apiBaseURL"
        static let modelName = "settings.modelName"
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.apiBaseURL = defaults.string(forKey: Keys.apiBaseURL) ?? "https://api.deepseek.com"
        self.modelName = defaults.string(forKey: Keys.modelName) ?? DeepSeekModel.flash.rawValue
    }

    var selectedModel: DeepSeekModel {
        DeepSeekModel(rawValue: modelName) ?? .flash
    }

    var modelStatusText: String {
        selectedModel.statusText
    }

    func makeDeepSeekConfiguration() -> DeepSeekConfiguration {
        DeepSeekConfiguration(
            apiBaseURL: apiBaseURL,
            modelName: modelName
        )
    }
}
