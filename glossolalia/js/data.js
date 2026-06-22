const VOCAB = {
  animals: [
    {
      entry: "lion",
      image: "images/vectorLion.png",
      data: {
        English:  { translation: "lion",      morph: ["li","on"] },
        Finnish:  { translation: "leijona",   morph: ["lei","jo","na"] },
        Spanish:  { translation: "le\u00f3n",       morph: ["le","\u00f3n"] },
        Cornish:  { translation: "lew",       morph: ["le","w"] },
        Polish:   { translation: "lew",       morph: ["le","w"] },
        Korean:   { translation: "사자",      morph: ["사","자"] }
      }
    },
    {
      entry: "octopus",
      image: "images/vectorOctopus.png",
      data: {
        English:  { translation: "octopus",     morph: ["oc","to","pus"] },
        Finnish:  { translation: "tursas",      morph: ["tur","sas"] },
        Spanish:  { translation: "pulpo",       morph: ["pul","po"] },
        Polish:   { translation: "o\u015bmiornica",  morph: ["o\u015b","mior","ni","ca"] },
        Korean:   { translation: "\ubb38\uc5b4",            morph: ["\ubb38","\uc5b4"] }
      }
    },
    {
      entry: "whale",
      image: "images/vectorWhale.png",
      data: {
        English:  { translation: "whale",    morph: ["wha","le"] },
        Finnish:  { translation: "valas",    morph: ["va","las"] },
        Spanish:  { translation: "ballena",  morph: ["ba","lle","na"] },
        Cornish:  { translation: "morvil",   morph: ["mor","vil"] },
        Polish:   { translation: "wieloryb", morph: ["wie","lo","ryb"] },
        Korean:   { translation: "고래",     morph: ["고","래"] }
      }
    },
    {
      entry: "wolf",
      image: "images/vectorWolf.png",
      data: {
        English:  { translation: "wolf",   morph: ["wo","lf"] },
        Finnish:  { translation: "susi",   morph: ["su","si"] },
        Spanish:  { translation: "lobo",   morph: ["lo","bo"] },
        Cornish:  { translation: "bleydh", morph: ["bley","dh"] },
        Polish:   { translation: "wilk",   morph: ["wi","lk"] },
        Korean:   { translation: "늑대",   morph: ["늑","대"] }
      }
    },
    {
      entry: "bird",
      image: "images/vectorBird.png",
      data: {
        English:  { translation: "bird",    morph: ["bi","rd"] },
        Finnish:  { translation: "lintu",   morph: ["lin","tu"] },
        Spanish:  { translation: "p\u00e1jaro",  morph: ["p\u00e1","ja","ro"] },
        Cornish:  { translation: "edhen",   morph: ["e","dhen"] },
        Polish:   { translation: "ptak",    morph: ["pt","ak"] },
        Korean:   { translation: "새",      morph: ["새"] }
      }
    },
    {
      entry: "fish",
      image: "images/vectorFish.png",
      data: {
        English:  { translation: "fish",  morph: ["fi","sh"] },
        Finnish:  { translation: "kala",  morph: ["ka","la"] },
        Spanish:  { translation: "pez",   morph: ["pe","z"] },
        Cornish:  { translation: "pysk",  morph: ["py","sk"] },
        Polish:   { translation: "ryba",  morph: ["ry","ba"] },
        Korean:   { translation: "물고기", morph: ["물","고","기"] }
      }
    },
    {
      entry: "cat",
      image: "images/vectorCat.png",
      data: {
        English:  { translation: "cat",   morph: ["ca","t"] },
        Finnish:  { translation: "kissa", morph: ["kis","sa"] },
        Spanish:  { translation: "gato",  morph: ["ga","to"] },
        Cornish:  { translation: "kath",  morph: ["ka","th"] },
        Polish:   { translation: "kot",   morph: ["ko","t"] },
        Korean:   { translation: "고양이", morph: ["고","양","이"] }
      }
    },
    {
      entry: "cow",
      image: "images/vectorCowF.png",
      data: {
        English:  { translation: "cow",    morph: ["co","w"] },
        Finnish:  { translation: "lehm\u00e4",  morph: ["leh","m\u00e4"] },
        Spanish:  { translation: "vaca",   morph: ["va","ca"] },
        Cornish:  { translation: "bugh",   morph: ["bu","gh"] },
        Polish:   { translation: "krowa",  morph: ["kro","wa"] },
        Korean:   { translation: "소",     morph: ["소"] }
      }
    },
    {
      entry: "dog",
      image: "images/vectorDog.png",
      data: {
        English:  { translation: "dog",   morph: ["do","g"] },
        Finnish:  { translation: "koira", morph: ["koi","ra"] },
        Spanish:  { translation: "perro", morph: ["pe","rro"] },
        Cornish:  { translation: "ki",    morph: ["k","i"] },
        Polish:   { translation: "pies",  morph: ["pi","es"] },
        Korean:   { translation: "개",    morph: ["개"] }
      }
    },
    {
      entry: "snake",
      image: "images/vectorSnake.png",
      data: {
        English:  { translation: "snake",     morph: ["sna","ke"] },
        Finnish:  { translation: "k\u00e4\u00e4rme",   morph: ["k\u00e4\u00e4r","me"] },
        Spanish:  { translation: "serpiente", morph: ["ser","pien","te"] },
        Cornish:  { translation: "sarf",      morph: ["sa","rf"] },
        Polish:   { translation: "w\u0105\u017c",       morph: ["w\u0105","\u017c"] },
        Korean:   { translation: "\ubc40",        morph: ["\ubc40"] }
      }
    }
  ]
};

const LANGUAGES = ["English", "Finnish", "Spanish", "Cornish", "Polish", "Korean"];

function getAvailableWords(topic, sourceLang, targetLang) {
  return VOCAB[topic].filter(
    item => item.data[sourceLang] && item.data[targetLang]
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}
