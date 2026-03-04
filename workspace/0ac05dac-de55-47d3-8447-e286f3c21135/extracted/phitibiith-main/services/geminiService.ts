import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
// Initialize the client. The key is guaranteed to be available per instructions.
const ai = new GoogleGenAI({ apiKey: apiKey });

export const generateAiSticker = async (prompt: string): Promise<string> => {
  try {
    // We use gemini-2.5-flash-image for general image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Generate a cute, high-quality, die-cut sticker style illustration of: ${prompt}. White background, flat vector art style, vibrant colors.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                // Determine mimeType (usually returns png/jpeg, we assume png for stickers)
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${base64EncodeString}`;
            }
        }
    }
    
    throw new Error("No image data returned from Gemini.");
  } catch (error) {
    console.error("Error generating sticker:", error);
    throw error;
  }
};
