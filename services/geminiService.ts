import { AnalysisResult } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = import.meta.env.VITE_GEMINI_API_URL || "https://ai.juguang.chat/v1beta/models/gemini-2.0-flash:generateContent";

if (!API_KEY) {
  throw new Error("請設置 VITE_GEMINI_API_KEY 環境變數");
}

export const generateMandarinQuiz = async (base64Image: string): Promise<AnalysisResult> => {
  console.log("🚀 開始呼叫 Gemini API...");
  console.log("📦 API URL:", API_URL);
  
  try {
    const prompt = `Identify the main object in this image and create a Mandarin quiz. You MUST respond with ONLY valid JSON, no other text.

Tasks:
1. Identify the object (Traditional Chinese).
2. Provide Pinyin with tone marks.
3. Provide English translation.
4. Create exactly 3 questions in this order:

   - **Q1 (initial)**: Ask for the Initial (聲母) of the first character.
     - Options: Correct answer + 3 distinct distractors.
   
   - **Q2 (final)**: Ask for the Final (韻母) of the first character.
     - Options: Correct answer + 3 distinct distractors.

   - **Q3 (tone)**: Ask for the Tone (聲調) of the first character.
     - questionText: "請畫出『[character]』字的聲調符號" (replace [character] with actual character)
     - options: MUST be an empty array []
     - correctOptionId: Must be the tone symbol ONLY: "ˉ", "ˊ", "ˇ", "ˋ" or "˙" (neutral).

Ensure no duplicate distractors in Q1/Q2.

Response format (JSON only):
{
  "detectedObject": "蘋果",
  "pinyin": "píng guǒ",
  "englishMeaning": "apple",
  "questions": [
    {
      "id": 1,
      "type": "initial",
      "questionText": "『蘋』字的聲母是？",
      "options": [
        {"id": "a", "text": "p"},
        {"id": "b", "text": "b"},
        {"id": "c", "text": "m"},
        {"id": "d", "text": "f"}
      ],
      "correctOptionId": "a",
      "explanation": "『蘋』的聲母是 p"
    },
    {
      "id": 2,
      "type": "final",
      "questionText": "『蘋』字的韻母是？",
      "options": [
        {"id": "a", "text": "ing"},
        {"id": "b", "text": "eng"},
        {"id": "c", "text": "ang"},
        {"id": "d", "text": "ong"}
      ],
      "correctOptionId": "a",
      "explanation": "『蘋』的韻母是 ing"
    },
    {
      "id": 3,
      "type": "tone",
      "questionText": "請畫出『蘋』字的聲調符號",
      "options": [],
      "correctOptionId": "ˊ",
      "explanation": "『蘋』是第二聲，聲調符號是 ˊ"
    }
  ]
}`;

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API 錯誤詳情:", errorText);
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("📝 回應內容:", text);
    
    if (!text) {
      throw new Error("No response content from OpenRouter");
    }

    // 清理可能的 markdown 代碼塊
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    // 嘗試修復常見的 JSON 格式錯誤
    cleanedText = cleanedText
      .replace(/\{"id":\s*"([a-z])":\s*"([^"]+)"\}/g, '{"id": "$1", "text": "$2"}') // 修復 {"id": "d": "ui"} -> {"id": "d", "text": "ui"}
      .replace(/,\s*}/g, '}') // 移除尾隨逗號
      .replace(/,\s*]/g, ']'); // 移除尾隨逗號

    let result: AnalysisResult;
    try {
      result = JSON.parse(cleanedText) as AnalysisResult;
    } catch (parseError) {
      console.error("❌ JSON 解析失敗，原始內容:", cleanedText);
      console.error("解析錯誤:", parseError);
      throw new Error("AI 回應格式錯誤，請重試");
    }

    console.log("🎉 成功解析 JSON:", result);
    return result;
  } catch (error) {
    console.error("❌ OpenRouter API Error:", error);
    throw error;
  }
};

export const validateToneDrawing = async (base64Image: string, expectedSymbol: string): Promise<boolean> => {
  try {
    const prompt = `Look at this drawing. Does it represent the Mandarin tone symbol "${expectedSymbol}"?
It might be hand-drawn and messy.

You MUST respond with ONLY valid JSON: { "isMatch": true } or { "isMatch": false }`;

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return false;
    }

    // 清理可能的 markdown 代碼塊
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const result = JSON.parse(cleanedText);
      return result.isMatch === true;
    } catch {
      return false;
    }
  } catch (error) {
    console.error("Validation Error:", error);
    return false;
  }
};
