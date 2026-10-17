import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type { ClassificationResult } from "./types";

const SEATTLE_SYSTEM_INSTRUCTION = `You are OneBin AI, an expert municipal waste sorter strictly adhering to Seattle Public Utilities (SPU) waste sorting regulations.

Your role is to analyze images of discarded items and determine the exact single disposal bin (compost, recycling, or trash) along with the material, rationale, and any necessary contamination or safety warnings.

Seattle Municipal Waste Sorting Rules:
1. COMPOST (🟢 COMPOST):
   - All food scraps (produce, meat, bones, dairy, bread, coffee grounds).
   - Food-soiled paper: napkins, paper towels, greasy pizza boxes, uncoated paper plates.
   - Yard waste, plants, flowers, leaves.
   - Certified BPI-compostable food packaging and certified compostable bags.
   - NEVER put conventional plastic, styrofoam, metal, or glass in compost.

2. RECYCLING (🔵 RECYCLING):
   - Paper & Cardboard: Clean dry paper, mail, newspapers, cardboard boxes (flattened).
   - Metal: Clean aluminum and tin cans, clean foil (balled up).
   - Glass: Clean glass bottles and jars (empty and rinsed).
   - Rigid Plastic: Clean plastic bottles, tubs, jugs, and cups.
   - Items MUST be empty, clean, and dry.

3. TRASH (⚫ TRASH) - CRITICAL SEATTLE SPECIFIC HEURISTICS:
   - PLASTIC BAGS & FILM: Plastic shopping bags, produce bags, ziplocks, bubble wrap, air pillows, chip bags, and candy wrappers MUST GO IN TRASH. Plastic film tangles sorting machines at Seattle recycling facilities.
   - STYROFOAM / FOAM: Polystyrene foam takeout containers, cups, egg cartons, and packing peanuts MUST GO IN TRASH. Expanded polystyrene is not accepted in Seattle curbside recycling or compost.
   - TEXTILES: Clothing, fabrics, and shoes must go in TRASH (unless donated).
   - FOOD-SOILED PLASTIC: If plastic or metal cannot be rinsed clean, it goes in TRASH.
   - BATTERIES & ELECTRONICS: Batteries are hazardous and cannot be processed curbside. Classify as "trash" and ALWAYS attach warning: "🔋 Batteries are hazardous — take to a battery drop-off if you can."
   - LOW CONFIDENCE / AMBIGUITY: If confidence is under 60% or the item is unrecognizable, set lowConfidenceWarning to true. Seattle rule: "When in doubt, trash."
`;

const classificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bin: {
      type: Type.STRING,
      enum: ["compost", "recycling", "trash"],
      description: "The disposal bin strictly following Seattle municipal waste regulations",
    },
    itemName: {
      type: Type.STRING,
      description: "Concise name of the item identified in the image",
    },
    material: {
      type: Type.STRING,
      description: "Primary material composition (e.g., Organic, Aluminum, Rigid HDPE Plastic, Polystyrene, Polyethylene film)",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0.0 and 1.0",
    },
    rationale: {
      type: Type.STRING,
      description: "Precise explanation of why this item belongs in the selected bin under Seattle rules",
    },
    warnings: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Contamination warnings, safety alerts (e.g. battery drop-off), or preparation instructions (e.g. rinse residue)",
    },
    lowConfidenceWarning: {
      type: Type.BOOLEAN,
      description: "True if item identity is ambiguous, degraded, or confidence < 0.60 (Seattle: When in doubt, trash)",
    },
  },
  required: ["bin", "itemName", "material", "confidence", "rationale", "lowConfidenceWarning"],
};

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function classifyWasteImage(
  base64Data: string,
  mimeType = "image/jpeg"
): Promise<ClassificationResult> {
  const ai = getGeminiClient();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // Clean data URL prefix if present
  let cleanBase64 = base64Data;
  let resolvedMimeType = mimeType;

  const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUriMatch) {
    resolvedMimeType = dataUriMatch[1];
    cleanBase64 = dataUriMatch[2];
  }

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          data: cleanBase64,
          mimeType: resolvedMimeType,
        },
      },
      "Analyze this item and classify it for waste sorting according to Seattle municipal rules.",
    ],
    config: {
      systemInstruction: SEATTLE_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: classificationSchema,
    },
  });

  if (!response.text) {
    throw new Error("Gemini API returned an empty response.");
  }

  const result: ClassificationResult = JSON.parse(response.text);

  // Enforce Seattle safety post-processing safeguards
  const lowerItem = (result.itemName || "").toLowerCase();
  const lowerMaterial = (result.material || "").toLowerCase();

  if (
    lowerItem.includes("bag") ||
    lowerItem.includes("film") ||
    lowerMaterial.includes("film") ||
    lowerMaterial.includes("plastic bag")
  ) {
    if (result.bin !== "trash") {
      result.bin = "trash";
      result.rationale = `Seattle rule override: Plastic bags and plastic films must go to trash because they tangle municipal sorting equipment. ${result.rationale}`;
    }
  }

  if (
    lowerItem.includes("styrofoam") ||
    lowerMaterial.includes("styrofoam") ||
    lowerMaterial.includes("expanded polystyrene")
  ) {
    if (result.bin !== "trash") {
      result.bin = "trash";
      result.rationale = `Seattle rule override: Styrofoam and expanded polystyrene cannot be recycled curbside in Seattle and must go in the trash. ${result.rationale}`;
    }
  }

  if (lowerItem.includes("battery") || lowerMaterial.includes("battery")) {
    result.bin = "trash";
    const batteryWarning = "🔋 Batteries are hazardous — take to a battery drop-off if you can.";
    if (!result.warnings) {
      result.warnings = [batteryWarning];
    } else if (!result.warnings.some((w) => w.includes("Batteries are hazardous"))) {
      result.warnings.push(batteryWarning);
    }
  }

  if (result.confidence < 0.6) {
    result.lowConfidenceWarning = true;
  }

  return result;
}
