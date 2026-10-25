const DAILY_GOAL = 1900;
const WATER_GOAL = 2500;
const MACRO_GOALS = { protein: 140, carbs: 190, fat: 65 };
const STORAGE_KEY = "balance-diary-v1";

const foods = [
  { keys: ["ei", "eier", "eiweißbrot"], name: "Ei, Größe L", icon: "🥚", unit: "Stück", grams: 60, per100: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, sugar: 0.4, salt: 0.36, fiber: 0 } },
  { keys: ["thunfisch", "tuna"], name: "Thunfisch im eigenen Saft", icon: "🐟", unit: "Dose", grams: 150, per100: { kcal: 116, protein: 25.5, carbs: 0, fat: 1, sugar: 0, salt: 0.8, fiber: 0 } },
  { keys: ["gouda", "gauda"], name: "Gouda", icon: "🧀", unit: "Scheibe", grams: 25, per100: { kcal: 356, protein: 25, carbs: 0, fat: 27, sugar: 0, salt: 1.8, fiber: 0 } },
  { keys: ["brötchen", "broetchen", "semmel"], name: "Brötchen", icon: "🥖", unit: "Stück", grams: 65, per100: { kcal: 270, protein: 9, carbs: 52, fat: 2, sugar: 3, salt: 1.2, fiber: 3.5 } },
  { keys: ["salat", "blattsalat"], name: "Salat, gemischt", icon: "🥬", unit: "g", grams: 100, per100: { kcal: 20, protein: 1.5, carbs: 3, fat: 0.2, sugar: 2, salt: 0.04, fiber: 1.5 } },
  { keys: ["haferflocken", "porridge"], name: "Haferflocken", icon: "🥣", unit: "g", grams: 100, per100: { kcal: 372, protein: 13.5, carbs: 58.7, fat: 7, sugar: 1, salt: 0.01, fiber: 10 } },
  { keys: ["banane"], name: "Banane", icon: "🍌", unit: "Stück", grams: 120, per100: { kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, sugar: 12.2, salt: 0, fiber: 2.6 } },
  { keys: ["apfel"], name: "Apfel", icon: "🍎", unit: "Stück", grams: 180, per100: { kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, sugar: 10.4, salt: 0, fiber: 2.4 } },
  { keys: ["hähnchen", "haehnchen", "huhn"], name: "Hähnchenbrust", icon: "🍗", unit: "g", grams: 100, per100: { kcal: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, salt: 0.07, fiber: 0 } },
  { keys: ["reis"], name: "Reis, gekocht", icon: "🍚", unit: "g", grams: 100, per100: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, sugar: 0.1, salt: 0, fiber: 0.4 } },
  { keys: ["quark", "magerquark"], name: "Magerquark", icon: "🥛", unit: "g", grams: 100, per100: { kcal: 67, protein: 12, carbs: 4, fat: 0.2, sugar: 4, salt: 0.1, fiber: 0 } },
  { keys: ["joghurt", "jogurt"], name: "Naturjoghurt", icon: "🥛", unit: "g", grams: 150, per100: { kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, sugar: 4.7, salt: 0.1, fiber: 0 } }
];

const state = loadState();
const $ = (selector) => document.querySelector(selector);
const today = new Date();
$("#today-label").textContent = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "short" }).format(today);
$("#greeting").textContent = `${today.getHours() < 11 ? "GUTEN MORGEN" : today.getHours() < 18 ? "GUTEN TAG" : "GUTEN ABEND"}`;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const key = new Date().toISOString().slice(0, 10);
    if (saved.date !== key) return { date: key, meals: [], water: 0 };
    return { date: key, meals: Array.isArray(saved.meals) ? saved.meals : [], water: Number(saved.water) || 0 };
  } catch (error) {
    console.error("Tagesprotokoll konnte nicht geladen werden.", error);
    return { date: new Date().toISOString().slice(0, 10), meals: [], water: 0 };
  }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (error) { console.error("Tagesprotokoll konnte nicht gespeichert werden.", error); showToast("Speichern nicht möglich. Bitte Gerätespeicher prüfen."); }
}

function totals() {
  return state.meals.reduce((sum, meal) => {
    for (const key of ["kcal", "protein", "carbs", "fat", "sugar", "salt", "fiber"]) sum[key] += Number(meal[key]) || 0;
    return sum;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0, fiber: 0 });
}

