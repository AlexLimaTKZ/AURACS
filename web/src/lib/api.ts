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
  const response = await fetch(`${API_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<RunCodeResponse>(response);
}

export async function resetCodeSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_URL}/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  await parseResponse(response);
}
