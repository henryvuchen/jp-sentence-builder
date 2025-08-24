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
  const form = document.getElementById("searchForm");
  const resultsDiv = document.getElementById("results");
  const clearBtn = document.getElementById("clearSentence");
  if (clearBtn && !clearBtn._wired) {
    clearBtn.addEventListener("click", () => { sentence.length = 0; renderSentence(); });
    clearBtn._wired = true;
  }
  if (!form || form._wired) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    resultsDiv.textContent = "Running connectivity test…";
    // MINIMAL query: 1 row, exact match, romaji-only
    const { data, error } = await supabase
      .from("dictionary")
      .select("romaji, kanji, kana, gloss")
      .eq("romaji", "taberu")
      .limit(1);
    if (error) {
      console.error("Supabase MIN test error:", error);
      resultsDiv.textContent = "MIN test failed: " + (error.code || "") + " " + (error.message || "");
      return;
    }
    if (!data || data.length === 0) {
      resultsDiv.textContent = "MIN test: no rows for exact romaji 'taberu'.";
      return;
    }
    const row = data[0];
    resultsDiv.textContent = "MIN test OK → " + (row.kanji?.[0] || row.kana?.[0] || row.romaji) + " — " + (row.gloss?.[0] || "");
  });
  form._wired = true;
  console.log("MIN connectiv

// Kick off
loadDictionary();

