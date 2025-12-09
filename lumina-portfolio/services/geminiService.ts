import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEventDescription = async (title: string, date: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a short, elegant, and inviting description (max 2 sentences) for a photography album event titled "${title}" which took place on ${date}. Focus on capturing memories and emotions.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export const generatePhotoCaption = async (base64Image: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "";

  try {
    // base64Image comes in as "data:image/jpeg;base64,....."
    // We need to strip the prefix for the API
    const data = base64Image.split(',')[1]; 
    const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
            {
                inlineData: {
                    data: data,
                    mimeType: mimeType
                }
            },
            {
                text: "Describe this photo in one short, artistic sentence suitable for a gallery caption."
            }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    return "";
  }
};