function render() {
  const t = totals();
  $("#calories-eaten").textContent = Math.round(t.kcal).toLocaleString("de-DE");
  $("#calories-left").textContent = Math.max(0, DAILY_GOAL - Math.round(t.kcal)).toLocaleString("de-DE");
  $("#calorie-goal").textContent = DAILY_GOAL.toLocaleString("de-DE");
  $("#calorie-ring").style.background = `conic-gradient(#557c58 ${Math.min(t.kcal / DAILY_GOAL * 360, 360)}deg,#e8eee7 0deg)`;
  for (const [key, label] of [["protein", "protein"], ["carbs", "carbs"], ["fat", "fat"]]) {
    $(`#${label}-total`).innerHTML = `${Math.round(t[key])} <small>/ ${MACRO_GOALS[key]} g</small>`;
    $(`#${label}-bar`).style.width = `${Math.min(t[key] / MACRO_GOALS[key] * 100, 100)}%`;
  }
  $("#water-total").textContent = state.water.toLocaleString("de-DE");
  $("#water-bar").style.width = `${Math.min(state.water / WATER_GOAL * 100, 100)}%`;
  $("#journal-calories").textContent = Math.round(t.kcal).toLocaleString("de-DE");
  $("#journal-water").textContent = state.water.toLocaleString("de-DE");
  renderMeals($("#meal-list"));
  renderMeals($("#journal-meals"));
  $("#nutrient-list").innerHTML = [
    ["Eiweiß", t.protein, "g"], ["Kohlenhydrate", t.carbs, "g"], ["Fett", t.fat, "g"],
    ["davon Zucker", t.sugar, "g"], ["Ballaststoffe", t.fiber, "g"], ["Salz", t.salt, "g"]
  ].map(([label, value, unit]) => `<div class="nutrient-row"><span>${label}</span><strong>${format(value)} ${unit}</strong></div>`).join("");
}

function renderMeals(target) {
  if (!state.meals.length) {
    target.innerHTML = '<div class="empty-meals">Noch nichts eingetragen – füge deine erste Mahlzeit hinzu.</div>';
    return;
  }
  target.innerHTML = state.meals.map((meal) => `<article class="meal-entry"><div class="meal-row"><span class="meal-emoji">${escapeHtml(meal.icon || "🍽️")}</span><div class="meal-copy"><strong>${escapeHtml(meal.name)}</strong><span>${escapeHtml(meal.amount || "")} · ${escapeHtml(meal.time || "")} · ${format(meal.protein)} g Eiweiß</span></div><div class="meal-kcal">${Math.round(meal.kcal)}<small>kcal</small></div></div><details class="meal-details"><summary>Nährwerte pro Eintrag</summary><div class="meal-nutrients"><div><span>Eiweiß</span><strong>${format(meal.protein)} g</strong></div><div><span>Kohlenhydrate</span><strong>${format(meal.carbs)} g</strong></div><div><span>Fett</span><strong>${format(meal.fat)} g</strong></div><div><span>Zucker</span><strong>${format(meal.sugar)} g</strong></div><div><span>Salz</span><strong>${format(meal.salt)} g</strong></div><div><span>Ballaststoffe</span><strong>${format(meal.fiber)} g</strong></div></div></details></article>`).join("");
}

function format(value) { return (Math.round((Number(value) || 0) * 10) / 10).toLocaleString("de-DE"); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }

function localParse(input) {
  const normalized = input.toLocaleLowerCase("de-DE").replace(/heute gegessen|ich habe gegessen|gegessen|heute|bitte|und dann|danach/g, "");
  const parts = normalized.split(/[,;\n]|\s+und\s+/).map((part) => part.trim()).filter(Boolean);
  const found = [];
  const unknown = [];
  for (const part of parts) {
    const food = foods.find((item) => item.keys.some((key) => key === "ei" ? /(?:^|\s)ei(?:\s|$)/.test(part) : part.includes(key)));
    if (!food) { unknown.push(part); continue; }
    const quantityMatch = part.match(/(\d+(?:[.,]\d+)?)\s*(g|gramm|ml|stück|stk|scheiben?|dosen?)?/);
    const quantity = quantityMatch ? Number(quantityMatch[1].replace(",", ".")) : 1;
    const unit = quantityMatch?.[2] || "";
    const grams = unit.startsWith("g") || unit === "gramm" ? quantity : food.grams * quantity;
    const factor = grams / 100;
    found.push({
      name: food.name, icon: food.icon, amount: `${format(quantity)} ${unit && (unit.startsWith("g") || unit === "gramm") ? "g" : food.unit}`,
      kcal: food.per100.kcal * factor, protein: food.per100.protein * factor, carbs: food.per100.carbs * factor,
      fat: food.per100.fat * factor, sugar: food.per100.sugar * factor, salt: food.per100.salt * factor, fiber: food.per100.fiber * factor
    });
  }
  return { found, unknown };
}

