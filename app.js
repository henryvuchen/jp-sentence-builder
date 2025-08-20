// app.js — starter setup
console.log("JP Sentence Builder app is connected.");

// Load JMdict JSON (test fetch)
async function loadDictionary() {
  const url = "data/sample_jmdict.json";
  try {
    let response = await fetch(url);
    let data = await response.json();
    console.log("Dictionary loaded:", data.length, "entries");
    // Display first entry on page
    const first = data[0];
    const output = document.createElement("div");
    output.innerHTML = `
      <h2>${first.kanji[0]} (${first.kana[0]}) — ${first.romaji}</h2>
      <p>${first.senses[0].gloss.join(", ")}</p>
    `;
    document.body.appendChild(output);
  } catch (err) {
    console.error("Error loading dictionary:", err);
  }
}

loadDictionary();
