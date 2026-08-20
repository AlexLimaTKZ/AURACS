import {
  evaluateCSharpCode,
  getOrCreateSession,
  resetSession,
  validateChallenge,
} from "./evaluator";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

export interface RunCodeResponse {
  success: boolean;
  logs: string[];
  returnValue?: string | null;
  challengePassed: boolean;
  feedback?: string | null;
  choiceValue?: number | null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Muitas execuções em pouco tempo. Aguarde alguns segundos e tente novamente.");
    }

    throw new Error(`API respondeu com status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function runCode(input: {
  code: string;
  sessionId: string;
  challengeId?: string;
}): Promise<RunCodeResponse> {
  // Tentar conectar à API backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const response = await fetch(`${API_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return await parseResponse<RunCodeResponse>(response);
  } catch {
    // Fallback gracioso para o motor de execução local quando o backend C# não estiver rodando
    const session = getOrCreateSession(input.sessionId, input.challengeId);
    const evalResult = evaluateCSharpCode(input.code, session);

    if (!evalResult.success) {
      return {
        success: false,
        logs: evalResult.logs,
        challengePassed: false,
      };
    }

    const challenge = validateChallenge(input.challengeId, session, evalResult);

    return {
      success: true,
      logs: evalResult.logs,
      returnValue: evalResult.returnValue,
      challengePassed: challenge.passed,
      feedback: challenge.feedback,
      choiceValue: challenge.choiceValue,
    };
  }
}

export async function resetCodeSession(sessionId: string): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(`${API_URL}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await parseResponse(response);
  } catch {
    resetSession(sessionId);
  }
}
