import { GoogleGenerativeAI, Chat, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GEMINI_MODEL_NAME, IMAGEN_MODEL_NAME, getSystemInstruction } from './constants'; // Path changed
import { GeminiApiResponse } from './types'; // Path changed

let ai: GoogleGenerativeAI | undefined; 
let initializationError: string | null = null;

try {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please ensure it is configured in your environment.");
  }
  ai = new GoogleGenerativeAI(process.env.API_KEY); 
} catch (error) {
  console.error("Failed to initialize GoogleGenerativeAI:", error);
  initializationError = error instanceof Error ? error.message : "An unknown error occurred during AI service initialization.";
  ai = undefined;
}

export const isAIServiceInitialized = (): boolean => !!ai;
export const getAIServiceInitializationError = (): string | null => initializationError;

const parseGeminiJsonResponse = (jsonString: string): GeminiApiResponse | null => {
  let cleanJsonString = jsonString.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanJsonString.match(fenceRegex);
  if (match && match[1]) {
    cleanJsonString = match[1].trim();
  }

  try {
    const parsed = JSON.parse(cleanJsonString);
    if (parsed && typeof parsed.description === 'string' && Array.isArray(parsed.choices) && typeof parsed.imagePrompt === 'string') {
      const allChoicesValid = parsed.choices.every((c: any) => typeof c.text === 'string' && typeof c.action === 'string');
      if (!allChoicesValid && parsed.choices.length > 0 && !(parsed.gameOver && parsed.choices.length === 0)) {
         console.warn("Some choices have invalid structure:", parsed.choices);
      }
      return parsed as GeminiApiResponse;
    }
    console.error("Parsed JSON does not match expected GeminiApiResponse structure:", parsed);
    return null;
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", e, "Raw string:", jsonString);
    return null;
  }
};

export const createAdventureChat = async (theme: string): Promise<Chat | null> => {
  if (!ai) {
    console.error("GoogleGenerativeAI not initialized. Cannot create chat.");
    return null;
  }
  try {
    const model = ai.getGenerativeModel({ 
        model: GEMINI_MODEL_NAME,
        systemInstruction: getSystemInstruction(theme),
        generationConfig: { responseMimeType: "application/json" }
    });
    const chat = model.startChat({ 
       history: [], 
       safetySettings: [ 
           { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
           { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
           { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
           { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
       ]
    });
    return chat;
  } catch (error) {
    console.error("Error creating Gemini chat session:", error);
    return null;
  }
};

export const sendAdventureCommand = async (chat: Chat, command: string): Promise<GeminiApiResponse | null> => {
  if (!ai) return null;
  try {
    const result = await chat.sendMessage(command); 
    const response = result.response; 
    const rawText = response.text(); 
    if (!rawText) {
      console.error("Gemini response text is empty.");
      return null;
    }
    return parseGeminiJsonResponse(rawText);
  } catch (error) {
    console.error("Error sending command to Gemini:", error);
    return null;
  }
};

export const generateAdventureImage = async (prompt: string): Promise<string | null> => {
  if (!ai) return null;
  try {
    console.warn("Imagen functionality (generateAdventureImage) is currently a placeholder and needs review against the correct Google AI SDK for image generation.");
    return "data:image/jpeg;base64,PLACEHOLDER_IMAGE_DATA"; 
  } catch (error) {
    console.error("Error generating image with Imagen:", error);
    return null;
  }
};
