const Flashcards = (() => {
  let deck, index, known, unknown;

  function start() {
    const words = getAvailableWords(state.topic, state.sourceLang, state.targetLang);
    deck = shuffle(words);
    index = 0;
    known = 0;
    unknown = 0;
    renderCard();
  }

  function renderCard() {
    const area = document.getElementById("flashcard-content");

    if (index >= deck.length) {
      showResults("flashcard-content", {
        title: "Flashcards Complete!",
        score: known,
        total: deck.length,
        words: deck.map((w, i) => ({
          entry: w.entry,
          foreign: w.data[state.targetLang].translation,
          native: w.data[state.sourceLang].translation,
          correct: true // flashcards don't track right/wrong per card in this mode
        })),
        onReplay: start
      });
      return;
    }

    const word = deck[index];
    const src = word.data[state.sourceLang].translation;
    const tgt = word.data[state.targetLang].translation;

    area.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-fill" style="width:${(index / deck.length) * 100}%"></div>
      </div>
      <div class="score-bar">Known: <span>${known}</span> | Learning: <span>${unknown}</span> | Remaining: <span>${deck.length - index}</span></div>
      <div class="flashcard-area">
        <div class="flashcard" id="the-flashcard">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <img src="${word.image}" alt="${word.entry}">
              <div class="flashcard-word">${src}</div>
              <div class="flashcard-hint">tap to reveal</div>
            </div>
            <div class="flashcard-back">
              <img src="${word.image}" alt="${word.entry}">
              <div class="flashcard-word">${tgt}</div>
              <div class="flashcard-hint">${src}</div>
            </div>
          </div>
        </div>
        <div class="flashcard-actions">
          <button class="btn btn-incorrect btn-sm" id="fc-unknown">Still Learning</button>
          <button class="btn btn-correct btn-sm" id="fc-known">Got It!</button>
        </div>
      </div>`;

    document.getElementById("the-flashcard").addEventListener("click", () => {
      document.getElementById("the-flashcard").classList.toggle("flipped");
    });

    document.getElementById("fc-known").addEventListener("click", () => { known++; index++; renderCard(); });
    document.getElementById("fc-unknown").addEventListener("click", () => { unknown++; index++; renderCard(); });
  }

  return { start };
})();
