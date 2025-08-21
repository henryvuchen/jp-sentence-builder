// app.js — starter setup
console.log("JP Sentence Builder app is connected.");
// Supabase setup
const SUPABASE_URL = "https://YOUR_PROJECT_URL.supabase.co"; 
const SUPABASE_KEY = "YOUR_ANON_KEY"; 
const supabase = window.supabase.createClient(https://fvmezrnvoivtdwedhrll.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bWV6cm52b2l2dGR3ZWRocmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NzcsImV4cCI6MjA3MTMxNjY3N30.wO4VZPsJOi1qr82NJbzrzX0sOnbb8w0H37HUI_MkYtc);
// Sentence state + helpers
const sentence = [];
function renderSentence() {
  const box = document.getElementById("sentence");
  if (box) box.textContent = sentence.join(" ");
}
function addToken(text) {
  if (!text) return;
  sentence.push(text);
  renderSentence();
}

// Load JMdict JSON (test fetch)
async function loadDictionary() {
  try {
  const { data, error } = await supabase
    .from('dictionary')
    .select('*');

  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  console.log("Dictionary loaded:", data.length, "entries");

    // Clear button
    const clearBtn = document.getElementById("clearSentence");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        sentence.length = 0;
        renderSentence();
      });
    }

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
  <button class="add" data-text="${(entry.kanji && entry.kanji[0]) || entry.kana[0]}">Add Kanji</button>
  <button class="add" data-text="${entry.kana[0]}">Add Kana</button>
  <button class="add" data-text="${entry.romaji}">Add Romaji</button>
  <button class="add" data-text="${entry.senses[0].gloss[0]}">Add EN</button>
`;
        div.querySelectorAll("button.add").forEach(btn => {
          btn.addEventListener("click", () => addToken(btn.dataset.text));
        });
        resultsDiv.appendChild(div);
      });
    });

    console.log("Dictionary loaded:", data.length, "entries");
  } catch (err) {
    console.error("Error loading dictionary:", err);
  }
}

loadDictionary();
