import { getSymptomAnalysis } from "../services/openaiService.js";

// ──────────────────────────────────────────────
//  Fallback Symptom Database (keyword-matching)
// ──────────────────────────────────────────────

const symptomDatabase = [
  {
    keywords: ["chest pain", "chest tightness", "chest pressure"],
    conditions: ["Angina", "Acid Reflux (GERD)", "Costochondritis"],
    analysis:
      "Chest pain can have several causes ranging from heart-related conditions to digestive issues. If the pain is sudden, severe, or accompanied by shortness of breath, sweating, or arm/jaw pain, seek emergency care immediately.",
    severity: "High",
    specialist: "Cardiologist",
    remedies: [
      "Rest and avoid physical exertion",
      "Take slow, deep breaths",
      "Chew an aspirin if you suspect a heart issue (and call emergency services)",
    ],
  },
  {
    keywords: ["headache", "head pain", "migraine", "head hurts"],
    conditions: ["Tension Headache", "Migraine", "Sinusitis"],
    analysis:
      "Headaches are very common and usually not serious. Tension headaches feel like a band around the head, while migraines often come with nausea and light sensitivity. Frequent or severe headaches should be evaluated.",
    severity: "Low to Medium",
    specialist: "Neurologist",
    remedies: [
      "Stay hydrated and rest in a dark, quiet room",
      "Apply a cold compress to your forehead",
      "Over-the-counter pain relief (paracetamol or ibuprofen)",
    ],
  },
  {
    keywords: ["skin rash", "rash", "itching", "itchy skin", "hives"],
    conditions: ["Allergic Dermatitis", "Eczema", "Urticaria (Hives)"],
    analysis:
      "Skin rashes can be caused by allergies, infections, or autoimmune conditions. Note when it started, if anything new was used (soap, food, medication), and whether it's spreading.",
    severity: "Low to Medium",
    specialist: "Dermatologist",
    remedies: [
      "Avoid scratching the affected area",
      "Apply calamine lotion or hydrocortisone cream",
      "Take an antihistamine (e.g. cetirizine) for itching",
    ],
  },
  {
    keywords: ["fever", "temperature", "chills", "feeling hot"],
    conditions: ["Viral Infection", "Bacterial Infection", "Dengue Fever"],
    analysis:
      "Fever is your body's natural response to infection. A temperature above 100.4 F (38 C) is considered a fever. Monitor for additional symptoms like body aches, rash, or persistent high fever lasting more than 3 days.",
    severity: "Medium",
    specialist: "General Physician",
    remedies: [
      "Rest well and stay hydrated (water, soup, electrolytes)",
      "Take paracetamol to reduce fever",
      "Use a damp cloth on the forehead for comfort",
    ],
  },
  {
    keywords: ["cough", "coughing", "sore throat", "throat pain", "dry cough"],
    conditions: ["Common Cold", "Pharyngitis", "Bronchitis"],
    analysis:
      "A cough or sore throat is often caused by viral infections and usually resolves within 1 to 2 weeks. A persistent cough lasting more than 3 weeks, or one producing blood, requires medical evaluation.",
    severity: "Low",
    specialist: "General Physician",
    remedies: [
      "Gargle with warm salt water",
      "Drink warm fluids (honey and lemon tea)",
      "Use throat lozenges for soothing relief",
    ],
  },
  {
    keywords: ["stomach pain", "abdominal pain", "belly ache", "stomach ache", "stomach cramps"],
    conditions: ["Gastritis", "Irritable Bowel Syndrome", "Food Poisoning"],
    analysis:
      "Stomach pain can originate from digestive issues, infections, or stress. Note the location of pain (upper, lower, left, right) and any related symptoms like vomiting or diarrhea. Sharp or persistent pain needs medical attention.",
    severity: "Medium",
    specialist: "General Physician",
    remedies: [
      "Eat light, bland foods (rice, toast, bananas)",
      "Avoid spicy, oily, or heavy meals",
      "Stay hydrated with small sips of water or oral rehydration salts",
    ],
  },
  {
    keywords: ["back pain", "lower back", "back ache", "spine pain"],
    conditions: ["Muscle Strain", "Herniated Disc", "Poor Posture"],
    analysis:
      "Back pain is one of the most common complaints. It's usually caused by muscle strain, poor posture, or prolonged sitting. If pain radiates down your legs, causes numbness, or follows an injury, consult a specialist.",
    severity: "Low to Medium",
    specialist: "Orthopedic Surgeon",
    remedies: [
      "Apply a hot or cold pack to the affected area",
      "Gentle stretching and avoid heavy lifting",
      "Maintain good posture and take breaks from sitting",
    ],
  },
  {
    keywords: ["breathing", "shortness of breath", "breathless", "difficulty breathing", "wheezing"],
    conditions: ["Asthma", "Anxiety/Panic Attack", "Pneumonia"],
    analysis:
      "Difficulty breathing can range from mild (anxiety-related) to life-threatening (asthma attack, pneumonia). If you experience sudden severe breathlessness, bluish lips, or chest pain, seek emergency help immediately.",
    severity: "High",
    specialist: "Pulmonologist",
    remedies: [
      "Sit upright and try slow, controlled breathing",
      "Use a prescribed inhaler if you have asthma",
      "Move to an area with fresh air and avoid smoke/dust",
    ],
  },
  {
    keywords: ["eye pain", "blurry vision", "red eye", "eye irritation", "watery eyes"],
    conditions: ["Conjunctivitis", "Eye Strain", "Dry Eye Syndrome"],
    analysis:
      "Eye discomfort can be caused by infections, prolonged screen use, allergies, or dry air. If you notice sudden vision changes, severe pain, or discharge, see a doctor promptly.",
    severity: "Low to Medium",
    specialist: "ENT Specialist",
    remedies: [
      "Rest your eyes and follow the 20-20-20 rule",
      "Use lubricating eye drops for dryness",
      "Avoid rubbing your eyes and wash hands frequently",
    ],
  },
  {
    keywords: ["anxiety", "stress", "panic", "depression", "sad", "worried", "can't sleep", "insomnia"],
    conditions: ["Generalized Anxiety Disorder", "Depression", "Insomnia"],
    analysis:
      "Mental health symptoms like persistent anxiety, low mood, or sleep difficulties are very common and treatable. It's important to seek support and speak with a professional.",
    severity: "Medium",
    specialist: "Psychiatrist",
    remedies: [
      "Practice deep breathing or meditation for 10 minutes daily",
      "Maintain a regular sleep schedule and limit screen time before bed",
      "Talk to a trusted person about how you're feeling",
    ],
  },
  {
    keywords: ["joint pain", "knee pain", "swollen joint", "arthritis", "stiff joints"],
    conditions: ["Osteoarthritis", "Rheumatoid Arthritis", "Gout"],
    analysis:
      "Joint pain can result from wear-and-tear, inflammation, or injury. Swelling, redness, or warmth around a joint may suggest an inflammatory condition. Persistent or worsening pain should be evaluated.",
    severity: "Medium",
    specialist: "Orthopedic Surgeon",
    remedies: [
      "Rest the affected joint and avoid strenuous activity",
      "Apply ice for 15 to 20 minutes to reduce swelling",
      "Over-the-counter anti-inflammatory medication (ibuprofen)",
    ],
  },
  {
    keywords: ["ear pain", "ear ache", "hearing loss", "ringing ear", "tinnitus"],
    conditions: ["Ear Infection (Otitis Media)", "Earwax Buildup", "Tinnitus"],
    analysis:
      "Ear pain is commonly caused by infections or fluid buildup, especially after a cold. Ringing sounds can be related to noise exposure or stress. See a specialist if symptoms persist beyond a few days.",
    severity: "Low to Medium",
    specialist: "ENT Specialist",
    remedies: [
      "Apply a warm compress against the ear for relief",
      "Avoid inserting objects into the ear canal",
      "Over-the-counter pain relief if needed",
    ],
  },
  {
    keywords: ["urination", "burning urine", "frequent urination", "blood in urine", "uti"],
    conditions: ["Urinary Tract Infection (UTI)", "Kidney Stones", "Bladder Infection"],
    analysis:
      "Burning or frequent urination often points to a urinary tract infection, especially in women. Blood in urine or severe flank pain can indicate kidney stones. These conditions require medical treatment.",
    severity: "Medium to High",
    specialist: "Urologist",
    remedies: [
      "Drink plenty of water to flush out bacteria",
      "Avoid caffeine and alcohol which can irritate the bladder",
      "See a doctor because antibiotics are usually needed for UTIs",
    ],
  },
  {
    keywords: ["toothache", "tooth pain", "gum pain", "bleeding gums", "dental"],
    conditions: ["Dental Cavity", "Gingivitis", "Tooth Abscess"],
    analysis:
      "Tooth or gum pain is usually caused by decay, infection, or gum disease. Throbbing pain, swelling, or fever alongside a toothache may indicate an abscess that needs urgent dental care.",
    severity: "Low to Medium",
    specialist: "General Physician",
    remedies: [
      "Rinse mouth with warm salt water",
      "Apply clove oil to the painful area for temporary relief",
      "Take over-the-counter pain relief and see a dentist soon",
    ],
  },
  {
    keywords: ["vomiting", "nausea", "throwing up", "feeling sick", "diarrhea"],
    conditions: ["Food Poisoning", "Gastroenteritis", "Motion Sickness"],
    analysis:
      "Nausea and vomiting are often caused by infections, food poisoning, or motion sickness. If vomiting is persistent, contains blood, or you cannot keep fluids down for more than 24 hours, seek medical help.",
    severity: "Medium",
    specialist: "General Physician",
    remedies: [
      "Sip small amounts of clear fluids frequently",
      "Avoid solid food until vomiting stops, then eat bland foods",
      "Rest and avoid strong odors that may trigger nausea",
    ],
  },
];

