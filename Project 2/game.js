// DOM references
const timeDisplay      = document.getElementById("time-display");
const offeringsDisplay = document.getElementById("offerings-count");
const gardenEl         = document.getElementById("garden");
const offeringBtn      = document.getElementById("place-offering");

// Chat log elements
const chatWrapper  = document.getElementById("chat-log-wrapper");
const chatHeader   = document.getElementById("chat-log-header");
const chatCloseBtn = document.getElementById("chat-log-close");
const chatTab      = document.getElementById("chat-tab");
const logList      = document.getElementById("chat-log");

// Opening overlay
const openingOverlay = document.getElementById("opening-overlay");

// Index / catalog elements
const indexButton    = document.getElementById("index-button");
const catalogOverlay = document.getElementById("catalog-overlay");
const catalogGrid    = document.getElementById("catalog-grid");
const catalogTabs    = document.querySelectorAll(".catalog-tab");
const catalogClose   = document.getElementById("catalog-close");

// Config
const STORAGE_KEY = "yokaiGardenState_v7";
const OFFERING_LIFETIME_MS = 2 * 60 * 60 * 1000; // 2 hours

// Time helpers
function getTimeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 23) return "evening";
  return "night";
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Yokai definitions
const YOKAI_LIST = [
  {
    id: "namazugami",
    sprite: "NamazuGami-min.gif",
    name: "NamazuGami",
    favoriteTime: ["evening", "night"],
    baseChance: 0.05,
    movementType: "heavyPatrol",
    mood: "sleepy",
    specialRule: "likesLongAbsence"
  },
  {
    id: "abumi_guchi",
    sprite: "AbumiGuchi-min.gif",
    name: "Abumi Guchi",
    favoriteTime: ["morning", "afternoon"],
    baseChance: 0.06,
    movementType: "smallPatrol",
    mood: "loyal",
    specialRule: "boostOnOffering"
  },
  {
    id: "moku_mokuren",
    sprite: "MokuMokuren-min.gif",
    name: "Moku Mokuren",
    favoriteTime: ["any"],
    baseChance: 0.04,
    movementType: "wallWatcher",
    mood: "curious",
    specialRule: "moreEyesWithActivity"
  },
  {
    id: "ushi_no_toki",
    sprite: "UshiNoTokiMairi-min.gif",
    name: "Ushi no Toki Mairi",
    favoriteTime: ["night"],
    baseChance: 0.01,
    movementType: "slowDriftCenter",
    mood: "ominous",
    specialRule: "nightOnlyRare"
  },
  {
    id: "ittan_momen",
    sprite: "Ittan Momen-min.gif",
    name: "Ittan Momen",
    favoriteTime: ["afternoon", "evening"],
    baseChance: 0.07,
    movementType: "fullFloat",
    mood: "playful",
    specialRule: "likesCrowdedGarden"
  },
  {
    id: "sakura_spirit",
    sprite: "sakura spirit.gif",
    name: "Sakura Spirit",
    favoriteTime: ["any"],
    baseChance: 0,
    movementType: "fullFloat",
    mood: "gentle",
    specialRule: "appearsWithManySakura"
  }
];

// State
let state = {
  offerings: 0,
  activeYokai: [],
  offeringsPlaced: [],
  lastTick: Date.now(),
  totalInteractions: 0
};

