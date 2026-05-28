const Storage = window.LingGanStorage;
const I18N = window.LingGanI18N;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const TEXT_TYPES = ["ppt", "copy", "prompt"];
const RECORD_TYPE_KEYS = {
  ppt: "ppt",
  copy: "copy",
  prompt: "prompt",
  image: "image",
  video: "video",
  chat: "chat"
};

const VIEW_TITLES = {
  home: ["workspace", "homeTitle"],
  ppt: ["ppt", "pptTitle"],
  copy: ["copy", "copyTitle"],
  prompt: ["prompt", "promptTitle"],
  image: ["image", "imageTitle"],
  video: ["video", "videoTitle"],
  chat: ["chat", "chatTitle"],
  trends: ["trends", "trendsTitle"],
  history: ["history", "historyTitle"],
  settings: ["settings", "settingsTitle"]
};

const SYSTEM_PROMPTS = {
  ppt: "你是专业的PPT策划师和中文文案专家，擅长把主题拆解成结构清晰、适合演示的PPT方案。",
  copy: "你是专业中文文案专家，擅长根据平台、字数和风格生成可直接使用的标题、正文和标签关键词。",
  prompt: "你是专业提示词工程师，擅长把模糊需求整理成可执行、结构化、适配不同AI平台的提示词。",
  iterate: "你是专业中文编辑和内容迭代助手。请基于上一版结果和用户修改要求，生成新的完整版本，不要只解释修改点。",
  chat: "你是海叔叔，专业的中文 AI 创作助手。你擅长 PPT 大纲、文案、提示词、短视频脚本、图片和视频创意。回答要清晰、可执行、适合中文用户直接使用。"
};

const IMAGE_SIZE_MAP = {
  "1:1": "1024x1024",
  "16:9": "1536x864",
  "9:16": "864x1536",
  "4:3": "1280x960"
};

const HOTSPOTS = {
  zh: [
    {
      title: "AI 学习助手成为校园效率工具",
      summary: "学生用 AI 整理资料、生成提纲、模拟答辩，学习工作流正在变轻。",
      tags: ["AI", "学习", "效率"]
    },
    {
      title: "毕业季答辩 PPT 模板需求上升",
      summary: "答辩、开题、项目汇报进入高峰，结构化大纲和演讲稿最受关注。",
      tags: ["毕业季", "PPT", "答辩"]
    },
    {
      title: "短视频脚本开始追求强信息密度",
      summary: "知识类短视频更看重开头钩子、分镜节奏和可复用口播框架。",
      tags: ["短视频", "脚本", "内容"]
    },
    {
      title: "小红书图文笔记偏好实用清单",
      summary: "清单式、步骤式、避坑式内容更容易被收藏和转发。",
      tags: ["小红书", "种草", "清单"]
    },
    {
      title: "商业路演强调一句话价值主张",
      summary: "投资人更快扫读，页面标题和数据证据需要一眼抓住重点。",
      tags: ["路演", "创业", "商业"]
    },
    {
      title: "AI 绘图提示词更重视镜头和材质",
      summary: "写实、产品图、海报类生成需要明确主体、光线、构图和质感。",
      tags: ["图片生成", "提示词", "设计"]
    }
  ],
  en: [
    {
      title: "AI study assistants become campus productivity tools",
      summary: "Students use AI to organize notes, outline decks, and rehearse defenses.",
      tags: ["AI", "Study", "Productivity"]
    },
    {
      title: "Defense deck demand rises during graduation season",
      summary: "Structured outlines and speaker notes are the most requested assets.",
      tags: ["Graduation", "PPT", "Defense"]
    },
    {
      title: "Short video scripts favor dense information",
      summary: "Knowledge creators need stronger hooks, pacing, and reusable narration.",
      tags: ["Video", "Script", "Content"]
    },
    {
      title: "Xiaohongshu posts favor practical checklists",
      summary: "Checklist, steps, and pitfall formats are easier to save and share.",
      tags: ["Xiaohongshu", "Copy", "Checklist"]
    },
    {
      title: "Pitch decks focus on one-sentence value propositions",
      summary: "Fast scanning makes titles and data proof more important.",
      tags: ["Pitch", "Startup", "Business"]
    },
    {
      title: "Image prompts rely more on camera and material details",
      summary: "Realistic and product visuals need subject, lighting, composition, and texture.",
      tags: ["Image", "Prompt", "Design"]
    }
  ]
};

const state = {
  settings: null,
  ui: null,
  records: [],
  tasks: [],
  chats: [],
  activeView: "home",
  activeFilter: "all",
  activeChatId: null,
  dialogRecordId: null,
  activeRecordIds: {
    ppt: null,
    copy: null,
    prompt: null
  },
  resultVersionIndex: {
    ppt: 0,
    copy: 0,
    prompt: 0
  },
  results: {
    ppt: "",
    copy: "",
    prompt: ""
  },
  currentImage: null,
  currentVideoTask: null,
  timers: {}
};

function t(key, values = {}) {
  return I18N.t(state.ui?.language || "zh", key, values);
}

async function init() {
  await Storage.init();
  state.settings = Storage.getSettings();
  state.ui = Storage.getUI();
  state.records = await Storage.listRecords();
  state.tasks = await Storage.listTasks();
  state.chats = await Storage.listChats();
  state.activeChatId = state.chats[0]?.id || null;

  applyTheme();
  bindNavigation();
  bindForms();
  bindHistory();
  bindSettings();
  bindDialog();
  bindExports();
  bindMediaActions();
  bindIteration();
  bindChat();
  await restoreDrafts();
  populateSettingsForm();
  applyI18n();
  updateSummaries();
  renderRecent();
  renderHistory();
  renderHotspots();
  renderTasks();
  renderChatList();
  renderChatMessages();
  renderImagePreview();
  renderVideoTask();
  resumeVideoPolling();
  toggleCustomScene();
  registerServiceWorker();
}

function applyI18n() {
  document.documentElement.lang = state.ui.language === "en" ? "en" : "zh-CN";
  document.title = t("appName");

  $$("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  $$("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  $("[data-language-toggle]").textContent = t(state.ui.language === "zh" ? "zh" : "en");
  updateThemeButton();
  showView(state.activeView, false);
  updateSummaries();
  renderRecent();
  renderHistory();
  renderHotspots();
  renderTasks();
  renderChatList();
  renderChatMessages();
  TEXT_TYPES.forEach((type) => renderVersionStrip(type));
  if (!state.currentImage) renderImagePreview();
  if (!state.currentVideoTask) renderVideoTask();
}

function applyTheme() {
  document.documentElement.dataset.theme = state.ui.theme === "dark" ? "dark" : state.ui.theme === "light" ? "light" : "";
  updateThemeButton();
}

function bindNavigation() {
  $$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  $("[data-language-toggle]").addEventListener("click", () => {
    state.ui.language = state.ui.language === "zh" ? "en" : "zh";
    Storage.saveUI(state.ui);
    applyI18n();
    populateSettingsForm();
  });

  $("[data-theme-cycle]")?.addEventListener("click", () => {
    const order = ["system", "light", "dark"];
    const currentIndex = order.indexOf(state.ui.theme);
    state.ui.theme = order[(currentIndex + 1) % order.length];
    Storage.saveUI(state.ui);
    applyTheme();
    populateSettingsForm();
  });

  $("[data-global-search]")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = event.currentTarget.value.trim();
    showView("history");
    const historySearch = $("[data-history-search]");
    if (historySearch) {
      historySearch.value = value;
      renderHistory();
    }
  });
}

