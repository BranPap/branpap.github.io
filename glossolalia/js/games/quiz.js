const Quiz = (() => {
  let questions, qIndex, score, results;

  function start() {
    const words = getAvailableWords(state.topic, state.sourceLang, state.targetLang);
    const selected = Progress.prioritizeDeck(words, state.sourceLang, state.targetLang).slice(0, Math.min(10, words.length));

    questions = selected.map(word => {
      const correct = word.data[state.targetLang].translation;
      const distractors = shuffle(
        words.filter(w => w.entry !== word.entry && w.data[state.targetLang])
          .map(w => w.data[state.targetLang].translation)
      ).slice(0, 3);

      return {
        word,
        correct,
        source: word.data[state.sourceLang].translation,
        choices: shuffle([correct, ...distractors])
      };
    });

    qIndex = 0;
    score = 0;
    results = [];

    // set up persistent shell with progress bar
    const area = document.getElementById("quiz-content");
    area.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-fill" id="quiz-progress" style="width:0%"></div>
      </div>
      <div class="score-bar" id="quiz-score">Score: <span>0</span> / ${questions.length}</div>
      <div class="quiz-area" id="quiz-area"></div>`;

    renderQuestion(false);
  }

  function renderQuestion(animate) {
    const quizArea = document.getElementById("quiz-area");

    if (qIndex >= questions.length) {
      // animate progress to 100% then show results
      document.getElementById("quiz-progress").style.width = "100%";
      setTimeout(() => {
        showResults("quiz-content", {
          title: "Quiz Complete!",
          score,
          total: questions.length,
          words: results,
          onReplay: start
        });
      }, 400);
      return;
    }

    // update progress bar smoothly
    document.getElementById("quiz-progress").style.width =
      `${(qIndex / questions.length) * 100}%`;
    document.getElementById("quiz-score").innerHTML =
      `Score: <span>${score}</span> / ${questions.length}`;

    const q = questions[qIndex];

    function populateContent() {
      quizArea.innerHTML = `
        <img src="${q.word.image}" alt="${q.word.entry}">
        <p class="quiz-prompt">What is <strong>${q.source}</strong> in ${state.targetLang}?</p>
        <div class="quiz-choices">
          ${q.choices.map(c => `<button class="quiz-choice" data-answer="${c}">${c}</button>`).join("")}
        </div>
        <div class="quiz-feedback" id="quiz-feedback"></div>`;

      // fade in
      requestAnimationFrame(() => {
        quizArea.classList.remove("quiz-exit");
        quizArea.classList.add("quiz-enter");
      });

      document.querySelectorAll(".quiz-choice").forEach(btn => {
        btn.addEventListener("click", () => handleAnswer(btn, q));
      });
    }

    if (animate) {
      // fade out, then swap content, then fade in
      quizArea.classList.add("quiz-exit");
      quizArea.classList.remove("quiz-enter");
      setTimeout(populateContent, 250);
    } else {
      populateContent();
    }
  }

  function handleAnswer(btn, q) {
    const chosen = btn.dataset.answer;
    const isCorrect = chosen === q.correct;

    if (isCorrect) {
      score++;
      btn.classList.add("correct");
      document.getElementById("quiz-feedback").textContent = "Correct!";
      document.getElementById("quiz-feedback").style.color = "var(--green)";
      document.getElementById("quiz-score").innerHTML =
        `Score: <span>${score}</span> / ${questions.length}`;
    } else {
      btn.classList.add("incorrect");
      document.querySelector(`.quiz-choice[data-answer="${CSS.escape(q.correct)}"]`).classList.add("correct");
      document.getElementById("quiz-feedback").textContent = `It was: ${q.correct}`;
      document.getElementById("quiz-feedback").style.color = "var(--red)";
    }

    results.push({
      entry: q.word.entry,
      foreign: q.correct,
      native: q.source,
      correct: isCorrect
    });

    document.querySelectorAll(".quiz-choice").forEach(b => b.classList.add("disabled"));

    setTimeout(() => { qIndex++; renderQuestion(true); }, 1200);
  }

  return { start };
})();
