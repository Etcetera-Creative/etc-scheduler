import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plans/[slug]/results — get plan with all responses
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const plan = await prisma.plan.findUnique({
    where: { slug },
    include: {
      responses: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(plan);
}