function updateThemeButton() {
  const button = $("[data-theme-cycle]");
  if (!button || !state.ui) return;
  button.textContent = state.ui.theme === "dark" ? "☾" : state.ui.theme === "light" ? "☼" : "◐";
  button.title = t(state.ui.theme === "dark" ? "themeDark" : state.ui.theme === "light" ? "themeLight" : "themeSystem");
}

function showView(viewName, updateNav = true) {
  if (!VIEW_TITLES[viewName]) return;
  state.activeView = viewName;

  $$(".view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === viewName);
  });

  if (updateNav) {
    $$(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === viewName);
    });
  } else {
    $$(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === state.activeView);
    });
  }

  const [eyebrowKey, titleKey] = VIEW_TITLES[viewName];
  $("[data-view-eyebrow]").textContent = t(eyebrowKey);
  $("[data-view-title]").textContent = t(titleKey);
}

function bindForms() {
  $("#ppt-scene").addEventListener("change", toggleCustomScene);

  bindDraftSaving("ppt");
  bindDraftSaving("copy");
  bindDraftSaving("prompt");
  bindDraftSaving("image");
  bindDraftSaving("video");

  $('[data-form="ppt"]').addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    const scene = data.scene === "sceneCustom" ? data.customScene.trim() : optionLabel(data.scene);
    const input = {
      topic: data.topic.trim(),
      pages: data.pages,
      scene,
      style: optionLabel(data.style),
      speechNotes: Boolean(data.speechNotes)
    };

    if (!input.topic) {
      showError("ppt", t("emptyPpt"));
      return;
    }

    await generateText({
      type: "ppt",
      title: input.topic,
      userPrompt: buildPPTPrompt(input),
      systemPrompt: SYSTEM_PROMPTS.ppt,
      submitButton: $("button[type='submit']", event.currentTarget)
    });
  });

  $('[data-form="copy"]').addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    const input = {
      topic: data.topic.trim(),
      copyType: optionLabel(data.copyType),
      length: optionLabel(data.length),
      style: optionLabel(data.style)
    };

    if (!input.topic) {
      showError("copy", t("emptyCopy"));
      return;
    }

    await generateText({
      type: "copy",
      title: input.topic,
      userPrompt: buildCopywritingPrompt(input),
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
      detail: optionLabel(data.detail)
    };

    if (!input.goal) {
      showError("prompt", t("emptyPrompt"));
      return;
    }

    await generateText({
      type: "prompt",
      title: input.goal,
      userPrompt: buildPromptGeneratorPrompt(input),
      systemPrompt: SYSTEM_PROMPTS.prompt,
      submitButton: $("button[type='submit']", event.currentTarget)
    });
  });

  $('[data-form="image"]').addEventListener("submit", generateImage);
  $('[data-form="video"]').addEventListener("submit", generateVideoTask);
}

function bindDraftSaving(formName) {
  const form = $(`[data-form="${formName}"]`);
  if (!form) return;
  const save = debounce(() => Storage.saveDraft(`form:${formName}`, readForm(form, { skipFiles: true })), 250);
  $$("[data-draft-field]", form).forEach((field) => {
    field.addEventListener("input", save);
    field.addEventListener("change", save);
  });
}

async function restoreDrafts() {
  for (const formName of ["ppt", "copy", "prompt", "image", "video"]) {
    const draft = await Storage.getDraft(`form:${formName}`);
    if (draft?.data) fillForm($(`[data-form="${formName}"]`), draft.data);
  }
  const chatDraft = await Storage.getDraft("chat:input");
  if (chatDraft?.data?.text) {
    const input = $("[data-chat-input]");
    if (input) input.value = chatDraft.data.text;
  }
}

function readForm(form, options = {}) {
  const data = {};
  Array.from(form.elements).forEach((element) => {
    if (!element.name) return;
    if (options.skipFiles && element.type === "file") return;
    if (element.type === "checkbox") {
      data[element.name] = element.checked;
    } else if (element.type === "file") {
      data[element.name] = element.files?.[0] || null;
    } else {
      data[element.name] = element.value;
    }
  });
  return data;
}

function fillForm(form, data) {
  if (!form || !data) return;
  Object.keys(data).forEach((name) => {
    const field = form.elements[name];
    if (!field || field.type === "file") return;
    if (field.type === "checkbox") field.checked = Boolean(data[name]);
    else field.value = data[name];
  });
}

function toggleCustomScene() {
  $("[data-custom-scene-field]").hidden = $("#ppt-scene").value !== "sceneCustom";
}

async function generateText({ type, title, userPrompt, systemPrompt, submitButton }) {
  clearError(type);
  setLoading(submitButton, true);
  setResult(type, t("generating"), true);

  try {
    const output = await sendTextMessage(systemPrompt, userPrompt);
    const now = new Date().toISOString();
    const record = {
      id: createId(),
      type,
      title: title.slice(0, 64),
      inputPrompt: userPrompt,
      outputContent: output,
      modelName: state.settings.text.modelName,
      favorite: false,
      versions: [{
        label: "V1",
        content: output,
        prompt: userPrompt,
        createdAt: now
      }],
      createdAt: now,
      updatedAt: now
    };

    await Storage.saveRecord(record);
    state.activeRecordIds[type] = record.id;
    state.resultVersionIndex[type] = 0;
    setTextResultFromRecord(type, record);
    await refreshRecords();
    showToast(t("saved"));
  } catch (error) {
    setResult(type, t("placeholderResult"), true);
    showError(type, toFriendlyError(error));
  } finally {
    setLoading(submitButton, false);
  }
}

