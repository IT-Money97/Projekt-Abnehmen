const STORAGE_KEY = "balance-diary-v1";
const DEFAULTS = {
  profile: { age: 29, sex: "männlich", height: 177, weight: 107, activity: "sitzend", bodyFat: "30–32 %" },
  goals: { calories: 1900, protein: 140, carbs: 190, fat: 65, water: 2500 }
};

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
    const sameDay = saved.date === key;
    return {
      date: key,
      meals: sameDay && Array.isArray(saved.meals) ? saved.meals : [],
      water: sameDay ? Number(saved.water) || 0 : 0,
      profile: { ...DEFAULTS.profile, ...(saved.profile || {}) },
      goals: { ...DEFAULTS.goals, ...(saved.goals || {}) },
      weights: Array.isArray(saved.weights) ? saved.weights.filter((entry) => entry && Number(entry.kg) > 0 && entry.date) : []
    };
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

function basalMetabolicRate() {
  const p = state.profile;
  const offset = p.sex === "männlich" ? 5 : p.sex === "weiblich" ? -161 : -78;
  return Math.round(10 * p.weight + 6.25 * p.height - 5 * p.age + offset);
}

function activityFactor() {
  return state.profile.activity === "leicht" ? 1.375 : state.profile.activity === "mittel" ? 1.55 : 1.2;
}

function render() {
  const t = totals();
  const goals = state.goals;
  const profile = state.profile;
  $("#calories-eaten").textContent = Math.round(t.kcal).toLocaleString("de-DE");
  $("#calories-left").textContent = Math.max(0, goals.calories - Math.round(t.kcal)).toLocaleString("de-DE");
  $("#calorie-goal").textContent = goals.calories.toLocaleString("de-DE");
  $("#calorie-ring").style.background = `conic-gradient(#557c58 ${Math.min(t.kcal / goals.calories * 360, 360)}deg,#e8eee7 0deg)`;
  for (const [key, label] of [["protein", "protein"], ["carbs", "carbs"], ["fat", "fat"]]) {
    $(`#${label}-total`).innerHTML = `${Math.round(t[key])} <small>/ ${goals[key]} g</small>`;
    $(`#${label}-bar`).style.width = `${Math.min(t[key] / goals[key] * 100, 100)}%`;
  }
  $("#water-total").textContent = state.water.toLocaleString("de-DE");
  $("#water-card-goal").textContent = `${goals.water.toLocaleString("de-DE")} ml`;
  $("#water-bar").style.width = `${Math.min(state.water / goals.water * 100, 100)}%`;
  $("#journal-calories").textContent = Math.round(t.kcal).toLocaleString("de-DE");
  $("#journal-water").textContent = state.water.toLocaleString("de-DE");
  renderMeals($("#meal-list"));
  renderMeals($("#journal-meals"));
  renderProfile();
  renderWeights();
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
  target.innerHTML = state.meals.map((meal, index) => `<article class="meal-entry"><div class="meal-row"><span class="meal-emoji">${escapeHtml(meal.icon || "🍽️")}</span><div class="meal-copy"><strong>${escapeHtml(meal.name)}</strong><span>${escapeHtml(meal.amount || "")} · ${escapeHtml(meal.time || "")} · ${format(meal.protein)} g Eiweiß</span></div><div class="meal-kcal">${Math.round(meal.kcal)}<small>kcal</small></div><button type="button" class="meal-options" data-meal-index="${index}" aria-label="${escapeHtml(meal.name)} bearbeiten">···</button></div><details class="meal-details"><summary>Nährwerte pro Eintrag</summary><div class="meal-nutrients"><div><span>Eiweiß</span><strong>${format(meal.protein)} g</strong></div><div><span>Kohlenhydrate</span><strong>${format(meal.carbs)} g</strong></div><div><span>Fett</span><strong>${format(meal.fat)} g</strong></div><div><span>Zucker</span><strong>${format(meal.sugar)} g</strong></div><div><span>Salz</span><strong>${format(meal.salt)} g</strong></div><div><span>Ballaststoffe</span><strong>${format(meal.fiber)} g</strong></div></div></details></article>`).join("");
}

