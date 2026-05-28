import Foundation
import SwiftData

@Model
final class GenerationRecord {
    @Attribute(.unique) var id: UUID
    var typeRawValue: String
    var title: String
    var inputPrompt: String
    var outputContent: String
    var modelName: String
    var createdAt: Date

    var type: GenerationType {
        get { GenerationType(rawValue: typeRawValue) ?? .copywriting }
        set { typeRawValue = newValue.rawValue }
    }

    var previewText: String {
        outputContent
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    init(
        id: UUID = UUID(),
        type: GenerationType,
        title: String,
        inputPrompt: String,
        outputContent: String,
        modelName: String,
        createdAt: Date = .now
    ) {
        self.id = id
        self.typeRawValue = type.rawValue
        self.title = title
        self.inputPrompt = inputPrompt
        self.outputContent = outputContent
        self.modelName = modelName
        self.createdAt = createdAt
    }
}
