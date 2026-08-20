import { NextRequest, NextResponse } from "next/server";
import {
  evaluateCSharpCode,
  getOrCreateSession,
  validateChallenge,
} from "@/lib/evaluator";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: string;
      sessionId?: string;
      challengeId?: string;
    };

    if (!body.sessionId) {
      return NextResponse.json(
        { success: false, logs: ["[ERRO]: sessionId é obrigatório."] },
        { status: 400 }
      );
    }

    if (!body.code) {
      return NextResponse.json(
        { success: false, logs: ["[ERRO]: Digite um comando C# antes de executar."] },
        { status: 400 }
      );
    }

    const session = getOrCreateSession(body.sessionId, body.challengeId);
    const evalResult = evaluateCSharpCode(body.code, session);

    if (!evalResult.success) {
      return NextResponse.json({
        success: false,
        logs: evalResult.logs,
      });
    }

    const challenge = validateChallenge(body.challengeId, session, evalResult);

    return NextResponse.json({
      success: true,
      logs: evalResult.logs,
      returnValue: evalResult.returnValue,
      challengePassed: challenge.passed,
      feedback: challenge.feedback,
      choiceValue: challenge.choiceValue,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        logs: [`[ERRO]: ${error instanceof Error ? error.message : "Erro inesperado."}`],
      },
      { status: 500 }
    );
  }
}