// ──────────────────────────────────────────────
//  Fallback — keyword-matching response
// ──────────────────────────────────────────────

const fallbackResponse = (symptoms) => {
  const lower = symptoms.toLowerCase();
  const inputWords = lower.split(/\s+/);

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of symptomDatabase) {
    let entryScore = 0;

    for (const keyword of entry.keywords) {
      const keywordWords = keyword.split(/\s+/);
      const allWordsFound = keywordWords.every((kw) =>
        inputWords.some((iw) => iw.includes(kw) || kw.includes(iw))
      );

      if (allWordsFound) entryScore += 1;
    }

    if (entryScore > bestScore) {
      bestScore = entryScore;
      bestMatch = entry;
    }
  }

  if (!bestMatch) {
    return {
      analysis:
        "I couldn't identify a specific condition from your description. Please describe the symptom location, duration, severity, and any fever, pain, rash, cough, or other related signs.",
      recommendedDoctor: "General Physician",
      severity: "Unknown",
      possibleConditions: [],
      homeRemedies: [
        "Stay hydrated and get adequate rest",
        "Monitor your symptoms and note any changes",
        "Visit a doctor if symptoms persist or worsen",
      ],
    };
  }

  return {
    reply: `Based on what you described${bestMatch ? ", here's some guidance." : "."} If anything gets worse or feels urgent, seek medical care.`,
    analysis: bestMatch.analysis,
    recommendedDoctor: bestMatch.specialist,
    severity: bestMatch.severity,
    possibleConditions: bestMatch.conditions,
    homeRemedies: bestMatch.remedies,
  };
};

