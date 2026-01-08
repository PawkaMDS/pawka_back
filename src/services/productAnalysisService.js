const { callGroqChat } = require("../utils/groqClient");
const { serpSearchTop } = require("./webSearchService");
const { fetchAndReducePage } = require("./webFetchService");

function buildSystemPromptCompact() {
    return `
        Return ONLY valid JSON. No extra text.

        Allowed outputs:
        1) {"status":"ok", ...full schema...}
        2) {"status":"not_animal_food"}
        3) {"status":"not_found"}

        If status="ok", output this exact schema (all keys required):
        {
            "status": "ok",
            "code_ean": "string",
            "name": "string",
            "brand": "string",
            "image_url": "string|null",
            "is_verified": false,
            "product_type_code": "food",
            "animal_type_code": "dog|cat",
            "food_type_code": "kibble|wet|treat|raw|air_dried|baked|other",
            "life_stage": "puppy|adult|senior|kitten|null",
            "is_for_sterilised": true|false,
            "breed_size": "toy|small|medium|large|giant|null",
            "ingredients": "string|null",
            "additives_list": "string|null",
            "moisture_percent": number|null,
            "analytical_composition": {
                "protein_percent": number|null,
                "fat_percent": number|null,
                "fiber_percent": number|null,
                "carbs_percent": number|null,
                "ash_percent": number|null,
                "energy_kcal_per_kg": number|null
            },
            "sources": "string",
            "scores": {
                "protein_content": { "pt": int|null, "pct": int|null, "rationale": "string" },
                "fat_content": { "pt": int|null, "pct": int|null, "rationale": "string" },
                "carbohydrate_content": { "pt": int|null, "pct": int|null, "rationale": "string" },
                "fiber_content": { "pt": int|null, "pct": int|null, "rationale": "string" },
                "ingredient_quality": { "pt": int|null, "pct": int|null, "rationale": "string" },
                "protein_source_quality": { "pt": int|null, "pct": int|null, "rationale": "string" },
                "byproducts_presence": { "pt": int|null, "pct": int|null, "rationale": "string" },
                "chemical_additives": { "pt": int|null, "pct": int|null, "rationale": "string" },
                "beneficial_additives": { "pt": int|null, "pct": int|null, "rationale": "string" }
            },
            "fediaf_conformity": true|false,
            "has_chemical_additives": true|false,
            "has_beneficial_additives": true|false,
            "sources": string,
            "score_version": "0.0.4"
        }

        Rules:
        - All human-readable text (name, ingredients, additives_list, scores.*.rationale, sources) MUST be written in French.
        - Use ONLY the provided data (search results + reduced page snippets). Do NOT invent information.
        - Fields must be null if not explicitly stated, except moisture_percent (see rule below).
        - If moisture_percent is explicitly stated, use that value.
        - If NOT stated, set default moisture_percent based on food_type:
            - kibble → 10
            - wet → 78
            - treat → 30
            - raw → 70
            - air_dried → 5
            - otherwise → null
        - If the product is not clearly dog or cat food, return {"status":"not_animal_food"}.
        - If no reliable product information is found, return {"status":"not_found"}.

        Image rule:
        - image_url MUST be a direct image URL (http/https ending with .jpg/.jpeg/.png/.webp) if any such URL is present in the provided data (page snippets).
        - Prefer the main product packshot image (closest to the product name/brand), otherwise use the first relevant product image found.
        - If no image URL is present in the provided data, set image_url to null (do not invent).

        Scoring constraint:
        - If analytical_composition values are null, scores MUST be based only on ingredients/additives (qualitative).
        - In that case, rationales must explicitly say "évaluation qualitative (sans valeurs analytiques)".
        - Do NOT imply numeric composition exists if analytical_composition is null.

        Scores rules (MANDATORY):
        - If status="ok", you MUST compute ALL scores.*.pt and scores.*.pct (integers) and a French rationale (1-2 sentences).
        - The rule "Fields must be null if not explicitly stated" does NOT apply to scores (scores are an evaluation).
        - pt MUST be an integer between 0 and the max for that criterion.
        - pct MUST be round(pt / max * 100).
        - Never output "Pas d'information disponible" for scores when analytical_composition or ingredients are present.

        Score maximums (max):
        - protein_content: 20
        - fat_content: 10
        - carbohydrate_content: 10
        - fiber_content: 5
        - ingredient_quality: 15
        - protein_source_quality: 15
        - byproducts_presence: 10
        - chemical_additives: 10
        - beneficial_additives: 5
    `.trim();
}

async function analyzeProductBarcode(barcode) {
    console.log(`🚀 [Analysis] barcode=${barcode} (WEB ONLY)`);

    // 1) SerpAPI top 5
    const searchResults = await serpSearchTop(barcode, 5);

    // 2) Fetch pages, skip errors, keep up to N valid pages
    const MAX_VALID_PAGES = 3; // safe tokens
    const pages = [];
    let image_url = null;

    for (const r of searchResults) {
        if (pages.length >= MAX_VALID_PAGES) break;

        const page = await fetchAndReducePage(r.url);

        if (!page.reduced_text) {
            console.log(`➡️  [Analysis] Skipping ${r.url} (status=${page.status}, error=${page.error})`);
            continue;
        }

        pages.push({
            url: r.url,
            title: r.title,
            snippet: r.snippet || null,
            reduced_text: page.reduced_text,
            status: page.status || null,
            error: page.error || null,
            image_candidates: page.image_candidates || [],
        });

        if (!image_url && page.image_candidates?.length) {
            image_url = page.image_candidates[0];
            console.log(`🖼️ [Analysis] Selected image_url: ${image_url}`);
        }

        console.log(`✅ [Analysis] Kept page ${pages.length}/${MAX_VALID_PAGES}: ${r.url}`);
    }

    if (pages.length === 0) {
        console.warn("⚠️ [Analysis] No usable pages fetched. Falling back to search snippets only.");
        // on laisse le LLM tenter avec les snippets
    }

    const userPayload = {
        barcode,
        openpetfoodfacts: null,
        image_url_suggestion: image_url,
        search_results: searchResults,
        pages,
    };

    const userStr = JSON.stringify(userPayload);
    const systemStr = buildSystemPromptCompact();

    console.log("ℹ️ [Analysis] system chars:", systemStr.length, "user chars:", userStr.length);

    const raw = await callGroqChat([
        { role: "system", content: systemStr },
        { role: "user", content: userStr },
    ]);


    const parsed = JSON.parse(raw);
    if (parsed?.status === "ok" && !parsed.image_url && image_url) {
        parsed.image_url = image_url;
    }
    return parsed;
}

module.exports = { analyzeProductBarcode };