// Load / save
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    state = { ...state, ...parsed };
    if (!Array.isArray(state.offeringsPlaced)) state.offeringsPlaced = [];
    if (!Array.isArray(state.activeYokai)) state.activeYokai = [];
  } catch (e) {
    console.warn("Error loading state", e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// colors for entries
const MEMO_COLORS = [
  "#a9a4f1ff",
  "#b0deffff",
  "#f1a0a0ff",
  "#f9e8aeff",
  "#f7f0f0ff"
];

// Chat-style log
function addLog(message) {
  const li = document.createElement("li");
  li.className = "chat-entry";

  const color = MEMO_COLORS[Math.floor(Math.random() * MEMO_COLORS.length)];
  li.style.background = color;

  li.innerHTML = message;
  logList.appendChild(li);

  while (logList.children.length > 20) {
    logList.removeChild(logList.firstChild);
  }

  logList.scrollTop = logList.scrollHeight;
}

// Garden helpers
function clearGarden() {
  while (gardenEl.firstChild) gardenEl.removeChild(gardenEl.firstChild);
}

function renderGardenEmptyIfNeeded() {
  if (state.activeYokai.length === 0 && state.offeringsPlaced.length === 0) {
    const msg = document.createElement("div");
    msg.className = "garden-empty-message";
    msg.textContent = "The garden is quiet… place a sakura offering and check back.";
    gardenEl.appendChild(msg);
  }
}

// Positioning
function getInitialYokaiPosition(yokaiDef) {
  let left = Math.random() * 70 + 10;
  let top  = Math.random() * 30 + 20;

  if (yokaiDef.id === "namazugami") {
    top = 35 + Math.random() * 6;
  }

  if (yokaiDef.id === "abumi_guchi") {
    left = 12 + Math.random() * 18;
    top  = 38 + Math.random() * 6;
  }

  if (yokaiDef.id === "moku_mokuren") {
    const side = Math.random() < 0.5 ? "left" : "right";
    left = side === "left" ? 4 : 86;
    top  = 12 + Math.random() * 18;
  }

  if (yokaiDef.id === "ushi_no_toki") {
    left = 45 + Math.random() * 10;
    top  = 32 + Math.random() * 8;
  }

  if (yokaiDef.id === "ittan_momen") {
    left = 8;
    top  = 26 + Math.random() * 8;
  }

  if (yokaiDef.id === "sakura_spirit") {
    left = 20 + Math.random() * 60;
    top  = 30 + Math.random() * 10;
  }

  return { left, top };
}

// Create yokai element
function createYokaiElement(yokaiDef, record) {
  const el = document.createElement("div");
  el.classList.add("yokai");
  el.classList.add("yokai--" + yokaiDef.movementType);

  const img = document.createElement("img");
  img.className = "yokai-sprite-img";
  img.src = `Pictures/${yokaiDef.sprite}`;
  img.alt = yokaiDef.name;
  el.appendChild(img);

  let { left, top } = record;
  if (left === undefined || top === undefined) {
    const pos = getInitialYokaiPosition(yokaiDef);
    left = pos.left;
    top  = pos.top;
  }

  el.style.left   = left + "%";
  el.style.top    = top + "%";
  el.style.cursor = "pointer";

  if (yokaiDef.id === "ushi_no_toki") {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      el.style.opacity = 0;
      setTimeout(() => el.remove(), 500);
      addLog(`${formatTime()} — Ushi no Toki vanished, leaving a quiet charm.`);
      showYokaiInfo(yokaiDef, record);
    });
  }

  if (yokaiDef.id === "moku_mokuren") {
    el.addEventListener("mouseenter", () => {
      el.style.opacity = 0.4;
      setTimeout(() => { el.style.opacity = 1; }, 200);
    });
  }

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    state.totalInteractions += 1;
    saveState();
    showYokaiInfo(yokaiDef, record);
  });

  return el;
}

// Personality
function getYokaiPersonality(yokaiDef, record) {
  const timeHere = Math.floor((Date.now() - record.arrivedAt) / 60000);

  const messages = {
    namazugami: [
      `"Zzz... ${timeHere} minutes of rest..."`,
      `"I sense vibrations in this realm... ${state.totalInteractions} disturbances detected."`,
      `"Long absences make me stronger. The quiet feeds me."`,
      `Mood: ${yokaiDef.mood}`
    ],
    abumi_guchi: [
      `"I've been watching for ${timeHere} minutes."`,
      `"${state.offeringsPlaced.length} sakura offerings placed..."`,
      `"Offerings attract me. Your generosity will be remembered."`,
      `Mood: ${yokaiDef.mood}`
    ],
    moku_mokuren: [
      `"I've observed for ${timeHere} minutes with my many eyes."`,
      `"Activity detected: ${Math.floor(state.totalInteractions)} interactions."`,
      `"The more you interact, the more I see..."`,
      `Mood: ${yokaiDef.mood}`
    ],
    ushi_no_toki: [
      `"${timeHere} minutes in this realm..."`,
      `"I appear only in the dark."`,
      `"Touch me and I vanish before your eyes."`,
      `Mood: ${yokaiDef.mood}`
    ],
    ittan_momen: [
      `"I have been flying around for ${timeHere} minutes!"`,
      `"${state.activeYokai.length} friends in the garden! The more the better!"`,
      `"I love crowded gardens full of energy!"`,
      `Mood: ${yokaiDef.mood}`
    ],
    sakura_spirit: [
      `"Born from ${state.offeringsPlaced.length} beautiful sakura offerings..."`,
      `"I've blessed this garden for ${timeHere} minutes."`,
      `"Your blessings summoned me into here."`,
      `Mood: ${yokaiDef.mood}`
    ]
  };

  return messages[yokaiDef.id] || [
    `"I am ${yokaiDef.name}."`,
    `"I've been here for ${timeHere} minutes."`,
    `Mood: ${yokaiDef.mood}`
  ];
}

