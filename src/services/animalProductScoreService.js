// services/animalProductScoreService.js
const { callGroqChat } = require("../utils/groqClient");

function buildSystemPromptAdaptation() {
    return `
    Return ONLY valid JSON. No extra text.

    You must output exactly:
    {
        "adapted": true,
        "scores": {
            "protein_content": { "pt": int, "pct": int, "rationale": "string" },
            "fat_content": { "pt": int, "pct": int, "rationale": "string" },
            "carbohydrate_content": { "pt": int, "pct": int, "rationale": "string" },
            "fiber_content": { "pt": int, "pct": int, "rationale": "string" },
            "ingredient_quality": { "pt": int, "pct": int, "rationale": "string" },
            "protein_source_quality": { "pt": int, "pct": int, "rationale": "string" },
            "byproducts_presence": { "pt": int, "pct": int, "rationale": "string" },
            "chemical_additives": { "pt": int, "pct": int, "rationale": "string" },
            "beneficial_additives": { "pt": int, "pct": int, "rationale": "string" }
        }
    }

    Rules:
    - All rationales MUST be in French.
    - Use ONLY the provided payload. Do NOT invent product facts.
    - Adapt scoring to the animal profile (age, weight, sterilized, breed_size if present).
    - pt maximums:
        protein_content max 20
        fat_content max 10
        carbohydrate_content max 10
        fiber_content max 5
        ingredient_quality max 15
        protein_source_quality max 15
        byproducts_presence max 10
        chemical_additives max 10
        beneficial_additives max 5
    - pct = round(pt / max * 100)
    `.trim();
}

async function adaptScoresToAnimalProfile({ rid, animal, product }) {
    const raw = await callGroqChat([
        { role: "system", content: buildSystemPromptAdaptation() },
        { role: "user", content: JSON.stringify({ rid, animal, product }) },
    ]);

    const parsed = JSON.parse(raw);

    if (!parsed || parsed.adapted !== true || !parsed.scores) {
        throw new Error("Réponse LLM invalide (adaptation)");
    }

    return parsed.scores;
}

module.exports = { adaptScoresToAnimalProfile };
