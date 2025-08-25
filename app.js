// app.js
console.log("JP Sentence Builder app is connected.");
// ===== Supabase setup (keep these EXACTLY as your current working values) =====
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
window.addToken = addToken;
// ===== Main: phased, fast search (no RPC, no FTS to avoid timeouts) =====
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
    if (!q) { resultsDiv.textContent = "Type something to search."; return; }
    // Preferred everyday headword for common English queries (forces taberu/nomu/ryouri to top)
    function preferredRomajiForQuery(s) {
      const t = (s || "").toLowerCase().trim();
      if (t === "to eat" || t === "eat") return "taberu";
      if (t === "to drink" || t === "drink") return "nomu";
      if (t === "to cook" || t === "cook" || t === "cooking") return "ryouri";
      return "";
    }
    function firstOrEmpty(a) { return (Array.isArray(a) && a.length ? a[0] : ""); }
    function containsGloss(entry, s) {
      const all = Array.isArray(entry.gloss) ? entry.gloss.join(" ").toLowerCase() : "";
      return all.indexOf((s || "").toLowerCase()) !== -1;
    }
    // Collect results with dedup (romaji|kanji0|kana0)
    function keyOf(r) {
      const k0 = firstOrEmpty(r.kanji);
      const a0 = firstOrEmpty(r.kana);
      return (r.romaji || "") + " | " + k0 + " | " + a0;
    }
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
    // Phase 0 — if English query maps to a preferred romaji, look that up first (fast, indexed)
    const pref = preferredRomajiForQuery(q);
    if (pref) {
      try {
        const r0 = await supabase
          .from("dictionary")
          .select("kanji,kana,romaji,gloss,is_common,freq_rank")
          .eq("romaji", pref)
          .limit(5);
        if (r0.error) throw r0.error;
        addRows(r0.data);
      } catch (e0) {
        console.error("Phase 0 error:", e0);
      }
    }
    // Phase 1 — exact headword matches (fast)
    try {
      // exact romaji (indexed)
      const a1 = await supabase
        .from("dictionary")
        .select("kanji,kana,romaji,gloss,is_common,freq_rank")
        .eq("romaji", q)
        .limit(10);
      if (a1.error) throw a1.error;
      addRows(a1.data);
      // exact kanji array contains
      const a2 = await supabase
        .from("dictionary")
        .select("kanji,kana,romaji,gloss,is_common,freq_rank")
        .contains("kanji", [q])
        .limit(10);
      if (a2.error) throw a2.error;
      addRows(a2.data);
      // exact kana array contains
      const a3 = await supabase
        .from("dictionary")
        .select("kanji,kana,romaji,gloss,is_common,freq_rank")
        .contains("kana", [q])
        .limit(10);
      if (a3.error) throw a3.error;
      addRows(a3.data);
    } catch (e1) {
      console.error("Phase 1 error:", e1);
    }
    // Phase 2 — romaji prefix (fast on index)
    if (byKey.size < 25) {
      try {
        const b1 = await supabase
          .from("dictionary")
          .select("kanji,kana,romaji,gloss,is_common,freq_rank")
          .like("romaji", q + "%")
          .limit(25 - byKey.size);
        if (b1.error) throw b1.error;
        addRows(b1.data);
      } catch (e2) {
        console.error("Phase 2 error:", e2);
      }
    }
    // Nothing found?
    if (byKey.size === 0) {
      resultsDiv.textContent = "No matches found.";
      return;
    }
    // Client-side ranking — force preferred everyday verbs first, then common/frequency, then short gloss
    function scoreEntry(entry, query) {
      const pq = preferredRomajiForQuery(query);
      const romaji = entry.romaji ? entry.romaji.toLowerCase() : "";
      const kanji0 = firstOrEmpty(entry.kanji).toLowerCase();
      const kana0  = firstOrEmpty(entry.kana).toLowerCase();
      const gloss0 = firstOrEmpty(entry.gloss).toLowerCase();
      const ql = (query || "").toLowerCase().trim();
      const fr = (entry.freq_rank === null || entry.freq_rank === undefined) ? 999 : entry.freq_rank;
      let s = 0;
      if (pq && romaji === pq) s += 10000;                 // hard boost for taberu/nomu/ryouri on EN queries
      if (gloss0 === ql) s += 5000;
      else if (gloss0.indexOf(ql) === 0) s += 3000;
      else if (containsGloss(entry, query)) s += 1500;
      if (romaji === ql) s += 2000;
      if (kanji0 === ql) s += 1800;
      if (kana0  === ql) s += 1800;
      if (entry.is_common) s += 800;
      s += Math.max(0, 400 - fr);
      s += Math.max(0, 200 - (gloss0 ? gloss0.length : 200));
      return s;
    }
    const rows = Array.from(byKey.values()).sort(function (x, y) {
      return scoreEntry(y, q) - scoreEntry(x, q);
    });
    // Render
    for (let i = 0; i < rows.length; i++) {
      const entry = rows[i];
      const div = document.createElement("div");
      const kanji0 = firstOrEmpty(entry.kanji);
      const kana0  = firstOrEmpty(entry.kana);
      const romaji = entry.romaji || "";
      const gloss0 = firstOrEmpty(entry.gloss);
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
  console.log("Dictionary search ready (phased; EN queries prefer everyday verbs).");
}
loadDictionary();
