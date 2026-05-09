import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// ──────────────────────────────────────────────
//  Configuration
// ──────────────────────────────────────────────

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

let openai = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL,
  });
  console.log(`✅ OpenAI service initialized (model: ${OPENAI_MODEL})`);
} else {
  console.log(
    "⚠️  OPENAI_API_KEY not set — AI symptom checker will use fallback mode"
  );
}

// ──────────────────────────────────────────────
//  System Prompt
// ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional, empathetic medical triage assistant built into a Sri Lankan e-channeling (doctor appointment) platform called "Smart E-Channeling".

YOUR ROLE:
- Help patients understand their symptoms and guide them toward the right specialist.
- You are NOT a doctor. You do NOT diagnose. You provide general medical guidance only.

CONVERSATION STYLE:
- Be warm, reassuring, and professional.
- If the patient's description is vague, ask 1-2 focused follow-up questions first before giving an analysis (e.g. "How long have you had this?", "Is there any fever?", "Where exactly is the pain?").
- Once you have enough information, provide a structured analysis.

RESPONSE FORMAT — you MUST always return valid JSON matching this exact shape:
{
  "reply": "A conversational message to the patient. This can include follow-up questions if needed, reassurance, or a summary of guidance. Keep it under 150 words.",
  "analysis": "A concise medical analysis of the described symptoms (2-4 sentences). Explain what the symptoms might indicate in simple language.",
  "recommendedDoctor": "The most appropriate specialist. Must be one of: General Physician, Cardiologist, Neurologist, Dermatologist, Orthopedic Surgeon, ENT Specialist, Urologist, Psychiatrist, Pulmonologist, Pediatrician, Gynecologist, Gastroenterologist, Ophthalmologist, Endocrinologist.",
  "severity": "One of: Low, Low to Medium, Medium, Medium to High, High. (Do NOT use Unknown. Make your best educated guess based on the current symptoms).",
  "possibleConditions": ["Up to 3 possible conditions as strings"],
  "homeRemedies": ["2-4 practical home care suggestions as strings"]
}

RULES:
1. ALWAYS return valid JSON. No markdown, no code fences, no extra text outside the JSON.
2. Never claim a definitive diagnosis — use words like "may", "could", "suggests".
3. If symptoms sound immediately life-threatening (chest pain + breathlessness, stroke signs, severe bleeding), set severity to "High" and tell them to seek emergency care NOW.
4. If the patient provides very little information and you need to ask follow-up questions, still return the full JSON structure. Make an educated guess for the severity (e.g. "Low" or "Low to Medium" for common complaints, "Medium" for more concerning ones). Do not use "Unknown". Fill in basic home remedies and possible conditions based on what little info you have.
5. recommendedDoctor should always be populated with your best guess even if information is limited.
6. Keep possibleConditions between 0 and 3 items.
7. Keep homeRemedies between 2 and 4 items.`;

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

/**
 * Build the messages array for the chat completion, including
 * conversation history and the current user symptoms.
 */
const buildMessages = (symptoms, conversationHistory = []) => {
  // Take only the last 12 messages to stay within context limits
  const recentHistory = Array.isArray(conversationHistory)
    ? conversationHistory.slice(-12)
    : [];

  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...recentHistory.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    {
      role: "user",
      content: symptoms,
    },
  ];
};

/**
 * Parse and validate the JSON response from OpenAI, ensuring all
 * required fields are present with the correct types.
 */
const parseAndValidate = (content) => {
  // Strip markdown code fences if the model wraps the JSON
  let cleaned = content.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  const parsed = JSON.parse(cleaned);

  // Ensure all expected fields exist with correct types
  return {
    reply: typeof parsed.reply === "string" ? parsed.reply : "",
    analysis: typeof parsed.analysis === "string" ? parsed.analysis : "",
    recommendedDoctor:
      typeof parsed.recommendedDoctor === "string"
        ? parsed.recommendedDoctor
        : "General Physician",
    severity: typeof parsed.severity === "string" && parsed.severity !== "Unknown" ? parsed.severity : "Low to Medium",
    possibleConditions: Array.isArray(parsed.possibleConditions)
      ? parsed.possibleConditions.slice(0, 3)
      : [],
    homeRemedies: Array.isArray(parsed.homeRemedies)
      ? parsed.homeRemedies.slice(0, 4)
      : [],
  };
};

// ──────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────

/**
 * Analyse patient symptoms using OpenAI.
 *
 * @param {string}   symptoms             – The patient's symptom description
 * @param {Array}    conversationHistory   – Previous chat messages [{ role, content }]
 * @returns {Object|null} Structured analysis or null if the service is unavailable
 */
export const getSymptomAnalysis = async (
  symptoms,
  conversationHistory = []
) => {
  if (!openai) {
    return null; // No API key configured — caller should use fallback
  }

  const messages = buildMessages(symptoms, conversationHistory);

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    messages,
    response_format: { type: "json_object" },
  });

  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return parseAndValidate(content);
};

/**
 * Quick health-check — returns true when the OpenAI client is configured.
 */
export const isAvailable = () => !!openai;