function renderProfile() {
  const p = state.profile;
  $("#profile-age").textContent = `${p.age} Jahre`;
  $("#profile-sex").textContent = p.sex.charAt(0).toLocaleUpperCase("de-DE") + p.sex.slice(1);
  $("#profile-height").textContent = `${p.height} cm`;
  $("#profile-weight").textContent = `${format(p.weight)} kg`;
  $("#profile-activity").textContent = p.activity === "sitzend" ? "Überwiegend sitzend" : p.activity === "leicht" ? "Leicht aktiv" : "Mäßig aktiv";
  $("#profile-fat").textContent = `${p.bodyFat || "—"} · Schätzung`;
  $("#profile-bmr").textContent = `ca. ${basalMetabolicRate().toLocaleString("de-DE")} kcal/Tag`;
  $("#maintenance-calories").textContent = `ca. ${Math.round(basalMetabolicRate() * activityFactor()).toLocaleString("de-DE")} kcal pro Tag`;
  $("#plan-calorie-goal").textContent = `${state.goals.calories.toLocaleString("de-DE")} kcal`;
  $("#plan-protein-goal").innerHTML = `ca. ${state.goals.protein} g <small>pro Tag</small>`;
  $("#settings-calorie-goal").textContent = `${state.goals.calories.toLocaleString("de-DE")} kcal`;
  $("#settings-protein-goal").textContent = `${state.goals.protein} g Eiweiß`;
  $("#settings-water-goal").textContent = `${state.goals.water.toLocaleString("de-DE")} ml Wasser`;
}

function renderWeights() {
  const entries = [...state.weights].sort((a, b) => b.date.localeCompare(a.date));
  $("#current-weight").textContent = `${format(entries[0]?.kg ?? state.profile.weight)} kg`;
  $("#weight-history").innerHTML = entries.length
    ? entries.slice(0, 5).map((entry, index) => {
      const previous = entries[index + 1];
      const difference = previous ? Number(entry.kg) - Number(previous.kg) : 0;
      const delta = previous ? `<small class="${difference <= 0 ? "weight-down" : "weight-up"}">${difference > 0 ? "+" : ""}${format(difference)} kg</small>` : "";
      return `<div class="weight-entry"><span>${new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" }).format(new Date(`${entry.date}T12:00:00`))}</span><strong>${format(entry.kg)} kg</strong>${delta}</div>`;
    }).join("")
    : '<p class="weight-empty">Trage dein Gewicht ein, um deinen Verlauf zu starten.</p>';
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

function openDialog(title, mode, content, actions) {
  $("#dialog-title").textContent = title;
  $("#dialog-content").innerHTML = content;
  $("#dialog-actions").innerHTML = actions;
  $("#dialog-form").dataset.dialogMode = mode;
  $("#app-dialog").showModal();
}

function closeDialog() { $("#app-dialog").close(); }

$("#dialog-close").addEventListener("click", closeDialog);
$("#app-dialog").addEventListener("click", (event) => {
  if (event.target === $("#app-dialog")) closeDialog();
});

$("#dialog-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const action = event.submitter?.value || "save";
  const mode = form.dataset.dialogMode;

  if (action === "cancel") { closeDialog(); return; }
  if (mode === "meal-delete") {
    state.meals.splice(Number(form.dataset.mealIndex), 1);
    saveState(); render(); closeDialog(); showToast("Eintrag gelöscht."); return;
  }
  if (mode === "meal") {
    const index = Number(form.dataset.mealIndex);
    const keys = ["kcal", "protein", "carbs", "fat", "sugar", "salt", "fiber"];
    const meal = { ...state.meals[index], name: String(values.get("name")).trim(), amount: String(values.get("amount")).trim() };
    for (const key of keys) meal[key] = Number(values.get(key));
    if (!meal.name || !meal.amount || keys.some((key) => !Number.isFinite(meal[key]) || meal[key] < 0)) { showToast("Bitte prüfe Name, Menge und Nährwerte."); return; }
    state.meals[index] = meal;
    saveState(); render(); closeDialog(); showToast("Eintrag aktualisiert."); return;
  }
  if (mode === "profile") {
    const profile = {
      age: Number(values.get("age")), sex: String(values.get("sex")), height: Number(values.get("height")),
      weight: Number(values.get("weight")), activity: String(values.get("activity")), bodyFat: String(values.get("bodyFat")).trim()
    };
    if (profile.age < 18 || profile.age > 120 || profile.height < 100 || profile.height > 250 || profile.weight < 30 || profile.weight > 400) { showToast("Bitte prüfe Alter, Größe und Gewicht."); return; }
    state.profile = profile;
    saveState(); render(); closeDialog(); showToast("Profil gespeichert."); return;
  }
  if (mode === "goals") {
    const goals = { calories: Number(values.get("calories")), protein: Number(values.get("protein")), carbs: Number(values.get("carbs")), fat: Number(values.get("fat")), water: Number(values.get("water")) };
    if (goals.calories < 800 || goals.calories > 10000 || goals.protein < 1 || goals.protein > 1000 || goals.carbs < 1 || goals.carbs > 1500 || goals.fat < 1 || goals.fat > 1000 || goals.water < 250 || goals.water > 10000) { showToast("Bitte prüfe die Zielwerte."); return; }
    state.goals = goals;
    saveState(); render(); closeDialog(); showToast("Tagesziele gespeichert."); return;
  }
  if (mode === "weight") {
    const kg = Number(values.get("kg"));
    const date = String(values.get("date"));
    if (!Number.isFinite(kg) || kg < 30 || kg > 400 || !date || date > new Date().toISOString().slice(0, 10)) { showToast("Bitte prüfe Gewicht und Datum."); return; }
    const existing = state.weights.findIndex((entry) => entry.date === date);
    const entry = { kg, date };
    if (existing >= 0) state.weights[existing] = entry;
    else state.weights.push(entry);
    state.profile.weight = kg;
    saveState(); render(); closeDialog(); showToast("Gewicht gespeichert."); return;
  }
  if (mode === "water") {
    const ml = Number(values.get("ml"));
    if (!Number.isFinite(ml) || ml < 1 || ml > 5000) { showToast("Bitte gib eine Trinkmenge von 1 bis 5.000 ml ein."); return; }
    state.water += ml;
    saveState(); render(); closeDialog(); showToast(`${ml} ml eingetragen.`); return;
  }
});