// Show yokai info
function showYokaiInfo(yokaiDef, record) {
  const personality = getYokaiPersonality(yokaiDef, record);
  const message = `
    <strong style="font-size: 14px; display: block; margin-bottom: 8px;">
      ${yokaiDef.name}
    </strong>
    ${personality
      .map(line => `<div style="margin: 4px 0; font-size: 11px;">${line}</div>`)
      .join("")}
  `;
  addLog(message);
}

// Render offerings
function renderOfferings(now) {
  const nowMs = now.getTime();
  for (const offering of state.offeringsPlaced) {
    const img = document.createElement("img");
    img.src = "Pictures/sakura.png";
    img.className = "offering";
    img.style.left = offering.left + "%";
    img.style.top  = offering.top + "%";

    const age = nowMs - offering.placedAt;
    const ratio = Math.min(Math.max(age / OFFERING_LIFETIME_MS, 0), 1);
    img.style.opacity = (1 - ratio).toFixed(2);

    gardenEl.appendChild(img);
  }
}

// Render scene
function render(now = new Date(), timeOfDay = getTimeOfDay(now)) {
  timeDisplay.textContent      = `${formatTime(now)} · ${timeOfDay}`;
  offeringsDisplay.textContent = state.offerings;

  clearGarden();
  renderOfferings(now);

  if (state.activeYokai.length === 0 && state.offeringsPlaced.length === 0) {
    renderGardenEmptyIfNeeded();
    return;
  }

  for (const record of state.activeYokai) {
    const def = YOKAI_LIST.find(y => y.id === record.id);
    if (!def) continue;
    const el = createYokaiElement(def, record);
    gardenEl.appendChild(el);
  }
}

// Spawn logic
function calculateChance(yokai, timeOfDay) {
  let chance = yokai.baseChance;
  const liveOfferings = state.offeringsPlaced.length;

  if (yokai.favoriteTime.includes("any") || yokai.favoriteTime.includes(timeOfDay)) {
    chance += 0.04;
  }

  const offeringBoost = Math.min(liveOfferings * 0.03, 0.3);
  chance += offeringBoost * 0.5;

  const now = Date.now();
  const awayMs = now - state.lastTick;

  if (yokai.specialRule === "likesLongAbsence" && awayMs > 10 * 60 * 1000) {
    chance += 0.08;
  }

  if (yokai.specialRule === "boostOnOffering" && liveOfferings > 0) {
    chance += 0.05;
  }

  if (yokai.specialRule === "nightOnlyRare" && timeOfDay !== "night") {
    return 0;
  }

  if (yokai.specialRule === "likesCrowdedGarden" && state.activeYokai.length >= 2) {
    chance += 0.05;
  }

  if (yokai.specialRule === "moreEyesWithActivity") {
    const activityBoost = Math.min(state.totalInteractions * 0.01, 0.1);
    chance += activityBoost;
  }

  if (yokai.specialRule === "appearsWithManySakura") {
    if (liveOfferings < 5) return 0;
    const extra = Math.min((liveOfferings - 5) * 0.02, 0.2);
    chance += 0.12 + extra;
  }

  return Math.min(chance, 0.7);
}

function maybeSpawnYokai(timeOfDay) {
  if (state.activeYokai.length >= 4) return;

  for (const yokai of YOKAI_LIST) {
    const alreadyHere = state.activeYokai.some(y => y.id === yokai.id);
    if (alreadyHere) continue;

    const chance = calculateChance(yokai, timeOfDay);
    if (Math.random() < chance) {
      const pos = getInitialYokaiPosition(yokai);
      state.activeYokai.push({
        id: yokai.id,
        arrivedAt: Date.now(),
        left: pos.left,
        top: pos.top
      });
      addLog(`${formatTime()} — ${yokai.name} appeared in the garden.`);
      break;
    }
  }
}

// Cleanup
function cleanupYokai() {
  const now = Date.now();
  const stayDuration = 5 * 60 * 1000;

  const before = state.activeYokai.length;
  state.activeYokai = state.activeYokai.filter(y => now - y.arrivedAt < stayDuration);

  if (state.activeYokai.length < before) {
    addLog(`${formatTime()} — A yokai slipped away while you weren't looking.`);
  }
}

function cleanupOfferings(simulated = false) {
  const nowMs = Date.now();
  const before = state.offeringsPlaced.length;
  state.offeringsPlaced = state.offeringsPlaced.filter(
    (o) => nowMs - o.placedAt < OFFERING_LIFETIME_MS
  );

  if (!simulated && state.offeringsPlaced.length < before) {
    addLog(`${formatTime()} — Some sakura offerings quietly faded away.`);
  }
}

// Tick loop
function tick(simulated = false) {
  const now = new Date();
  const timeOfDay = getTimeOfDay(now);

  cleanupOfferings(simulated);
  cleanupYokai();
  maybeSpawnYokai(timeOfDay);

  if (!simulated) {
    state.lastTick = Date.now();
  }

  saveState();
  render(now, timeOfDay);
}

