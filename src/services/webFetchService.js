// src/services/webFetchService.js
const axios = require("axios");

const KEYWORDS = [
    "ingrédients", "ingredients",
    "composition analytique", "analytical constituents", "constituants analytiques",
    "analyse", "protéines", "protein",
    "matières grasses", "fat",
    "fibres", "fibre",
    "cendres", "ash",
    "humidité", "moisture",
    "énergie", "kcal",
    "additifs", "additives",
    "stérilisé", "sterilised", "neutered",
    "chien", "dog", "chat", "cat",
];

function cleanHtml(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function extractSnippets(html, keywords, windowSize = 1200, maxSnippets = 6) {
    const lower = html.toLowerCase();
    const snippets = [];
    const seen = new Set();

    for (const kw of keywords) {
        const key = kw.toLowerCase();
        let idx = lower.indexOf(key);

        while (idx !== -1 && snippets.length < maxSnippets) {
            const start = Math.max(0, idx - Math.floor(windowSize / 2));
            const end = Math.min(html.length, idx + Math.floor(windowSize / 2));
            const snippet = html.slice(start, end).trim();
            const hash = snippet.slice(0, 80);

            if (!seen.has(hash)) {
                seen.add(hash);
                snippets.push(`KEYWORD:${kw} >>> ${snippet}`);
            }
            idx = lower.indexOf(key, idx + key.length);
        }
        if (snippets.length >= maxSnippets) break;
    }

    return snippets;
}

async function fetchAndReducePage(url) {
    console.log(`🌐 [Fetch] GET ${url}`);

    try {
        const res = await axios.get(url, {
            timeout: 15000,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
            },
            validateStatus: () => true,
        });

        if (res.status >= 400) {
            console.warn(`⚠️ [Fetch] HTTP ${res.status} for ${url}`);
            return { url, reduced_text: null, status: res.status, error: `HTTP_${res.status}` };
        }

        const cleaned = cleanHtml(res.data.toString());

        const snippets = extractSnippets(cleaned, KEYWORDS, 900, 5);
        const fallback = cleaned.slice(0, 2500);

        const MAX_REDUCED_CHARS = 5000;
        const reduced_text = (snippets.length ? snippets.join("\n\n") : fallback).slice(0, MAX_REDUCED_CHARS);

        console.log(`✅ [Fetch] Reduced content length=${reduced_text.length} chars (snippets=${snippets.length})`);
        return { url, reduced_text, status: res.status, error: null };
    } catch (e) {
        console.warn(`⚠️ [Fetch] Failed ${url}:`, e.message);
        return { url, reduced_text: null, status: null, error: e.message };
    }
}

module.exports = { fetchAndReducePage };