document.querySelectorAll(".meal-list").forEach((list) => list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-meal-index]");
  if (!button) return;
  const index = Number(button.dataset.mealIndex);
  const meal = state.meals[index];
  if (!meal) return;
  $("#dialog-form").dataset.mealIndex = String(index);
  openDialog("Eintrag bearbeiten", "meal", `
    <label class="dialog-field">Lebensmittel<input name="name" maxlength="100" required value="${escapeHtml(meal.name)}"></label>
    <label class="dialog-field">Menge<input name="amount" maxlength="60" required value="${escapeHtml(meal.amount || "")}"></label>
    <div class="dialog-field-grid">${[
      ["kcal", "Kalorien (kcal)"], ["protein", "Eiweiß (g)"], ["carbs", "Kohlenhydrate (g)"],
      ["fat", "Fett (g)"], ["sugar", "Zucker (g)"], ["salt", "Salz (g)"], ["fiber", "Ballaststoffe (g)"]
    ].map(([key, label]) => `<label class="dialog-field">${label}<input name="${key}" type="number" min="0" max="5000" step="any" required value="${Number(meal[key]) || 0}"></label>`).join("")}</div>`,
  '<button class="dialog-danger" type="button" id="delete-meal">Löschen</button><span class="dialog-spacer"></span><button class="dialog-secondary" type="submit" value="cancel">Abbrechen</button><button class="dialog-primary" type="submit" value="save">Speichern</button>');
  $("#delete-meal").addEventListener("click", () => {
    $("#dialog-form").dataset.mealIndex = String(index);
    openDialog("Eintrag löschen?", "meal-delete", `<p class="dialog-copy">${escapeHtml(meal.name)} wird aus dem heutigen Tagebuch entfernt.</p>`, '<button class="dialog-secondary" type="submit" value="cancel">Behalten</button><button class="dialog-danger" type="submit" value="delete">Löschen</button>');
  }, { once: true });
}));

$("#water-add").addEventListener("click", () => {
  openDialog("Wasser eintragen", "water", '<p class="dialog-copy">Wie viel hast du getrunken?</p><label class="dialog-field">Menge in ml<input name="ml" type="number" inputmode="numeric" min="1" max="5000" step="1" value="250" required></label>', '<button class="dialog-secondary" type="submit" value="cancel">Abbrechen</button><button class="dialog-primary" type="submit" value="save">Eintragen</button>');
});

