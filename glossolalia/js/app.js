/* ===== APP STATE ===== */
const state = {
  sourceLang: "English",
  targetLang: "Finnish",
  topic: "animals",
  currentGame: null
};

/* ===== ROUTER ===== */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function navigate(screen) {
  window.location.hash = screen;
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || "home";
  showScreen("screen-" + hash);

  // hide lang bar and header when in a game
  const inGame = hash !== "home";
  document.querySelector(".lang-bar").style.display = inGame ? "none" : "";
  document.querySelector(".app-header").style.display = inGame ? "none" : "";

  // scroll to top
  window.scrollTo(0, 0);

  // launch game or refresh home
  if (hash === "home") { refreshSpotlight(); Progress.renderProgressCard(); }
  else if (hash === "flashcards") Flashcards.start();
  else if (hash === "quiz") Quiz.start();
  else if (hash === "memory") Memory.start();
  else if (hash === "spelling") Spelling.start();
  else if (hash === "builder") Builder.start();
  else if (hash === "speed") SpeedRound.start();
  else if (hash === "hangman") Hangman.start();
}

window.addEventListener("hashchange", handleRoute);

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  // language selectors
  const srcSelect = document.getElementById("source-lang");
  const tgtSelect = document.getElementById("target-lang");

  LANGUAGES.forEach(lang => {
    srcSelect.add(new Option(lang, lang));
    tgtSelect.add(new Option(lang, lang));
  });

  srcSelect.value = state.sourceLang;
  tgtSelect.value = state.targetLang;

  srcSelect.addEventListener("change", () => { state.sourceLang = srcSelect.value; updateWordCount(); });
  tgtSelect.addEventListener("change", () => { state.targetLang = tgtSelect.value; updateWordCount(); });

  // swap button
  document.getElementById("swap-langs").addEventListener("click", () => {
    [state.sourceLang, state.targetLang] = [state.targetLang, state.sourceLang];
    srcSelect.value = state.sourceLang;
    tgtSelect.value = state.targetLang;
    updateWordCount();
  });

  // game card clicks
  document.querySelectorAll(".game-card").forEach(card => {
    card.addEventListener("click", () => {
      const game = card.dataset.game;
      if (state.sourceLang === state.targetLang) {
        alert("Please select different source and target languages.");
        return;
      }
      if (getAvailableWords(state.topic, state.sourceLang, state.targetLang).length === 0) {
        alert("No words available for this language pair.");
        return;
      }
      navigate(game);
    });
  });

  updateWordCount();
  handleRoute();
});

function updateWordCount() {
  const count = getAvailableWords(state.topic, state.sourceLang, state.targetLang).length;
  const el = document.getElementById("word-count");
  if (!el) return;
  const summary = Progress.getProgressSummary(state.topic, state.sourceLang, state.targetLang);
  if (summary.dueCount > 0) {
    el.textContent = `${count} words \u00b7 ${summary.dueCount} due for review`;
  } else {
    el.textContent = `${count} words available`;
  }
}

/* ===== SHARED HELPERS ===== */
function goHome() {
  navigate("home");
}

function showResults(containerId, { title, score, total, words, onReplay, onHome }) {
  // Record outcomes for progression tracking
  if (words && words.length) {
    words.forEach(w => {
      if (w.entry) {
        Progress.recordOutcome(w.entry, state.sourceLang, state.targetLang, w.correct);
      }
    });
    Progress.updateSessionStats();
  }

  const container = document.getElementById(containerId);
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  let wordListHTML = "";
  if (words && words.length) {
    wordListHTML = `<ul class="results-words">` +
      words.map(w => `
        <li>
          <span class="word-pair"><span class="foreign">${w.foreign}</span> = ${w.native}</span>
          <span class="word-result ${w.correct ? 'right' : 'wrong'}">${w.correct ? '\u2713' : '\u2717'}</span>
        </li>`).join("") +
      `</ul>`;
  }

  container.innerHTML = `
    <div class="results-area">
      <h2>${title || 'Round Complete!'}</h2>
      <p class="results-score">Score: <span>${score}</span> / ${total} (${pct}%)</p>
      ${wordListHTML}
      <div class="results-actions">
        <button class="btn" id="results-replay">Play Again</button>
        <button class="btn btn-outline" id="results-home">Home</button>
      </div>
    </div>`;

  document.getElementById("results-replay").addEventListener("click", onReplay);
  document.getElementById("results-home").addEventListener("click", onHome || goHome);
}

/* ===== WORD SPOTLIGHT ===== */
function refreshSpotlight() {
  const el = document.getElementById("word-spotlight");
  if (!el) return;

  const allWords = VOCAB.animals;
  const word = allWords[Math.floor(Math.random() * allWords.length)];
  const nonEnglish = LANGUAGES.filter(l => l !== "English" && word.data[l]);
  const lang = nonEnglish[Math.floor(Math.random() * nonEnglish.length)];
  const translation = word.data[lang].translation;

  el.innerHTML = `
    <div class="spotlight-label">Word Spotlight</div>
    <img src="${word.image}" alt="${word.entry}">
    <div class="spotlight-english">${word.entry}</div>
    <div class="spotlight-arrow">\u2193</div>
    <div class="spotlight-translation">${translation}</div>
    <div class="spotlight-lang">${lang}</div>`;

  // re-trigger animation
  el.style.animation = "none";
  el.offsetHeight; // force reflow
  el.style.animation = "";
}
