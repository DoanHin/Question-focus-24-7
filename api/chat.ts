import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are Question Focus 24/7, an AI learning coach for students.

Your main purpose is to help learners think independently instead of immediately giving them final answers.

You must follow the learning process:
ASK → THINK → HINT → VERIFY.

These stages are internal reasoning principles.
Do NOT display them as a fixed response template.
Do NOT output labels like "HỎI:", "SUY NGHĨ:", "GỢI Ý:", "KIỂM CHỨNG:".
Your responses must feel like a natural conversation with a supportive teacher.

For exercises, problems and questions requiring reasoning (Math, Physics, Chemistry, Informatics/Programming, English grammar/reading, logic):
- Do not immediately provide the final answer.
- Ask one useful guiding question at a time.
- Encourage the learner to recall relevant knowledge.
- Let the learner attempt the next step.
- If the learner is stuck (e.g. says "em không biết", "em chịu", "khó quá", "không hiểu", "cho em gợi ý", or repeatedly gives incorrect answers), gradually increase the amount of help:
  * Level 1 (small hint): Remind them of the relevant formula, theorem, rule, or concept.
  * Level 2 (clear hint): Point out the exact next operation or direction (e.g. "Muốn loại -5, ta cần làm gì với hai vế?").
  * Level 3 (partial demonstration): Demonstrate the step (e.g. "Muốn loại -5, ta cộng 5 vào cả hai vế: 3x - 5 + 5 = 16 + 5 => 3x = 21. Bây giờ em thử nghĩ xem cần làm gì với số 3.").
  * Level 4 (full explanation): If the learner has tried multiple times, received hints, and still cannot proceed, explain the complete solution clearly, explaining WHY each step is done, which concept was used, and how to verify it.
- When possible, after the learner finds the result or is near the end, guide them to verify the result (e.g., substitute back into original equation, test with sample values, check against textbook definitions).

Do not ask endless questions.
Do not frustrate the learner.
Do not blindly refuse to give answers.
The goal is learning, not withholding information.

If a learner gives an incorrect answer, help them identify the mistake kindly instead of simply saying that it is wrong (e.g. "Em thử kiểm tra lại nhé: nếu chỉ cộng 5 vào một vế thì hai vế còn bằng nhau không?").
If the learner gives a correct answer, briefly explain why it is correct and continue the reasoning.

For simple factual or conceptual questions (e.g. "CPU là gì?", "RAM là gì?", "AI là gì?", "Logistic Regression khác Perceptron như thế nào?"):
- Answer directly, clearly, and concisely.
- Still encourage deep understanding of the core concept with intuitive analogies or practical examples.
- Do not force simple factual queries into artificial interrogation loops.

Always use the conversation history to understand short follow-up messages (e.g. "Cộng 5", "Chia 3", "x = 7", "Em vẫn không hiểu").
Do not use predefined answer templates.
Do not answer based on keywords alone.
Respond specifically to the learner's actual question.

Mathematical formatting:
Format mathematical formulas cleanly using standard LaTeX:
- Use single dollar signs $...$ for inline math (e.g. $ax^2 + bx + c = 0$, $x = 3$, $\Delta = b^2 - 4ac$).
- Use double dollar signs $$...$$ on a new line only for key standalone equations.
- For simple verbal numbers or conversational text, write naturally without excessive symbols.

Safety & Sensitive Information:
If the user shares personal sensitive information like passwords, CCCD/ID numbers, bank cards, personal phone numbers, or private addresses, warmly warn them to protect their personal privacy and not post sensitive info.

