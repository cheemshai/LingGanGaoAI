const SETTINGS_KEY = "linggangaoai.settings.v1";
const RECORDS_KEY = "linggangaoai.records.v1";

const DEFAULT_SETTINGS = {
  apiBaseURL: "https://api.deepseek.com",
  modelName: "deepseek-v4-flash",
  apiKey: ""
};

const TITLES = {
  home: ["工作台", "灵感稿 AI"],
  ppt: ["PPT 大纲生成", "把主题拆成可演示的页面"],
  copy: ["文案生成", "把想法写成可发布的文字"],
  prompt: ["提示词生成", "把需求整理成清晰指令"],
  history: ["历史记录", "本地保存的生成结果"],
  settings: ["设置", "DeepSeek API 与本地数据"]
};

const TYPE_LABELS = {
  ppt: "PPT",
  copy: "文案",
  prompt: "提示词"
};

const SYSTEM_PROMPTS = {
  ppt: "你是专业的PPT策划师和中文文案专家，擅长把主题拆解成结构清晰、适合演示的PPT方案。",
  copy: "你是专业中文文案专家，擅长根据平台、字数和风格生成可直接使用的标题、正文和标签关键词。",
  prompt: "你是专业提示词工程师，擅长把模糊需求整理成可执行、结构化、适配不同AI平台的提示词。"
};

const state = {
  settings: loadSettings(),
  records: loadRecords(),
  activeFilter: "all",
  dialogRecordId: null,
  results: {
    ppt: "",
    copy: "",
    prompt: ""
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function loadRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(state.records));
}

function init() {
  bindNavigation();
  bindForms();
  bindHistory();
  bindSettings();
  bindDialog();
  populateSettingsForm();
  updateSummaries();
  renderRecent();
  renderHistory();
  toggleCustomScene();
  registerServiceWorker();
}

function bindNavigation() {
  $$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
}

function showView(viewName) {
  if (!TITLES[viewName]) return;

  $$(".view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === viewName);
  });

  $$(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewName);
  });

  const [eyebrow, title] = TITLES[viewName];
  $("[data-view-eyebrow]").textContent = eyebrow;
  $("[data-view-title]").textContent = title;
}

function bindForms() {
  const pptScene = $("#ppt-scene");
  pptScene.addEventListener("change", toggleCustomScene);

  $('[data-form="ppt"]').addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    const scene = data.scene === "自定义" ? data.customScene.trim() : data.scene;
    const input = {
      topic: data.topic.trim(),
      pages: data.pages,
      scene,
      style: data.style,
      speechNotes: Boolean(data.speechNotes)
    };

    if (!input.topic) {
      showError("ppt", "请先填写 PPT 主题。");
      return;
    }

    const userPrompt = buildPPTPrompt(input);
    await generate({
      type: "ppt",
      title: input.topic,
      userPrompt,
      systemPrompt: SYSTEM_PROMPTS.ppt,
      submitButton: $("button[type='submit']", event.currentTarget)
    });
  });

  $('[data-form="copy"]').addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    const input = {
      topic: data.topic.trim(),
      copyType: data.copyType,
      length: data.length,
      style: data.style
    };

    if (!input.topic) {
      showError("copy", "请先填写文案主题。");
      return;
    }

    const userPrompt = buildCopywritingPrompt(input);
    await generate({
      type: "copy",
      title: input.topic,
      userPrompt,
      systemPrompt: SYSTEM_PROMPTS.copy,
      submitButton: $("button[type='submit']", event.currentTarget)
    });
  });

  $('[data-form="prompt"]').addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    const input = {
      goal: data.goal.trim(),
      platform: data.platform,
      style: data.style.trim(),
      detail: data.detail
    };

    if (!input.goal) {
      showError("prompt", "请先填写想生成什么内容。");
      return;
    }

    const userPrompt = buildPromptGeneratorPrompt(input);
    await generate({
      type: "prompt",
      title: input.goal,
      userPrompt,
      systemPrompt: SYSTEM_PROMPTS.prompt,
      submitButton: $("button[type='submit']", event.currentTarget)
    });
  });

  $$("[data-copy-result]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.copyResult;
      copyText(state.results[type] || getResultText(type));
    });
  });
}

