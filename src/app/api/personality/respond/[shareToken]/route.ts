import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { normalizeSelectedWords } from "@/lib/personality";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
  const url = new URL(request.url);
  const responseToken = url.searchParams.get("responseToken");

  const quiz = await prisma.personalityQuiz.findUnique({
    where: { shareToken },
    select: {
      id: true,
      title: true,
      description: true,
      instructions: true,
      selectionCount: true,
      creatorName: true,
      wordPool: true,
      responses: responseToken
        ? {
            where: { responseToken },
            select: { selectedWords: true, responseToken: true },
            take: 1,
          }
        : false,
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const existingResponse = Array.isArray(quiz.responses) ? quiz.responses[0] ?? null : null;

  return NextResponse.json({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    instructions: quiz.instructions,
    selectionCount: quiz.selectionCount,
    creatorName: quiz.creatorName,
    wordPool: quiz.wordPool,
    existingResponse,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const quiz = await prisma.personalityQuiz.findUnique({
      where: { shareToken },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const body = await request.json();
    const selectedWords = normalizeSelectedWords(
      body.selectedWords,
      quiz.wordPool,
      quiz.selectionCount
    );
    const submittedToken = typeof body.responseToken === "string" ? body.responseToken.trim() : "";

    if (submittedToken) {
      const existing = await prisma.personalityResponse.findUnique({
        where: { responseToken: submittedToken },
      });

      if (existing && existing.quizId === quiz.id) {
        const updated = await prisma.personalityResponse.update({
          where: { id: existing.id },
          data: { selectedWords },
        });

        return NextResponse.json({
          responseToken: updated.responseToken,
          selectedWords: updated.selectedWords,
          updated: true,
        });
      }
    }

    const created = await prisma.personalityResponse.create({
      data: {
        quizId: quiz.id,
        responseToken: nanoid(24),
        selectedWords,
      },
    });

    return NextResponse.json(
      {
        responseToken: created.responseToken,
        selectedWords: created.selectedWords,
        updated: false,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save response";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
