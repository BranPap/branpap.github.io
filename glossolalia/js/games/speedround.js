const SpeedRound = (() => {
  let words, score, combo, maxCombo, correct, total, timer, timeLeft, animFrame;
  const DURATION = 60;

  function start() {
    words = getAvailableWords(state.topic, state.sourceLang, state.targetLang);
    if (words.length < 4) return;

    score = 0;
    combo = 0;
    maxCombo = 0;
    correct = 0;
    total = 0;
    timeLeft = DURATION;

    const area = document.getElementById("speed-content");
    area.innerHTML = `
      <div class="speed-hud">
        <div class="speed-timer" id="speed-timer">
          <span class="timer-num" id="timer-num">${DURATION}</span>
          <span class="timer-label">sec</span>
        </div>
        <div class="speed-score-wrap">
          <div class="speed-score" id="speed-score">0</div>
          <div class="speed-combo" id="speed-combo"></div>
        </div>
      </div>
      <div class="speed-timer-bar">
        <div class="speed-timer-fill" id="speed-timer-fill"></div>
      </div>
      <div class="speed-arena" id="speed-arena"></div>`;

    nextQuestion();
    startTimer();
  }

  function startTimer() {
    const startTime = Date.now();
    const fill = document.getElementById("speed-timer-fill");
    const num = document.getElementById("timer-num");

    function tick() {
      const elapsed = (Date.now() - startTime) / 1000;
      timeLeft = Math.max(0, DURATION - elapsed);

      num.textContent = Math.ceil(timeLeft);
      fill.style.width = `${(timeLeft / DURATION) * 100}%`;

      // color shifts as time runs out
      if (timeLeft < 10) {
        fill.style.background = "var(--red)";
        num.style.color = "var(--red)";
      } else if (timeLeft < 20) {
        fill.style.background = "#f0a030";
      }

      if (timeLeft <= 0) {
        endGame();
        return;
      }
      animFrame = requestAnimationFrame(tick);
    }
    animFrame = requestAnimationFrame(tick);
  }

  function nextQuestion() {
    const arena = document.getElementById("speed-arena");
    if (!arena) return;

    const word = words[Math.floor(Math.random() * words.length)];
    const correctAnswer = word.data[state.targetLang].translation;
    const distractors = shuffle(
      words.filter(w => w.entry !== word.entry)
        .map(w => w.data[state.targetLang].translation)
    ).slice(0, 3);
    const choices = shuffle([correctAnswer, ...distractors]);

    arena.innerHTML = `
      <div class="speed-question">
        <img src="${word.image}" alt="${word.entry}" class="speed-img">
        <div class="speed-word">${word.data[state.sourceLang].translation}</div>
      </div>
      <div class="speed-choices">
        ${choices.map(c => `<button class="speed-choice" data-answer="${c}">${c}</button>`).join("")}
      </div>`;

    arena.querySelectorAll(".speed-choice").forEach(btn => {
      btn.addEventListener("click", () => handleChoice(btn, correctAnswer, word));
    });
  }

  function handleChoice(btn, correctAnswer, word) {
    total++;
    const isCorrect = btn.dataset.answer === correctAnswer;

    if (isCorrect) {
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      correct++;

      // combo multiplier: 1x, 2x at 3+, 3x at 6+, 5x at 10+
      let mult = 1;
      if (combo >= 10) mult = 5;
      else if (combo >= 6) mult = 3;
      else if (combo >= 3) mult = 2;

      const points = 100 * mult;
      score += points;

      btn.classList.add("speed-correct");
      showFloater(`+${points}`, combo >= 3);
      updateHUD();

      // record for progression
      Progress.recordOutcome(word.entry, state.sourceLang, state.targetLang, true);
    } else {
      combo = 0;
      btn.classList.add("speed-wrong");
      document.querySelector(`.speed-choice[data-answer="${CSS.escape(correctAnswer)}"]`)?.classList.add("speed-correct");
      showFloater("miss", false);
      updateHUD();

      Progress.recordOutcome(word.entry, state.sourceLang, state.targetLang, false);
    }

    // brief pause then next
    document.querySelectorAll(".speed-choice").forEach(b => b.style.pointerEvents = "none");
    setTimeout(nextQuestion, isCorrect ? 400 : 800);
  }

  function showFloater(text, isCombo) {
    const arena = document.getElementById("speed-arena");
    const floater = document.createElement("div");
    floater.className = "speed-floater" + (isCombo ? " combo" : "");
    floater.textContent = text;
    arena.appendChild(floater);
    setTimeout(() => floater.remove(), 800);
  }

  function updateHUD() {
    document.getElementById("speed-score").textContent = score;
    const comboEl = document.getElementById("speed-combo");
    if (combo >= 3) {
      let mult = combo >= 10 ? 5 : combo >= 6 ? 3 : 2;
      comboEl.textContent = `${combo}x combo! (${mult}x pts)`;
      comboEl.className = "speed-combo active";
    } else {
      comboEl.textContent = "";
      comboEl.className = "speed-combo";
    }
  }

  function endGame() {
    cancelAnimationFrame(animFrame);
    Progress.updateSessionStats();

    const area = document.getElementById("speed-content");
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // grade
    let grade, gradeColor;
    if (score >= 3000) { grade = "S"; gradeColor = "gold"; }
    else if (score >= 2000) { grade = "A"; gradeColor = "var(--green)"; }
    else if (score >= 1200) { grade = "B"; gradeColor = "var(--blue)"; }
    else if (score >= 600) { grade = "C"; gradeColor = "var(--purple)"; }
    else { grade = "D"; gradeColor = "var(--text-light)"; }

    area.innerHTML = `
      <div class="speed-results">
        <div class="speed-grade" style="color:${gradeColor}">${grade}</div>
        <h2>Time's Up!</h2>
        <div class="speed-final-score">${score} pts</div>
        <div class="speed-stats">
          <div><strong>${correct}</strong> / ${total} correct (${accuracy}%)</div>
          <div>Max combo: <strong>${maxCombo}x</strong></div>
        </div>
        <div class="results-actions">
          <button class="btn" id="speed-replay">Go Again</button>
          <button class="btn btn-outline" id="speed-home">Home</button>
        </div>
      </div>`;

    document.getElementById("speed-replay").addEventListener("click", start);
    document.getElementById("speed-home").addEventListener("click", goHome);
  }

  return { start };
})();
