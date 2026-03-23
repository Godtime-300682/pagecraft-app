import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient() {
  const key = localStorage.getItem('geminiKey');
  if (!key) throw new Error('API Key não encontrada. Faça login novamente.');
  return new GoogleGenerativeAI(key);
}

export async function generateWithGemini(prompt, onStream) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  if (onStream) {
    const result = await model.generateContentStream(prompt);
    let text = '';
    for await (const chunk of result.stream) {
      text += chunk.text();
      onStream(text);
    }
    return text;
  } else {
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export async function validateApiKey(key) {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    await model.generateContent("Olá, teste de conexão. Responda apenas: OK");
    return true;
  } catch {
    return false;
  }
}