async function continueText(type, button) {
  const input = $(`[data-iterate-input="${type}"]`);
  const instruction = input.value.trim();
  const record = await getActiveTextRecord(type);

  if (!record) {
    showError(type, t("noActiveResult"));
    return;
  }

  if (!instruction) {
    showError(type, t("continuePlaceholder"));
    return;
  }

  clearError(type);
  setLoading(button, true);

  try {
    const current = record.versions?.[state.resultVersionIndex[type]]?.content || record.outputContent;
    const userPrompt = [
      "上一版内容：",
      current,
      "",
      "用户修改要求：",
      instruction,
      "",
      "请输出修改后的完整新版本。"
    ].join("\n");
    const output = await sendTextMessage(SYSTEM_PROMPTS.iterate, userPrompt);
    const versionNumber = (record.versions?.length || 0) + 1;
    record.versions = record.versions || [];
    record.versions.push({
      label: `V${versionNumber}`,
      content: output,
      prompt: instruction,
      createdAt: new Date().toISOString()
    });
    record.outputContent = output;
    record.updatedAt = new Date().toISOString();
    await Storage.saveRecord(record);
    state.resultVersionIndex[type] = record.versions.length - 1;
    input.value = "";
    setTextResultFromRecord(type, record);
    await refreshRecords();
    showToast(t("saved"));
  } catch (error) {
    showError(type, toFriendlyError(error));
  } finally {
    setLoading(button, false);
  }
}

function setTextResultFromRecord(type, record) {
  const index = Math.min(state.resultVersionIndex[type] || 0, (record.versions?.length || 1) - 1);
  const content = record.versions?.[index]?.content || record.outputContent || "";
  state.activeRecordIds[type] = record.id;
  state.results[type] = content;
  setResult(type, content);
  renderVersionStrip(type, record);
}

function renderVersionStrip(type, record = null) {
  const strip = $(`[data-version-strip="${type}"]`);
  if (!strip) return;
  const current = record || state.records.find((item) => item.id === state.activeRecordIds[type]);
  const versions = current?.versions || [];
  if (!versions.length) {
    strip.innerHTML = "";
    return;
  }

  strip.innerHTML = versions.map((version, index) => {
    const active = index === state.resultVersionIndex[type] ? "active" : "";
    return `<button class="${active}" type="button" data-version="${type}:${index}">${escapeHtml(version.label || `V${index + 1}`)}</button>`;
  }).join("");

  $$("[data-version]", strip).forEach((button) => {
    button.addEventListener("click", () => {
      const [, index] = button.dataset.version.split(":");
      state.resultVersionIndex[type] = Number(index);
      setTextResultFromRecord(type, current);
    });
  });
}

async function getActiveTextRecord(type) {
  const id = state.activeRecordIds[type];
  if (!id) return null;
  return Storage.getRecord(id);
}

function setResult(type, text, isPlaceholder = false) {
  const container = $(`[data-result="${type}"]`);
  container.classList.toggle("empty", isPlaceholder);
  container.innerHTML = isPlaceholder ? escapeHtml(text) : renderMarkdown(text);
}

function buildPPTPrompt(input) {
  return [
    `请为主题「${input.topic}」生成一份 PPT 大纲。`,
    `页数：${input.pages} 页。`,
    `使用场景：${input.scene || "未指定"}。`,
    `风格：${input.style}。`,
    input.speechNotes ? "每页都要生成演讲备注。" : "不需要生成演讲备注。",
    "",
    "输出要求：PPT 标题、每页页码、每页标题、每页核心内容、每页图表建议、每页设计建议。",
    "如果需要演讲稿，则每页包含演讲备注。",
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
    "输出要求：标题、正文、标签或关键词。",
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
    "输出要求：完整提示词、精简提示词、使用建议。",
    "请使用 Markdown 格式输出。"
  ].join("\n");
}

async function sendTextMessage(systemPrompt, userPrompt) {
  const { apiKey, apiBaseURL, modelName } = state.settings.text;
  if (!apiKey.trim()) throw new Error("API_KEY_EMPTY");

  const payload = await requestJSON(`${normalizeBaseURL(apiBaseURL)}/chat/completions`, {
    apiKey,
    body: {
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    }
  });

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("EMPTY_RESPONSE");
  return content.trim();
}

