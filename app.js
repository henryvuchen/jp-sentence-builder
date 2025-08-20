// app.js — starter setup
console.log("JP Sentence Builder app is connected.");

// Load JMdict JSON (test fetch)
async function loadDictionary() {
  const url = "data/sample_jmdict.json";
  try {
    let response = await fetch(url);
    let data = await response.json();
ChatGPT said:

Perfect — the search bar is now in place. ✅

Instruction 28 — Add search logic to app.js.

Open app.js → edit.

Right after the line let data = await response.json();, insert this block:

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
        `;
        resultsDiv.appendChild(div);
      });
    });    
    console.log("Dictionary loaded:", data.length, "entries");
    // Display first entry on page
    const first = data[0];
    const output = document.createElement("div");
    output.innerHTML = `
      <h2>${first.kanji[0]} (${first.kana[0]}) — ${first.romaji}</h2>
      <p>${first.senses[0].gloss.join(", ")}</p>
    `;
    document.getElementById("results").appendChild(output);
  } catch (err) {
    console.error("Error loading dictionary:", err);
  }
}

loadDictionary();