function readForm(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

async function generate({ type, title, userPrompt, systemPrompt, submitButton }) {
  clearError(type);
  setLoading(submitButton, true);
  setResult(type, "生成中，请稍候。", true);

  try {
    const output = await sendMessage(systemPrompt, userPrompt);
    state.results[type] = output;
    setResult(type, output);
    addRecord({
      type,
      title: title.slice(0, 48),
      inputPrompt: userPrompt,
      outputContent: output,
      modelName: state.settings.modelName
    });
    showToast("已生成并保存到历史记录");
  } catch (error) {
    setResult(type, "结果会显示在这里。", true);
    showError(type, toFriendlyError(error));
  } finally {
    setLoading(submitButton, false);
  }
}

function toggleCustomScene() {
  const scene = $("#ppt-scene").value;
  $("[data-custom-scene-field]").hidden = scene !== "自定义";
}

function buildPPTPrompt(input) {
  const notesLine = input.speechNotes
    ? "每页都要生成演讲备注。"
    : "不需要生成演讲备注。";

  return [
    `请为主题「${input.topic}」生成一份 PPT 大纲。`,
    `页数：${input.pages} 页。`,
    `使用场景：${input.scene || "未指定"}。`,
    `风格：${input.style}。`,
    notesLine,
    "",
    "输出要求：",
    "1. PPT 标题",
    "2. 每页页码",
    "3. 每页标题",
    "4. 每页核心内容",
    "5. 每页图表建议",
    "6. 每页设计建议",
    "7. 如需要演讲稿，则每页包含演讲备注",
    "",
    "请使用清晰的 Markdown 格式输出。"
  ].join("\n");
}

function buildCopywritingPrompt(input) {
  return [
    `请围绕主题「${input.topic}」生成一份中文文案。`,
    `文案类型：${input.copyType}。`,
    `字数：${input.length}。`,
    `风格：${input.style}。`,
    "",
    "输出要求：",
    "1. 标题",
    "2. 正文",
    "3. 标签或关键词",
    "",
    "请让内容可直接复制使用，并使用 Markdown 格式输出。"
  ].join("\n");
}

function buildPromptGeneratorPrompt(input) {
  return [
    `我想生成的内容：${input.goal}`,
    `使用平台：${input.platform}。`,
    `目标风格：${input.style || "未指定"}。`,
    `详细程度：${input.detail}。`,
    "",
    "输出要求：",
    "1. 完整提示词",
    "2. 精简提示词",
    "3. 使用建议",
    "",
    "请使用 Markdown 格式输出。"
  ].join("\n");
}

async function sendMessage(systemPrompt, userPrompt) {
  const { apiKey, apiBaseURL, modelName } = state.settings;

  if (!apiKey.trim()) {
    throw new Error("API_KEY_EMPTY");
  }

  const baseURL = normalizeBaseURL(apiBaseURL);
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    })
  }).catch((error) => {
    throw new Error(error?.message || "NETWORK_ERROR");
  });

  const responseText = await response.text();
  let payload = null;
  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || responseText || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 返回为空。");
  }

  return content.trim();
}

