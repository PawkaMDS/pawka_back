// src/services/webSearchService.js
const axios = require("axios");

const SERPAPI_KEY = process.env.SERPAPI_KEY;

if (!SERPAPI_KEY) {
    console.warn("⚠️ SERPAPI_KEY is not set. Web search will not work properly.");
}

/**
 * Recherche des pages produits à partir du code-barres via SerpAPI (Google).
 * On renvoie une petite liste de résultats pertinents : { title, url, snippet }.
 */
async function searchProductByBarcode(barcode) {
    console.log(`🔎 [WebSearch] Searching web for barcode ${barcode} via SerpAPI...`);

    if (!SERPAPI_KEY) {
        console.warn("⚠️ [WebSearch] SERPAPI_KEY missing, returning [].");
        return [];
    }

    try {
        const params = {
            api_key: SERPAPI_KEY,
            engine: "google",
            q: barcode,
            num: 10,   // on récupère un peu plus large, on filtrera ensuite
            hl: "fr",
        };

        const res = await axios.get("https://serpapi.com/search.json", {
            params,
            timeout: 15000,
        });

        const organic = res.data.organic_results || [];
        console.log(`✅ [WebSearch] Got ${organic.length} organic results from SerpAPI.`);

        // On filtre un peu : on garde plutôt les sites e-commerce / marque
        const filtered = organic.filter((r) => {
            if (!r.link) return false;
            const url = r.link.toLowerCase();

            // Exemple de filtrage basique : tu pourras ajuster
            const allowedDomains = [
                "royalcanin",
                "purina",
                "hillspet",
                "zooplus",
                "maxizoo",
                "amazon.",
                "bitiba",
                "zooroyal",
            ];

            return allowedDomains.some((domain) => url.includes(domain));
        });

        const chosen = (filtered.length ? filtered : organic).slice(0, 3);

        const results = chosen.map((r) => ({
            title: r.title,
            url: r.link,
            snippet: r.snippet,
        }));

        console.log(
            `📄 [WebSearch] Selected ${results.length} results:`,
            results.map((r) => r.url)
        );

        return results;
    } catch (error) {
        console.error("❌ [WebSearch] SerpAPI error:", error?.response?.data || error.message);
        return [];
    }
}

/**
 * Récupère le HTML des URLs trouvées, pour les donner ensuite au LLM.
 */
async function fetchHtmlForUrls(urls) {
    const pages = [];
    const MAX_PAGES = 1;           // ⚠️ POC : on ne garde qu'UNE page html
    const MAX_HTML_CHARS = 6000;   // ⚠️ on tronque fort

    console.log(`🌐 [WebFetch] Fetching HTML for up to ${MAX_PAGES} URLs...`);

    for (const { url, title } of urls.slice(0, MAX_PAGES)) {
        try {
            console.log(`🌐 [WebFetch] Fetching ${url}`);
            const res = await axios.get(url, { timeout: 15000 });

            let rawHtml = res.data.toString();

            // 1) on enlève les scripts et styles qui ne servent à rien pour nous
            rawHtml = rawHtml
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<style[\s\S]*?<\/style>/gi, "");

            // 2) on réduit les espaces
            rawHtml = rawHtml.replace(/\s+/g, " ");

            // 3) on tronque fort
            const html = rawHtml.slice(0, MAX_HTML_CHARS);

            pages.push({ url, title, html });
        } catch (e) {
            console.warn(`⚠️ [WebFetch] Failed to fetch ${url}:`, e.message);
        }
    }

    console.log(`✅ [WebFetch] Collected HTML for ${pages.length} pages.`);
    return pages;
}

module.exports = {
    searchProductByBarcode,
    fetchHtmlForUrls,
};
