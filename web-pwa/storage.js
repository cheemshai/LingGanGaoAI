(function (global) {
  const DB_NAME = "linggangaoai-pwa";
  const DB_VERSION = 3;
  const SETTINGS_KEY = "linggangaoai.settings.v2";
  const UI_KEY = "linggangaoai.ui.v2";
  const OLD_RECORDS_KEY = "linggangaoai.records.v1";

  const defaultSettings = {
    text: {
      apiBaseURL: "https://api.deepseek.com",
      apiKey: "",
      modelName: "deepseek-v4-flash"
    },
    image: {
      apiBaseURL: "https://api.openai.com/v1",
      apiKey: "",
      modelName: "gpt-image-2"
    },
    video: {
      apiBaseURL: "/api/ark",
      apiKey: "",
      modelName: "doubao-seedance-2-0-260128"
    },
    export: {
      defaultFormat: "markdown"
    }
  };

  const defaultUI = {
    language: "zh",
    theme: "system"
  };

  let dbPromise;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeDeep(base, patch) {
    const output = clone(base);
    if (!patch || typeof patch !== "object") return output;

    Object.keys(patch).forEach((key) => {
      if (
        patch[key] &&
        typeof patch[key] === "object" &&
        !Array.isArray(patch[key]) &&
        output[key] &&
        typeof output[key] === "object"
      ) {
        output[key] = mergeDeep(output[key], patch[key]);
      } else {
        output[key] = patch[key];
      }
    });

    return output;
  }

  function readLocal(key, fallback) {
    try {
      return mergeDeep(fallback, JSON.parse(localStorage.getItem(key) || "{}"));
    } catch {
      return clone(fallback);
    }
  }

  function writeLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeSettings(settings) {
    const output = mergeDeep(defaultSettings, settings);
    if (output.video.apiBaseURL === "https://api.seedance.example/v1") {
      output.video.apiBaseURL = defaultSettings.video.apiBaseURL;
    }
    if (output.video.apiBaseURL === "https://ark.cn-beijing.volces.com/api/v3") {
      output.video.apiBaseURL = defaultSettings.video.apiBaseURL;
    }
    if (output.video.modelName === "seedance-2.0") {
      output.video.modelName = defaultSettings.video.modelName;
    }
    return output;
  }

  function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("records")) {
          const store = db.createObjectStore("records", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("type", "type");
          store.createIndex("favorite", "favorite");
        }
        if (!db.objectStoreNames.contains("tasks")) {
          const store = db.createObjectStore("tasks", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("status", "status");
        }
        if (!db.objectStoreNames.contains("drafts")) {
          db.createObjectStore("drafts", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("chats")) {
          const store = db.createObjectStore("chats", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return dbPromise;
  }

  async function storeAction(storeName, mode, action) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function put(storeName, value) {
    return storeAction(storeName, "readwrite", (store) => store.put(value));
  }

  async function get(storeName, id) {
    return storeAction(storeName, "readonly", (store) => store.get(id));
  }

  async function getAll(storeName) {
    return storeAction(storeName, "readonly", (store) => store.getAll());
  }

  async function remove(storeName, id) {
    return storeAction(storeName, "readwrite", (store) => store.delete(id));
  }

  async function clear(storeName) {
    return storeAction(storeName, "readwrite", (store) => store.clear());
  }

  async function migrateOldRecords() {
    if (localStorage.getItem("linggangaoai.migrated.v1")) return;

    try {
      const oldRecords = JSON.parse(localStorage.getItem(OLD_RECORDS_KEY) || "[]");
      if (Array.isArray(oldRecords) && oldRecords.length) {
        for (const record of oldRecords) {
          await put("records", {
            ...record,
            favorite: Boolean(record.favorite),
            versions: record.versions || [{
              label: "V1",
              content: record.outputContent || "",
              prompt: record.inputPrompt || "",
              createdAt: record.createdAt || new Date().toISOString()
            }]
          });
        }
      }
      localStorage.setItem("linggangaoai.migrated.v1", "true");
    } catch {
      localStorage.setItem("linggangaoai.migrated.v1", "true");
    }
  }

  const storage = {
    defaults: {
      settings: defaultSettings,
      ui: defaultUI
    },

    async init() {
      await openDB();
      await migrateOldRecords();
    },

    getSettings() {
      const settings = normalizeSettings(readLocal(SETTINGS_KEY, defaultSettings));
      writeLocal(SETTINGS_KEY, settings);
      return settings;
    },

    saveSettings(settings) {
      writeLocal(SETTINGS_KEY, normalizeSettings(settings));
    },

    getUI() {
      return readLocal(UI_KEY, defaultUI);
    },

    saveUI(ui) {
      writeLocal(UI_KEY, mergeDeep(defaultUI, ui));
    },

    async listRecords() {
      const records = await getAll("records");
      return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async saveRecord(record) {
      await put("records", record);
      return record;
    },

    async getRecord(id) {
      return get("records", id);
    },

    async deleteRecord(id) {
      await remove("records", id);
    },

    async listTasks() {
      const tasks = await getAll("tasks");
      return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async saveTask(task) {
      await put("tasks", task);
      return task;
    },

    async deleteTask(id) {
      await remove("tasks", id);
    },

    async listChats() {
      const chats = await getAll("chats");
      return chats.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    },

    async saveChat(chat) {
      await put("chats", chat);
      return chat;
    },

    async getChat(id) {
      return get("chats", id);
    },

    async deleteChat(id) {
      await remove("chats", id);
    },

    async getDraft(id) {
      return get("drafts", id);
    },

    async saveDraft(id, data) {
      await put("drafts", {
        id,
        data,
        updatedAt: new Date().toISOString()
      });
    },

    async clearAllLocalData() {
      await Promise.all([
        clear("records"),
        clear("tasks"),
        clear("drafts"),
        clear("chats")
      ]);
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(UI_KEY);
      localStorage.removeItem(OLD_RECORDS_KEY);
      localStorage.removeItem("linggangaoai.migrated.v1");
    }
  };

  global.LingGanStorage = storage;
})(window);
