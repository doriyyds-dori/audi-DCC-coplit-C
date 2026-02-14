
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { DOJO_SYSTEM_INSTRUCTION } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;

export const startDojoSession = async (): Promise<string> => {
  try {
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction: DOJO_SYSTEM_INSTRUCTION, temperature: 0.9 },
    });
    const response = await chatSession.sendMessage({ message: "喂？" });
    return response.text || "喂？";
  } catch (error) {
    return "系统错误。";
  }
};

export const sendDojoMessage = async (userMessage: string): Promise<string> => {
  if (!chatSession) return "错误：会话未开始。";
  try {
    const response = await chatSession.sendMessage({ message: userMessage });
    return response.text || "...";
  } catch (error) {
    return "通话中断。";
  }
};

/**
 * 结构化生成 AMS 记录，全面适配异常与正常通话结果
 */
export const generateSummaryEnhancement = async (data: any): Promise<{profile: string, record: string, plan: string}> => {
  try {
    const prompt = `
      你是一个奥迪DCC中心的高级CRM专家。请根据以下通话原始数据生成标准的【AMS系统记录】。
      
      上下文信息:
      - 客户基础: ${data.name}${data.gender}, 咨询车型: ${data.series}
      - 通话轨迹日志: 
      ${data.logs}
      
      关键判定结果: 
      ${data.outcome === 'APPOINTED' ? '【成功邀约】客户已同意大致的进店时间' : 
        data.outcome === 'UNDECIDED' ? '【待定】客户暂时无法确定进店时间或表示再看看' : 
        '【异常/未接通】通话未正常进行或被异常中断'}

      生成要求:
      1. profile: 客户画像。提取核心需求、性格标签、购买意向等级。如果是异常状态，注明具体异常原因。
      2. record: 通话总结。概括沟通的核心痛点、异议点及处理结果。
      3. plan: 跟进计划。必须具体！若是“已约”，计划应包含发送定位和提醒；若是“待定”，应包含下一次尝试触达的时间建议。

      请直接返回 JSON 格式，不要有任何 Markdown 标记。
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profile: { type: Type.STRING },
            record: { type: Type.STRING },
            plan: { type: Type.STRING }
          },
          required: ["profile", "record", "plan"]
        }
      }
    });

    const text = response.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (error) {
    console.error("AMS Generation Error:", error);
    return {
      profile: "无法获取画像",
      record: "AI 整理失败，请参考操作轨迹日志进行手动整理。",
      plan: "建议尽快补录下一步动作。"
    };
  }
};
