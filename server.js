const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const heicConvert = require("heic-convert");

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

function sendBinary(response, status, data, contentType) {
  response.writeHead(status, {
    "Content-Type": contentType || "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(data);
}

function parseMultipartFormData(body, contentType) {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[1] ||
    contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[2];
  if (!boundary) {
    const error = new Error("Le formulaire de photos est invalide.");
    error.status = 400;
    throw error;
  }

  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = body.indexOf(delimiter);
  while (cursor !== -1) {
    cursor += delimiter.length;
    if (body.slice(cursor, cursor + 2).toString() === "--") break;
    if (body.slice(cursor, cursor + 2).toString() === "\r\n") cursor += 2;

    const next = body.indexOf(delimiter, cursor);
    if (next === -1) break;
    let part = body.slice(cursor, next);
    if (part.slice(-2).toString() === "\r\n") part = part.slice(0, -2);

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const rawHeaders = part.slice(0, headerEnd).toString("utf8");
      const data = part.slice(headerEnd + 4);
      const disposition = rawHeaders.match(/content-disposition:\s*([^\r\n]+)/i)?.[1] || "";
      const name = disposition.match(/name="([^"]+)"/i)?.[1] || "";
      const filename = disposition.match(/filename="([^"]*)"/i)?.[1] || "";
      const partContentType = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || "";
      if (name) parts.push({ name, filename, contentType: partContentType, data });
    }
    cursor = next;
  }
  return parts;
}

function isProbablyHeic(part) {
  const filename = String(part.filename || "").toLowerCase();
  const contentType = String(part.contentType || "").toLowerCase();
  const brand = part.data.slice(4, 12).toString("latin1").toLowerCase();
  const majorBrand = part.data.slice(8, 12).toString("latin1").toLowerCase();
  const compatibleBrands = part.data.slice(8, 48).toString("latin1").toLowerCase();
  return /\.(heic|heif)$/i.test(filename) ||
    contentType.includes("heic") ||
    contentType.includes("heif") ||
    contentType.includes("avif") ||
    brand.startsWith("ftypheic") ||
    brand.startsWith("ftypheif") ||
    brand.startsWith("ftypheix") ||
    brand.startsWith("ftypheim") ||
    brand.startsWith("ftypheis") ||
    brand.startsWith("ftyphevc") ||
    brand.startsWith("ftyphevx") ||
    brand.startsWith("ftypmif1") ||
    brand.startsWith("ftypmsf1") ||
    brand.startsWith("ftypavif") ||
    brand.startsWith("ftypavis") ||
    ["heic", "heif", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1", "avif", "avis"].includes(majorBrand) ||
    /hei[cfxms]|hev[ctx]|mif1|msf1|avif|avis/.test(compatibleBrands);
}

function jpegFilename(filename) {
  const base = String(filename || "photo-plante").replace(/\.[^.]+$/, "") || "photo-plante";
  return `${base}.jpg`;
}

async function convertHeicPart(part) {
  if (!isProbablyHeic(part)) return part;
  try {
    const output = await heicConvert({
      buffer: part.data,
      format: "JPEG",
      quality: 0.88
    });
    return {
      ...part,
      filename: jpegFilename(part.filename),
      contentType: "image/jpeg",
      data: Buffer.from(output)
    };
  } catch {
    const error = new Error("Cette photo HEIC n’a pas pu être convertie. Dans les réglages de l’appareil photo, choisis le format le plus compatible puis reprends la photo.");
    error.status = 415;
    throw error;
  }
}

async function preparePlantNetFormData(body, contentType) {
  const parts = parseMultipartFormData(body, contentType);
  const formData = new FormData();
  for (const part of parts) {
    if (part.filename) {
      const converted = await convertHeicPart(part);
      formData.append(
        converted.name,
        new Blob([converted.data], { type: converted.contentType || "application/octet-stream" }),
        converted.filename || "photo-plante.jpg"
      );
    } else {
      formData.append(part.name, part.data.toString("utf8"));
    }
  }
  return formData;
}

async function previewPhoto(request, response) {
  const contentType = request.headers["content-type"] || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return sendJson(response, 400, { error: "Le formulaire de photo est invalide." });
  }

  try {
    const body = await readBody(request);
    const parts = parseMultipartFormData(body, contentType);
    const photo = parts.find(part => part.filename);
    if (!photo) return sendJson(response, 400, { error: "Aucune photo reçue." });

    const prepared = await convertHeicPart(photo);
    const outputType = prepared.contentType || "image/jpeg";
    if (!String(outputType).toLowerCase().startsWith("image/")) {
      return sendJson(response, 415, { error: "Ce fichier n’est pas reconnu comme une photo." });
    }
    return sendBinary(response, 200, prepared.data, outputType);
  } catch (error) {
    return sendJson(response, error.status || 415, {
      error: error.message || "Cette photo n’a pas pu être préparée."
    });
  }
}