$("#edit-goals").addEventListener("click", () => {
  const g = state.goals;
  openDialog("Tagesziele anpassen", "goals", `<p class="dialog-copy">Orientierungswerte – du kannst sie jederzeit ändern.</p><div class="dialog-field-grid">${[
    ["calories", "Kalorien (kcal)", g.calories], ["protein", "Eiweiß (g)", g.protein], ["carbs", "Kohlenhydrate (g)", g.carbs], ["fat", "Fett (g)", g.fat], ["water", "Wasser (ml)", g.water]
  ].map(([name, label, value]) => `<label class="dialog-field">${label}<input name="${name}" type="number" min="1" max="10000" step="1" value="${value}" required></label>`).join("")}</div>`, '<button class="dialog-secondary" type="submit" value="cancel">Abbrechen</button><button class="dialog-primary" type="submit" value="save">Speichern</button>');
});

$("#edit-profile").addEventListener("click", () => {
  const p = state.profile;
  openDialog("Profil bearbeiten", "profile", `<div class="dialog-field-grid">
    <label class="dialog-field">Alter<input name="age" type="number" min="18" max="120" value="${p.age}" required></label>
    <label class="dialog-field">Geschlecht<select name="sex"><option ${p.sex === "männlich" ? "selected" : ""}>männlich</option><option ${p.sex === "weiblich" ? "selected" : ""}>weiblich</option><option ${p.sex === "divers" ? "selected" : ""}>divers</option></select></label>
    <label class="dialog-field">Größe (cm)<input name="height" type="number" min="100" max="250" value="${p.height}" required></label>
    <label class="dialog-field">Gewicht (kg)<input name="weight" type="number" min="30" max="400" step="0.1" value="${p.weight}" required></label>
    <label class="dialog-field">Aktivität<select name="activity"><option value="sitzend" ${p.activity === "sitzend" ? "selected" : ""}>Überwiegend sitzend</option><option value="leicht" ${p.activity === "leicht" ? "selected" : ""}>Leicht aktiv</option><option value="mittel" ${p.activity === "mittel" ? "selected" : ""}>Mäßig aktiv</option></select></label>
    <label class="dialog-field">Körperfett (%)<input name="bodyFat" maxlength="20" value="${escapeHtml(p.bodyFat)}" placeholder="optional"></label>
  </div>`, '<button class="dialog-secondary" type="submit" value="cancel">Abbrechen</button><button class="dialog-primary" type="submit" value="save">Speichern</button>');
});

$("#add-weight").addEventListener("click", () => {
  openDialog("Gewicht eintragen", "weight", `<p class="dialog-copy">Ein Eintrag pro Tag. Der Verlauf bleibt auf diesem Gerät gespeichert.</p><div class="dialog-field-grid"><label class="dialog-field">Gewicht (kg)<input name="kg" type="number" inputmode="decimal" min="30" max="400" step="0.1" value="${state.profile.weight}" required></label><label class="dialog-field">Datum<input name="date" type="date" max="${new Date().toISOString().slice(0, 10)}" value="${new Date().toISOString().slice(0, 10)}" required></label></div>`, '<button class="dialog-secondary" type="submit" value="cancel">Abbrechen</button><button class="dialog-primary" type="submit" value="save">Speichern</button>');
});
$("#coach-button").addEventListener("click", async () => {
  const button = $("#coach-button");
  const result = $("#coach-result");
  button.disabled = true;
  button.querySelector("strong").textContent = "Dein Plan wird erstellt …";
  try {
    if (location.hostname.endsWith("github.io")) throw new Error("Claude benötigt noch einen separaten Server.");
    const response = await fetch(new URL("api/claude-coach", document.baseURI), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: { ...state.profile, heightCm: state.profile.height, weightKg: state.profile.weight, activity: state.profile.activity, goal: "gesund abnehmen" } }) });
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
  document.querySelectorAll(".nav-item").forEach((item) => {
    const selected = item.dataset.view === view && !item.classList.contains("nav-center");
    item.classList.toggle("selected", selected);
    if (selected) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  const main = $("#main-content");
  if (view === "heute" && button.classList.contains("nav-center")) {
    $("#quick-add").scrollIntoView({ behavior: "smooth", block: "center" });
    $("#food-input").focus({ preventScroll: true });
  } else main.scrollTo({ top: 0, behavior: "smooth" });
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
