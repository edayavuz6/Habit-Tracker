const STORAGE_KEY = "habit_tracker_v4";
const today = new Date().toISOString().slice(0, 10);

const MOTIVATIONS = [
  { icon: "🌸", text: "Küçük adımlar, büyük değişimler yaratır." },
  { icon: "✨", text: "Her gün biraz daha güçleniyorsun. Devam et!" },
  { icon: "🌿", text: "Tutarlılık, mükemmeliyetten çok daha değerlidir." },
  { icon: "🦋", text: "Değişim zamanla gelir. Bugün de önemli bir gün." },
  { icon: "🌈", text: "Kendine iyi davranmak da bir alışkanlıktır." },
  { icon: "🔥", text: "Streakini kırmadan bugünü tamamla!" },
  { icon: "💫", text: "En iyi zaman şimdi. En iyi sen bugünkü sensin." },
  { icon: "🌙", text: "Dünden daha iyi olmak, en güzel zafer." },
  { icon: "🎯", text: "Hedefine her gün bir adım daha yaklaşıyorsun." },
  { icon: "🌺", text: "İyi alışkanlıklar, geleceğin sana verdiği hediyedir." },
];

let state = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { habits: [] };
  } catch {
    return { habits: [] };
  }
})();

let selectedColor = "pink";
let currentTab = "daily";

function init() {
document.getElementById("dateLabel").textContent =   
    new Date().toLocaleDateString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const m = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
  document.getElementById("motIcon").textContent = m.icon;
  document.getElementById("motText").textContent = m.text;

  document.getElementById("colorPicks").addEventListener("click", (e) => {
    const dot = e.target.closest(".color-dot");
    if (!dot) return;
    document
      .querySelectorAll(".color-dot")
      .forEach((d) => d.classList.remove("selected"));
    dot.classList.add("selected");
    selectedColor = dot.dataset.color;
  });

  document.getElementById("habitInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addHabit();
  });

  state.habits.forEach((h) => {
    if (!h.history) h.history = {};
    if (h.lastDone !== today) h.doneToday = false;
  });
  save();
  render();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const list = document.getElementById("habitsList");
  const empty = document.getElementById("emptyState");
  const summary = document.getElementById("summaryBox");
  list.innerHTML = "";

  if (!state.habits.length) {
    empty.style.display = "block";
    summary.style.display = "none";
    return;
  }
  empty.style.display = "none";
  summary.style.display = "block";

  state.habits.forEach((h, i) => {
    const card = document.createElement("div");
    card.className = "habit-card" + (h.doneToday ? " done" : "");
    card.dataset.color = h.color;
    card.style.animationDelay = i * 0.055 + "s";

    const hot = h.streak >= 3;
    const badge =
      h.streak > 0
        ? `<span class="streak-badge ${hot ? "hot" : ""}">${hot ? "🔥" : "⭐"} ${h.streak} gün seri</span>`
        : `<span class="streak-badge">✨ Yeni başlangıç</span>`;

    card.innerHTML = `
            <button class="check-btn" onclick="toggleHabit(${i})">${h.doneToday ? "✓" : ""}</button>
            <div class="habit-info">
                <div class="habit-name">${esc(h.name)}</div>
                ${badge}
            </div>
            <button class="delete-btn" onclick="deleteHabit(${i})" title="Sil">✕</button>
        `;
    list.appendChild(card);
  });

  const total = state.habits.length;
  const done = state.habits.filter((h) => h.doneToday).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressText").innerHTML =
    `Bugün <span>${done}/${total}</span> alışkanlığı tamamladın — <span>%${pct}</span>`;
}

function addHabit() {
  const inp = document.getElementById("habitInput");
  const name = inp.value.trim();
  if (!name) {
    inp.focus();
    return;
  }
  state.habits.push({
    name,
    color: selectedColor,
    doneToday: false,
    streak: 0,
    lastDone: null,
    history: {},
  });
  save();
  inp.value = "";
  render();
  if (currentTab === "weekly") renderWeekly();
}

