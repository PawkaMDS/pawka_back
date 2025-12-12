const axios = require("axios");
const { callGroqChat } = require("../utils/groqClient");
const { searchProductByBarcode, fetchHtmlForUrls } = require("./webSearchService");

/**
 * Appelle l'API Open Pet Food Facts pour un code-barres donné.
 */
async function fetchFromOpenPetFoodFacts(barcode) {
    const url = `https://world.openpetfoodfacts.org/api/v2/product/${barcode}.json`;
    console.log(`🔍 [OPFF] Fetching product from ${url}`);

    try {
        const res = await axios.get(url, { timeout: 15000 });
        console.log("✅ [OPFF] Response received.");
        return res.data;
    } catch (error) {
        console.error("❌ [OPFF] Error while calling Open Pet Food Facts:", error?.response?.data || error.message);
        throw new Error("OpenPetFoodFacts API error");
    }
}

/**
 * Construit le system prompt "prod" que tu as défini, mais adapté :
 * on enlève la partie "va chercher sur le net" et on dit : "voici les données OPFF".
 */
function buildSystemPrompt() {
    return `
        Tu es un agent spécialisé dans l’analyse d’aliments pour animaux (chiens et chats). À partir d’un code-barres et de données déjà fournies (par exemple issues d’Open Pet Food Facts), ta mission est :

        1. Identifier si le produit est un aliment pour animaux.
        2. Extraire et normaliser un maximum d’informations à partir des données fournies.
        3. Calculer les scores nutritionnels selon les barèmes décrits.
        4. Retourner uniquement un objet JSON strictement conforme aux formats définis ci-dessous.
        5. Ne jamais retourner de texte hors JSON.

        IMPORTANT :
        - Tu NE peux PAS appeler toi-même des APIs ni faire de recherche web.
        - Toutes les données externes (Open Pet Food Facts, autres sources) te sont déjà fournies dans le message utilisateur sous forme de JSON.
        - Si les données fournies sont insuffisantes pour déterminer clairement le produit, tu dois renvoyer "not_found" ou "not_animal_food" selon le cas.

        FORMAT DE SORTIE :

        Tu dois renvoyer exactement un des trois JSON suivants :

        Cas 1 : produit animalier trouvé

        {
            "status": "ok",
            "code_ean": "string",
            "name": "string",
            "brand": "string",
            "image_url": "string|null",
            "is_verified": false,
            "product_type": "food",
            "animal_type": "dog|cat",
            "food_type": "kibble|wet|treat|raw|air_dried|baked|other",
            "life_stage": "puppy|adult|senior|kitten|null",
            "is_for_sterilised": true,
            "breed_size": "toy|small|medium|large|giant|null",
            "ingredients": "string",
            "additives_list": "string|null",
            "analytical_composition": {
                "protein_percent": 0,
                "fat_percent": 0,
                "fiber_percent": 0,
                "carbs_percent": null,
                "ash_percent": null,
                "moisture_percent": null,
                "energy_kcal_per_kg": null
            },
            "sources": "string",
            "scores": {
                "protein_content": { "pt": 0, "pct": 0, "rationale": "string" },
                "fat_content": { "pt": 0, "pct": 0, "rationale": "string" },
                "carbohydrate_content": { "pt": 0, "pct": 0, "rationale": "string" },
                "fiber_content": { "pt": 0, "pct": 0, "rationale": "string" },
                "ingredient_quality": { "pt": 0, "pct": 0, "rationale": "string" },
                "protein_source_quality": { "pt": 0, "pct": 0, "rationale": "string" },
                "byproducts_presence": { "pt": 0, "pct": 0, "rationale": "string" },
                "chemical_additives": { "pt": 0, "pct": 0, "rationale": "string" },
                "beneficial_additives": { "pt": 0, "pct": 0, "rationale": "string" }
            }
        }

        Cas 2 : produit trouvé mais pas animalier

        { "status": "not_animal_food" }

        Cas 3 : aucun produit exploitable pour ce code-barres

        { "status": "not_found" }

        DONNÉES FOURNIES DANS LE MESSAGE UTILISATEUR :

        Le message utilisateur contiendra un JSON de ce type :

        {
        "barcode": "string",
        "openpetfoodfacts": { ... }
        }

        - "barcode" : le code EAN à analyser.
        - "openpetfoodfacts" : la réponse brute de l’API Open Pet Food Facts pour ce code-barres, ou null si l’appel a échoué.

        Tu dois :
        - Utiliser ces données pour décider si le produit est un aliment pour animaux (chien ou chat).
        - Si ce n’est manifestement pas un aliment pour animaux (par exemple cosmétique, produit ménager, etc.), renvoyer { "status": "not_animal_food" }.
        - Si les données sont trop incomplètes pour identifier le produit, renvoyer { "status": "not_found" }.

        RÈGLES DE REMPLISSAGE :

        analytical_composition :
        - Toujours inclure les 7 clés : protein_percent, fat_percent, fiber_percent, carbs_percent, ash_percent, moisture_percent, energy_kcal_per_kg.
        - Utiliser les valeurs EXACTES trouvées dans les données (étiquette, champs nutriments, etc.) si disponibles.
        - Utiliser null si l'information n’est pas disponible.
        - Ne jamais estimer les glucides : carbs_percent = null sauf si explicitement fourni.

        ingredients :
        - Texte brut exact dérivé de la liste d’ingrédients (conserve l’ordre et le libellé autant que possible).

        additives_list :
        - Texte brut listant les additifs s’ils sont identifiés dans les données (section additives), sinon null.

        animal_type :
        - "dog" ou "cat" selon les données (mots-clés dans le nom, catégories, etc.).
        - Si tu ne peux pas déterminer l’animal cible, considère que ce n’est pas exploitable et renvoie "not_animal_food".

        food_type :
        - "kibble", "wet", "treat", "raw", "air_dried", "baked", "other".
        - Déduire à partir des informations disponibles (type, nom, catégories).

        life_stage :
        - "puppy", "adult", "senior", "kitten", ou null si non précisé.

        is_for_sterilised :
        - true si le produit cible explicitement les animaux stérilisés (stérilisé/sterilised/neutered).
        - false si le produit cible explicitement un autre profil.
        - null si ce n’est pas mentionné.

        breed_size :
        - Catégorie de taille pour chien : "toy", "small", "medium", "large", "giant" si discernable, sinon null.

        scores :
        Pour chaque critère, produire :
        - pt = entier entre 0 et le maximum défini pour ce critère.
        - pct = round(pt / max * 100).
        - rationale = explication courte (1–2 phrases) basée sur les données (analyse nutritionnelle, ingrédients, additifs, etc.).

        Barèmes :
        - protein_content : 20
        - fat_content : 10
        - carbohydrate_content : 10
        - fiber_content : 5
        - ingredient_quality : 15
        - protein_source_quality : 15
        - byproducts_presence : 10
        - chemical_additives : 10
        - beneficial_additives : 5

        sources :
        - Lister les sources utilisées (ex : "Open Pet Food Facts (barcode XXX)"), séparées par ";".

        CONTRAINTES FINALES :
        - Retourner uniquement un JSON, sans texte autour.
        - Respecter strictement les formats décrits.
        - Si un doute sérieux existe sur la nature alimentaire du produit, renvoyer { "status": "not_animal_food" }.
    `.trim();
}

