import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

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

Safety & Sensitive Information:
If the user shares personal sensitive information like passwords, CCCD/ID numbers, bank cards, personal phone numbers, or private addresses, warmly warn them to protect their personal privacy and not post sensitive info.

Default language: Vietnamese.
Tone: Supportive, encouraging, respectful, clear, suitable for high-school and middle-school students.`;

// Endpoint to check server status & model info
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'QUESTION FOCUS 24/7',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Danh sách tin nhắn không hợp lệ.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Server Error] GEMINI_API_KEY is not configured in environment variables.');
      return res.status(500).json({
        error: 'MISSING_API_KEY',
        message: 'Question Focus hiện chưa kết nối được với AI do máy chủ chưa được cấu hình GEMINI_API_KEY. Vui lòng cấu hình GEMINI_API_KEY trong biến môi trường.',
      });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Format messages for @google/genai SDK
    // Filter and map role: 'user' | 'assistant' -> 'user' | 'model'
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

    // Ensure first message has role 'user'
    while (formattedContents.length > 0 && formattedContents[0].role !== 'user') {
      formattedContents.shift();
    }

    if (formattedContents.length === 0) {
      return res.status(400).json({
        error: 'NO_USER_MESSAGE',
        message: 'Cần ít nhất một tin nhắn từ người dùng.',
      });
    }

    // Merge consecutive messages with identical roles if any
    const mergedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const item of formattedContents) {
      if (mergedContents.length > 0 && mergedContents[mergedContents.length - 1].role === item.role) {
        mergedContents[mergedContents.length - 1].parts[0].text += '\n\n' + item.parts[0].text;
      } else {
        mergedContents.push({ role: item.role, parts: [{ text: item.parts[0].text }] });
      }
    }

    console.log(`[API Call] Generating content with model: ${modelName}, messages count: ${mergedContents.length}`);

    let response;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        response = await ai.models.generateContent({
          model: modelName,
          contents: mergedContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });
        break;
      } catch (callErr: any) {
        const msg = callErr?.message || '';
        const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand') || callErr?.status === 503;
        if (isTransient && attempts < maxAttempts) {
          console.warn(`[Gemini API] Transient 503, retrying in 1.5s (attempt ${attempts}/${maxAttempts})...`);
          await new Promise((r) => setTimeout(r, 1500));
        } else {
          throw callErr;
        }
      }
    }

    const replyText = response?.text || '';

    if (!replyText) {
      console.warn('[Server Warning] Received empty reply from Gemini API');
    }

    return res.json({
      role: 'assistant',
      content: replyText,
    });
  } catch (error: any) {
    console.error('[Gemini API Error]', error);

    const errorMessage = error?.message || '';
    let userMessage = 'Question Focus hiện chưa kết nối được với AI. Vui lòng thử lại sau.';
    let errorCode = 'API_ERROR';

    if (errorMessage.includes('API key') || errorMessage.includes('API_KEY_INVALID') || error?.status === 401 || error?.status === 403) {
      errorCode = 'INVALID_API_KEY';
      userMessage = 'Cấu hình API Key của hệ thống không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra GEMINI_API_KEY.';
    } else if (errorMessage.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      errorCode = 'QUOTA_EXCEEDED';
      userMessage = 'Hệ thống AI đang quá tải hoặc đã đạt giới hạn yêu cầu. Vui lòng đợi ít phút rồi thử lại.';
    } else if (errorMessage.includes('UNAVAILABLE') || errorMessage.includes('503') || errorMessage.includes('high demand')) {
      errorCode = 'SERVICE_BUSY';
      userMessage = 'Máy chủ AI tạm thời đang có lượng truy cập cao. Vui lòng bấm thử lại sau vài giây.';
    } else if (errorMessage.includes('NOT_FOUND') || error?.status === 404) {
      errorCode = 'MODEL_NOT_FOUND';
      userMessage = 'Mô hình AI được chỉ định không tồn tại hoặc không khả dụng.';
    } else if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
      errorCode = 'NETWORK_ERROR';
      userMessage = 'Mất kết nối tới máy chủ Google Gemini. Vui lòng kiểm tra kết nối mạng.';
    }

    return res.status(500).json({
      error: errorCode,
      message: userMessage,
      details: process.env.NODE_ENV === 'production' ? undefined : errorMessage,
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);

  if (isProd && hasDist) {
    console.log(`[Production] Serving static build from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.log('[Development/Vite] Mounting Vite middleware mode');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Question Focus 24/7 server ready at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
