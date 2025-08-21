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
  // Clear sentence button
  const clearBtn = document.getElementById("clearSentence");
  if (clearBtn && !clearBtn._wired) {
    clearBtn.addEventListener("click", () => {
      sentence.length = 0;
      renderSentence();
    });
    clearBtn._wired = true;
  }
  // Search form (server-side search via Supabase RPC)
  const form = document.getElementById("searchForm");
  if (!form) {
    console.error("searchForm not found in DOM.");
    return;
  }
  if (form._wired) {
    // already wired; avoid double listeners
    return;
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("q");
    const q = (input?.value || "").trim();
    const resultsDiv = document.getElementById("results");
    if (!resultsDiv) return;
    resultsDiv.innerHTML = "";
    if (!q) {
      resultsDiv.textContent = "Type something to search.";
      return;
    }
    try {
      const { data, error } = await supabase.rpc("search_dictionary_ranked", {
  q: q,
  lim: 25
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
      data.forEach((entry) => {
        const div = document.createElement("div");
        const kanji0 = Array.isArray(entry.kanji) && entry.kanji.length ? entry.kanji[0] : "";
        const kana0  = Array.isArray(entry.kana)  && entry.kana.length  ? entry.kana[0]  : "";
        const romaji = entry.romaji || "";
        const gloss0 = Array.isArray(entry.gloss) && entry.gloss.length ? entry.gloss[0] : "";
        const glosses = Array.isArray(entry.gloss) ? entry.gloss.join(", ") : "";
        // use string concatenation to avoid nested backticks inside template
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
    } catch (err) {
      console.error("Search request failed:", err);
      resultsDiv.textContent = "Search failed. Check connection.";
    }
  });
  form._wired = true;
  console.log("Dictionary search ready (server-side).");
}
// Kick off
loadDictionary();

