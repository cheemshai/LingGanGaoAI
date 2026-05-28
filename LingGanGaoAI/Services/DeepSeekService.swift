import Foundation

struct DeepSeekConfiguration {
    let apiBaseURL: String
    let modelName: String
}

enum DeepSeekError: LocalizedError {
    case emptyAPIKey
    case invalidBaseURL
    case network(Error)
    case invalidResponse
    case authenticationFailed(String)
    case insufficientBalance(String)
    case apiError(statusCode: Int, message: String)
    case emptyResponse
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .emptyAPIKey:
            return "API Key 为空，请先在设置中填写 DeepSeek API Key"
        case .invalidBaseURL:
            return "API Base URL 无效，请检查设置中的地址"
        case .network(let error):
            return "网络连接失败：\(error.localizedDescription)"
        case .invalidResponse:
            return "DeepSeek 返回错误：响应格式无效"
        case .authenticationFailed(let message):
            return "余额不足或鉴权失败：\(message)"
        case .insufficientBalance(let message):
            return "余额不足或鉴权失败：\(message)"
        case .apiError(let statusCode, let message):
            return "DeepSeek 返回错误（\(statusCode)）：\(message)"
        case .emptyResponse:
            return "DeepSeek 返回内容为空"
        case .decodingFailed:
            return "DeepSeek 返回内容无法解析"
        }
    }
}

struct DeepSeekService {
    private let configuration: DeepSeekConfiguration
    private let keychain: KeychainService
    private let session: URLSession

    init(
        configuration: DeepSeekConfiguration,
        keychain: KeychainService = .shared,
        session: URLSession = .shared
    ) {
        self.configuration = configuration
        self.keychain = keychain
        self.session = session
    }

    func sendMessage(systemPrompt: String, userPrompt: String) async throws -> String {
        try await request(systemPrompt: systemPrompt, userPrompt: userPrompt)
    }

    func testConnection() async throws -> Bool {
        _ = try await request(
            systemPrompt: "你是一个 API 连接测试助手。",
            userPrompt: "请只回复 OK。",
            maxTokens: 8
        )
        return true
    }

    private func request(
        systemPrompt: String,
        userPrompt: String,
        maxTokens: Int? = nil
    ) async throws -> String {
        let apiKey = try keychain.readAPIKey().trimmed
        guard !apiKey.isEmpty else {
            throw DeepSeekError.emptyAPIKey
        }

        let endpoint = try endpointURL()
        var urlRequest = URLRequest(url: endpoint)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.timeoutInterval = 60

        let body = ChatCompletionRequest(
            model: configuration.modelName,
            messages: [
                .init(role: "system", content: systemPrompt),
                .init(role: "user", content: userPrompt)
            ],
            temperature: 0.7,
            maxTokens: maxTokens
        )
        urlRequest.httpBody = try JSONEncoder().encode(body)

        do {
            let (data, response) = try await session.data(for: urlRequest)
            guard let httpResponse = response as? HTTPURLResponse else {
                throw DeepSeekError.invalidResponse
            }

            guard (200..<300).contains(httpResponse.statusCode) else {
                throw mapHTTPError(statusCode: httpResponse.statusCode, data: data)
            }

            guard
                let decoded = try? JSONDecoder().decode(ChatCompletionResponse.self, from: data),
                let content = decoded.choices.first?.message.content?.trimmed
            else {
                throw DeepSeekError.decodingFailed
            }

            guard !content.isEmpty else {
                throw DeepSeekError.emptyResponse
            }

            return content
        } catch let error as DeepSeekError {
            throw error
        } catch let error as URLError {
            throw DeepSeekError.network(error)
        }
    }

    private func endpointURL() throws -> URL {
        let value = configuration.apiBaseURL.trimmed
        guard
            let baseURL = URL(string: value),
            let scheme = baseURL.scheme,
            let host = baseURL.host,
            !scheme.isEmpty,
            !host.isEmpty
        else {
            throw DeepSeekError.invalidBaseURL
        }

        if baseURL.path.hasSuffix("/chat/completions") {
            return baseURL
        }

        return baseURL.appendingPathComponent("chat/completions")
    }

    private func mapHTTPError(statusCode: Int, data: Data) -> DeepSeekError {
        let fallbackMessage = HTTPURLResponse.localizedString(forStatusCode: statusCode)
        let decodedMessage = (try? JSONDecoder().decode(APIErrorEnvelope.self, from: data))?.error.message
        let rawMessage = String(data: data, encoding: .utf8)
        let message = (decodedMessage ?? rawMessage ?? fallbackMessage).trimmed
        let lowercasedMessage = message.lowercased()

        if statusCode == 401 || statusCode == 403 {
            return .authenticationFailed(message)
        }

        if statusCode == 402
            || lowercasedMessage.contains("balance")
            || lowercasedMessage.contains("insufficient") {
            return .insufficientBalance(message)
        }

        return .apiError(statusCode: statusCode, message: message)
    }
}

private struct ChatCompletionRequest: Encodable {
    let model: String
    let messages: [ChatMessage]
    let temperature: Double
    let maxTokens: Int?

    enum CodingKeys: String, CodingKey {
        case model
        case messages
        case temperature
        case maxTokens = "max_tokens"
    }
}

private struct ChatMessage: Encodable {
    let role: String
    let content: String
}

private struct ChatCompletionResponse: Decodable {
    let choices: [Choice]

    struct Choice: Decodable {
        let message: ResponseMessage
    }

    struct ResponseMessage: Decodable {
        let role: String?
        let content: String?
    }
}

private struct APIErrorEnvelope: Decodable {
    let error: APIErrorDetail
}

private struct APIErrorDetail: Decodable {
    let message: String
    let type: String?
    let code: String?
}
