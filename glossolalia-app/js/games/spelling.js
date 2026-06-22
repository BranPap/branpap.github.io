const Spelling = (() => {
  let words, index, score, results;

  function start() {
    const available = getAvailableWords(state.topic, state.sourceLang, state.targetLang);
    words = Progress.prioritizeDeck(available, state.sourceLang, state.targetLang).slice(0, Math.min(10, available.length));
    index = 0;
    score = 0;
    results = [];

    // persistent shell
    const area = document.getElementById("spelling-content");
    area.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-fill" id="spelling-progress" style="width:0%"></div>
      </div>
      <div class="score-bar" id="spelling-score">Score: <span>0</span> / ${words.length}</div>
      <div class="spelling-area" id="spelling-area"></div>`;

    renderWord(false);
  }

  function renderWord(animate) {
    const spellingArea = document.getElementById("spelling-area");

    if (index >= words.length) {
      document.getElementById("spelling-progress").style.width = "100%";
      setTimeout(() => {
        showResults("spelling-content", {
          title: "Spelling Complete!",
          score,
          total: words.length,
          words: results,
          onReplay: start
        });
      }, 400);
      return;
    }

    // update persistent elements
    document.getElementById("spelling-progress").style.width =
      `${(index / words.length) * 100}%`;
    document.getElementById("spelling-score").innerHTML =
      `Score: <span>${score}</span> / ${words.length}`;

    const word = words[index];
    const src = word.data[state.sourceLang].translation;
    const tgt = word.data[state.targetLang].translation;
    let submitted = false;

    function populateContent() {
      spellingArea.innerHTML = `
        <img src="${word.image}" alt="${word.entry}">
        <p class="spelling-prompt">Spell <strong>${src}</strong> in ${state.targetLang}:</p>
        <input type="text" class="spelling-input" id="spell-input" autocomplete="off" autofocus>
        <div class="spelling-feedback" id="spell-feedback"></div>
        <div class="spelling-answer" id="spell-answer"></div>
        <button class="btn" id="spell-submit">Check</button>`;

      requestAnimationFrame(() => {
        spellingArea.classList.remove("spelling-exit");
        spellingArea.classList.add("spelling-enter");
      });

      const input = document.getElementById("spell-input");
      const submitBtn = document.getElementById("spell-submit");

      function handleClick() {
        if (submitted) {
          // "Next" click
          index++;
          renderWord(true);
          return;
        }

        const answer = input.value.trim();
        if (!answer) return;
        submitted = true;

        const isCorrect = answer.toLowerCase() === tgt.toLowerCase();

        if (isCorrect) {
          score++;
          input.classList.add("correct");
          document.getElementById("spell-feedback").textContent = "Correct!";
          document.getElementById("spell-feedback").style.color = "var(--green)";
          document.getElementById("spelling-score").innerHTML =
            `Score: <span>${score}</span> / ${words.length}`;
        } else {
          input.classList.add("incorrect");
          document.getElementById("spell-feedback").textContent = "Not quite!";
          document.getElementById("spell-feedback").style.color = "var(--red)";
          document.getElementById("spell-answer").textContent = `Answer: ${tgt}`;
        }

        results.push({ entry: word.entry, foreign: tgt, native: src, correct: isCorrect });
        submitBtn.textContent = "Next";
        input.disabled = true;
      }

      submitBtn.addEventListener("click", handleClick);
      input.addEventListener("keydown", e => {
        if (e.key === "Enter") handleClick();
      });
      setTimeout(() => input.focus(), 100);
    }

    if (animate) {
      spellingArea.classList.add("spelling-exit");
      spellingArea.classList.remove("spelling-enter");
      setTimeout(populateContent, 250);
    } else {
      populateContent();
    }
  }

  return { start };
})();
