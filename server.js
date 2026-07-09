const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

loadEnv(path.join(ROOT, ".env"));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function loadEnv(filename) {
  if (!fs.existsSync(filename)) return;
  const lines = fs.readFileSync(filename, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_UPLOAD_SIZE) {
      const error = new Error("Les photos dépassent la taille maximale autorisée.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function identifyPlant(request, response, requestUrl) {
  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) {
    return sendJson(response, 503, {
      error: "La clé Pl@ntNet n’est pas configurée dans le fichier .env."
    });
  }

  const contentType = request.headers["content-type"] || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return sendJson(response, 400, { error: "Le formulaire de photos est invalide." });
  }

  try {
    const body = await readBody(request);
    const project = requestUrl.searchParams.get("project") || "all";
    const upstreamUrl = new URL(
      `https://my-api.plantnet.org/v2/identify/${encodeURIComponent(project)}`
    );
    upstreamUrl.searchParams.set("api-key", apiKey);
    const requestedLanguage = requestUrl.searchParams.get("lang");
    upstreamUrl.searchParams.set("lang", requestedLanguage === "en" ? "en" : "fr");
    upstreamUrl.searchParams.set("nb-results", "3");
    upstreamUrl.searchParams.set("include-related-images", "true");

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: "Réponse inattendue du service Pl@ntNet." };
    }

    if (!upstream.ok) {
      const message =
        upstream.status === 404
          ? "Pl@ntNet n’a pas reconnu de plante dans ces photos."
          : data.message || data.error || "L’identification Pl@ntNet a échoué.";
      return sendJson(response, upstream.status, { error: message });
    }

    return sendJson(response, 200, data);
  } catch (error) {
    return sendJson(response, error.status || 502, {
      error: error.message || "Impossible de contacter Pl@ntNet."
    });
  }
}

function serveFile(response, pathname) {
  const requestedPath = pathname === "/" ? "Le_Grimoire_v0_2_0.html" : pathname.slice(1);
  const normalized = path.normalize(requestedPath);
  const filename = path.resolve(ROOT, normalized);

  if (!filename.startsWith(ROOT + path.sep) && filename !== ROOT) {
    response.writeHead(403);
    return response.end("Accès refusé");
  }

  fs.stat(filename, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404);
      return response.end("Page introuvable");
    }
    const type = MIME_TYPES[path.extname(filename).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(self), geolocation=()",
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(filename).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "POST" && requestUrl.pathname === "/api/identify") {
    return identifyPlant(request, response, requestUrl);
  }
  if (request.method === "GET" && requestUrl.pathname === "/health") {
    return sendJson(response, 200, { status: "ok" });
  }
  if (request.method === "GET") {
    return serveFile(response, decodeURIComponent(requestUrl.pathname));
  }
  response.writeHead(405, { Allow: "GET, POST" });
  response.end("Méthode non autorisée");
});

server.listen(PORT, HOST, () => {
  console.log(`Le Grimoire est disponible sur http://127.0.0.1:${PORT}`);
  if(HOST === "0.0.0.0"){
    console.log("Pour un test mobile, ouvre http://ADRESSE-IP-DU-PC:" + PORT);
  }
});
