// app.js — starter setup
console.log("JP Sentence Builder app is connected.");
// Sentence state + helpers
const sentence = [];
function renderSentence() {
  const box = document.getElementById("sentence");
  box.textContent = sentence.join(" ");
}
function addToken(text) {
  if (!text) return;
  sentence.push(text);
  renderSentence();
}
// Load JMdict JSON (test fetch)
async function loadDictionary() {
  const url = "data/sample_jmdict.json";
  try {
    let response = await fetch(url);
    let data = await response.json();
    document.getElementById("clearSentence").addEventListener("click", () => {
  sentence.length = 0;
  renderSentence();
});

    // Hook up search form
    const form = document.getElementById("searchForm");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const q = document.getElementById("q").value.trim().toLowerCase();
      const resultsDiv = document.getElementById("results");
      resultsDiv.innerHTML = "";

      const matches = data.filter(entry =>
        entry.kanji.some(k => k.includes(q)) ||
        entry.kana.some(k => k.includes(q)) ||
        entry.romaji.toLowerCase().includes(q) ||
        entry.senses.some(s => s.gloss.join(", ").toLowerCase().includes(q))
      );

      if (matches.length === 0) {
        resultsDiv.textContent = "No matches found.";
        return;
      }

      matches.forEach(entry => {
  const div = document.createElement("div");
  div.innerHTML = `
    <h2>${entry.kanji[0]} (${entry.kana[0]}) — ${entry.romaji}</h2>
    <p>${entry.senses[0].gloss.join(", ")}</p>
    <button class="add" data-text="${entry.kana[0]}">Add JP</button>
    <button class="add" data-text="${entry.senses[0].gloss[0]}">Add EN</button>
  `;

  div.querySelectorAll("button.add").forEach(btn => {
    btn.addEventListener("click", () => addToken(btn.dataset.text));
  });

  resultsDiv.appendChild(div);
});

loadDictionary();
