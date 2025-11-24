// DOM references 
const timeDisplay = document.getElementById("time-display");
const offeringsDisplay = document.getElementById("offerings-count");
const gardenEl = document.getElementById("garden");
const offeringBtn = document.getElementById("place-offering");
const logList = document.getElementById("log-list");
const clockHand = document.getElementById("clock-hand");

//  Config 
const STORAGE_KEY = "yokaiGardenState_v7";
const OFFERING_LIFETIME_MS = 2 * 60 * 60 * 1000; // 2 hours before vanish

// Yokai 
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
    sprite: "NamazuGami-min.png",
    name: "NamazuGami",
    favoriteTime: ["evening", "night"],
    baseChance: 0.05,
    movementType: "heavyPatrol",
    mood: "sleepy",
    specialRule: "likesLongAbsence"
  },
  {
    id: "abumi_guchi",
    sprite: "AbumiGuchi-min.png",
    name: "Abumi Guchi",
    favoriteTime: ["morning", "afternoon"],
    baseChance: 0.06,
    movementType: "smallPatrol",
    mood: "loyal",
    specialRule: "boostOnOffering"
  },
  {
    id: "moku_mokuren",
    sprite: "MokuMokuren-min.png",
    name: "Moku Mokuren",
    favoriteTime: ["any"],
    baseChance: 0.04,
    movementType: "wallWatcher",
    mood: "curious",
    specialRule: "moreEyesWithActivity"
  },
  {
    id: "ushi_no_toki",
    sprite: "UshiNoTokiMairi-min.png",
    name: "Ushi no Toki Mairi",
    favoriteTime: ["night"],
    baseChance: 0.01,
    movementType: "slowDriftCenter",
    mood: "ominous",
    specialRule: "nightOnlyRare"
  },
  {
    id: "ittan_momen",
    sprite: "Ittan Momen-min.png",
    name: "Ittan Momen",
    favoriteTime: ["afternoon", "evening"],
    baseChance: 0.07,
    movementType: "fullFloat",
    mood: "playful",
    specialRule: "likesCrowdedGarden"
  },
  {
    id: "sakura_spirit",
    sprite: "sakura.png",
    name: "Sakura Spirit",
    favoriteTime: ["any"],
    baseChance: 0,
    movementType: "fullFloat",
    mood: "gentle",
    specialRule: "appearsWithManySakura"
  }
];

//  State 
let state = {
  offerings: 0,
  activeYokai: [],
  offeringsPlaced: [],
  lastTick: Date.now(),
  totalInteractions: 0
};

// State load/save 
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

// Memo / log UI 
const MEMO_COLORS = ["#a9a4f1ff", "#b0deffff", "#f1a0a0ff", "#f9e8aeff", "#f7f0f0ff"];

function addLog(message) {
  const li = document.createElement("li");
  li.className = "memo-note";

  const color = MEMO_COLORS[Math.floor(Math.random() * MEMO_COLORS.length)];
  li.style.backgroundColor = color;

  li.innerHTML = `
    <div class="memo-title">MEMO PAD</div>
    <div class="memo-body">${message}</div>
  `;

  logList.appendChild(li);

  while (logList.children.length > 8) {
    logList.removeChild(logList.firstChild);
  }
}

// The Yokai 
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

function getInitialYokaiPosition(yokaiDef) {
  let left = Math.random() * 70 + 10;
  let top = Math.random() * 30 + 20;

  if (yokaiDef.id === "namazugami") {
    top = 35 + Math.random() * 6;
  }

  if (yokaiDef.id === "abumi_guchi") {
    left = 12 + Math.random() * 18;
    top = 38 + Math.random() * 6;
  }

  if (yokaiDef.id === "moku_mokuren") {
    const side = Math.random() < 0.5 ? "left" : "right";
    left = side === "left" ? 4 : 86;
    top = 12 + Math.random() * 18;
  }

  if (yokaiDef.id === "ushi_no_toki") {
    left = 45 + Math.random() * 10;
    top = 32 + Math.random() * 8;
  }

  if (yokaiDef.id === "ittan_momen") {
    left = 8;
    top = 26 + Math.random() * 8;
  }

  if (yokaiDef.id === "sakura_spirit") {
    left = 20 + Math.random() * 60;
    top = 30 + Math.random() * 10;
  }

  return { left, top };
}

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
    top = pos.top;
  }

  el.style.left = left + "%";
  el.style.top = top + "%";
  el.style.cursor = "pointer";

  // Special behavior for Ushi no Toki
  if (yokaiDef.id === "ushi_no_toki") {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      el.style.opacity = 0;
      setTimeout(() => el.remove(), 500);
      addLog(`${formatTime()} — Ushi no Toki vanished, leaving a quiet charm.`);
      showYokaiInfo(yokaiDef, record);
    });
  }

  // Special behavior for Moku Mokuren
  if (yokaiDef.id === "moku_mokuren") {
    el.addEventListener("mouseenter", () => {
      el.style.opacity = 0.4;
      setTimeout(() => { el.style.opacity = 1; }, 200);
    });
  }

  // Click to show yokai info
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    state.totalInteractions += 1;
    saveState();
    showYokaiInfo(yokaiDef, record);
  });

  return el;
}

