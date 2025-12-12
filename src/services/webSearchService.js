// src/services/webSearchService.js
const axios = require("axios");

const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function serpSearchTop(barcode, limit = 5) {
    console.log(`🔎 [SerpAPI] Searching top results for: ${barcode} (limit=${limit})`);

    if (!SERPAPI_KEY) {
        console.warn("⚠️ [SerpAPI] SERPAPI_KEY missing");
        return [];
    }

    try {
        const res = await axios.get("https://serpapi.com/search.json", {
            params: {
                api_key: SERPAPI_KEY,
                engine: "google",
                q: barcode,
                num: limit,
                hl: "fr",
            },
            timeout: 15000,
        });

        const organic = res.data.organic_results || [];
        const top = organic.slice(0, limit).map(r => ({
            title: r.title,
            url: r.link,
            snippet: r.snippet,
        }));

        console.log("✅ [SerpAPI] Top results:", top.map(x => x.url));
        return top;
    } catch (e) {
        console.error("❌ [SerpAPI] Error:", e?.response?.data || e.message);
        return [];
    }
}

module.exports = { serpSearchTop };
