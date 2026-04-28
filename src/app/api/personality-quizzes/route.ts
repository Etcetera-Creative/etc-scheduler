import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  DEFAULT_RESPONDER_INSTRUCTIONS,
  PERSONALITY_WORD_POOL,
  normalizeSelectedWords,
  sanitizeSelectionCount,
} from "@/lib/personality";

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quizzes = await prisma.personalityQuiz.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  });

  return NextResponse.json(quizzes);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const instructions =
      typeof body.instructions === "string" && body.instructions.trim()
        ? body.instructions.trim()
        : DEFAULT_RESPONDER_INSTRUCTIONS;
    const selectionCount = sanitizeSelectionCount(body.selectionCount);

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const selfWords = normalizeSelectedWords(
      body.selfWords,
      PERSONALITY_WORD_POOL,
      selectionCount
    );

    const creatorName = user.user_metadata?.display_name || null;

    const quiz = await prisma.personalityQuiz.create({
      data: {
        ownerToken: nanoid(16),
        shareToken: nanoid(16),
        title,
        description: description || null,
        instructions,
        selectionCount,
        creatorId: user.id,
        creatorName,
        selfWords,
        wordPool: PERSONALITY_WORD_POOL,
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create quiz";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