function toggleHabit(i) {
  const h = state.habits[i];
  if (!h.history) h.history = {};
  h.doneToday = !h.doneToday;
  if (h.doneToday) {
    h.history[today] = true;
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yStr = yest.toISOString().slice(0, 10);
    h.streak =
      h.lastDone === yStr ? h.streak + 1 : h.lastDone === today ? h.streak : 1;
    h.lastDone = today;
    burst();
  } else {
    delete h.history[today];
    if (h.streak > 0) h.streak--;
    h.lastDone = h.streak > 0 ? today : null;
  }
  save();
  render();
  if (currentTab === "weekly") renderWeekly();
}

function deleteHabit(i) {
  state.habits.splice(i, 1);
  save();
  render();
  renderWeekly();
}

function switchTab(tab) {
  currentTab = tab;
  document
    .getElementById("tabDaily")
    .classList.toggle("active", tab === "daily");
  document
    .getElementById("tabWeekly")
    .classList.toggle("active", tab === "weekly");
  document.getElementById("dailyView").style.display =
    tab === "daily" ? "" : "none";
  document.getElementById("weeklyView").style.display =
    tab === "weekly" ? "" : "none";
  if (tab === "weekly") renderWeekly();
  else render();
}

function getWeekDates() {
  const now = new Date(),
    day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function renderWeekly() {
  const dates = getWeekDates();
  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  document.getElementById("weekHeader").innerHTML =
    "<div></div>" +
    dates
      .map((d, i) => {
        const isT = d === today;
        const num = new Date(d + "T12:00:00").getDate();
        return `<div class="day-label ${isT ? "today-col" : ""}">${dayNames[i]}<br>${num}</div>`;
      })
      .join("");

  const rowsEl = document.getElementById("weekRows");
  rowsEl.innerHTML = "";

  if (!state.habits.length) {
    rowsEl.innerHTML =
      '<p style="text-align:center;color:var(--text-soft);padding:28px 0;font-size:.9rem;">Henüz alışkanlık eklemedin.</p>';
    document.getElementById("weekStats").innerHTML = "";
    return;
  }

  state.habits.forEach((h) => {
    if (!h.history) h.history = {};
    const row = document.createElement("div");
    row.className = "week-row";
    let html = `<div class="week-habit-name" title="${esc(h.name)}">${esc(h.name)}</div>`;
    dates.forEach((d) => {
      const done = !!h.history[d];
      const isToday = d === today;
      const isFuture = d > today;
      const missed = !done && !isFuture;
      let cls = "week-cell";
      if (done) cls += " done-cell";
      if (isToday) cls += " today-cell";
      if (isFuture) cls += " future-cell";
      else if (missed && !done) cls += " missed-cell";
      const icon = done ? "✓" : isFuture ? "" : "×";
      html += `<div class="${cls}" data-color="${h.color}">${icon}</div>`;
    });
    row.innerHTML = html;
    rowsEl.appendChild(row);
  });

  let totalDone = 0,
    bestStreak = 0;
  state.habits.forEach((h) => {
    dates.forEach((d) => {
      if (h.history && h.history[d]) totalDone++;
    });
    if ((h.streak || 0) > bestStreak) bestStreak = h.streak;
  });
  const pastDays = dates.filter((d) => d <= today).length;
  const possible = state.habits.length * pastDays;
  const pct = possible ? Math.round((totalDone / possible) * 100) : 0;

  document.getElementById("weekStats").innerHTML = `
        <div class="week-stat"><div class="stat-val">${totalDone}</div><div class="stat-label">Bu hafta tamamlanan</div></div>
        <div class="week-stat"><div class="stat-val">%${pct}</div><div class="stat-label">Haftalık başarı</div></div>
        <div class="week-stat"><div class="stat-val">${bestStreak}🔥</div><div class="stat-label">En uzun seri</div></div>
    `;
}

function burst() {
  const colors = [
    "#e8426e",
    "#f07840",
    "#7c5cbf",
    "#1faa7a",
    "#2585d4",
    "#d4a017",
  ];
  for (let k = 0; k < 18; k++) {
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = 20 + Math.random() * 60 + "vw";
      el.style.top = 10 + Math.random() * 50 + "vh";
      el.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }, k * 40);
  }
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

init();

const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");

  themeToggle.textContent = isDark ? "☀️" : "🌙";

  localStorage.setItem("theme", isDark ? "dark" : "light");
});
