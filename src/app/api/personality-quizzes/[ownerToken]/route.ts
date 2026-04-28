import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";

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
    include: { _count: { select: { responses: true } } },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  if (quiz.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(quiz);
}

export async function DELETE(
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
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  if (quiz.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.personalityQuiz.delete({ where: { id: quiz.id } });

  return NextResponse.json({ ok: true });
}
