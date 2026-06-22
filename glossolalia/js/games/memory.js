const Memory = (() => {
  let cards, flipped, matched, moves, lockBoard;

  function start() {
    const words = getAvailableWords(state.topic, state.sourceLang, state.targetLang);
    const selected = pickRandom(words, Math.min(6, words.length));

    // create pairs: one image card + one word card per word
    const pairs = [];
    selected.forEach((word, i) => {
      pairs.push({ id: i, type: "image", image: word.image, entry: word.entry, label: "" });
      pairs.push({ id: i, type: "word",  image: null, entry: word.entry, label: word.data[state.targetLang].translation });
    });

    cards = shuffle(pairs);
    flipped = [];
    matched = 0;
    moves = 0;
    lockBoard = false;
    render();
  }

  function render() {
    const area = document.getElementById("memory-content");
    const total = cards.length / 2;

    area.innerHTML = `
      <div class="memory-stats">
        <div>Moves: <span id="mem-moves">${moves}</span></div>
        <div>Matched: <span id="mem-matched">${matched}</span> / ${total}</div>
      </div>
      <div class="memory-grid" id="memory-grid">
        ${cards.map((card, idx) => `
          <div class="memory-card" data-idx="${idx}" data-id="${card.id}">
            <div class="memory-card-inner">
              <div class="memory-card-front">?</div>
              <div class="memory-card-back">
                ${card.type === "image"
                  ? `<img src="${card.image}" alt="${card.entry}">`
                  : `<span class="card-label">${card.label}</span>`}
              </div>
            </div>
          </div>`).join("")}
      </div>`;

    document.querySelectorAll(".memory-card").forEach(el => {
      el.addEventListener("click", () => flipCard(el));
    });
  }

  function flipCard(el) {
    if (lockBoard) return;
    if (el.classList.contains("flipped") || el.classList.contains("matched")) return;

    el.classList.add("flipped");
    flipped.push(el);

    if (flipped.length === 2) {
      moves++;
      document.getElementById("mem-moves").textContent = moves;
      checkMatch();
    }
  }

  function checkMatch() {
    lockBoard = true;
    const [a, b] = flipped;
    const idA = parseInt(a.dataset.id);
    const idB = parseInt(b.dataset.id);

    if (idA === idB) {
      a.classList.add("matched");
      b.classList.add("matched");
      matched++;
      document.getElementById("mem-matched").textContent = matched;
      flipped = [];
      lockBoard = false;

      if (matched === cards.length / 2) {
        setTimeout(() => {
          showResults("memory-content", {
            title: "All Matched!",
            score: cards.length / 2,
            total: cards.length / 2,
            words: [],
            onReplay: start
          });
        }, 500);
      }
    } else {
      setTimeout(() => {
        a.classList.remove("flipped");
        b.classList.remove("flipped");
        flipped = [];
        lockBoard = false;
      }, 800);
    }
  }

  return { start };
})();
