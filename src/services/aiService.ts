import { ChatMessage, ServerConfig } from '../types';

export interface SendMessageResponse {
  role: 'assistant';
  content: string;
}

export class AIServiceError extends Error {
  code: string;
  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
  }
}

/**
 * Check if the text contains sensitive personal information
 * (e.g. passwords, Vietnamese citizen ID / CCCD, bank cards, etc.)
 */
export function detectSensitiveInfo(text: string): { isSensitive: boolean; warning?: string } {
  // Regex for 9 or 12 digit ID (CCCD), credit card patterns (16 digits), or password patterns
  const cccdRegex = /\b\d{9}\b|\b\d{12}\b/;
  const cardRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/;
  const passwordKeywords = /\b(mật khẩu|mat khau|password|pass|mã pin|ma pin)\s*[:=]\s*\S+/i;

  if (cardRegex.test(text)) {
    return {
      isSensitive: true,
      warning: 'Cảnh báo: Bạn dường như đang gửi số thẻ tín dụng hoặc số tài khoản. Vui lòng không chia sẻ thông tin tài chính!',
    };
  }

  if (cccdRegex.test(text) && /\b(cccd|cmnd|căn cước|chứng minh)\b/i.test(text)) {
    return {
      isSensitive: true,
      warning: 'Cảnh báo: Bạn dường như đang gửi số CCCD/CMND. Vui lòng bảo vệ thông tin định danh cá nhân!',
    };
  }

  if (passwordKeywords.test(text)) {
    return {
      isSensitive: true,
      warning: 'Cảnh báo: Bạn đang gửi mật khẩu hoặc mã PIN. Question Focus không yêu cầu mật khẩu của bạn!',
    };
  }

  return { isSensitive: false };
}

/**
 * Fetch server configuration
 */
export async function getServerConfig(): Promise<ServerConfig> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) {
      throw new Error(`Failed to fetch config: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetching server config:', err);
    return {
      appName: 'QUESTION FOCUS 24/7',
      model: 'gemini-3.8-flash',
      hasApiKey: false,
      status: 'error',
    };
  }
}

/**
 * Send messages history to backend Gemini proxy
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  conversationId?: string
): Promise<string> {
  try {
    const payload = {
      conversationId,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    let response: Response | null = null;
    let lastNetworkErr: any = null;

    // Try up to 2 times for transient network dips
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        break;
      } catch (err: any) {
        lastNetworkErr = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    if (!response) {
      console.error('Network request failed after retries:', lastNetworkErr);
      throw new AIServiceError(
        'Không thể kết nối đến máy chủ Question Focus. Vui lòng kiểm tra kết nối mạng và thử lại.',
        'NETWORK_ERROR'
      );
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new AIServiceError(
        data?.message || 'Question Focus hiện chưa kết nối được với AI. Vui lòng thử lại sau.',
        data?.error || `HTTP_${response.status}`
      );
    }

    if (!data?.content || typeof data.content !== 'string') {
      throw new AIServiceError('Không nhận được nội dung phản hồi từ AI.', 'EMPTY_RESPONSE');
    }

    return data.content;
  } catch (error: any) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    console.error('Request Error:', error);
    throw new AIServiceError(
      'Question Focus hiện chưa kết nối được với AI. Vui lòng thử lại sau.',
      'NETWORK_ERROR'
    );
  }
}
