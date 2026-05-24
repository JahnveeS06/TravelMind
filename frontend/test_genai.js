import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyAEA_VqODEEBc62ZIxDNN2oqoqb1fucO";
const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are TravelMind, a helpful travel assistant. Context: General travel help. User: Hello`,
      config: {
        systemInstruction: "Keep responses concise, friendly, and helpful for travelers."
      }
    });
    console.log(response.text);
  } catch (e) {
    console.error("ERROR:");
    console.error(e);
  }
}

run();
