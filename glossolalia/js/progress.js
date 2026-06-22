/* ===== PROGRESSION TRACKING (SM-2 Spaced Repetition) ===== */

const Progress = (() => {
  const STORAGE_KEY = "glossolalia-progress";
  const MIN_EASE = 1.3;

  /* --- localStorage helpers --- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* localStorage unavailable or corrupt */ }
    return { version: 1, words: {}, stats: { totalSessions: 0, currentStreak: 0, lastSessionDate: null } };
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* silently degrade */ }
  }

  function makeKey(entry, sourceLang, targetLang) {
    return `${entry}::${sourceLang}\u2192${targetLang}`;
  }

  /* --- SM-2 Core --- */

  function recordOutcome(entry, sourceLang, targetLang, wasCorrect) {
    const data = load();
    const key = makeKey(entry, sourceLang, targetLang);
    const now = Date.now();

    let rec = data.words[key] || {
      correct: 0, incorrect: 0, streak: 0,
      interval: 0, easeFactor: 2.5,
      nextReview: 0, lastSeen: 0
    };

    if (wasCorrect) {
      rec.correct++;
      rec.streak++;

      // SM-2 interval
      if (rec.streak === 1) rec.interval = 1;
      else if (rec.streak === 2) rec.interval = 3;
      else rec.interval = Math.round(rec.interval * rec.easeFactor);

      // SM-2 ease factor (quality = 5 for correct)
      rec.easeFactor = rec.easeFactor + (0.1 - 0 * (0.08 + 0 * 0.02));
    } else {
      rec.incorrect++;
      rec.streak = 0;
      rec.interval = 1;

      // SM-2 ease factor (quality = 1 for incorrect)
      const diff = 4; // 5 - 1
      rec.easeFactor = rec.easeFactor + (0.1 - diff * (0.08 + diff * 0.02));
    }

    if (rec.easeFactor < MIN_EASE) rec.easeFactor = MIN_EASE;
    rec.nextReview = now + (rec.interval * 86400000);
    rec.lastSeen = now;

    data.words[key] = rec;
    save(data);
  }

  function getWordPriority(entry, sourceLang, targetLang) {
    const data = load();
    const key = makeKey(entry, sourceLang, targetLang);
    const rec = data.words[key];
    const now = Date.now();

    if (!rec) return 0;                            // never seen
    if (rec.nextReview <= now) return 1;            // overdue
    if (rec.nextReview <= now + 86400000) return 2; // due soon
    return 3;                                       // mastered / not due
  }

  function prioritizeDeck(words, sourceLang, targetLang) {
    // score each word, then sort by priority (low = urgent), shuffle within tiers
    const scored = words.map(w => ({
      word: w,
      priority: getWordPriority(w.entry, sourceLang, targetLang),
      rand: Math.random()
    }));

    scored.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.rand - b.rand;
    });

    return scored.map(s => s.word);
  }

  function getProgressSummary(topic, sourceLang, targetLang) {
    const data = load();
    const words = VOCAB[topic] || [];
    const now = Date.now();

    let total = 0, newCount = 0, dueCount = 0, masteredCount = 0;

    words.forEach(w => {
      if (!w.data[sourceLang] || !w.data[targetLang]) return;
      total++;
      const key = makeKey(w.entry, sourceLang, targetLang);
      const rec = data.words[key];

      if (!rec) { newCount++; return; }
      if (rec.streak >= 5 && rec.nextReview > now) { masteredCount++; return; }
      if (rec.nextReview <= now) { dueCount++; return; }
      // in-progress (seen but not mastered and not due)
    });

    return { total, newCount, dueCount, masteredCount, learningCount: total - newCount - dueCount - masteredCount };
  }

  /* --- Session streak --- */

  function updateSessionStats() {
    const data = load();
    const today = new Date().toISOString().slice(0, 10);

    if (data.stats.lastSessionDate !== today) {
      // check if yesterday
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (data.stats.lastSessionDate === yesterday) {
        data.stats.currentStreak++;
      } else if (data.stats.lastSessionDate !== today) {
        data.stats.currentStreak = 1;
      }
      data.stats.lastSessionDate = today;
    }

    data.stats.totalSessions++;
    save(data);
  }

  function getDayStreak() {
    const data = load();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (data.stats.lastSessionDate === today || data.stats.lastSessionDate === yesterday) {
      return data.stats.currentStreak || 0;
    }
    return 0; // streak broken
  }

  /* --- Export / Import --- */

  function exportProgress() {
    const data = load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "glossolalia-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProgress(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.version && data.words) {
        save(data);
        return true;
      }
    } catch (e) { /* invalid JSON */ }
    return false;
  }

  function resetProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* silent */ }
  }

  /* --- Progress card rendering --- */

  function getWordStatus(entry, sourceLang, targetLang) {
    const data = load();
    const key = makeKey(entry, sourceLang, targetLang);
    const rec = data.words[key];
    const now = Date.now();
    if (!rec) return "new";
    if (rec.streak >= 5 && rec.nextReview > now) return "mastered";
    if (rec.nextReview <= now) return "due";
    return "learning";
  }

  function getWordRecord(entry, sourceLang, targetLang) {
    const data = load();
    const key = makeKey(entry, sourceLang, targetLang);
    return data.words[key] || null;
  }

  function renderProgressCard() {
    const el = document.getElementById("progress-card");
    if (!el) return;

    const summary = getProgressSummary(state.topic, state.sourceLang, state.targetLang);
    const streak = getDayStreak();

    const pctNew = summary.total ? (summary.newCount / summary.total) * 100 : 100;
    const pctDue = summary.total ? (summary.dueCount / summary.total) * 100 : 0;
    const pctLearning = summary.total ? (summary.learningCount / summary.total) * 100 : 0;
    const pctMastered = summary.total ? (summary.masteredCount / summary.total) * 100 : 0;

    // Build per-word detail list
    const words = getAvailableWords(state.topic, state.sourceLang, state.targetLang);
    const wordRows = words.map(w => {
      const status = getWordStatus(w.entry, state.sourceLang, state.targetLang);
      const rec = getWordRecord(w.entry, state.sourceLang, state.targetLang);
      const tgt = w.data[state.targetLang].translation;
      const stars = rec ? Math.min(rec.streak, 5) : 0;
      const starStr = "\u2B50".repeat(stars) + "\u2606".repeat(5 - stars);
      const pct = rec ? Math.round((rec.correct / Math.max(rec.correct + rec.incorrect, 1)) * 100) : 0;
      return `<div class="word-detail-row">
        <img src="${w.image}" alt="${w.entry}" class="word-detail-img">
        <div class="word-detail-text">
          <span class="word-detail-entry">${w.entry}</span>
          <span class="word-detail-tgt">${tgt}</span>
        </div>
        <div class="word-detail-meta">
          <span class="word-detail-stars">${starStr}</span>
          <span class="dot dot-${status}"></span>
        </div>
      </div>`;
    }).join("");

    el.innerHTML = `
      <div class="progress-card-header" id="progress-toggle" title="Click to expand">
        <div class="progress-card-label">Your Progress</div>
        ${streak > 0 ? `<div class="streak-badge">\uD83D\uDD25 ${streak}-day streak</div>` : ""}
        <div class="progress-stacked-bar">
          <div class="bar-mastered" style="width:${pctMastered}%" title="Mastered"></div>
          <div class="bar-learning" style="width:${pctLearning}%" title="Learning"></div>
          <div class="bar-due" style="width:${pctDue}%" title="Due"></div>
          <div class="bar-new" style="width:${pctNew}%" title="New"></div>
        </div>
        <div class="progress-legend">
          <span class="legend-item"><span class="dot dot-new"></span>${summary.newCount} new</span>
          <span class="legend-item"><span class="dot dot-due"></span>${summary.dueCount} due</span>
          <span class="legend-item"><span class="dot dot-learning"></span>${summary.learningCount} learning</span>
          <span class="legend-item"><span class="dot dot-mastered"></span>${summary.masteredCount} mastered</span>
        </div>
        <div class="progress-expand-hint" id="expand-hint">\u25BC details</div>
      </div>
      <div class="progress-details" id="progress-details">
        <div class="progress-lang-label">${state.sourceLang} \u2192 ${state.targetLang}</div>
        ${wordRows}
        ${summary.dueCount > 0 ? `<button class="btn btn-sm" id="review-due-btn" style="margin-top:0.6rem;">Review ${summary.dueCount} Due</button>` : ""}
      </div>`;

    document.getElementById("progress-toggle").addEventListener("click", () => {
      const details = document.getElementById("progress-details");
      const hint = document.getElementById("expand-hint");
      details.classList.toggle("open");
      hint.textContent = details.classList.contains("open") ? "\u25B2 hide" : "\u25BC details";
    });

    const reviewBtn = document.getElementById("review-due-btn");
    if (reviewBtn) {
      reviewBtn.addEventListener("click", () => {
        navigate("quiz");
      });
    }
  }

  /* --- Settings modal --- */

  function renderSettingsModal() {
    let modal = document.getElementById("settings-modal");
    if (modal) { modal.classList.toggle("open"); return; }

    modal = document.createElement("div");
    modal.id = "settings-modal";
    modal.className = "settings-modal open";
    modal.innerHTML = `
      <div class="settings-overlay"></div>
      <div class="settings-panel">
        <h3>Settings</h3>
        <button class="btn btn-sm" id="export-btn">Export Progress</button>
        <label class="btn btn-sm btn-outline import-label">
          Import Progress
          <input type="file" id="import-input" accept=".json" hidden>
        </label>
        <button class="btn btn-sm btn-outline" id="reset-btn" style="color:var(--red);border-color:var(--red);">Reset Progress</button>
        <div id="settings-status" class="settings-status"></div>
        <button class="btn btn-sm btn-outline" id="close-settings">Close</button>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById("export-btn").addEventListener("click", () => {
      exportProgress();
      document.getElementById("settings-status").textContent = "Progress exported!";
    });

    document.getElementById("import-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (importProgress(reader.result)) {
          document.getElementById("settings-status").textContent = "Progress imported!";
          renderProgressCard();
        } else {
          document.getElementById("settings-status").textContent = "Invalid file.";
        }
      };
      reader.readAsText(file);
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
      if (confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
        resetProgress();
        document.getElementById("settings-status").textContent = "Progress reset.";
        renderProgressCard();
      }
    });

    document.querySelector(".settings-overlay").addEventListener("click", () => modal.classList.remove("open"));
    document.getElementById("close-settings").addEventListener("click", () => modal.classList.remove("open"));
  }

  return {
    recordOutcome,
    getWordPriority,
    prioritizeDeck,
    getProgressSummary,
    getDayStreak,
    updateSessionStats,
    exportProgress,
    importProgress,
    resetProgress,
    renderProgressCard,
    renderSettingsModal
  };
})();