// --- Nominatim : cache mémoire + sérialisation à >= 1 req/s (politique d'usage) ---
const NOMINATIM_UA = "Le-Grimoire/0.3 (botanical educational app)";
const geocodeCache = new Map();
const GEOCODE_CACHE_MAX = 500;
let nominatimChain = Promise.resolve();
let lastNominatimAt = 0;

function geocodeCacheGet(key) {
  return geocodeCache.has(key) ? geocodeCache.get(key) : undefined;
}

function geocodeCacheSet(key, value) {
  geocodeCache.set(key, value);
  if (geocodeCache.size > GEOCODE_CACHE_MAX) {
    geocodeCache.delete(geocodeCache.keys().next().value);
  }
}

function nominatimFetch(url) {
  const run = async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastNominatimAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastNominatimAt = Date.now();
    return fetch(url, {
      headers: { "User-Agent": NOMINATIM_UA },
      signal: AbortSignal.timeout(6000)
    });
  };
  nominatimChain = nominatimChain.then(run, run);
  return nominatimChain;
}

// --- Limitation de débit basique par IP sur /api/* ---
const rateBuckets = new Map();
function isRateLimited(ip, limit = 60, windowMs = 60000) {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (rateBuckets.size > 5000) {
    for (const [key, value] of rateBuckets) {
      if (now > value.resetAt) rateBuckets.delete(key);
    }
  }
  return bucket.count > limit;
}

function textSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]+/g)
    ?.map(value => value.trim()) || [];
}

function extractHeight(text, language) {
  const source = String(text || "").replace(/\s+/g, " ");
  const pattern = language === "en"
    ? /(?:grows?|reaches?|height of|tall|up to)[^.!?]{0,65}?(\d+(?:[.,]\d+)?(?:\s*(?:to|–|-)\s*\d+(?:[.,]\d+)?)?\s*(?:cm|m|metres?|meters?|feet|ft))/i
    : /(?:atteint|mesure|hauteur de|haut(?:e)? de|peut atteindre|pouvant atteindre|jusqu['’]à)[^.!?]{0,65}?(\d+(?:[.,]\d+)?(?:\s*(?:à|–|-)\s*\d+(?:[.,]\d+)?)?\s*(?:cm|m|mètres?))/i;
  return source.match(pattern)?.[1] || "";
}

function extractFlowering(text, language) {
  const source = String(text || "").replace(/\s+/g, " ");
  const cue = language === "en" ? /flower(?:s|ing)?|bloom(?:s|ing)?/i : /floraison|fleurit|fleurissent/i;
  const sentence = source.match(/[^.!?]+[.!?]+/g)?.find(value => cue.test(value));
  if (!sentence || sentence.length > 220) return "";
  return sentence.trim();
}

function extractSafetyNote(text, language) {
  const source = String(text || "").replace(/\s+/g, " ");
  const cue = language === "en"
    ? /toxic|poison|edible|inedible|consum/i
    : /toxique|poison|comestible|consomm|alimentaire/i;
  const sentence = source.match(/[^.!?]+[.!?]+/g)?.find(value => cue.test(value));
  if (!sentence || sentence.length > 320) return "";
  return sentence.trim();
}

async function wikipediaSpeciesInfo(scientificName, language) {
  if (!scientificName) return null;
  const lang = language === "en" ? "en" : "fr";
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `"${scientificName}"`);
  url.searchParams.set("gsrlimit", "1");
  url.searchParams.set("prop", "extracts|pageimages|info");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("inprop", "url");
  url.searchParams.set("pithumbsize", "900");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Le-Grimoire/0.2 (botanical educational app)" },
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    const page = data?.query?.pages?.[0];
    if (!page?.extract || page.missing) return null;
    const sentences = textSentences(page.extract);
    return {
      summary: sentences.slice(0, 3).join(" "),
      recognition: (sentences.slice(2, 6).join(" ") || sentences.slice(0, 3).join(" ")),
      height: extractHeight(page.extract, lang),
      flowering: extractFlowering(page.extract, lang),
      safetyNote: extractSafetyNote(page.extract, lang),
      imageUrl: /^https:\/\//.test(page.thumbnail?.source || "") ? page.thumbnail.source : "",
      sourceLabel: `Wikipédia — ${page.title}`,
      sourceUrl: /^https:\/\//.test(page.fullurl || "") ? page.fullurl : ""
    };
  } catch {
    return null;
  }
}

async function enrichResults(data, language) {
  if (!Array.isArray(data?.results)) return data;
  await Promise.all(data.results.slice(0, 3).map(async result => {
    const scientificName =
      result?.species?.scientificNameWithoutAuthor ||
      result?.species?.scientificName;
    result.enrichment = await wikipediaSpeciesInfo(scientificName, language);
  }));
  return data;
}

