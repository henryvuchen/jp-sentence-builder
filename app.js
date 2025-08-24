// app.js — known-good minimal connectivity test (no backticks, no RPCs)
console.log("JP Sentence Builder app is connected.");
// ===== Supabase setup (your real values) =====
const SUPABASE_URL = "https://fvmezrnvoivtdwedhrll.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bWV6cm52b2l2dGR3ZWRocmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NzcsImV4cCI6MjA3MTMxNjY3N30.wO4VZPsJOi1qr82NJbzrzX0sOnbb8w0H37HUI_MkYtc";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ===== Sentence helpers (unchanged) =====
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
window.addToken = addToken; // used by the quick-add buttons in index.html
// ===== Minimal connectivity test =====
async function loadDictionary() {
  const form = document.getElementById("searchForm");
  const resultsDiv = document.getElementById("results");
  const clearBtn = document.getElementById("clearSentence");
  if (clearBtn && !clearBtn._wired) {
    clearBtn.addEventListener("click", function () {
      sentence.length = 0;
      renderSentence();
    });
    clearBtn._wired = true;
  }
  if (!form || form._wired) return;
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!resultsDiv) return;
    resultsDiv.textContent = "Testing Supabase…";
    // Exact 1-row query (cannot time out under normal conditions)
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
      resultsDiv.textContent = "MIN test: no exact romaji match for 'taberu'.";
      return;
    }
    const row = data[0];
    const head = (Array.isArray(row.kanji) && row.kanji[0]) || (Array.isArray(row.kana) && row.kana[0]) || row.romaji || "";
    const gloss0 = (Array.isArray(row.gloss) && row.gloss[0]) || "";
    resultsDiv.textContent = "MIN test OK → " + head + " — " + gloss0;
  });
  form._wired = true;
  console.log("MIN connectivity test ready.");
}
loadDictionary();
