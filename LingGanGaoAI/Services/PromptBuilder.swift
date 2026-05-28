import Foundation

enum PromptBuilder {
    static let pptSystemPrompt = "你是专业的 PPT 策划师和中文文案专家，擅长把主题拆解为结构清晰、可直接制作成幻灯片的方案。"
    static let copywritingSystemPrompt = "你是中文新媒体文案、商业文案和学术表达专家，擅长根据平台和风格输出可直接使用的内容。"
    static let promptSystemPrompt = "你是提示词工程专家，擅长把用户目标改写为清晰、可执行、适合不同 AI 平台的提示词。"

    static func buildPPTPrompt(
        topic: String,
        pageCount: Int,
        scenario: String,
        style: String,
        needsSpeakerNotes: Bool
    ) -> String {
        """
        请为以下主题生成一份完整 PPT 大纲。

        主题：\(topic)
        页数：\(pageCount) 页
        使用场景：\(scenario)
        风格：\(style)
        是否需要演讲稿：\(needsSpeakerNotes ? "需要" : "不需要")

        输出要求：
        1. 使用 Markdown。
        2. 先给出 PPT 标题。
        3. 按页码逐页输出，每页必须包含：
           - 页码
           - 页面标题
           - 核心内容
           - 图表建议
           - 设计建议
        4. 如果需要演讲稿，请为每页补充“演讲备注”。
        5. 内容要适合中文场景，可直接复制到 PPT 制作流程中。
        """
    }

    static func buildCopywritingPrompt(
        topic: String,
        copyType: String,
        length: String,
        style: String
    ) -> String {
        """
        请生成一篇中文文案。

        主题：\(topic)
        文案类型：\(copyType)
        字数：\(length)
        风格：\(style)

        输出要求：
        1. 使用 Markdown。
        2. 必须包含“标题”“正文”“标签或关键词”。
        3. 正文要符合所选平台和使用场景。
        4. 语言自然、有记忆点，避免空泛套话。
        """
    }

    static func buildPromptGeneratorPrompt(
        goal: String,
        platform: String,
        targetStyle: String,
        detailLevel: String
    ) -> String {
        """
        请把用户目标改写为可直接使用的 AI 提示词。

        想生成的内容：\(goal)
        使用平台：\(platform)
        目标风格：\(targetStyle)
        详细程度：\(detailLevel)

        输出要求：
        1. 使用 Markdown。
        2. 必须包含“完整提示词”“精简提示词”“使用建议”。
        3. 完整提示词要具体、结构清晰、可直接复制使用。
        4. 精简提示词要保留核心目标。
        5. 使用建议要说明如何调整变量、风格或限制条件。
        """
    }
}
