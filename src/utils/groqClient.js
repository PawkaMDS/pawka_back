const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

if (!GROQ_API_KEY) {
    console.warn("⚠️  GROQ_API_KEY is not set in environment variables.");
}

/**
 * Appelle l'API Groq (endpoint OpenAI-compatible) pour obtenir une complétion chat.
 * On force un JSON en sortie.
 */
async function callGroqChat(messages) {
    console.log("🧠 [Groq] Calling chat completions...");

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: GROQ_MODEL,
                messages,
                temperature: 0.1,
                response_format: { type: "json_object" },
            },
            {
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 20000,
            }
        );

        const choice = response.data.choices?.[0]?.message?.content;
        console.log("✅ [Groq] Response received.");
        return choice;
    } catch (error) {
        console.error("❌ [Groq] Error while calling Groq API:", error?.response?.data || error.message);
        throw new Error("Groq API error");
    }
}

module.exports = {
    callGroqChat,
};