async function requestJSON(url, { apiKey, body, method = "POST" }) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`
    }
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options).catch((error) => {
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

  return payload;
}

async function generateImage(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = readForm(form);
  const input = {
    prompt: data.prompt.trim(),
    ratio: data.ratio,
    style: optionLabel(data.style)
  };

  if (!input.prompt) {
    showError("image", t("emptyImage"));
    return;
  }

  clearError("image");
  setLoading($("button[type='submit']", form), true);
  renderImagePreview({ status: t("imageGenerating") });

  try {
    const image = await callImageAPI(input);
    state.currentImage = image;
    renderImagePreview(image);
    await saveImageRecord(image);
    showToast(t("saved"));
  } catch (error) {
    showError("image", toFriendlyError(error, "image"));
    renderImagePreview();
  } finally {
    setLoading($("button[type='submit']", form), false);
  }
}

async function callImageAPI(input) {
  const { apiKey, apiBaseURL, modelName } = state.settings.image;
  if (!apiKey.trim()) throw new Error("IMAGE_KEY_EMPTY");

  const payload = await requestJSON(`${normalizeBaseURL(apiBaseURL)}/images/generations`, {
    apiKey,
    body: {
      model: modelName,
      prompt: `${input.prompt}\nStyle: ${input.style}`,
      size: IMAGE_SIZE_MAP[input.ratio] || "1024x1024",
      n: 1,
      response_format: "b64_json"
    }
  });

  const first = payload?.data?.[0];
  const url = first?.url || (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : "");
  if (!url) throw new Error("EMPTY_RESPONSE");

  return {
    id: createId(),
    type: "image",
    title: input.prompt.slice(0, 64),
    prompt: input.prompt,
    style: input.style,
    ratio: input.ratio,
    url,
    modelName: modelName,
    createdAt: new Date().toISOString()
  };
}

async function saveImageRecord(image = state.currentImage) {
  if (!image) return;
  const record = {
    id: image.recordId || createId(),
    type: "image",
    title: image.title,
    inputPrompt: image.prompt,
    outputContent: image.prompt,
    modelName: image.modelName,
    favorite: false,
    media: {
      kind: "image",
      url: image.url,
      ratio: image.ratio,
      style: image.style
    },
    versions: [],
    createdAt: image.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  image.recordId = record.id;
  await Storage.saveRecord(record);
  await refreshRecords();
}

function renderImagePreview(image = state.currentImage) {
  const preview = $("[data-image-preview]");
  if (!image) {
    preview.classList.add("empty");
    preview.innerHTML = `<p>${escapeHtml(t("placeholderImage"))}</p>`;
    return;
  }
  if (image.status) {
    preview.classList.add("empty");
    preview.innerHTML = `<p>${escapeHtml(image.status)}</p>`;
    return;
  }
  preview.classList.remove("empty");
  preview.innerHTML = `<img src="${escapeAttribute(image.url)}" alt="${escapeAttribute(image.prompt || "")}">`;
}

async function generateVideoTask(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = readForm(form);
  const input = {
    prompt: data.prompt.trim(),
    mode: data.mode,
    ratio: data.ratio,
    duration: Number(data.duration) || 11,
    sourceImageDataURL: data.sourceImage ? await fileToDataURL(data.sourceImage) : "",
    referenceImageUrls: parseURLLines(data.referenceImageUrls),
    referenceVideoUrl: String(data.referenceVideoUrl || "").trim(),
    referenceAudioUrl: String(data.referenceAudioUrl || "").trim(),
    generateAudio: Boolean(data.generateAudio),
    watermark: Boolean(data.watermark)
  };

  if (!input.prompt) {
    showError("video", t("emptyVideo"));
    return;
  }

  if (!state.settings.video.apiKey.trim()) {
    showError("video", t("videoKeyEmpty"));
    return;
  }

  clearError("video");
  const submitButton = $("button[type='submit']", form);
  setLoading(submitButton, true);

  const task = {
    id: createId(),
    type: "video",
    title: input.prompt.slice(0, 64),
    prompt: input.prompt,
    mode: input.mode,
    ratio: input.ratio,
    duration: input.duration,
    modelName: state.settings.video.modelName,
    status: "creating",
    progress: 5,
    sourceImageDataURL: input.sourceImageDataURL,
    referenceImageUrls: input.referenceImageUrls,
    referenceVideoUrl: input.referenceVideoUrl,
    referenceAudioUrl: input.referenceAudioUrl,
    generateAudio: input.generateAudio,
    watermark: input.watermark,
    outputContent: input.prompt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.currentVideoTask = task;
  await Storage.saveTask(task);
  state.tasks = await Storage.listTasks();
  renderVideoTask(task);
  renderTasks();

  try {
    const response = await createArkVideoTask(input);
    task.externalTaskId = extractArkTaskId(response);
    task.providerResponse = response;
    task.status = "polling";
    task.progress = 12;
    task.updatedAt = new Date().toISOString();
    await Storage.saveTask(task);
    state.tasks = await Storage.listTasks();
    state.currentVideoTask = task;
    renderVideoTask(task);
    renderTasks();
    showToast(t("arkTaskSubmitted"));
    pollArkVideoTask(task.id);
  } catch (error) {
    task.status = "failed";
    task.progress = 0;
    task.errorMessage = toFriendlyError(error, "video");
    task.updatedAt = new Date().toISOString();
    await Storage.saveTask(task);
    state.tasks = await Storage.listTasks();
    renderVideoTask(task);
    renderTasks();
    showError("video", task.errorMessage);
  } finally {
    setLoading(submitButton, false);
  }
}

async function createArkVideoTask(input) {
  const { apiKey, apiBaseURL, modelName } = state.settings.video;
  return requestJSON(`${normalizeBaseURL(apiBaseURL)}/contents/generations/tasks`, {
    apiKey,
    body: {
      model: modelName,
      content: buildArkVideoContent(input),
      generate_audio: input.generateAudio,
      ratio: input.ratio,
      duration: input.duration,
      watermark: input.watermark
    }
  });
}

async function getArkVideoTask(externalTaskId) {
  const { apiKey, apiBaseURL } = state.settings.video;
  return requestJSON(`${normalizeBaseURL(apiBaseURL)}/contents/generations/tasks/${encodeURIComponent(externalTaskId)}`, {
    apiKey,
    method: "GET"
  });
}

function buildArkVideoContent(input) {
  const content = [{
    type: "text",
    text: input.prompt
  }];

  input.referenceImageUrls.forEach((url) => {
    content.push({
      type: "image_url",
      image_url: { url },
      role: "reference_image"
    });
  });

  if (input.sourceImageDataURL) {
    content.push({
      type: "image_url",
      image_url: { url: input.sourceImageDataURL },
      role: "reference_image"
    });
  }

  if (input.referenceVideoUrl) {
    content.push({
      type: "video_url",
      video_url: { url: input.referenceVideoUrl },
      role: "reference_video"
    });
  }

  if (input.referenceAudioUrl) {
    content.push({
      type: "audio_url",
      audio_url: { url: input.referenceAudioUrl },
      role: "reference_audio"
    });
  }

  return content;
}

function extractArkTaskId(payload) {
  const taskId = payload?.id || payload?.task_id || payload?.taskId ||
    payload?.data?.id || payload?.data?.task_id || payload?.data?.taskId;
  if (!taskId) throw new Error("EMPTY_RESPONSE");
  return taskId;
}

function pollArkVideoTask(taskId) {
  clearInterval(state.timers[taskId]);

  const tick = async () => {
    const task = state.tasks.find((item) => item.id === taskId) || state.currentVideoTask;
    if (!task?.externalTaskId) {
      clearInterval(state.timers[taskId]);
      return;
    }

    try {
      const payload = await getArkVideoTask(task.externalTaskId);
      const providerStatus = extractArkStatus(payload);
      task.providerStatus = providerStatus.rawStatus;
      task.providerResponse = payload;
      task.status = providerStatus.status;
      task.progress = providerStatus.progress ?? task.progress ?? 12;
      task.videoUrl = extractVideoUrl(payload) || task.videoUrl || "";
      task.updatedAt = new Date().toISOString();
      await Storage.saveTask(task);
      state.tasks = await Storage.listTasks();
      state.currentVideoTask = task;
      renderVideoTask(task);
      renderTasks();

      if (task.status === "completed") {
        clearInterval(state.timers[taskId]);
        await saveVideoRecord(task);
        showToast(t("taskDone"));
      } else if (task.status === "failed") {
        clearInterval(state.timers[taskId]);
        showError("video", t("statusFailed"));
      }
    } catch (error) {
      clearInterval(state.timers[taskId]);
      task.status = "failed";
      task.errorMessage = toFriendlyError(error, "video");
      task.updatedAt = new Date().toISOString();
      await Storage.saveTask(task);
      state.tasks = await Storage.listTasks();
      state.currentVideoTask = task;
      renderVideoTask(task);
      renderTasks();
      showError("video", task.errorMessage);
    }
  };

  tick();
  state.timers[taskId] = setInterval(tick, 5000);
}

function resumeVideoPolling() {
  const task = state.tasks.find((item) => item.externalTaskId && !["completed", "failed"].includes(item.status));
  if (!task) return;
  state.currentVideoTask = task;
  renderVideoTask(task);
  pollArkVideoTask(task.id);
}

function extractArkStatus(payload) {
  const data = payload?.data || payload || {};
  const rawStatus = String(data.status || data.task_status || data.taskStatus || data.state || data.output?.status || "").toLowerCase();
  const rawProgress = Number(data.progress ?? data.percentage ?? data.output?.progress);

  if (["succeeded", "success", "done", "completed", "complete"].includes(rawStatus)) {
    return { status: "completed", progress: 100, rawStatus };
  }

  if (["failed", "error", "cancelled", "canceled", "timeout"].includes(rawStatus)) {
    return { status: "failed", progress: Number.isFinite(rawProgress) ? rawProgress : 0, rawStatus };
  }

  if (["queued", "pending", "created", "submitted"].includes(rawStatus)) {
    return { status: "polling", progress: Number.isFinite(rawProgress) ? rawProgress : 18, rawStatus };
  }

  if (["running", "processing", "generating", "in_progress"].includes(rawStatus)) {
    return { status: "rendering", progress: Number.isFinite(rawProgress) ? rawProgress : 58, rawStatus };
  }

  return { status: "polling", progress: Number.isFinite(rawProgress) ? rawProgress : 24, rawStatus };
}

function extractVideoUrl(payload) {
  const direct = payload?.data?.video_url?.url || payload?.data?.video_url || payload?.video_url?.url || payload?.video_url;
  if (typeof direct === "string") return direct;
  return findVideoUrl(payload);
}

function findVideoUrl(value) {
  if (!value || typeof value !== "object") return "";
  if (value.role === "reference_video") return "";
  if (typeof value.video_url === "string") return value.video_url;
  if (value.video_url?.url) return value.video_url.url;
  if (value.type === "video_url" && value.video_url?.url) return value.video_url.url;
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findVideoUrl(item);
        if (found) return found;
      }
    } else if (child && typeof child === "object") {
      const found = findVideoUrl(child);
      if (found) return found;
    }
  }
  return "";
}

function parseURLLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function saveVideoRecord(task) {
  const exists = state.records.find((record) => record.taskId === task.id);
  if (exists) return;

  const record = {
    id: createId(),
    taskId: task.id,
    type: "video",
    title: task.title,
    inputPrompt: task.prompt,
    outputContent: `${task.prompt}\n\nSeedance 2.0 task: ${task.externalTaskId || task.id}\nStatus: ${task.status}\nRatio: ${task.ratio}\nDuration: ${task.duration}s\nVideo: ${task.videoUrl || ""}`,
    modelName: task.modelName,
    favorite: false,
    media: {
      kind: "video",
      url: task.videoUrl || "",
      ratio: task.ratio,
      duration: task.duration,
      mode: task.mode,
      sourceImageDataURL: task.sourceImageDataURL,
      referenceImageUrls: task.referenceImageUrls || [],
      referenceVideoUrl: task.referenceVideoUrl || "",
      referenceAudioUrl: task.referenceAudioUrl || ""
    },
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await Storage.saveRecord(record);
  await refreshRecords();
}

function renderVideoTask(task = state.currentVideoTask) {
  const progress = $("[data-video-progress] .progress-bar span");
  const status = $("[data-video-status]");
  const preview = $("[data-video-preview]");

  if (!task) {
    progress.style.width = "0%";
    status.textContent = t("placeholderVideo");
    preview.classList.add("empty");
    preview.innerHTML = `<p>${escapeHtml(t("placeholderVideo"))}</p>`;
    return;
  }

  progress.style.width = `${task.progress || 0}%`;
  status.textContent = `${statusLabel(task.status)} · ${task.progress || 0}%`;

  if (task.status === "failed") {
    preview.classList.add("empty");
    preview.innerHTML = `<p>${escapeHtml(task.errorMessage || t("statusFailed"))}</p>`;
  } else if (task.status === "completed") {
    preview.classList.remove("empty");
    if (task.videoUrl) {
      preview.innerHTML = `<video src="${escapeAttribute(task.videoUrl)}" controls playsinline></video>`;
    } else {
      preview.innerHTML = `<div class="video-placeholder"><div>${escapeHtml(task.title)}<br><span class="muted">${escapeHtml(t("placeholderVideo"))}</span></div></div>`;
    }
  } else {
    preview.classList.add("empty");
    preview.innerHTML = `<p>${escapeHtml(statusLabel(task.status))}</p>`;
  }
}

function renderTasks() {
  const list = $("[data-task-list]");
  if (!list) return;
  const tasks = state.tasks.slice(0, 4);
  if (!tasks.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = tasks.map((task) => `
    <div class="task-item">
      <strong>${escapeHtml(task.title)}</strong>
      <span class="record-meta">${escapeHtml(task.modelName)} · ${statusLabel(task.status)} · ${task.progress || 0}%</span>
    </div>
  `).join("");
}

function bindChat() {
  const form = $("[data-chat-form]");
  const input = $("[data-chat-input]");
  if (!form || !input) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await sendChatMessage($("[data-chat-send]"));
  });

  $("[data-new-chat]")?.addEventListener("click", async () => {
    state.activeChatId = null;
    input.value = "";
    await Storage.saveDraft("chat:input", { text: "" });
    renderChatList();
    renderChatMessages();
    input.focus();
  });

  $("[data-delete-chat]")?.addEventListener("click", deleteActiveChat);

  const save = debounce(() => Storage.saveDraft("chat:input", { text: input.value }), 250);
  input.addEventListener("input", save);
}

async function sendChatMessage(button) {
  const input = $("[data-chat-input]");
  const text = input.value.trim();

  if (!text) {
    showError("chat", t("emptyChat"));
    return;
  }

  if (!state.settings.text.apiKey.trim()) {
    showError("chat", t("apiKeyEmpty"));
    return;
  }

  clearError("chat");
  setLoading(button, true);

  let chat = await getActiveChat();
  if (!chat) {
    chat = createChat(text);
    state.activeChatId = chat.id;
  }

  const now = new Date().toISOString();
  chat.messages.push({ role: "user", content: text, createdAt: now });
  chat.updatedAt = now;
  input.value = "";
  await Storage.saveDraft("chat:input", { text: "" });
  await Storage.saveChat(chat);
  await refreshChats();
  renderChatMessages(chat);

  try {
    const reply = await sendChatMessages(chat.messages);
    chat.messages.push({ role: "assistant", content: reply, createdAt: new Date().toISOString() });
    chat.modelName = state.settings.text.modelName;
    chat.updatedAt = new Date().toISOString();
    await Storage.saveChat(chat);
    await refreshChats();
    renderChatMessages(chat);
  } catch (error) {
    showError("chat", toFriendlyError(error));
  } finally {
    setLoading(button, false);
  }
}

function createChat(firstMessage) {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: firstMessage.slice(0, 36) || t("newChat"),
    messages: [],
    modelName: state.settings.text.modelName,
    createdAt: now,
    updatedAt: now
  };
}

async function sendChatMessages(messages) {
  const { apiKey, apiBaseURL, modelName } = state.settings.text;
  if (!apiKey.trim()) throw new Error("API_KEY_EMPTY");

  const payload = await requestJSON(`${normalizeBaseURL(apiBaseURL)}/chat/completions`, {
    apiKey,
    body: {
      model: modelName,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.chat },
        ...messages.slice(-16).map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content
        }))
      ],
      temperature: 0.7
    }
  });

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("EMPTY_RESPONSE");
  return content.trim();
}

async function getActiveChat() {
  if (!state.activeChatId) return null;
  return Storage.getChat(state.activeChatId);
}

async function refreshChats() {
  state.chats = await Storage.listChats();
  if (state.activeChatId && !state.chats.some((chat) => chat.id === state.activeChatId)) {
    state.activeChatId = state.chats[0]?.id || null;
  }
  renderChatList();
}

function renderChatList() {
  const list = $("[data-chat-list]");
  if (!list) return;

  if (!state.chats.length) {
    list.innerHTML = `<p class="muted">${escapeHtml(t("chatEmpty"))}</p>`;
    return;
  }

  list.innerHTML = state.chats.map((chat) => `
    <button class="chat-session ${chat.id === state.activeChatId ? "active" : ""}" type="button" data-open-chat="${chat.id}">
      <strong>${escapeHtml(chat.title || t("newChat"))}</strong>
      <small>${escapeHtml(chat.modelName || state.settings.text.modelName)} · ${formatDate(chat.updatedAt || chat.createdAt)}</small>
    </button>
  `).join("");

  $$("[data-open-chat]", list).forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeChatId = button.dataset.openChat;
      renderChatList();
      renderChatMessages(await getActiveChat());
    });
  });
}

function renderChatMessages(chat = state.chats.find((item) => item.id === state.activeChatId)) {
  const container = $("[data-chat-messages]");
  if (!container) return;

  const messages = chat?.messages || [];
  if (!messages.length) {
    container.innerHTML = `<div class="chat-empty"><strong>${escapeHtml(t("chat"))}</strong><p>${escapeHtml(t("chatWelcome"))}</p></div>`;
    return;
  }

  container.innerHTML = messages.map((message) => `
    <article class="chat-message ${message.role === "assistant" ? "assistant" : "user"}">
      <div class="chat-bubble">${renderMarkdown(message.content)}</div>
    </article>
  `).join("");
  container.scrollTop = container.scrollHeight;
}

async function deleteActiveChat() {
  if (!state.activeChatId) return;
  await Storage.deleteChat(state.activeChatId);
  state.activeChatId = null;
  await refreshChats();
  renderChatMessages();
  showToast(t("deleted"));
}

function statusLabel(status) {
  const key = {
    queued: "statusQueued",
    creating: "statusCreating",
    polling: "statusPolling",
    rendering: "statusRendering",
    finalizing: "statusFinalizing",
    completed: "statusCompleted",
    failed: "statusFailed"
  }[status] || "statusQueued";
  return t(key);
}

function bindHistory() {
  $("[data-history-search]").addEventListener("input", renderHistory);
  $$("[data-history-filter] button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter;
      $$("[data-history-filter] button").forEach((item) => item.classList.toggle("active", item === button));
      renderHistory();
    });
  });
}

async function refreshRecords() {
  state.records = await Storage.listRecords();
  renderRecent();
  renderHistory();
  updateSummaries();
}

function renderRecent() {
  const list = $("[data-recent-list]");
  const recent = state.records.slice(0, 5);
  if (!recent.length) {
    list.innerHTML = `<p class="muted">${escapeHtml(t("noHistory"))}</p>`;
    return;
  }
  list.innerHTML = recent.map(recentRecordHTML).join("");
  $$("[data-open-record]", list).forEach((button) => button.addEventListener("click", () => openRecord(button.dataset.openRecord)));
}

function renderHistory() {
  const list = $("[data-history-list]");
  const keyword = $("[data-history-search]")?.value?.trim().toLowerCase() || "";
  const records = state.records.filter((record) => {
    const matchesType = state.activeFilter === "all" ||
      (state.activeFilter === "favorite" && record.favorite) ||
      record.type === state.activeFilter;
    const haystack = `${record.title} ${record.inputPrompt} ${record.outputContent}`.toLowerCase();
    return matchesType && (!keyword || haystack.includes(keyword));
  });

  if (!records.length) {
    list.innerHTML = `<p class="muted">${escapeHtml(t("noMatch"))}</p>`;
    return;
  }
  list.innerHTML = records.map(recordItemHTML).join("");
  bindRecordItems(list);
}

function recentRecordHTML(record) {
  return `
    <button class="recent-item" type="button" data-open-record="${record.id}">
      <span class="recent-icon ${record.type}">${escapeHtml(typeIcon(record.type))}</span>
      <span class="recent-copy">
        <strong>${record.favorite ? "★ " : ""}${escapeHtml(record.title || t("detailTitle"))}</strong>
        <small>${escapeHtml(typeLabel(record.type))} · ${formatDate(record.createdAt)}</small>
      </span>
    </button>
  `;
}

function recordItemHTML(record) {
  return `
    <div class="record-item" data-record-id="${record.id}">
      <button class="record-main" type="button" data-open-record="${record.id}">
        <span class="record-title">${record.favorite ? "★ " : ""}${escapeHtml(record.title || t("detailTitle"))}</span>
        <span class="record-meta">${escapeHtml(typeLabel(record.type))} · ${formatDate(record.createdAt)} · ${escapeHtml(record.modelName || "")}</span>
      </button>
      <div class="record-actions">
        <button class="copy-button" type="button" data-favorite-record="${record.id}">${record.favorite ? "★" : "☆"}</button>
        <button class="copy-button" type="button" data-copy-record="${record.id}">${escapeHtml(t("copyAction"))}</button>
        <button class="danger-button" type="button" data-delete-record="${record.id}">${escapeHtml(t("delete"))}</button>
      </div>
    </div>
  `;
}

function typeIcon(type) {
  return {
    ppt: "▤",
    copy: "✎",
    prompt: "⌘",
    image: "◉",
    video: "▶",
    chat: "◌"
  }[type] || "◷";
}

function bindRecordItems(root) {
  $$("[data-open-record]", root).forEach((button) => button.addEventListener("click", () => openRecord(button.dataset.openRecord)));
  $$("[data-copy-record]", root).forEach((button) => button.addEventListener("click", () => {
    const record = state.records.find((item) => item.id === button.dataset.copyRecord);
    if (record) copyText(record.outputContent || record.media?.url || "");
  }));
  $$("[data-delete-record]", root).forEach((button) => button.addEventListener("click", () => deleteRecord(button.dataset.deleteRecord)));
  $$("[data-favorite-record]", root).forEach((button) => button.addEventListener("click", () => toggleFavorite(button.dataset.favoriteRecord)));
}

function bindDialog() {
  const dialog = $("[data-record-dialog]");
  $("[data-dialog-close]").addEventListener("click", () => dialog.close());
  $("[data-dialog-copy]").addEventListener("click", () => {
    const record = state.records.find((item) => item.id === state.dialogRecordId);
    if (record) copyText(record.outputContent || record.media?.url || "");
  });
  $("[data-dialog-delete]").addEventListener("click", async () => {
    if (!state.dialogRecordId) return;
    await deleteRecord(state.dialogRecordId);
    dialog.close();
  });
  $("[data-dialog-favorite]").addEventListener("click", async () => {
    if (!state.dialogRecordId) return;
    await toggleFavorite(state.dialogRecordId);
    openRecord(state.dialogRecordId);
  });
  $("[data-dialog-reopen]").addEventListener("click", () => {
    const record = state.records.find((item) => item.id === state.dialogRecordId);
    if (record) reopenRecord(record);
    dialog.close();
  });
}

function openRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;
  state.dialogRecordId = id;
  $("[data-dialog-type]").textContent = `${typeLabel(record.type)} · ${formatDate(record.createdAt)}`;
  $("[data-dialog-title]").textContent = record.title || t("detailTitle");
  $("[data-dialog-favorite]").textContent = record.favorite ? t("unfavorite") : t("favorite");

  if (record.media?.kind === "image") {
    $("[data-dialog-content]").innerHTML = `<p>${escapeHtml(record.inputPrompt || "")}</p><img src="${escapeAttribute(record.media.url)}" alt="" style="max-width:100%;border-radius:20px;">`;
  } else if (record.media?.kind === "video") {
    const preview = record.media.url
      ? `<video src="${escapeAttribute(record.media.url)}" controls playsinline style="max-width:100%;border-radius:20px;"></video>`
      : `<div class="video-placeholder">${escapeHtml(record.title)}</div>`;
    $("[data-dialog-content]").innerHTML = `${preview}${renderMarkdown(record.outputContent || "")}`;
  } else {
    $("[data-dialog-content]").innerHTML = renderMarkdown(record.outputContent || "");
  }

  $("[data-record-dialog]").showModal();
}

function reopenRecord(record) {
  showView(record.type);
  if (TEXT_TYPES.includes(record.type)) {
    state.activeRecordIds[record.type] = record.id;
    state.resultVersionIndex[record.type] = (record.versions?.length || 1) - 1;
    setTextResultFromRecord(record.type, record);
  } else if (record.type === "image") {
    state.currentImage = {
      title: record.title,
      prompt: record.inputPrompt,
      url: record.media?.url,
      ratio: record.media?.ratio,
      style: record.media?.style,
      modelName: record.modelName,
      recordId: record.id
    };
    renderImagePreview();
  } else if (record.type === "video") {
    state.currentVideoTask = {
      id: record.taskId || record.id,
      title: record.title,
      prompt: record.inputPrompt,
      modelName: record.modelName,
      status: "completed",
      progress: 100,
      videoUrl: record.media?.url,
      ratio: record.media?.ratio,
      duration: record.media?.duration
    };
    renderVideoTask();
  }
}

async function deleteRecord(id) {
  await Storage.deleteRecord(id);
  await refreshRecords();
  showToast(t("deleted"));
}

async function toggleFavorite(id) {
  const record = await Storage.getRecord(id);
  if (!record) return;
  record.favorite = !record.favorite;
  record.updatedAt = new Date().toISOString();
  await Storage.saveRecord(record);
  await refreshRecords();
}

function renderHotspots() {
  const list = $("[data-hotspot-list]");
  const hotspots = HOTSPOTS[state.ui.language] || HOTSPOTS.zh;
  list.innerHTML = hotspots.map((item, index) => `
    <article class="hotspot-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p class="muted">${escapeHtml(item.summary)}</p>
      <div>${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(" ")}</div>
      <div class="hotspot-actions">
        <button class="copy-button" type="button" data-hot-action="ppt:${index}">PPT</button>
        <button class="copy-button" type="button" data-hot-action="script:${index}">${escapeHtml(t("generateScript"))}</button>
        <button class="copy-button" type="button" data-hot-action="xhs:${index}">${escapeHtml(t("xhsCopy"))}</button>
        <button class="copy-button" type="button" data-hot-action="moments:${index}">${escapeHtml(t("momentsCopy"))}</button>
        <button class="copy-button" type="button" data-hot-action="prompt:${index}">${escapeHtml(t("prompt"))}</button>
      </div>
    </article>
  `).join("");

  $$("[data-hot-action]", list).forEach((button) => {
    button.addEventListener("click", () => handleHotAction(button.dataset.hotAction));
  });
}

function handleHotAction(action) {
  const [kind, indexText] = action.split(":");
  const item = (HOTSPOTS[state.ui.language] || HOTSPOTS.zh)[Number(indexText)];
  if (!item) return;

  if (kind === "ppt") {
    $("#ppt-topic").value = item.title;
    saveFormDraft("ppt");
    showView("ppt");
  } else if (kind === "prompt") {
    $("#prompt-goal").value = item.title;
    saveFormDraft("prompt");
    showView("prompt");
  } else {
    $("#copy-topic").value = item.title;
    $("#copy-type").value = kind === "script" ? "copyScript" : kind === "xhs" ? "copyXhs" : "copyMoments";
    saveFormDraft("copy");
    showView("copy");
  }
}

function saveFormDraft(formName) {
  const form = $(`[data-form="${formName}"]`);
  if (form) Storage.saveDraft(`form:${formName}`, readForm(form, { skipFiles: true }));
}

function bindSettings() {
  $('[data-form="settings"]').addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    state.settings = {
      text: {
        apiBaseURL: normalizeBaseURL(data.textApiBaseURL),
        apiKey: data.textApiKey.trim(),
        modelName: data.textModel
      },
      image: {
        apiBaseURL: normalizeBaseURL(data.imageApiBaseURL),
        apiKey: data.imageApiKey.trim(),
        modelName: data.imageModel.trim() || "gpt-image-2"
      },
      video: {
        apiBaseURL: normalizeBaseURL(data.videoApiBaseURL),
        apiKey: data.videoApiKey.trim(),
        modelName: data.videoModel.trim() || "doubao-seedance-2-0-260128"
      },
      export: {
        defaultFormat: data.exportFormat
      }
    };
    state.ui.language = data.language;
    state.ui.theme = data.theme;
    Storage.saveSettings(state.settings);
    Storage.saveUI(state.ui);
    applyTheme();
    applyI18n();
    populateSettingsForm();
    showToast(t("settingsSaved"));
  });

  $("[data-test-connection]").addEventListener("click", async (event) => {
    clearError("settings");
    const button = event.currentTarget;
    setLoading(button, true);
    saveSettingsFromForm();
    try {
      await sendTextMessage("你是连接测试助手。", "请只回复：OK");
      $("[data-settings-status]").textContent = t("currentModel", { model: state.settings.text.modelName }) + " · " + t("connectionOK");
      showToast(t("connectionOK"));
    } catch (error) {
      showError("settings", toFriendlyError(error));
    } finally {
      setLoading(button, false);
    }
  });

  $$("[data-toggle-secret]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.toggleSecret);
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? t("show") : t("hide");
    });
  });

  $("[data-clear-history]").addEventListener("click", async () => {
    if (!confirm(t("confirmClearHistory"))) return;
    for (const record of state.records) await Storage.deleteRecord(record.id);
    state.records = [];
    renderRecent();
    renderHistory();
    updateSummaries();
    showToast(t("historyCleared"));
  });

  $("[data-clear-local]").addEventListener("click", async () => {
    if (!confirm(t("confirmClearLocalOne"))) return;
    if (!confirm(t("confirmClearLocalTwo"))) return;
    await Storage.clearAllLocalData();
    state.settings = Storage.getSettings();
    state.ui = Storage.getUI();
    state.records = [];
    state.tasks = [];
    state.chats = [];
    state.activeChatId = null;
    state.currentImage = null;
    state.currentVideoTask = null;
    TEXT_TYPES.forEach((type) => {
      state.activeRecordIds[type] = null;
      state.results[type] = "";
      setResult(type, t("placeholderResult"), true);
      renderVersionStrip(type);
    });
    applyTheme();
    populateSettingsForm();
    applyI18n();
    renderRecent();
    renderHistory();
    renderTasks();
    renderChatList();
    renderChatMessages();
    renderImagePreview();
    renderVideoTask();
    showToast(t("localCleared"));
  });
}

function saveSettingsFromForm() {
  $('[data-form="settings"]').dispatchEvent(new Event("submit", { cancelable: true }));
}

function populateSettingsForm() {
  $("#text-base").value = state.settings.text.apiBaseURL;
  $("#text-key").value = state.settings.text.apiKey;
  $("#text-model").value = state.settings.text.modelName;
  $("#image-base").value = state.settings.image.apiBaseURL;
  $("#image-key").value = state.settings.image.apiKey;
  $("#image-model").value = state.settings.image.modelName;
  $("#video-base").value = state.settings.video.apiBaseURL;
  $("#video-key").value = state.settings.video.apiKey;
  $("#video-model").value = state.settings.video.modelName;
  $("#language-select").value = state.ui.language;
  $("#theme-select").value = state.ui.theme;
  $("#export-format").value = state.settings.export.defaultFormat;
}

function updateSummaries() {
  const hasKey = Boolean(state.settings.text.apiKey.trim());
  $$("[data-model-label]").forEach((item) => {
    item.textContent = state.settings.text.modelName;
  });
  $("[data-summary-model]").textContent = state.settings.text.modelName;
  $("[data-summary-base]").textContent = state.settings.text.apiBaseURL;
  $("[data-summary-key]").textContent = hasKey ? "••••••••••••••••" : t("keyEmpty");
  $("[data-history-count]").textContent = t("recordCount", { count: state.records.length });
  $("[data-settings-status]").textContent = t("currentModel", { model: state.settings.text.modelName });
}

function bindExports() {
  $$("[data-copy-result]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.copyResult;
      copyText(getActiveText(type));
    });
  });

  $$("[data-export]").forEach((button) => {
    button.addEventListener("click", () => {
      const [type, format] = button.dataset.export.split(":");
      exportContent(type, format);
    });
  });
}

function bindMediaActions() {
  $("[data-copy-image]").addEventListener("click", copyCurrentImage);
  $("[data-download-image]").addEventListener("click", downloadCurrentImage);
  $("[data-save-image]").addEventListener("click", async () => {
    if (state.currentImage) {
      await saveImageRecord();
      showToast(t("saved"));
    }
  });
}

function bindIteration() {
  $$("[data-iterate]").forEach((button) => {
    button.addEventListener("click", () => continueText(button.dataset.iterate, button));
  });
}

function getActiveText(type) {
  return state.results[type] || $(`[data-result="${type}"]`)?.innerText?.trim() || "";
}

function exportContent(type, format) {
  const content = getActiveText(type);
  if (!content) {
    showToast(t("nothingToCopy"));
    return;
  }
  const title = safeFileName(`${type}-${new Date().toISOString().slice(0, 10)}`);
  if (format === "pdf") {
    exportPDF(title, content);
  } else if (format === "word") {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body>${renderMarkdown(content)}</body></html>`;
    downloadBlob(`${title}.doc`, html, "application/msword;charset=utf-8");
  } else {
    const ext = format === "txt" ? "txt" : "md";
    downloadBlob(`${title}.${ext}`, content, "text/plain;charset=utf-8");
  }
  showToast(t("exported"));
}

