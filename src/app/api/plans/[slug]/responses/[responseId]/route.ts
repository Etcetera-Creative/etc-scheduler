import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";

// DELETE /api/plans/[slug]/responses/[responseId] — delete a response (owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; responseId: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, responseId } = await params;

  const plan = await prisma.plan.findUnique({
    where: { slug },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (plan.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = await prisma.response.findUnique({
    where: { id: responseId },
  });

  if (!response || response.planId !== plan.id) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  await prisma.response.delete({ where: { id: responseId } });

  return NextResponse.json({ ok: true });
}
