import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const interpretRoll = async (results: number[]): Promise<string> => {
  if (!ai) {
    return "API Anahtarı bulunamadı.";
  }

  const total = results.reduce((a, b) => a + b, 0);
  const diceCount = results.length;

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Sen fantastik bir zindan efendisisin (Dungeon Master) veya mistik bir falcısın.
      Kullanıcı ${diceCount} adet zar attı.
      Gelen zarlar: ${results.join(', ')}.
      Toplam: ${total}.
      
      Bu atış için tek cümlelik, Türkçe, eğlenceli, biraz mistik veya RPG temalı bir "kader yorumu" yap.
      Eğer toplam çok düşükse (zar başına ortalama 1-2) başarısızlık veya şanssızlık vurgusu yap.
      Eğer toplam çok yüksekse (zar başına ortalama 5-6) büyük zafer veya şans vurgusu yap.
      Sadece yorumu döndür, başka metin ekleme.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.8
      }
    });

    return response.text?.trim() || "Kaderin sisli...";
  } catch (error) {
    console.error("Gemini interpretation failed:", error);
    return "Ruhlar şu an sessiz...";
  }
};