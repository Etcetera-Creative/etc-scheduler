import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildPersonalityResults } from "@/lib/personality";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ownerToken: string }> }
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ownerToken } = await params;
  const quiz = await prisma.personalityQuiz.findUnique({
    where: { ownerToken },
    include: {
      responses: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  if (quiz.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    quiz: {
      ownerToken: quiz.ownerToken,
      shareToken: quiz.shareToken,
      title: quiz.title,
      description: quiz.description,
      instructions: quiz.instructions,
      selectionCount: quiz.selectionCount,
      selfWords: quiz.selfWords,
      wordPool: quiz.wordPool,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    },
    ...buildPersonalityResults(quiz),
  });
}
