import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
