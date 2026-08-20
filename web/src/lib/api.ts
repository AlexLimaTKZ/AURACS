import type { ChallengeStatus } from "./gameRules";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

export interface RunCodeResponse {
  success: boolean;
  logs: string[];
  returnValue?: string | null;
  challengePassed: boolean;
  challengeStatus?: ChallengeStatus;
  feedback?: string | null;
  choiceValue?: number | null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Muitas execuções em pouco tempo. Aguarde alguns segundos e tente novamente.");
    }

    if (response.status === 503) {
      throw new Error("O executor está temporariamente ocupado. Tente novamente em instantes.");
    }

    let backendMessage = "";
    try {
      const body = (await response.json()) as { logs?: string[]; message?: string };
      backendMessage = body.logs?.[0] ?? body.message ?? "";
    } catch {
      // Resposta sem JSON: manter mensagem genérica abaixo.
    }

    throw new Error(backendMessage || `API respondeu com status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function fetchWithTimeout(
  path: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("O executor C# demorou demais para responder.");
    }

    throw new Error("Não foi possível conectar ao executor C#. Verifique se a API está disponível.");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function runCode(input: {
  code: string;
  sessionId: string;
  challengeId?: string;
}): Promise<RunCodeResponse> {
  const response = await fetchWithTimeout(
    "/run",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    3_000
  );

  return parseResponse<RunCodeResponse>(response);
}

export async function resetCodeSession(sessionId: string): Promise<void> {
  const response = await fetchWithTimeout(
    "/reset",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    },
    2_000
  );

  await parseResponse(response);
}