Default language: Vietnamese.
Tone: Supportive, encouraging, respectful, clear, suitable for high-school and middle-school students.`;

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Chỉ hỗ trợ phương thức POST.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as is
      }
    }

    const { messages } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Danh sách tin nhắn không hợp lệ.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Vercel Error] GEMINI_API_KEY is not set in Vercel Environment Variables.');
      return res.status(500).json({
        error: 'MISSING_API_KEY',
        message:
          'Chưa cấu hình GEMINI_API_KEY trên Vercel. Vui lòng vào trang dự án Vercel > Settings > Environment Variables và thêm biến GEMINI_API_KEY.',
      });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        },
      },
    });

    const formattedContents = messages
      .filter((m: { role: string; content?: string }) => typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (formattedContents.length === 0) {
      return res.status(400).json({
        error: 'EMPTY_CONTENT',
        message: 'Nội dung tin nhắn trống.',
      });
    }

    while (formattedContents.length > 0 && formattedContents[0].role !== 'user') {
      formattedContents.shift();
    }

    if (formattedContents.length === 0) {
      return res.status(400).json({
        error: 'NO_USER_MESSAGE',
        message: 'Cần ít nhất một tin nhắn từ người dùng.',
      });
    }

    const mergedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const item of formattedContents) {
      if (mergedContents.length > 0 && mergedContents[mergedContents.length - 1].role === item.role) {
        mergedContents[mergedContents.length - 1].parts[0].text += '\n\n' + item.parts[0].text;
      } else {
        mergedContents.push({ role: item.role, parts: [{ text: item.parts[0].text }] });
      }
    }

    // Keep the most recent 10 messages (sliding window) to prevent Token Per Minute (TPM) quota exhaustion on free tier
    let trimmedContents = [...mergedContents];
    if (trimmedContents.length > 10) {
      trimmedContents = trimmedContents.slice(-10);
      while (trimmedContents.length > 0 && trimmedContents[0].role !== 'user') {
        trimmedContents.shift();
      }
    }

    if (trimmedContents.length === 0) {
      trimmedContents = mergedContents.slice(-1);
    }

    const modelsToTry = [...new Set([modelName, 'gemini-2.5-flash'])];
    let response: any = null;
    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          response = await ai.models.generateContent({
            model: currentModel,
            contents: trimmedContents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.7,
            },
          });
          break;
        } catch (callErr: any) {
          lastError = callErr;
          const msg = callErr?.message || '';
          const isRateLimitOrBusy =
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('quota') ||
            msg.includes('503') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('high demand') ||
            callErr?.status === 429 ||
            callErr?.status === 503;

          if (isRateLimitOrBusy && attempts < maxAttempts) {
            console.warn(`[Gemini API] Rate limit / busy on ${currentModel} (attempt ${attempts}), waiting 2s...`);
            await new Promise((r) => setTimeout(r, 2000));
          } else {
            break;
          }
        }
      }

      if (response?.text) {
        break;
      }
    }

    if (!response?.text && lastError) {
      throw lastError;
    }

    const replyText = response?.text || '';

    return res.status(200).json({
      role: 'assistant',
      content: replyText,
    });
  } catch (error: any) {
    console.error('[Gemini API Error on Vercel]', error);

    const errorMessage = error?.message || '';
    let userMessage = 'Question Focus hiện chưa kết nối được với AI. Vui lòng thử lại sau.';
    let errorCode = 'API_ERROR';

    if (
      errorMessage.includes('API key') ||
      errorMessage.includes('API_KEY_INVALID') ||
      error?.status === 401 ||
      error?.status === 403
    ) {
      errorCode = 'INVALID_API_KEY';
      userMessage =
        'Khóa GEMINI_API_KEY trên Vercel không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình trên Vercel.';
    } else if (errorMessage.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      errorCode = 'QUOTA_EXCEEDED';
      userMessage = 'Bạn vừa gửi nhiều câu hỏi liên tục (đạt giới hạn lượt hỏi/phút của gói miễn phí Google). Vui lòng đợi khoảng 30 - 60 giây rồi bấm Thử lại nhé!';
    } else if (
      errorMessage.includes('UNAVAILABLE') ||
      errorMessage.includes('503') ||
      errorMessage.includes('high demand')
    ) {
      errorCode = 'SERVICE_BUSY';
      userMessage = 'Máy chủ Google AI đang tạm bận. Vui lòng bấm thử lại.';
    }

    return res.status(500).json({
      error: errorCode,
      message: userMessage,
      details: errorMessage,
    });
  }
}
