// app.js — starter setup
console.log("JP Sentence Builder app is connected.");

// Load JMdict JSON (test fetch)
async function loadDictionary() {
  const url = "data/sample_jmdict.json";
  try {
    let response = await fetch(url);
    let data = await response.json();
    console.log("Dictionary loaded:", data.length, "entries");
  } catch (err) {
    console.error("Error loading dictionary:", err);
  }
}

loadDictionary();
