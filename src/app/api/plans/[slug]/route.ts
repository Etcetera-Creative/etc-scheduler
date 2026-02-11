import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/plans/[slug] — public: get plan info for guests
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const plan = await prisma.plan.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(plan);
}

// DELETE /api/plans/[slug] — delete a plan (authenticated, owner only)
export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await prisma.plan.findUnique({
    where: { slug: params.slug },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (plan.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.plan.delete({ where: { id: plan.id } });

  return NextResponse.json({ ok: true });
}
