// app.js — starter setup
console.log("JP Sentence Builder app is connected.");
// Supabase setup
const SUPABASE_URL = "https://fvmezrnvoivtdwedhrll.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bWV6cm52b2l2dGR3ZWRocmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NzcsImV4cCI6MjA3MTMxNjY3N30.wO4VZPsJOi1qr82NJbzrzX0sOnbb8w0H37HUI_MkYtc"; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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
  // Clear button
  const clearBtn = document.getElementById("clearSentence");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      sentence.length = 0;
      renderSentence();
    });
  }
  // Hook up search form (server-side search)
  const form = document.getElementById("searchForm");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const q = document.getElementById("q").value.trim();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    if (!q) {
      resultsDiv.textContent = "Type something to search.";
      return;
    }
    // Call the SQL function you created in Supabase
    const { data, error } = await supabase.rpc("search_dictionary", {
      q,          // search text
      lim: 25     // max rows to return
    });
    if (error) {
      console.error("Supabase search error:", error);
      resultsDiv.textContent = "Search failed. Check console.";
      return;
    }
    if (!data || data.length === 0) {
      resultsDiv.textContent = "No matches found.";
      return;
    }
    // Render results
    data.forEach(entry => {
      const div = document.createElement("div");
      const kanji0  = (entry.kanji && entry.kanji[0]) || "";
      const kana0   = (entry.kana  && entry.kana[0])  || "";
      const romaji  = entry.romaji || "";
      const glosses = (entry.gloss || []).join(", ");
      div.innerHTML = `
        <h2>${kanji0 || kana0} ${kanji0 && kana0 ? `(${kana0})` : ""} — ${romaji}</h2>
        <p>${glosses}</p>
        <button class="add" data-text="${kanji0 || kana0}">Add Kanji/Kana</button>
        <button class="add" data-text="${kana0}">Add Kana</button>
        <button class="add" data-text="${romaji}">Add Romaji</button>
        <button class="add" data-text="${(entry.gloss && entry.gloss[0]) || ""}">Add EN</button>
      `;
      div.querySelectorAll("button.add").forEach(btn => {
        btn.addEventListener("click", () => addToken(btn.dataset.text));
      });
      resultsDiv.appendChild(div);
    });
  });
  console.log("Dictionary search ready (server-side).");
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
        (entry.gloss || []).join(", ").toLowerCase().includes(q)
      );

      if (matches.length === 0) {
        resultsDiv.textContent = "No matches found.";
        return;
      }

      matches.forEach(entry => {
        const div = document.createElement("div");
        div.innerHTML = `
  <h2>${entry.kanji[0]} (${entry.kana[0]}) — ${entry.romaji}</h2>
  <p>${entry.gloss.join(", ")}</p>
  <button class="add" data-text="${(entry.kanji && entry.kanji[0]) || entry.kana[0]}">Add Kanji</button>
  <button class="add" data-text="${entry.kana[0]}">Add Kana</button>
  <button class="add" data-text="${entry.romaji}">Add Romaji</button>
  <button class="add" data-text="${entry.gloss[0] || ''}">Add EN</button>
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
