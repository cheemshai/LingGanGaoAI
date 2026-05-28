import Foundation

extension DateFormatter {
    static let recordDateTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_CN")
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}