async function parseWithClaude(text) {
  if (location.hostname.endsWith("github.io")) throw new Error("Claude benötigt noch einen separaten Server.");
  const response = await fetch(new URL("api/claude-food", document.baseURI), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Claude ist gerade nicht erreichbar.");
  const result = await response.json();
  if (!Array.isArray(result.items)) throw new Error("Die Antwort konnte nicht als Lebensmittel-Liste gelesen werden.");
  return result.items;
}

$("#food-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#food-input").value.trim();
  if (!input) { showToast("Schreib oder sprich zuerst auf, was du gegessen hast."); return; }
  const button = $(".add-button");
  button.disabled = true;
  button.textContent = "Wird ausgewertet …";
  try {
    let result = localParse(input);
    if (result.unknown.length) {
      try {
        const aiItems = await parseWithClaude(input);
        result = { found: [...result.found, ...aiItems.map(normalizeAiItem)], unknown: [] };
      } catch (error) {
        console.info("Claude-Auswertung nicht verfügbar; lokale Schätzung wird verwendet.", error.message);
        if (!result.found.length) { showToast("Lebensmittel nicht erkannt. Ergänze CLAUDE_API_KEY für die KI-Suche."); return; }
        showToast(`Unbekannt: ${result.unknown.join(", ")} – bekannte Zutaten wurden erfasst.`);
      }
    }
    if (!result.found.length) { showToast("Ich konnte keine Lebensmittel erkennen. Probiere z. B. „2 Eier, 100 g Salat“."); return; }
    const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    state.meals.push(...result.found.map((item) => ({ ...item, time })));
    saveState();
    render();
    $("#food-input").value = "";
    if (!result.unknown.length) showToast(`${result.found.length} ${result.found.length === 1 ? "Lebensmittel" : "Lebensmittel"} hinzugefügt.`);
  } catch (error) {
    console.error("Lebensmittel konnten nicht hinzugefügt werden.", error);
    showToast("Das hat nicht geklappt. Bitte versuche es erneut.");
  } finally {
    button.disabled = false;
    button.innerHTML = 'Auswerten <span>↗</span>';
  }
});

function normalizeAiItem(item) {
  const keys = ["kcal", "protein", "carbs", "fat", "sugar", "salt", "fiber"];
  const clean = { name: String(item.name || "Lebensmittel"), icon: String(item.icon || "🍽️"), amount: String(item.amount || "Portion") };
  for (const key of keys) clean[key] = Math.max(0, Number(item[key]) || 0);
  clean.kcal = Math.min(clean.kcal, 5000);
  return clean;
}

$("#water-add").addEventListener("click", () => { state.water += 250; saveState(); render(); showToast("250 ml Wasser eingetragen."); });
$("#coach-button").addEventListener("click", async () => {
  const button = $("#coach-button");
  const result = $("#coach-result");
  button.disabled = true;
  button.querySelector("strong").textContent = "Dein Plan wird erstellt …";
  try {
    if (location.hostname.endsWith("github.io")) throw new Error("Claude benötigt noch einen separaten Server.");
    const response = await fetch(new URL("api/claude-coach", document.baseURI), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: { age: 29, sex: "männlich", heightCm: 177, weightKg: 107, activity: "überwiegend sitzend", goal: "gesund abnehmen" } }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Die Planberatung ist gerade nicht verfügbar.");
    result.innerHTML = `<h2>Dein Impuls für heute</h2><p>${escapeHtml(data.text || "")}</p>`;
    result.hidden = false;
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.querySelector("strong").textContent = "Plan mit Claude erstellen";
  }
});
$("#clear-data").addEventListener("click", () => {
  if (!confirm("Möchtest du das heutige Essens- und Trinkprotokoll wirklich löschen?")) return;
  state.meals = []; state.water = 0; saveState(); render(); showToast("Tagesprotokoll zurückgesetzt.");
});

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
  const view = button.dataset.view;
  document.querySelectorAll(".view").forEach((section) => section.classList.toggle("active", section.id === `view-${view}`));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("selected", item.dataset.view === view));
  if (view === "heute" && button.classList.contains("nav-center")) { $("#food-input").focus(); $("#food-input").scrollIntoView({ behavior: "smooth", block: "center" }); }
  else window.scrollTo({ top: 0, behavior: "smooth" });
}));

$("#voice-button").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { showToast("Spracheingabe wird von diesem Browser nicht unterstützt."); return; }
  const recognition = new SpeechRecognition();
  recognition.lang = "de-DE";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $("#input-hint").textContent = "Ich höre zu …";
  recognition.onresult = (event) => { $("#food-input").value = event.results[0][0].transcript; $("#input-hint").textContent = "Prüfe die Erkennung und tippe auf „Auswerten“."; };
  recognition.onerror = (event) => { $("#input-hint").textContent = "Spracheingabe nicht verfügbar."; showToast(`Spracheingabe: ${event.error}`); };
  recognition.onend = () => { if ($("#input-hint").textContent === "Ich höre zu …") $("#input-hint").textContent = "Sprich natürlich – ich teile dein Essen in einzelne Zutaten auf."; };
  recognition.start();
});

let toastTimeout;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 3000);
}

render();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register(new URL("sw.js", document.baseURI)).catch((error) => console.warn("Offline-Modus konnte nicht aktiviert werden.", error));
}
