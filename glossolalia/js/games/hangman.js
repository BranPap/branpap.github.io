const Hangman = (() => {
  let words, wordIndex, currentWord, targetWord, guessed, wrongCount, maxWrong, score, results, lastGuessed;

  // Full alphabets per language — covers all characters a learner might need
  const ALPHABETS = {
    Finnish:  "abcdefghijklmnopqrstuvwxyz\u00e4\u00f6".split(""),
    Spanish:  "abcdefghijklmn\u00f1opqrstuvwxyz\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc".split(""),
    Cornish:  "abcdefghijklmnopqrstuvwxyz".split(""),
    Polish:   "abcdefghijklmnopqrstuvwxyz\u0105\u0107\u0119\u0142\u0144\u00f3\u015b\u017a\u017c".split(""),
    English:  "abcdefghijklmnopqrstuvwxyz".split("")
  };

  const STAGES = [
    // each stage: [emoji, label] — progressively worse
    ["\u{1F600}", "All good!"],
    ["\u{1F610}", "Uh oh..."],
    ["\u{1F61F}", "Getting worried..."],
    ["\u{1F630}", "Nervous!"],
    ["\u{1F628}", "Yikes!"],
    ["\u{1F631}", "AAAH!"],
    ["\u{1F635}", "Game over!"]
  ];

  function start() {
    const available = getAvailableWords(state.topic, state.sourceLang, state.targetLang);
    words = shuffle(available).slice(0, Math.min(8, available.length));
    wordIndex = 0;
    score = 0;
    maxWrong = STAGES.length - 1;
    results = [];

    const area = document.getElementById("hangman-content");
    area.innerHTML = `
      <div class="score-bar" id="hangman-score">Word <span>1</span> / ${words.length}</div>
      <div class="hangman-area" id="hangman-area"></div>`;

    renderWord();
  }

  function renderWord() {
    if (wordIndex >= words.length) {
      showResults("hangman-content", {
        title: "Hangman Complete!",
        score,
        total: words.length,
        words: results,
        onReplay: start
      });
      return;
    }

    currentWord = words[wordIndex];
    targetWord = currentWord.data[state.targetLang].translation.toLowerCase();
    guessed = new Set();
    wrongCount = 0;
    lastGuessed = null;

    document.getElementById("hangman-score").innerHTML =
      `Word <span>${wordIndex + 1}</span> / ${words.length}`;

    renderBoard();
  }

  function renderBoard() {
    const area = document.getElementById("hangman-area");
    const stage = STAGES[Math.min(wrongCount, STAGES.length - 1)];
    const isLost = wrongCount >= maxWrong;
    const isWon = [...targetWord].every(ch => ch === " " || ch === "-" || guessed.has(ch));
    const gameOver = isLost || isWon;

    // Build the word display — only animate the letter that was JUST guessed
    const wordDisplay = [...targetWord].map(ch => {
      if (ch === " ") return '<span class="hangman-letter space"> </span>';
      if (ch === "-") return '<span class="hangman-letter">-</span>';
      if (guessed.has(ch)) {
        const justRevealed = ch === lastGuessed;
        return `<span class="hangman-letter revealed${justRevealed ? ' pop' : ''}">${ch}</span>`;
      }
      if (isLost) return `<span class="hangman-letter missed">${ch}</span>`;
      return '<span class="hangman-letter blank">_</span>';
    }).join("");

    // Build keyboard — full alphabet for the target language
    const sortedLetters = ALPHABETS[state.targetLang] || ALPHABETS.English;

    const keyboard = sortedLetters.map(ch => {
      const used = guessed.has(ch);
      const inWord = targetWord.includes(ch);
      let cls = "hangman-key";
      if (used && inWord) cls += " correct";
      else if (used && !inWord) cls += " wrong";
      if (used || gameOver) cls += " disabled";
      return `<button class="${cls}" data-letter="${ch}"${used || gameOver ? " disabled" : ""}>${ch}</button>`;
    }).join("");

    area.innerHTML = `
      <div class="hangman-stage">
        <div class="hangman-emoji">${stage[0]}</div>
        <div class="hangman-lives">${"\u2764\uFE0F".repeat(maxWrong - wrongCount)}${"\u{1F5A4}".repeat(wrongCount)}</div>
      </div>
      <div class="hangman-clue">
        <img src="${currentWord.image}" alt="?" class="hangman-img">
        <div class="hangman-source">${currentWord.data[state.sourceLang].translation}</div>
      </div>
      <div class="hangman-word">${wordDisplay}</div>
      ${gameOver ? `
        <div class="hangman-result ${isWon ? 'won' : 'lost'}">
          ${isWon ? "You got it!" : `The word was: <strong>${currentWord.data[state.targetLang].translation}</strong>`}
        </div>
        <button class="btn" id="hangman-next">${wordIndex < words.length - 1 ? "Next Word" : "See Results"}</button>
      ` : `
        <div class="hangman-hint">Guess the ${state.targetLang} word!</div>
        <div class="hangman-keyboard">${keyboard}</div>
      `}`;

    if (gameOver) {
      if (isWon) score++;
      results.push({
        entry: currentWord.entry,
        foreign: currentWord.data[state.targetLang].translation,
        native: currentWord.data[state.sourceLang].translation,
        correct: isWon
      });
      Progress.recordOutcome(currentWord.entry, state.sourceLang, state.targetLang, isWon);

      document.getElementById("hangman-next").addEventListener("click", () => {
        wordIndex++;
        renderWord();
      });
    } else {
      area.querySelectorAll(".hangman-key:not(.disabled)").forEach(btn => {
        btn.addEventListener("click", () => {
          const letter = btn.dataset.letter;
          guessed.add(letter);
          lastGuessed = letter;
          if (!targetWord.includes(letter)) wrongCount++;
          renderBoard();
        });
      });
    }
  }

  return { start };
})();
