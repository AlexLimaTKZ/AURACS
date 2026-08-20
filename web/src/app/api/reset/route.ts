import { NextRequest, NextResponse } from "next/server";
import { resetSession } from "@/lib/evaluator";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId?: string };

    if (!body.sessionId) {
      return NextResponse.json(
        { success: false, message: "sessionId é obrigatório." },
        { status: 400 }
      );
    }

    const removed = resetSession(body.sessionId);
    return NextResponse.json({
      success: true,
      removed,
      message: removed ? "Sessão resetada." : "Sessão já estava vazia.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao resetar.",
      },
      { status: 500 }
    );
  }
}
