const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };
const foodSearchRequests = new Map();
const foodSearchCache = new Map();
const FOOD_SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const FOOD_SEARCH_CACHE_LIMIT = 500;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/api/food-search") {
    await handleFoodSearch(req, res, url);
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/claude-food") {
    await handleClaude(req, res, "food");
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/claude-coach") {
    await handleClaude(req, res, "coach");
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD, POST" }).end("Method not allowed");
    return;
  }
  const requestPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filename = path.resolve(root, `.${requestPath}`);
  if (!filename.startsWith(`${root}${path.sep}`)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(filename, (error, data) => {
    if (error) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, { "Content-Type": contentTypes[path.extname(filename)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
    res.end(req.method === "HEAD" ? undefined : data);
  });
});

async function handleFoodSearch(req, res, requestUrl) {
  const query = requestUrl.searchParams.get("q")?.trim();
  if (!query || query.length > 100) {
    res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Bitte gib einen Suchbegriff mit höchstens 100 Zeichen ein." }));
    return;
  }
  const now = Date.now();
  const cacheKey = query.toLocaleLowerCase("de-DE").replace(/\s+/g, " ");
  const cached = foodSearchCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(cached.data));
    return;
  }
  if (cached) foodSearchCache.delete(cacheKey);

  const client = req.socket.remoteAddress || "unknown";
  if (foodSearchRequests.size > 1000) {
    for (const [address, requests] of foodSearchRequests) {
      if (!requests.some((time) => now - time < 60000)) foodSearchRequests.delete(address);
    }
  }
  const recentRequests = (foodSearchRequests.get(client) || []).filter((time) => now - time < 60000);
  if (recentRequests.length >= 9) {
    foodSearchRequests.set(client, recentRequests);
    res.writeHead(429, { "Content-Type": "application/json", "Retry-After": "60" }).end(JSON.stringify({ error: "Zu viele Suchen in kurzer Zeit. Bitte warte eine Minute." }));
    return;
  }
  recentRequests.push(now);
  foodSearchRequests.set(client, recentRequests);

  const upstreamUrl = new URL("https://world.openfoodfacts.org/api/v2/search");
  upstreamUrl.search = new URLSearchParams({
    search_terms: query,
    page_size: "20",
    fields: "product_name,brands,nutriments,quantity,serving_size,code",
    lc: "de",
    cc: "de"
  });
  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json", "User-Agent": "BalanceNutritionTracker/1.0" },
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) {
      console.warn(`Open Food Facts returned HTTP ${upstream.status}`);
      const status = upstream.status === 429 || upstream.status === 503 ? 503 : 502;
      res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ error: "Die öffentliche Nährwertsuche ist gerade nicht verfügbar." }));
      return;
    }
    const data = await upstream.json();
    if (foodSearchCache.size >= FOOD_SEARCH_CACHE_LIMIT) {
      const oldestKey = foodSearchCache.keys().next().value;
      if (oldestKey !== undefined) foodSearchCache.delete(oldestKey);
    }
    foodSearchCache.set(cacheKey, { data, expiresAt: now + FOOD_SEARCH_CACHE_TTL_MS });
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(data));
  } catch (error) {
    console.error("Open Food Facts request failed:", error.message);
    res.writeHead(502, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ error: "Die öffentliche Nährwertsuche ist gerade nicht erreichbar." }));
  }
}

async function handleClaude(req, res, mode) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Claude ist nicht konfiguriert. Hinterlege ANTHROPIC_API_KEY auf dem Server." }));
    return;
  }
  try {
    const raw = await readBody(req, 12000);
    const input = JSON.parse(raw);
    const isCoach = mode === "coach";
    if ((!isCoach && (typeof input.text !== "string" || !input.text.trim())) || (isCoach && (!input.profile || typeof input.profile !== "object"))) {
      res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: isCoach ? "Profilangaben fehlen." : "Bitte gib eine Beschreibung deines Essens an." }));
      return;
    }
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: isCoach ? 800 : 1200,
        system: isCoach
          ? "Du bist ein vorsichtiger deutschsprachiger Ernährungsbegleiter, keine Ärztin/kein Arzt. Gib einen kurzen, alltagstauglichen Tagesimpuls und 2-3 konkrete Ideen. Unterstütze nur moderates, nachhaltiges Abnehmen; empfehle keine Crash-Diäten, keine extremen Kalorienziele und keine ungesicherten Supplemente. Weise darauf hin, dass 6 kg in 3 Wochen kein sicheres/garantierbares Ziel ist. Berücksichtige, dass Berechnungen Schätzungen sind und individuelle medizinische Beratung ersetzen."
          : "Du bist ein vorsichtiger deutschsprachiger Ernährungs-Parser. Extrahiere genannte Lebensmittel und schätze Nährwerte nur für die angegebene Menge. Erfinde keine nicht genannten Zutaten. Gib ausschließlich gültiges JSON in der Form {\"items\":[{\"name\":\"...\",\"amount\":\"...\",\"icon\":\"...\",\"kcal\":0,\"protein\":0,\"carbs\":0,\"fat\":0,\"sugar\":0,\"salt\":0,\"fiber\":0}]}. Nährwerte beziehen sich auf die ganze angegebene Portion. Bei unklarer Menge verwende eine übliche Portion und kennzeichne sie im amount Feld als geschätzt. Keine medizinischen Aussagen.",
        messages: [{ role: "user", content: isCoach ? `Erstelle einen sicheren kurzen Plan-Impuls für dieses Profil: ${JSON.stringify(input.profile)}` : input.text.trim() }]
      })
    });
    if (!upstream.ok) {
      const status = upstream.status;
      console.error(`Anthropic API returned HTTP ${status}`);
      res.writeHead(502, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Die Claude-Anfrage ist fehlgeschlagen. Bitte versuche es später erneut." }));
      return;
    }
    const result = await upstream.json();
    const text = result.content?.find((item) => item.type === "text")?.text || "";
    if (isCoach) {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ text }));
      return;
    }
    const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) throw new Error("Claude response did not contain JSON");
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed.items)) throw new Error("Claude response is missing items");
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ items: parsed.items }));
  } catch (error) {
    console.error("Claude food parsing failed:", error.message);
    const status = error.statusCode || (error instanceof SyntaxError ? 400 : 502);
    const message = status === 413 ? "Die Anfrage ist zu groß." : status === 400 ? "Ungültige Anfrage." : "Die Lebensmittelauswertung ist fehlgeschlagen.";
    res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: message }));
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body) > limit) { tooLarge = true; body = ""; }
    });
    req.on("end", () => tooLarge ? reject(Object.assign(new Error("Request body too large"), { statusCode: 413 })) : resolve(body));
    req.on("error", reject);
  });
}

server.listen(port, "0.0.0.0", () => console.log(`Balance is running at http://localhost:${port}`));