function normalizeBaseURL(url) {
  const trimmed = (url || DEFAULT_SETTINGS.apiBaseURL).trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function toFriendlyError(error) {
  if (error.message === "API_KEY_EMPTY") {
    return "API Key 为空，请先到设置页填写 DeepSeek API Key。";
  }

  if (error.status === 401 || error.status === 403) {
    return "鉴权失败，请检查 API Key 是否正确。";
  }

  if (error.status === 402) {
    return "余额不足，请检查 DeepSeek 账户余额。";
  }

  if (error.status === 429) {
    return "请求过于频繁，请稍后再试。";
  }

  if (error.status) {
    return `DeepSeek 返回错误 ${error.status}：${error.message}`;
  }

  return "网络连接失败，或浏览器拦截了跨域请求。若一直失败，可以改用代理地址作为 API Base URL。";
}

function setLoading(button, isLoading) {
  button.disabled = isLoading;
  button.classList.toggle("loading", isLoading);
}

function setResult(type, text, isPlaceholder = false) {
  const container = $(`[data-result="${type}"]`);
  container.classList.toggle("empty", isPlaceholder);
  container.innerHTML = isPlaceholder ? escapeHtml(text) : renderMarkdown(text);
}

function getResultText(type) {
  const element = $(`[data-result="${type}"]`);
  return element?.innerText?.trim() || "";
}

function showError(type, message) {
  const banner = $(`[data-error="${type}"]`);
  banner.textContent = message;
  banner.hidden = false;
}

function clearError(type) {
  const banner = $(`[data-error="${type}"]`);
  banner.textContent = "";
  banner.hidden = true;
}

function addRecord({ type, title, inputPrompt, outputContent, modelName }) {
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type,
    title,
    inputPrompt,
    outputContent,
    modelName,
    createdAt: new Date().toISOString()
  };

  state.records.unshift(record);
  saveRecords();
  updateSummaries();
  renderRecent();
  renderHistory();
}

function bindHistory() {
  $("[data-history-search]").addEventListener("input", renderHistory);
  $$("[data-history-filter] button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter;
      $$("[data-history-filter] button").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      renderHistory();
    });
  });
}

function renderRecent() {
  const list = $("[data-recent-list]");
  const recent = state.records.slice(0, 4);

  if (!recent.length) {
    list.innerHTML = `<p class="muted">暂无历史记录。</p>`;
    return;
  }

  list.innerHTML = recent.map(recordItemHTML).join("");
  bindRecordItems(list);
}

function renderHistory() {
  const list = $("[data-history-list]");
  const keyword = $("[data-history-search]")?.value?.trim().toLowerCase() || "";
  const records = state.records.filter((record) => {
    const matchesType = state.activeFilter === "all" || record.type === state.activeFilter;
    const haystack = `${record.title} ${record.inputPrompt} ${record.outputContent}`.toLowerCase();
    return matchesType && (!keyword || haystack.includes(keyword));
  });

  if (!records.length) {
    list.innerHTML = `<p class="muted">没有匹配的记录。</p>`;
    return;
  }

  list.innerHTML = records.map(recordItemHTML).join("");
  bindRecordItems(list);
}

function recordItemHTML(record) {
  return `
    <div class="record-item" data-record-id="${record.id}">
      <button type="button" data-open-record="${record.id}">
        <span class="record-title">${escapeHtml(record.title || "未命名记录")}</span>
        <span class="record-meta">${TYPE_LABELS[record.type]} · ${formatDate(record.createdAt)} · ${escapeHtml(record.modelName)}</span>
      </button>
      <button class="copy-button" type="button" data-copy-record="${record.id}">复制</button>
    </div>
  `;
}

function bindRecordItems(root) {
  $$("[data-open-record]", root).forEach((button) => {
    button.addEventListener("click", () => openRecord(button.dataset.openRecord));
  });

  $$("[data-copy-record]", root).forEach((button) => {
    button.addEventListener("click", () => {
      const record = state.records.find((item) => item.id === button.dataset.copyRecord);
      if (record) copyText(record.outputContent);
    });
  });
}

function bindDialog() {
  const dialog = $("[data-record-dialog]");
  $("[data-dialog-close]").addEventListener("click", () => dialog.close());
  $("[data-dialog-copy]").addEventListener("click", () => {
    const record = state.records.find((item) => item.id === state.dialogRecordId);
    if (record) copyText(record.outputContent);
  });
  $("[data-dialog-delete]").addEventListener("click", () => {
    if (!state.dialogRecordId) return;
    deleteRecord(state.dialogRecordId);
    dialog.close();
  });
}

function openRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  state.dialogRecordId = id;
  $("[data-dialog-type]").textContent = `${TYPE_LABELS[record.type]} · ${formatDate(record.createdAt)}`;
  $("[data-dialog-title]").textContent = record.title || "详情";
  $("[data-dialog-content]").innerHTML = renderMarkdown(record.outputContent);
  $("[data-record-dialog]").showModal();
}

