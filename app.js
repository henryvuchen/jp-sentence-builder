// app.js — starter setup
console.log("JP Sentence Builder app is connected.");

// Load JMdict JSON (test fetch)
async function loadDictionary() {
  const url = "https://github.com/henryvuchen/jp-sentence-builder/releases/download/v1.0.0/jmdict-all-3.6.1.json";
  try {
    let response = await fetch(url);
    let data = await response.json();
    console.log("Dictionary loaded:", data.length, "entries");
  } catch (err) {
    console.error("Error loading dictionary:", err);
  }
}

loadDictionary();