// Catch up
function catchUpFromLastTick() {
  const now = Date.now();
  const diffMs = now - state.lastTick;
  let missedTicks = Math.min(Math.floor(diffMs / 60000), 30);

  while (missedTicks > 0) {
    tick(true);
    missedTicks--;
  }
}

// Offering button
offeringBtn.addEventListener("click", () => {
  state.offerings += 1;

  const left = Math.random() * 60 + 20;
  const top  = Math.random() * 20 + 35;

  state.offeringsPlaced.push({
    left,
    top,
    placedAt: Date.now()
  });

  saveState();
  addLog(`${formatTime()} — A soft sakura offering was placed.`);
  render();
});

// Track interactions
document.addEventListener("mousemove", () => {
  state.totalInteractions += 0.1;
});

document.addEventListener("click", () => {
  state.totalInteractions += 1;
});

// Chat log open/close with header + tab
function toggleChat() {
  chatWrapper.classList.toggle("closed");
}

if (chatWrapper && chatHeader && chatCloseBtn && chatTab) {
  chatCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleChat();
  });

  chatHeader.addEventListener("click", (e) => {
    if (e.target === chatCloseBtn) return;
    toggleChat();
  });

  chatTab.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleChat();
  });
}

/* ===== Catalog (Yokai Index) ===== */

function formatFavoriteTimeLabel(arr) {
  if (!arr || !arr.length) return "";
  if (arr.includes("any")) return "Any time";
  const map = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night"
  };
  return arr.map(t => map[t] || t).join(" · ");
}

function buildCatalog() {
  if (!catalogGrid) return;
  catalogGrid.innerHTML = "";

  YOKAI_LIST.forEach((yokai) => {
    const card = document.createElement("div");
    card.className = "catalog-card";
    card.dataset.times = (yokai.favoriteTime || []).join(",");

    const favLabel = formatFavoriteTimeLabel(yokai.favoriteTime);
    const moodLabel = yokai.mood ? `Mood: ${yokai.mood}` : "";

    const tags = [];

    if (favLabel) tags.push(favLabel);
    if (yokai.specialRule === "nightOnlyRare") tags.push("Rare");
    if (yokai.specialRule === "likesCrowdedGarden") tags.push("Crowd lover");
    if (yokai.specialRule === "boostOnOffering") tags.push("Offering boosted");
    if (yokai.specialRule === "appearsWithManySakura") tags.push("Sakura-born");

    card.innerHTML = `
      <div class="catalog-image-wrapper">
        <img src="Pictures/${yokai.sprite}" alt="${yokai.name}">
      </div>
      <div class="catalog-name">${yokai.name}</div>
      <div class="catalog-sub">${moodLabel}</div>
      <div class="catalog-tags">
        ${tags.map(t => `<span class="catalog-tag">${t}</span>`).join("")}
      </div>
    `;

    catalogGrid.appendChild(card);
  });
}

function filterCatalog(filter) {
  if (!catalogGrid) return;
  const cards = catalogGrid.querySelectorAll(".catalog-card");
  cards.forEach(card => {
    const times = (card.dataset.times || "").split(",").filter(Boolean);
    let show = true;

    if (filter === "night") {
      show = times.includes("night") || times.includes("evening");
    } else if (filter === "day") {
      show = times.includes("morning") || times.includes("afternoon");
    } else if (filter === "all") {
      show = true;
    }

    card.style.display = show ? "flex" : "none";
  });
}

function openCatalog() {
  if (!catalogOverlay) return;
  catalogOverlay.classList.add("open");
}

function closeCatalog() {
  if (!catalogOverlay) return;
  catalogOverlay.classList.remove("open");
}

if (indexButton) {
  indexButton.addEventListener("click", () => {
    openCatalog();
  });
}

if (catalogClose) {
  catalogClose.addEventListener("click", (e) => {
    e.stopPropagation();
    closeCatalog();
  });
}

if (catalogOverlay) {
  catalogOverlay.addEventListener("click", (e) => {
    if (e.target === catalogOverlay) {
      closeCatalog();
    }
  });
}

if (catalogTabs && catalogTabs.length > 0) {
  catalogTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      catalogTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const filter = tab.dataset.filter || "all";
      filterCatalog(filter);
    });
  });
}

// After opening animation finishes, disable overlay clicks and hide it
if (openingOverlay) {
  openingOverlay.addEventListener("animationend", () => {
    openingOverlay.style.pointerEvents = "none";
    openingOverlay.style.display = "none";
  });
}

// Init
loadState();
catchUpFromLastTick();
render();
buildCatalog();
filterCatalog("all");

setInterval(() => {
  tick(false);
}, 10000);