// ──────────────────────────────────────────────
//  Route Handler
// ──────────────────────────────────────────────

export const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, messages = [] } = req.body;

    if (!symptoms?.trim()) {
      return res.status(400).json({ message: "Symptoms required" });
    }

    const trimmedSymptoms = symptoms.trim();
    let fallbackReason = "";

    // ── Try OpenAI service first ──
    try {
      const aiResult = await getSymptomAnalysis(trimmedSymptoms, messages);
      const fallback = fallbackResponse(trimmedSymptoms);

      if (aiResult) {
        return res.json({
          source: "ai",
          reply: aiResult.reply || fallback.reply,
          analysis: aiResult.analysis || fallback.analysis,
          recommendedDoctor:
            aiResult.recommendedDoctor || fallback.recommendedDoctor,
          severity: aiResult.severity || fallback.severity,
          possibleConditions: Array.isArray(aiResult.possibleConditions)
            ? aiResult.possibleConditions
            : fallback.possibleConditions,
          homeRemedies: Array.isArray(aiResult.homeRemedies)
            ? aiResult.homeRemedies
            : fallback.homeRemedies,
        });
      }
    } catch (aiError) {
      console.log("OpenAI service failed, using fallback:", aiError.message);
      fallbackReason = aiError.message;
    }

    // ── Fallback to keyword matching ──
    return res.json({
      source: "fallback",
      reason: fallbackReason || "AI provider unavailable",
      ...fallbackResponse(trimmedSymptoms),
    });
  } catch (error) {
    console.log("Symptom check error:", error);
    res.status(500).json({ message: "AI Check Error" });
  }
};
