(function () {
  "use strict";

  const BEADS = 108;
  const KEYS = {
    mantras: "@zenmala/mantras",
    history: "@zenmala/history",
    settings: "@zenmala/settings",
    currentCount: "@zenmala/current_count",
  };

  const DEFAULT_MANTRAS = [
    {
      id: "om-namah-shivaya",
      name: "Om Namah Shivaya",
      devanagari: "ॐ नमः शिवाय",
      meaning: "I bow to Shiva, the inner Self.",
    },
    {
      id: "hare-krishna",
      name: "Hare Krishna",
      devanagari: "हरे कृष्ण",
      meaning: "Invocation of divine love and presence.",
    },
    {
      id: "om-mani-padme-hum",
      name: "Om Mani Padme Hum",
      devanagari: "ॐ मणि पद्मे हूँ",
      meaning: "The jewel is in the lotus - compassion.",
    },
    {
      id: "gayatri",
      name: "Gayatri Mantra",
      devanagari: "ॐ भूर्भुवः स्वः",
      meaning: "May we meditate on the divine light.",
    },
    { id: "om", name: "Om", devanagari: "ॐ", meaning: "The primordial sound." },
    { id: "so-hum", name: "So Hum", devanagari: "सो हम्", meaning: "I am that." },
  ];

  const DEFAULT_SETTINGS = {
    hapticsEnabled: true,
    soundEnabled: true,
    selectedMantraId: "om-namah-shivaya",
  };

  const state = {
    count: 0,
    settings: { ...DEFAULT_SETTINGS },
    customMantras: [],
    history: [],
    sessionStart: Date.now(),
    activeView: "counter",
    installPrompt: null,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function allMantras() {
    return [...DEFAULT_MANTRAS, ...state.customMantras];
  }

  function activeMantra() {
    return allMantras().find((m) => m.id === state.settings.selectedMantraId) || DEFAULT_MANTRAS[0];
  }

  function loadState() {
    state.customMantras = readJson(KEYS.mantras, []);
    state.history = readJson(KEYS.history, []);
    state.settings = { ...DEFAULT_SETTINGS, ...readJson(KEYS.settings, {}) };
    const savedCount = Number.parseInt(localStorage.getItem(KEYS.currentCount) || "0", 10);
    state.count = Number.isFinite(savedCount) ? Math.min(Math.max(savedCount, 0), BEADS - 1) : 0;
  }

  function saveSettings() {
    writeJson(KEYS.settings, state.settings);
  }

  function saveCount() {
    localStorage.setItem(KEYS.currentCount, String(state.count));
  }

  function saveCustomMantras() {
    writeJson(KEYS.mantras, state.customMantras);
  }

  function saveHistory() {
    writeJson(KEYS.history, state.history);
  }

  function setView(view) {
    state.activeView = view;
    $$(".view").forEach((node) => node.classList.toggle("is-active", node.dataset.view === view));
    $$("[data-tab]").forEach((node) => node.classList.toggle("is-active", node.dataset.tab === view));
    const nextUrl = new URL(window.location.href);
    if (view === "counter") {
      nextUrl.searchParams.delete("view");
    } else {
      nextUrl.searchParams.set("view", view);
    }
    window.history.replaceState({}, "", nextUrl);
    render();
  }

  function openModal(name) {
    const modal = $(`[data-modal="${name}"]`);
    if (!modal) return;
    if (name === "edit-count") {
      $("[data-edit-count-input]").value = String(state.count);
    }
    modal.classList.remove("hidden");
    const input = $("input, textarea, button", modal);
    if (input) window.setTimeout(() => input.focus(), 40);
  }

  function closeModals() {
    $$("[data-modal]").forEach((modal) => modal.classList.add("hidden"));
  }

  function beep(kind) {
    if (!state.settings.soundEnabled || !window.AudioContext) return;
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = kind === "complete" ? 587.33 : 220;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.linearRampToValueAtTime(kind === "complete" ? 0.12 : 0.055, context.currentTime + 0.015);
      gain.gain.linearRampToValueAtTime(0.0001, context.currentTime + (kind === "complete" ? 0.55 : 0.11));
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + (kind === "complete" ? 0.58 : 0.12));
    } catch {
      // Audio is optional.
    }
  }

  function haptic(kind) {
    if (!state.settings.hapticsEnabled || !navigator.vibrate) return;
    navigator.vibrate(kind === "complete" ? [30, 40, 80] : 12);
  }

  function countBead() {
    const next = state.count + 1;
    if (next >= BEADS) {
      const mantra = activeMantra();
      state.history.unshift({
        id: `h-${Date.now()}`,
        mantraId: mantra.id,
        mantraName: mantra.name,
        malaCount: 1,
        beadCount: BEADS,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - state.sessionStart,
      });
      state.count = 0;
      state.sessionStart = Date.now();
      saveHistory();
      saveCount();
      beep("complete");
      haptic("complete");
      celebrate();
    } else {
      state.count = next;
      saveCount();
      beep("tick");
      haptic("tick");
    }
    renderCounter();
  }

  function resetCount() {
    state.count = 0;
    state.sessionStart = Date.now();
    saveCount();
    renderCounter();
  }

  function celebrate() {
    const celebration = $("[data-celebration]");
    celebration.classList.remove("hidden");
    window.setTimeout(() => celebration.classList.add("hidden"), 1800);
  }

  function selectMantra(id) {
    state.settings.selectedMantraId = id;
    saveSettings();
    closeModals();
    render();
  }

  function deleteCustomMantra(id) {
    const mantra = state.customMantras.find((item) => item.id === id);
    if (!mantra) return;
    if (!window.confirm(`Remove "${mantra.name}"?`)) return;
    state.customMantras = state.customMantras.filter((item) => item.id !== id);
    if (state.settings.selectedMantraId === id) {
      state.settings.selectedMantraId = DEFAULT_SETTINGS.selectedMantraId;
      saveSettings();
    }
    saveCustomMantras();
    render();
  }

  function computeWeekly() {
    const today = new Date();
    const buckets = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const malas = state.history
        .filter((entry) => entry.completedAt.slice(0, 10) === key)
        .reduce((sum, entry) => sum + entry.malaCount, 0);
      buckets.push({
        label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
        date: key,
        malas,
      });
    }
    return buckets;
  }

  function computeStreak() {
    const dayKey = (date) => date.toISOString().slice(0, 10);
    const days = new Set(state.history.map((entry) => dayKey(new Date(entry.completedAt))));
    let streak = 0;
    const cursor = new Date();
    if (!days.has(dayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!days.has(dayKey(cursor))) return 0;
    }
    while (days.has(dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function formatDuration(ms) {
    if (!ms || ms < 1000) return "-";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return minutes === 0 ? `${seconds}s` : `${minutes}m ${remaining}s`;
  }

  function renderCounter() {
    const progress = (state.count / BEADS) * 360;
    $("[data-current-count]").textContent = String(state.count);
    $("[data-bead-total]").textContent = `of ${BEADS}`;
    $("[data-count-button]").style.setProperty("--progress", `${progress}deg`);
    const mantra = activeMantra();
    $("[data-active-mantra-name]").textContent = mantra.name;
    $("[data-active-mantra-deva]").textContent = mantra.devanagari || "";
  }

  function createMantraCard(mantra, options = {}) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "mantra-card";
    if (mantra.id === state.settings.selectedMantraId) card.classList.add("is-selected");
    card.innerHTML = `
      <span>
        ${mantra.devanagari ? `<span class="deva">${escapeHtml(mantra.devanagari)}</span>` : ""}
        <strong>${escapeHtml(mantra.name)}</strong>
        ${mantra.meaning ? `<p>${escapeHtml(mantra.meaning)}</p>` : ""}
        ${mantra.isCustom ? "<small>Custom</small>" : ""}
      </span>
      <span class="selected-dot" aria-hidden="true"></span>
    `;
    card.addEventListener("click", () => selectMantra(mantra.id));
    if (options.allowDelete && mantra.isCustom) {
      card.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        deleteCustomMantra(mantra.id);
      });
      card.addEventListener("dblclick", () => deleteCustomMantra(mantra.id));
    }
    return card;
  }

  function renderMantras() {
    const list = $("[data-mantra-list]");
    const picker = $("[data-picker-list]");
    list.replaceChildren();
    picker.replaceChildren();
    for (const mantra of allMantras()) {
      list.appendChild(createMantraCard(mantra, { allowDelete: true }));
      picker.appendChild(createMantraCard(mantra));
    }
  }

  function renderStats() {
    const totalMalas = state.history.reduce((sum, item) => sum + item.malaCount, 0);
    const totalBeads = state.history.reduce((sum, item) => sum + item.beadCount, 0);
    $("[data-total-malas]").textContent = String(totalMalas);
    $("[data-total-beads]").textContent = totalBeads.toLocaleString();
    $("[data-streak]").textContent = String(computeStreak());
    $("[data-stats-empty]").classList.toggle("hidden", state.history.length > 0);

    const weekly = computeWeekly();
    const max = Math.max(1, ...weekly.map((day) => day.malas));
    const chart = $("[data-weekly-chart]");
    chart.replaceChildren();
    for (const day of weekly) {
      const col = document.createElement("div");
      col.className = "chart-col";
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${Math.max(4, (day.malas / max) * 106)}px`;
      bar.title = `${day.malas} malas`;
      const label = document.createElement("span");
      label.textContent = day.label;
      col.append(bar, label);
      chart.appendChild(col);
    }
  }

  function renderHistory() {
    const list = $("[data-history-list]");
    const empty = $("[data-history-empty]");
    const clearButton = $("[data-clear-history]");
    list.replaceChildren();
    empty.classList.toggle("hidden", state.history.length > 0);
    clearButton.classList.toggle("hidden", state.history.length === 0);

    for (const entry of state.history) {
      const date = new Date(entry.completedAt);
      const row = document.createElement("article");
      row.className = "history-row";
      row.innerHTML = `
        <span class="date">
          <strong>${escapeHtml(date.toLocaleDateString(undefined, { month: "short", day: "2-digit" }))}</strong>
          <span>${escapeHtml(date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }))}</span>
        </span>
        <span>
          <strong>${escapeHtml(entry.mantraName)}</strong>
          <p>${entry.beadCount} beads · ${escapeHtml(formatDuration(entry.durationMs))}</p>
        </span>
        <span class="checkmark" aria-hidden="true">✓</span>
      `;
      list.appendChild(row);
    }
  }

  function renderSettings() {
    $("[data-setting-haptics]").checked = Boolean(state.settings.hapticsEnabled);
    $("[data-setting-sound]").checked = Boolean(state.settings.soundEnabled);
  }

  function renderInstallButton() {
    $("[data-install-app]").classList.toggle("hidden", !state.installPrompt);
  }

  function render() {
    renderCounter();
    renderMantras();
    renderStats();
    renderHistory();
    renderSettings();
    renderInstallButton();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function wireEvents() {
    $("[data-count-button]").addEventListener("click", countBead);
    $("[data-count-plus]").addEventListener("click", countBead);
    $("[data-reset-count]").addEventListener("click", resetCount);
    $("[data-open-edit-count]").addEventListener("click", () => openModal("edit-count"));
    $("[data-open-settings]").addEventListener("click", () => openModal("settings"));
    $("[data-open-mantra-picker]").addEventListener("click", () => openModal("mantra-picker"));
    $("[data-open-add-mantra]").addEventListener("click", () => openModal("add-mantra"));
    $$("[data-tab]").forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.tab)));
    $$("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModals));
    $$("[data-modal]").forEach((modal) => {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModals();
      });
    });

    $("[data-setting-haptics]").addEventListener("change", (event) => {
      state.settings.hapticsEnabled = event.target.checked;
      saveSettings();
    });
    $("[data-setting-sound]").addEventListener("change", (event) => {
      state.settings.soundEnabled = event.target.checked;
      saveSettings();
    });

    $("[data-edit-count-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      const value = Number.parseInt($("[data-edit-count-input]").value || "0", 10);
      state.count = Number.isFinite(value) ? Math.min(Math.max(value, 0), BEADS - 1) : 0;
      saveCount();
      closeModals();
      renderCounter();
    });

    $("[data-add-mantra-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const name = String(form.get("name") || "").trim();
      if (!name) return;
      state.customMantras.push({
        id: `custom-${Date.now()}`,
        name,
        devanagari: String(form.get("devanagari") || "").trim() || undefined,
        meaning: String(form.get("meaning") || "").trim() || undefined,
        isCustom: true,
      });
      saveCustomMantras();
      event.currentTarget.reset();
      closeModals();
      setView("mantras");
    });

    $("[data-clear-history]").addEventListener("click", () => {
      if (!state.history.length || !window.confirm("Clear all completed mala records?")) return;
      state.history = [];
      saveHistory();
      render();
    });

    $("[data-install-app]").addEventListener("click", async () => {
      if (!state.installPrompt) return;
      state.installPrompt.prompt();
      await state.installPrompt.userChoice.catch(() => undefined);
      state.installPrompt = null;
      renderInstallButton();
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installPrompt = event;
      renderInstallButton();
    });
  }

  function bootViewFromUrl() {
    const view = new URL(window.location.href).searchParams.get("view");
    if (["counter", "mantras", "stats", "history"].includes(view)) {
      setView(view);
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => undefined);
    });
  }

  loadState();
  wireEvents();
  render();
  bootViewFromUrl();
  registerServiceWorker();
})();