/**
 * Analyse un code-barres :
 * - appelle OPFF
 * - envoie les données + le code-barres à Groq
 * - retourne l'objet JSON parsé
 */
async function analyzeProductBarcode(barcode) {
    console.log(`🚀 [Analysis] Starting analysis for barcode ${barcode}`);

    // 1) OPFF
    const opffData = await fetchFromOpenPetFoodFacts(barcode);

    // 2) Recherche web via SerpAPI
    const searchResults = await searchProductByBarcode(barcode);
    const webPages = await fetchHtmlForUrls(searchResults);

    const systemPrompt = buildSystemPrompt();

    const userContent = {
        barcode,
        openpetfoodfacts: opffData,
        web_sources: webPages,
    };

    console.log("🧠 [Analysis] Sending data to Groq...");
    const rawContent = await callGroqChat([
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userContent) },
    ]);

    console.log("📥 [Analysis] Raw Groq content:", rawContent);

    let parsed;
    try {
        parsed = JSON.parse(rawContent);
    } catch (e) {
        console.error("❌ [Analysis] Failed to parse Groq JSON:", e.message);
        throw new Error("Invalid JSON returned by Groq");
    }

    console.log("✅ [Analysis] Parsed result.status:", parsed.status);
    return parsed;
}

module.exports = {
    analyzeProductBarcode,
};