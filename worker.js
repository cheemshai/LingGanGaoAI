const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

const VIDEO_DOWNLOAD_FIX = `
<script data-video-download-fix>
(() => {
  const labels = {
    copy: document.documentElement.lang === "en" ? "Copy Link" : "复制链接",
    open: document.documentElement.lang === "en" ? "Open Video" : "打开视频",
    download: document.documentElement.lang === "en" ? "Download Video" : "下载视频",
    empty: document.documentElement.lang === "en" ? "No video yet" : "还没有可下载的视频",
    started: document.documentElement.lang === "en" ? "Download started" : "已开始下载"
  };

  const toast = (message) => {
    const node = document.querySelector("[data-toast]");
    if (node) {
      node.textContent = message;
      node.hidden = false;
      clearTimeout(window.__videoDownloadToastTimer);
      window.__videoDownloadToastTimer = setTimeout(() => { node.hidden = true; }, 1800);
    } else {
      console.info(message);
    }
  };

  const safeName = (value) => String(value || "seedance-video").replace(/[\\\\/:*?"<>|]+/g, "-").slice(0, 80) || "seedance-video";
  const videoUrl = () => document.querySelector("[data-video-preview] video")?.currentSrc || document.querySelector("[data-video-preview] video")?.src || "";
  const filename = () => safeName(document.querySelector("[data-video-status]")?.textContent || "seedance-video") + ".mp4";

  function buildDownloadUrl(url) {
    return "/api/download?url=" + encodeURIComponent(url) + "&filename=" + encodeURIComponent(filename());
  }

  function ensureButtons() {
    const heading = document.querySelector('[data-panel="video"] .result-panel .panel-heading');
    if (!heading || heading.querySelector("[data-worker-download-video]")) return;
    let group = heading.querySelector(".action-group");
    if (!group) {
      group = document.createElement("div");
      group.className = "action-group";
      heading.appendChild(group);
    }

    const makeButton = (text, action) => {
      const button = document.createElement("button");
      button.className = "copy-button";
      button.type = "button";
      button.textContent = text;
      button.dataset.workerDownloadVideo = action;
      group.appendChild(button);
      return button;
    };

    makeButton(labels.copy, "copy").addEventListener("click", async () => {
      const url = videoUrl();
      if (!url) return toast(labels.empty);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast(labels.copy);
    });

    makeButton(labels.open, "open").addEventListener("click", () => {
      const url = videoUrl();
      if (!url) return toast(labels.empty);
      window.open(url, "_blank", "noopener");
    });

    makeButton(labels.download, "download").addEventListener("click", () => {
      const url = videoUrl();
      if (!url) return toast(labels.empty);
      const link = document.createElement("a");
      link.href = buildDownloadUrl(url);
      link.download = filename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast(labels.started);
    });
  }

  ensureButtons();
  new MutationObserver(ensureButtons).observe(document.documentElement, { childList: true, subtree: true });
})();
</script>`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,Range",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/download") {
      return proxyDownload(request, url);
    }

    if (url.pathname.startsWith("/api/ark/")) {
      return proxyArkRequest(request, env, url);
    }

    return serveAsset(request, env);
  }
};

async function serveAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("text/html")) return response;

  const html = await response.text();
  if (html.includes("data-video-download-fix")) return response;

  const headers = new Headers(response.headers);
  return new Response(html.replace("</body>", `${VIDEO_DOWNLOAD_FIX}\n</body>`), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function proxyArkRequest(request, env, url) {
  const arkPath = url.pathname.replace(/^\/api\/ark/, "");
  const upstreamURL = new URL(`${ARK_BASE_URL}${arkPath}`);
  upstreamURL.search = url.search;

  const clientAuth = request.headers.get("Authorization") || "";
  const secretAuth = env.ARK_API_KEY ? `Bearer ${env.ARK_API_KEY}` : "";
  const authorization = clientAuth || secretAuth;

  if (!authorization) {
    return jsonResponse({ error: { message: "Missing Ark API key." } }, 401);
  }

  const headers = new Headers({
    "Content-Type": request.headers.get("Content-Type") || "application/json",
    "Authorization": authorization
  });

  const init = {
    method: request.method,
    headers
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  try {
    const upstream = await fetch(upstreamURL, init);
    const responseHeaders = new Headers(upstream.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(key, value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return jsonResponse({
      error: {
        message: error?.message || "Ark upstream request failed."
      }
    }, 502);
  }
}

async function proxyDownload(request, url) {
  const target = url.searchParams.get("url");
  const filename = sanitizeFilename(url.searchParams.get("filename") || "seedance-video.mp4");

  if (!target) {
    return jsonResponse({ error: { message: "Missing download URL." } }, 400);
  }

  let targetURL;
  try {
    targetURL = new URL(target);
  } catch {
    return jsonResponse({ error: { message: "Invalid download URL." } }, 400);
  }

  if (!["http:", "https:"].includes(targetURL.protocol) || !isAllowedDownloadHost(targetURL.hostname)) {
    return jsonResponse({ error: { message: "Unsupported download host." } }, 400);
  }

  const headers = new Headers();
  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);

  try {
    const upstream = await fetch(targetURL, { method: "GET", headers });
    const responseHeaders = new Headers();
    for (const name of ["Content-Type", "Content-Length", "Accept-Ranges", "Content-Range", "ETag", "Last-Modified"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set("Content-Type", responseHeaders.get("Content-Type") || "video/mp4");
    responseHeaders.set("Content-Disposition", `attachment; filename="${filename}"`);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(key, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return jsonResponse({
      error: {
        message: error?.message || "Video download failed."
      }
    }, 502);
  }
}

function isAllowedDownloadHost(hostname) {
  const host = hostname.toLowerCase();
  return host === "volces.com" ||
    host.endsWith(".volces.com") ||
    host === "volcengine.com" ||
    host.endsWith(".volcengine.com");
}

function sanitizeFilename(filename) {
  const safe = filename.replace(/[\\/:*?"<>|]+/g, "-").replace(/[\r\n]+/g, "").slice(0, 120);
  return safe || "seedance-video.mp4";
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS
    }
  });
}