async function reverseGeocode(lat, lon, language) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  const lang = language === "en" ? "en" : "fr";
  const cacheKey = `r:${latitude.toFixed(4)},${longitude.toFixed(4)}:${lang}`;
  const cached = geocodeCacheGet(cacheKey);
  if (cached !== undefined) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "16");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", lang);

  try {
    const response = await nominatimFetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const address = data?.address || {};
    const road = address.road || address.pedestrian || address.footway || address.path || address.cycleway || "";
    const locality = address.suburb || address.city_district || address.quarter || address.neighbourhood || "";
    const city = address.city || address.town || address.village || address.municipality || address.hamlet || address.county || "";
    const region = address.state || address.region || "";
    const parts = [];
    if (road) parts.push(road);
    if (locality && locality !== city) parts.push(locality);
    if (city) parts.push(city);
    if (!parts.length && region) parts.push(region);
    const label = parts.join(", ") ||
      String(data?.display_name || "").split(",").slice(0, 2).map(part => part.trim()).filter(Boolean).join(", ");
    if (!label) return null;
    const result = { label, road, locality, city, region, country: address.country || "" };
    geocodeCacheSet(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

async function forwardGeocode(query, language) {
  const q = String(query || "").trim();
  if (!q || q.length > 160) return null;

  const lang = language === "en" ? "en" : "fr";
  const cacheKey = `f:${q.toLowerCase()}:${lang}`;
  const cached = geocodeCacheGet(cacheKey);
  if (cached !== undefined) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", lang);

  try {
    const response = await nominatimFetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first) return null;
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const address = first.address || {};
    const road = address.road || address.pedestrian || address.footway || "";
    const city = address.city || address.town || address.village || address.municipality || address.hamlet || address.county || "";
    const parts = [];
    if (road) parts.push(road);
    if (city) parts.push(city);
    const label = parts.join(", ") ||
      String(first.display_name || "").split(",").slice(0, 2).map(part => part.trim()).filter(Boolean).join(", ") ||
      q;
    const result = { label, lat, lon };
    geocodeCacheSet(cacheKey, result);
    return result;
  } catch {
    return null;
  }
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
    const plantNetFormData = await preparePlantNetFormData(body, contentType);
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
      body: plantNetFormData
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

    await enrichResults(data, requestedLanguage);
    return sendJson(response, 200, data);
  } catch (error) {
    return sendJson(response, error.status || 502, {
      error: error.message || "Impossible de contacter Pl@ntNet."
    });
  }
}

// Inline handlers (onclick=...) et styles injectés par Leaflet imposent
// 'unsafe-inline'. img-src https: couvre les tuiles OSM et les images Pl@ntNet/Wikipédia.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "frame-src https://www.openstreetmap.org",
  "form-action 'self'"
].join("; ");

function serveFile(response, pathname) {
  const requestedPath = pathname === "/" ? "le_grimoire.html" : pathname.slice(1);
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
      "Permissions-Policy": "camera=(self), geolocation=(self)",
      "Content-Security-Policy": CONTENT_SECURITY_POLICY,
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(filename).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (requestUrl.pathname.startsWith("/api/")) {
    const forwarded = String(request.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const ip = forwarded || request.socket.remoteAddress || "unknown";
    if (isRateLimited(ip)) {
      return sendJson(response, 429, { error: "Trop de requêtes. Réessaie dans un instant." });
    }
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/identify") {
    return identifyPlant(request, response, requestUrl);
  }
  if (request.method === "POST" && requestUrl.pathname === "/api/photo-preview") {
    return previewPhoto(request, response);
  }
  if (request.method === "GET" && requestUrl.pathname === "/health") {
    return sendJson(response, 200, { status: "ok" });
  }
  if (request.method === "GET" && requestUrl.pathname === "/api/species-info") {
    const name = requestUrl.searchParams.get("name") || "";
    const language = requestUrl.searchParams.get("lang") || "fr";
    if (!name || name.length > 160) {
      return sendJson(response, 400, { error: "Nom scientifique invalide." });
    }
    const information = await wikipediaSpeciesInfo(name, language);
    return sendJson(response, information ? 200 : 404, information || {
      error: "Aucune information complémentaire trouvée."
    });
  }
  if (request.method === "GET" && requestUrl.pathname === "/api/reverse-geocode") {
    const lat = requestUrl.searchParams.get("lat");
    const lon = requestUrl.searchParams.get("lon");
    const language = requestUrl.searchParams.get("lang") || "fr";
    const place = await reverseGeocode(lat, lon, language);
    return sendJson(response, place ? 200 : 404, place || {
      error: "Lieu introuvable pour ces coordonnées."
    });
  }
  if (request.method === "GET" && requestUrl.pathname === "/api/geocode") {
    const query = requestUrl.searchParams.get("q") || "";
    const language = requestUrl.searchParams.get("lang") || "fr";
    const place = await forwardGeocode(query, language);
    return sendJson(response, place ? 200 : 404, place || {
      error: "Lieu introuvable."
    });
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
