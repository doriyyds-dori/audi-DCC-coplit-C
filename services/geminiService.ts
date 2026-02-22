import { GoogleGenAI, Chat } from "@google/genai";
import { DOJO_SYSTEM_INSTRUCTION } from "../constants";

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

let dojoChat: Chat | null = null;

export const generateSummaryEnhancement = async (data: any): Promise<{profile: string, record: string, plan: string}> => {
  const resp = await fetch('/api/ams/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AMS生成失败: ${text}`);
  }
  const json = await resp.json();
  return { profile: json.profile, record: json.record, plan: json.plan };
};

export const startDojoSession = async (): Promise<string> => {
  try {
    const ai = getAI();
    dojoChat = ai.chats.create({ model: 'gemini-3-pro-preview', config: { systemInstruction: DOJO_SYSTEM_INSTRUCTION } });
    const response = await dojoChat.sendMessage({ message: "你好，你是陈先生。请开始我们的对话。" });
    return response.text || "你好。";
  } catch {
    return "AI 陪练暂时离线，请重试。";
  }
};

export const sendDojoMessage = async (message: string): Promise<string> => {
  try {
    if (!dojoChat) await startDojoSession();
    if (!dojoChat) throw new Error("Failed to initialize chat");
    const response = await dojoChat.sendMessage({ message });
    return response.text || "我不清楚你在说什么。";
  } catch {
    return "通信失败，请检查连接。";
  }
};
