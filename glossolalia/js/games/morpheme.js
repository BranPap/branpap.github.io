const Builder = (() => {
  let words, index, score, results;

  function start() {
    const available = getAvailableWords(state.topic, state.sourceLang, state.targetLang);
    words = Progress.prioritizeDeck(available, state.sourceLang, state.targetLang).slice(0, Math.min(10, available.length));
    index = 0;
    score = 0;
    results = [];

    // persistent shell
    const area = document.getElementById("builder-content");
    area.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-fill" id="builder-progress" style="width:0%"></div>
      </div>
      <div class="score-bar" id="builder-score">Score: <span>0</span> / ${words.length}</div>
      <div class="builder-area" id="builder-area"></div>`;

    renderWord(false);
  }

  function renderWord(animate) {
    const builderArea = document.getElementById("builder-area");

    if (index >= words.length) {
      document.getElementById("builder-progress").style.width = "100%";
      setTimeout(() => {
        showResults("builder-content", {
          title: "Word Builder Complete!",
          score,
          total: words.length,
          words: results,
          onReplay: start
        });
      }, 400);
      return;
    }

    // update persistent elements
    document.getElementById("builder-progress").style.width =
      `${(index / words.length) * 100}%`;
    document.getElementById("builder-score").innerHTML =
      `Score: <span>${score}</span> / ${words.length}`;

    const word = words[index];
    const src = word.data[state.sourceLang].translation;
    const tgtData = word.data[state.targetLang];
    const tgt = tgtData.translation;
    const morphemes = tgtData.morph;

    // create distractors from other words' morphemes
    const allMorphs = getAvailableWords(state.topic, state.sourceLang, state.targetLang)
      .filter(w => w.entry !== word.entry)
      .flatMap(w => w.data[state.targetLang].morph);
    const distractors = shuffle(allMorphs).slice(0, Math.min(2, allMorphs.length));
    const bank = shuffle([...morphemes, ...distractors]);

    let placed = [];
    let checked = false;

    function populateContent() {
      builderArea.innerHTML = `
        <img src="${word.image}" alt="${word.entry}">
        <p class="builder-prompt">Build <strong>${src}</strong> in ${state.targetLang}:</p>
        <div class="build-zone" id="build-zone"></div>
        <div class="morph-bank" id="morph-bank">
          ${bank.map((m, i) => `<span class="morph-piece" data-morph="${m}" data-idx="${i}">${m}</span>`).join("")}
        </div>
        <div class="builder-feedback" id="builder-feedback"></div>
        <button class="btn" id="builder-check">Check</button>`;

      requestAnimationFrame(() => {
        builderArea.classList.remove("builder-exit");
        builderArea.classList.add("builder-enter");
      });

      // click to place
      document.querySelectorAll("#morph-bank .morph-piece").forEach(el => {
        el.addEventListener("click", () => {
          if (el.classList.contains("placed") || checked) return;
          el.classList.add("placed");
          placed.push({ morph: el.dataset.morph, idx: el.dataset.idx });
          renderZone();
        });
      });

      function renderZone() {
        const zone = document.getElementById("build-zone");
        zone.innerHTML = placed.map((p, i) =>
          `<span class="morph-piece in-zone" data-pos="${i}">${p.morph}</span>`
        ).join("");

        zone.querySelectorAll(".morph-piece").forEach(el => {
          el.addEventListener("click", () => {
            if (checked) return;
            const pos = parseInt(el.dataset.pos);
            const removed = placed[pos];
            placed.splice(pos, 1);
            const bankPiece = document.querySelector(`#morph-bank .morph-piece[data-idx="${removed.idx}"]`);
            if (bankPiece) bankPiece.classList.remove("placed");
            renderZone();
          });
        });
      }

      document.getElementById("builder-check").addEventListener("click", function handler() {
        if (checked) {
          // this is "Next" click
          index++;
          renderWord(true);
          return;
        }

        checked = true;
        const built = placed.map(p => p.morph).join("");
        const isCorrect = built === tgt;

        const zone = document.getElementById("build-zone");
        const feedback = document.getElementById("builder-feedback");

        if (isCorrect) {
          score++;
          zone.classList.add("correct");
          feedback.textContent = "Correct!";
          feedback.style.color = "var(--green)";
          document.getElementById("builder-score").innerHTML =
            `Score: <span>${score}</span> / ${words.length}`;
        } else {
          zone.classList.add("incorrect");
          feedback.textContent = `Answer: ${tgt}`;
          feedback.style.color = "var(--red)";
        }

        results.push({ entry: word.entry, foreign: tgt, native: src, correct: isCorrect });

        document.getElementById("builder-check").textContent = "Next";
      });
    }

    if (animate) {
      builderArea.classList.add("builder-exit");
      builderArea.classList.remove("builder-enter");
      setTimeout(populateContent, 250);
    } else {
      populateContent();
    }
  }

  return { start };
})();