// Generate yokai personality messages
function getYokaiPersonality(yokaiDef, record) {
  const timeHere = Math.floor((Date.now() - record.arrivedAt) / 60000); // minutes
  const messages = {
    namazugami: [
      `"Zzz... ${timeHere} minutes of rest..."`,
      `"I sense vibrations in this realm... ${state.totalInteractions} disturbances detected."`,
      `"Long absences make me stronger. The quiet feeds me."`,
      `Mood: ${yokaiDef.mood} `
    ],
    abumi_guchi: [
      `"I've been watching for ${timeHere} minutes."`,
      `"${state.offeringsPlaced.length} sakura offerings placed..."`,
      `"Offerings attract me. Your generosity will be remembered."`,
      `Mood: ${yokaiDef.mood} `
    ],
    moku_mokuren: [
      `"I've observed for ${timeHere} minutes with my many eyes."`,
      `"Activity detected: ${Math.floor(state.totalInteractions)} interactions."`,
      `"The more you interact, the more I see..."`,
      `Mood: ${yokaiDef.mood} `
    ],
    ushi_no_toki: [
      `"${timeHere} minutes in this realm..."`,
      `"I appear only in the dark."`,
      `"Touch me and I vanish before your eyes."`,
      `Mood: ${yokaiDef.mood} `
    ],
    ittan_momen: [
      `"I have been flying around for ${timeHere} minutes!"`,
      `"${state.activeYokai.length} friends in the garden! The more the better!"`,
      `"I love crowded gardens full of energy!"`,
      `Mood: ${yokaiDef.mood} `
    ],
    sakura_spirit: [
      `"Born from ${state.offeringsPlaced.length} beautiful sakura offerings..."`,
      `"I've blessed this garden for ${timeHere} minutes."`,
      `"Your blessings summoned me into here."`,
      `Mood: ${yokaiDef.mood} `
    ]
  };

  return messages[yokaiDef.id] || [
    `"I am ${yokaiDef.name}."`,
    `"I've been here for ${timeHere} minutes."`,
    `Mood: ${yokaiDef.mood}`
  ];
}

// Show yokai info in a memo note
function showYokaiInfo(yokaiDef, record) {
  const personality = getYokaiPersonality(yokaiDef, record);
  const message = `
    <strong style="font-size: 14px; display: block; margin-bottom: 8px;">${yokaiDef.name}</strong>
    ${personality.map(line => `<div style="margin: 4px 0; font-size: 11px;">${line}</div>`).join('')}
  `;
  addLog(message);
}

function renderOfferings(now) {
  const nowMs = now.getTime();
  for (const offering of state.offeringsPlaced) {
    const img = document.createElement("img");
    img.src = "Pictures/sakura.png";
    img.className = "offering";
    img.style.left = offering.left + "%";
    img.style.top = offering.top + "%";

    const age = nowMs - offering.placedAt;
    const ratio = Math.min(Math.max(age / OFFERING_LIFETIME_MS, 0), 1);
    img.style.opacity = (1 - ratio).toFixed(2);

    gardenEl.appendChild(img);
  }
}

//  Render whole scene 
function render(now = new Date(), timeOfDay = getTimeOfDay(now)) {
  timeDisplay.textContent = `${formatTime(now)} · ${timeOfDay}`;
  offeringsDisplay.textContent = state.offerings;

  // clock hand
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const angle = hours * 30 + minutes * 0.5 + seconds * (0.5/60);
  clockHand.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

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

// Spawn 
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

//  Cleanup 
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

function catchUpFromLastTick() {
  const now = Date.now();
  const diffMs = now - state.lastTick;
  let missedTicks = Math.min(Math.floor(diffMs / 60000), 30);

  while (missedTicks > 0) {
    tick(true);
    missedTicks--;
  }
}

//  Event handlers 
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

document.addEventListener("mousemove", () => {
  state.totalInteractions += 0.1;
});
document.addEventListener("click", () => {
  state.totalInteractions += 1;
});

// Init 
loadState();
catchUpFromLastTick();
render();

setInterval(() => {
  tick(false);
}, 10000);