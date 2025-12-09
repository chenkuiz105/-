import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CalendarEvent, EventType, PlanRequest, SchedulingConstraints, GeneratedPlan } from "../types";
import { generateId } from "../utils/helpers";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

const eventSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    start: { type: Type.STRING, description: "ISO 8601 date string" },
    end: { type: Type.STRING, description: "ISO 8601 date string" },
    isRecurring: { type: Type.BOOLEAN },
  },
  required: ["title", "start", "end"]
};

const importResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    events: {
      type: Type.ARRAY,
      items: eventSchema
    },
    summary: { type: Type.STRING }
  }
};

const scheduledEventSchema = {
  type: Type.OBJECT,
  properties: {
    taskId: { type: Type.STRING },
    start: { type: Type.STRING, description: "ISO 8601 date string" },
    end: { type: Type.STRING, description: "ISO 8601 date string" },
    title: { type: Type.STRING },
    reasoning: { type: Type.STRING }
  },
  required: ["start", "end", "title"]
};

const planStrategySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    strategyName: { type: Type.STRING, description: "Name of the strategy (e.g., Interleaved)" },
    description: { type: Type.STRING, description: "Explanation of why this strategy helps" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    scheduledEvents: {
      type: Type.ARRAY,
      items: scheduledEventSchema
    }
  },
  required: ["strategyName", "scheduledEvents"]
};

const multiPlanResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    plans: {
      type: Type.ARRAY,
      items: planStrategySchema,
      description: "Exactly 3 distinct planning strategies"
    }
  }
};

// --- Services ---

export const parseScheduleFile = async (
  fileBase64: string, 
  mimeType: string,
  currentYear: number = new Date().getFullYear()
): Promise<{ events: CalendarEvent[], summary: string }> => {
  
  const prompt = `
    你是一個專業的日程解析助手。
    請分析提供的文件（日曆 PDF、Excel 匯出檔案或圖片）。
    提取所有計劃的事件。
    如果年份缺失，假設當前年份為 ${currentYear}。
    返回一個包含準確 ISO 開始/結束時間的事件列表。
    如果未指定時區，假定為本地時間。
    請確保 'summary' 欄位使用繁體中文返回一個簡短的匯入總結。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: fileBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: importResponseSchema
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Transform to internal CalendarEvent type
    const events: CalendarEvent[] = (result.events || []).map((e: any) => ({
      id: generateId(),
      title: e.title,
      description: e.description || "",
      start: e.start,
      end: e.end,
      type: EventType.FIXED,
      recurrence: e.isRecurring ? "Detected from import" : undefined
    }));

    return {
      events,
      summary: result.summary || `成功匯入 ${events.length} 個事件。`
    };

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw new Error("解析日程文件失敗。");
  }
};

export const generateStudyPlan = async (
  request: PlanRequest
): Promise<GeneratedPlan[]> => {
  
  const { currentEvents, tasks, constraints } = request;

  // Minify data to save tokens
  const simplifiedEvents = currentEvents.map(e => ({
    start: e.start,
    end: e.end,
    title: e.title
  }));

  const simplifiedTasks = tasks.filter(t => t.status === 'pending').map(t => ({
    id: t.id,
    title: t.title,
    minutes: t.estimatedMinutes,
    deadline: t.deadline,
    priority: t.priority
  }));

  const daysChinese = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

  // Generate specific date constraints for the next 7 days
  const today = new Date();
  const dateSpecificAvailability: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayIndex = d.getDay(); // 0 = Sunday
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysChinese[dayIndex];
    
    const slots = constraints.availableSlots[dayIndex];
    
    const ranges: string[] = [];
    let start = -1;
    for (let h = 0; h <= 24; h++) {
      const isActive = h < 24 && slots[h];
      if (isActive && start === -1) {
        start = h;
      } else if (!isActive && start !== -1) {
        ranges.push(`${start.toString().padStart(2, '0')}:00-${h.toString().padStart(2, '0')}:00`);
        start = -1;
      }
    }

    if (ranges.length > 0) {
      dateSpecificAvailability.push(`- ${dateStr} (${dayName}): 僅允許在 [${ranges.join(', ')}] 這些時段內安排。`);
    } else {
      dateSpecificAvailability.push(`- ${dateStr} (${dayName}): 全天禁止安排 (FORBIDDEN)`);
    }
  }

  const availabilityPromptBlock = dateSpecificAvailability.join('\n');

  const prompt = `
    你是一個頂尖的學習規劃 AI 專家 "計畫精靈"。
    
    任務目標：根據用戶的任務列表，生成【三個截然不同的排程策略 (Plan Options)】供用戶選擇。
    
    步驟 1：分析任務語義 (Semantic Analysis)
    - 識別任務的主題 (Subject) (例如：解剖學、生理學、專案A、專案B)。
    - 推斷認知負荷 (Cognitive Load) (例如：背誦、概念理解、練習題)。
    - 識別章節順序 (Sequential order) (例如：Ch1 -> Ch2)。

    步驟 2：生成三種策略 (Strategies)
    請生成以下三種計畫，每種計畫必須包含完整的排程結果：
    
    1. 【交錯學習模式 (Interleaved Scheduling)】
       - 核心邏輯：不同科目的任務必須穿插進行 (例如：解剖 -> 生理 -> 解剖)。
       - 優點：減少大腦疲勞，提升長期記憶。
       
    2. 【連續專注模式 (Sequential Focus)】
       - 核心邏輯：同一科目的任務連續安排，完成一個主題再換下一個。
       - 優點：維持思維連貫性，減少任務切換成本。
       
    3. 【智能負載平衡 (Cognitive Load Aware)】
       - 核心邏輯：將"高認知負荷" (困難/新概念) 的任務安排在每天最早的可用時段 (假設精神最好)。
       - 將"低認知負荷" (複習/簡單) 的任務安排在較晚的時段。
       - 同時考慮截止日期權重。

    【嚴格約束規則 (CRITICAL CONSTRAINTS - 適用於所有策略)】:
    1. 絕對禁止在【每日允許排程時段】之外的時間安排任務。
    2. 絕對不能與【現有日曆事件】重疊。
    3. 每個事件必須有明確的 ISO 開始和結束時間。
    
    上下文數據：
    - 當前基準日期: ${today.toISOString().split('T')[0]}
    
    【每日允許排程時段 (Whitelisted Windows)】:
    ${availabilityPromptBlock}
    
    待安排任務:
    ${JSON.stringify(simplifiedTasks)}

    現有日曆事件 (避開這些時間):
    ${JSON.stringify(simplifiedEvents)}

    輸出要求：
    - 返回 JSON，包含 'plans' 數組，內含 3 個策略物件。
    - 所有文字 (strategyName, description, reasoning) 請使用繁體中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: multiPlanResponseSchema
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    if (!result.plans || !Array.isArray(result.plans)) {
      throw new Error("Invalid AI response structure");
    }

    // Transform API response to internal types
    const generatedPlans: GeneratedPlan[] = result.plans.map((plan: any) => ({
      id: generateId(),
      strategyName: plan.strategyName,
      description: plan.description,
      tags: plan.tags || [],
      events: (plan.scheduledEvents || []).map((e: any) => ({
        id: generateId(),
        title: `[${plan.strategyName.substring(0, 2)}] ${e.title}`,
        description: e.reasoning || "AI 自動調度",
        start: e.start,
        end: e.end,
        type: EventType.PLANNED
      }))
    }));

    return generatedPlans;

  } catch (error) {
    console.error("Gemini Planning Error:", error);
    throw new Error("生成計畫失敗。");
  }
};