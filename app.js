// app.js — starter setup
console.log("JP Sentence Builder app is connected.");
// Supabase setup
const SUPABASE_URL = "https://fvmezrnvoivtdwedhrll.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bWV6cm52b2l2dGR3ZWRocmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NzcsImV4cCI6MjA3MTMxNjY3N30.wO4VZPsJOi1qr82NJbzrzX0sOnbb8w0H37HUI_MkYtc"; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// --- Sentence state + helpers ---
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
// expose for the quick-add buttons in index.html
window.addToken = addToken;
// --- Main wiring ---
async function loadDictionary() {
  // Clear button
  const clearBtn = document.getElementById("clearSentence");
  if (clearBtn && !clearBtn._wired) {
    clearBtn.addEventListener("click", () => {
      sentence.length = 0;
      renderSentence();
    });
    clearBtn._wired = true;
  }
  // Search form
  const form = document.getElementById("searchForm");
  if (!form || form._wired) return;
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const q = document.getElementById("q").value.trim();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    if (!q) {
      resultsDiv.textContent = "Type something to search.";
      return;
    }
    // DIRECT indexed full-text search on search_text (no RPC, no timeout)
    let { data, error } = await supabase
      .from("dictionary")
      .select("kanji,kana,romaji,gloss")
      .textSearch("search_text", q, { config: "simple", type: "plain" }) // uses plainto_tsquery
      .limit(25);
    if (error) {
      console.error("Supabase query error:", error);
      resultsDiv.textContent = "Search failed. Check console.";
      return;
    }
    if (!data || data.length === 0) {
      resultsDiv.textContent = "No matches found.";
      return;
    }
    // Render results
    data.forEach((entry) => {
      const div = document.createElement("div");
      const kanji0 = Array.isArray(entry.kanji) && entry.kanji.length ? entry.kanji[0] : "";
      const kana0  = Array.isArray(entry.kana)  && entry.kana.length  ? entry.kana[0]  : "";
      const romaji = entry.romaji || "";
      const gloss0 = Array.isArray(entry.gloss) && entry.gloss.length ? entry.gloss[0] : "";
      const glosses = Array.isArray(entry.gloss) ? entry.gloss.join(", ") : "";
      div.innerHTML =
        "<h2>" + (kanji0 || kana0) +
        (kanji0 && kana0 ? " (" + kana0 + ")" : "") +
        " — " + romaji + "</h2>" +
        "<p>" + glosses + "</p>" +
        '<button class="add" data-text="' + (kanji0 || kana0) + '">Add Kanji/Kana</button> ' +
        '<button class="add" data-text="' + kana0 + '">Add Kana</button> ' +
        '<button class="add" data-text="' + romaji + '">Add Romaji</button> ' +
        '<button class="add" data-text="' + gloss0 + '">Add EN</button>';
      div.querySelectorAll("button.add").forEach((btn) => {
        btn.addEventListener("click", () => addToken(btn.dataset.text));
      });
      resultsDiv.appendChild(div);
    });
  });
  form._wired = true;
  console.log("Dictionary search ready (direct FTS).");
}
// Kick off
loadDictionary();