function deleteRecord(id) {
  state.records = state.records.filter((record) => record.id !== id);
  saveRecords();
  updateSummaries();
  renderRecent();
  renderHistory();
  showToast("已删除");
}

function bindSettings() {
  $('[data-form="settings"]').addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    state.settings = {
      apiKey: data.apiKey.trim(),
      modelName: data.modelName,
      apiBaseURL: normalizeBaseURL(data.apiBaseURL)
    };
    saveSettings();
    updateSummaries();
    showToast("设置已保存");
  });

  $("[data-test-connection]").addEventListener("click", async (event) => {
    clearError("settings");
    const form = $('[data-form="settings"]');
    const data = readForm(form);
    state.settings = {
      apiKey: data.apiKey.trim(),
      modelName: data.modelName,
      apiBaseURL: normalizeBaseURL(data.apiBaseURL)
    };
    saveSettings();
    updateSummaries();

    const button = event.currentTarget;
    setLoading(button, true);
    try {
      await sendMessage("你是连接测试助手。", "请只回复：OK");
      showToast("连接成功");
      $("[data-settings-status]").textContent = `当前模型：${state.settings.modelName}，连接正常`;
    } catch (error) {
      showError("settings", toFriendlyError(error));
    } finally {
      setLoading(button, false);
    }
  });

  $("[data-clear-history]").addEventListener("click", () => {
    if (!confirm("确定清空全部历史记录？")) return;
    state.records = [];
    saveRecords();
    updateSummaries();
    renderRecent();
    renderHistory();
    showToast("历史记录已清空");
  });
}

function populateSettingsForm() {
  $("#api-key").value = state.settings.apiKey;
  $("#model-name").value = state.settings.modelName;
  $("#api-base").value = state.settings.apiBaseURL;
}

function updateSummaries() {
  const hasKey = Boolean(state.settings.apiKey.trim());
  $$("[data-model-label]").forEach((item) => {
    item.textContent = state.settings.modelName;
  });
  $("[data-summary-model]").textContent = state.settings.modelName;
  $("[data-summary-base]").textContent = state.settings.apiBaseURL;
  $("[data-summary-key]").textContent = hasKey ? "已填写" : "未填写";
  $("[data-history-count]").textContent = `${state.records.length} 条记录`;
  $("[data-settings-status]").textContent = `当前模型：${state.settings.modelName}`;
}

function renderMarkdown(markdown) {
  const parts = [];
  const source = String(markdown || "").replace(/\r\n/g, "\n");
  let index = 0;
  const fencePattern = /```([\s\S]*?)```/g;
  let match;

  while ((match = fencePattern.exec(source))) {
    parts.push(renderTextBlock(source.slice(index, match.index)));
    parts.push(`<pre><code>${escapeHtml(match[1].trim())}</code></pre>`);
    index = fencePattern.lastIndex;
  }

  parts.push(renderTextBlock(source.slice(index)));
  return parts.join("");
}

function renderTextBlock(text) {
  const lines = text.split("\n");
  let html = "";
  let listType = null;

  const closeList = () => {
    if (listType) {
      html += `</${listType}>`;
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html += `<h3>${formatInline(line.slice(4))}</h3>`;
    } else if (line.startsWith("## ")) {
      closeList();
      html += `<h2>${formatInline(line.slice(3))}</h2>`;
    } else if (line.startsWith("# ")) {
      closeList();
      html += `<h1>${formatInline(line.slice(2))}</h1>`;
    } else if (/^[-*]\s+/.test(line)) {
      if (listType !== "ul") {
        closeList();
        html += "<ul>";
        listType = "ul";
      }
      html += `<li>${formatInline(line.replace(/^[-*]\s+/, ""))}</li>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (listType !== "ol") {
        closeList();
        html += "<ol>";
        listType = "ol";
      }
      html += `<li>${formatInline(line.replace(/^\d+\.\s+/, ""))}</li>`;
    } else {
      closeList();
      html += `<p>${formatInline(line)}</p>`;
    }
  }

  closeList();
  return html;
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyText(text) {
  const value = String(text || "").trim();
  if (!value) {
    showToast("没有可复制内容");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  showToast("已复制");
}

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 1800);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

init();
