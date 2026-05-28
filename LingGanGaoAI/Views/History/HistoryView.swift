import SwiftData
import SwiftUI

struct HistoryView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \GenerationRecord.createdAt, order: .reverse) private var records: [GenerationRecord]

    @State private var searchText = ""
    @State private var filter: HistoryFilter = .all

    private var filteredRecords: [GenerationRecord] {
        let keyword = searchText.trimmed

        return records.filter { record in
            let matchesType = filter.type == nil || record.type == filter.type
            let matchesSearch = keyword.isEmpty
                || record.title.localizedCaseInsensitiveContains(keyword)
                || record.inputPrompt.localizedCaseInsensitiveContains(keyword)
                || record.outputContent.localizedCaseInsensitiveContains(keyword)

            return matchesType && matchesSearch
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            Picker("类型", selection: $filter) {
                ForEach(HistoryFilter.allCases) { value in
                    Text(value.title).tag(value)
                }
            }
            .pickerStyle(.segmented)
            .padding([.horizontal, .top])

            if filteredRecords.isEmpty {
                ContentUnavailableView(
                    searchText.trimmed.isEmpty ? "暂无历史记录" : "没有匹配结果",
                    systemImage: "clock.arrow.circlepath"
                )
            } else {
                List {
                    ForEach(filteredRecords, id: \.id) { record in
                        NavigationLink {
                            RecordDetailView(record: record)
                        } label: {
                            RecordRow(record: record)
                        }
                    }
                    .onDelete(perform: delete)
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("历史记录")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $searchText, prompt: "搜索标题或内容")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                EditButton()
                    .disabled(filteredRecords.isEmpty)
            }
        }
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(filteredRecords[index])
        }

        try? modelContext.save()
    }
}

private enum HistoryFilter: String, CaseIterable, Identifiable {
    case all
    case ppt
    case copywriting
    case prompt

    var id: String { rawValue }

    var title: String {
        switch self {
        case .all:
            return "全部"
        case .ppt:
            return "PPT"
        case .copywriting:
            return "文案"
        case .prompt:
            return "提示词"
        }
    }

    var type: GenerationType? {
        switch self {
        case .all:
            return nil
        case .ppt:
            return .ppt
        case .copywriting:
            return .copywriting
        case .prompt:
            return .prompt
        }
    }
}

private struct RecordRow: View {
    let record: GenerationRecord

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: record.type.systemImage)
                .font(.headline)
                .foregroundStyle(record.type.accentColor)
                .frame(width: 32, height: 32)
                .background(record.type.accentColor.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 6) {
                Text(record.title)
                    .font(.headline)
                    .lineLimit(1)

                Text(record.previewText)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                HStack(spacing: 8) {
                    Text(record.type.fullTitle)
                    Text(DateFormatter.recordDateTime.string(from: record.createdAt))
                }
                .font(.caption)
                .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }
}