function exportPDF(title, content) {
  const win = window.open("", "_blank");
  if (!win) {
    downloadBlob(`${title}.html`, renderMarkdown(content), "text/html;charset=utf-8");
    return;
  }
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px;line-height:1.6;color:#111}h1,h2,h3{font-weight:800}</style></head><body>${renderMarkdown(content)}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 150);
}

async function copyCurrentImage() {
  const image = state.currentImage;
  if (!image?.url) {
    showToast(t("nothingToCopy"));
    return;
  }
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = await (await fetch(image.url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
    } else {
      await copyText(image.url);
      return;
    }
    showToast(t("copied"));
  } catch {
    copyText(image.url);
  }
}

function downloadCurrentImage() {
  const image = state.currentImage;
  if (!image?.url) {
    showToast(t("nothingToCopy"));
    return;
  }
  const link = document.createElement("a");
  link.href = image.url;
  link.download = `${safeFileName(image.title || "image")}.png`;
  link.click();
}

function toFriendlyError(error, scope = "text") {
  if (error.message === "API_KEY_EMPTY") return t("apiKeyEmpty");
  if (error.message === "IMAGE_KEY_EMPTY") return t("imageKeyEmpty");
  if (error.message === "VIDEO_KEY_EMPTY") return t("videoKeyEmpty");
  if (error.status === 401 || error.status === 403) return t("authError");
  if (error.status === 402) return t("balanceError");
  if (error.status === 429) return t("rateError");
  if (error.status) {
    const label = scope === "image" ? "Image API" : scope === "video" ? "Video API" : "API";
    return `${label} ${error.status}: ${error.message}`;
  }
  return t("networkError");
}

function showError(type, message) {
  const banner = $(`[data-error="${type}"]`);
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
}

function clearError(type) {
  const banner = $(`[data-error="${type}"]`);
  if (!banner) return;
  banner.textContent = "";
  banner.hidden = true;
}

function setLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.classList.toggle("loading", isLoading);
}

function optionLabel(value) {
  return I18N.messages.zh[value] || I18N.messages.en[value] ? t(value) : value;
}

function typeLabel(type) {
  return t(RECORD_TYPE_KEYS[type] || "detailTitle");
}

function normalizeBaseURL(url) {
  const trimmed = String(url || "").trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
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
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

async function copyText(text) {
  const value = String(text || "").trim();
  if (!value) {
    showToast(t("nothingToCopy"));
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
  showToast(t("copied"));
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
  return new Intl.DateTimeFormat(state.ui.language === "en" ? "en-US" : "zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function safeFileName(value) {
  return String(value || "export").replace(/[\\/:*?"<>|]/g, "-").slice(0, 80);
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

init();
