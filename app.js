/ app.js — full file (top to bottom)
// Uses phased, fast queries (no RPC) and client-side ranking to avoid timeouts.
console.log("JP Sentence Builder app is connected.");
// ===== Supabase setup (your real values) =====
const SUPABASE_URL = "https://fvmezrnvoivtdwedhrll.supabase.co"; // keep yours
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bWV6cm52b2l2dGR3ZWRocmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NzcsImV4cCI6MjA3MTMxNjY3N30.wO4VZPsJOi1qr82NJbzrzX0sOnbb8w0H37HUI_MkYtc"; // keep yours
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ===== Sentence helpers =====
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
window.addToken = addToken; // used by quick-add buttons in index.html
// ===== Main: phased search (fast) =====
async function loadDictionary() {
  // Clear button
  const clearBtn = document.getElementById("clearSentence");
  if (clearBtn && !clearBtn._wired) {
    clearBtn.addEventListener("click", function () {
      sentence.length = 0;
      renderSentence();
    });
    clearBtn._wired = true;
  }
  const form = document.getElementById("searchForm");
  if (!form || form._wired) return;
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const input = document.getElementById("q");
    const q = (input && input.value ? input.value : "").trim();
    const resultsDiv = document.getElementById("results");
    if (!resultsDiv) return;
    resultsDiv.innerHTML = "";
    if (!q) {
      resultsDiv.textContent = "Type something to search.";
      return;
    }
    // Dedup helper
    const keyOf = function (r) {
      const k0 = (Array.isArray(r.kanji) && r.kanji.length ? r.kanji[0] : "");
      const a0 = (Array.isArray(r.kana)  && r.kana.length  ? r.kana[0]  : "");
      return (r.romaji || "") + " | " + k0 + " | " + a0;
    };
    const byKey = new Map();
    function addRows(rows) {
      if (!rows) return;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const k = keyOf(r);
        if (!byKey.has(k)) byKey.set(k, r);
        if (byKey.size >= 25) break;
      }
    }
    // Phase 1 — exact headword matches (FAST)
    try {
      // exact romaji (indexed)
      let a1 = await supabase
        .from("dictionary")
        .select("kanji,kana,romaji,gloss,is_common,freq_rank")
        .eq("romaji", q)
        .limit(10);
      if (a1.error) throw a1.error;
      addRows(a1.data);
      // exact kanji (array contains)
      let a2 = await supabase
        .from("dictionary")
        .select("kanji,kana,romaji,gloss,is_common,freq_rank")
        .contains("kanji", [q])
        .limit(10);
      if (a2.error) throw a2.error;
      addRows(a2.data);
      // exact kana (array contains)
      let a3 = await supabase
        .from("dictionary")
        .select("kanji,kana,romaji,gloss,is_common,freq_rank")
        .contains("kana", [q])
        .limit(10);
      if (a3.error) throw a3.error;
      addRows(a3.data);
    } catch (err1) {
      console.error("Phase 1 error:", err1);
    }
    // Phase 2 — romaji prefix (still fast on index)
    if (byKey.size < 25) {
      try {
        let b1 = await supabase
          .from("dictionary")
          .select("kanji,kana,romaji,gloss,is_common,freq_rank")
          .like("romaji", q + "%")
          .limit(25 - byKey.size);
        if (b1.error) throw b1.error;
        addRows(b1.data);
      } catch (err2) {
        console.error("Phase 2 error:", err2);
      }
    }
    // Phase 3 — full-text fallback (indexed tsvector); small cap
    if (byKey.size < 25) {
      try {
        let c1 = await supabase
          .from("dictionary")
          .select("kanji,kana,romaji,gloss,is_common,freq_rank")
          .textSearch("search_text", q, { config: "simple", type: "plain" })
          .limit(25 - byKey.size);
        if (c1.error) throw c1.error;
        addRows(c1.data);
      } catch (err3) {
        console.error("Phase 3 error:", err3);
      }
    }
    if (byKey.size === 0) {
      resultsDiv.textContent = "No matches found.";
      return;
    }
    // Client-side ranking: common first, better freq rank, shorter primary gloss
    const rows = Array.from(byKey.values()).sort(function (x, y) {
      const xc = x.is_common ? 1 : 0, yc = y.is_common ? 1 : 0;
      if (yc - xc) return yc - xc;
      const xf = (x.freq_rank === null || x.freq_rank === undefined) ? 999 : x.freq_rank;
      const yf = (y.freq_rank === null || y.freq_rank === undefined) ? 999 : y.freq_rank;
      if (xf - yf) return xf - yf;
      const xg = (Array.isArray(x.gloss) && x.gloss[0]) ? x.gloss[0].length : 9999;
      const yg = (Array.isArray(y.gloss) && y.gloss[0]) ? y.gloss[0].length : 9999;
      return xg - yg;
    });
    // Render
    for (let i = 0; i < rows.length; i++) {
      const entry = rows[i];
      const div = document.createElement("div");
      const kanji0 = (Array.isArray(entry.kanji) && entry.kanji.length ? entry.kanji[0] : "");
      const kana0  = (Array.isArray(entry.kana)  && entry.kana.length  ? entry.kana[0]  : "");
      const romaji = entry.romaji || "";
      const gloss0 = (Array.isArray(entry.gloss) && entry.gloss.length ? entry.gloss[0] : "");
      const glosses = (Array.isArray(entry.gloss) ? entry.gloss.join(", ") : "");
      div.innerHTML =
        "<h2>" + (kanji0 || kana0) +
        (kanji0 && kana0 ? " (" + kana0 + ")" : "") +
        " — " + romaji + "</h2>" +
        "<p>" + glosses + "</p>" +
        '<button class="add" data-text="' + (kanji0 || kana0) + '">Add Kanji/Kana</button> ' +
        '<button class="add" data-text="' + kana0 + '">Add Kana</button> ' +
        '<button class="add" data-text="' + romaji + '">Add Romaji</button> ' +
        '<button class="add" data-text="' + gloss0 + '">Add EN</button>';
      const btns = div.querySelectorAll("button.add");
      for (let j = 0; j < btns.length; j++) {
        btns[j].addEventListener("click", function () {
          addToken(this.dataset.text);
        });
      }
      resultsDiv.appendChild(div);
    }
  });
  form._wired = true;
  console.log("Dictionary search ready (phased, fast).");
}
loadDictionary();
