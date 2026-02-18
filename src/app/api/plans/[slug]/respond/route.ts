import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/plans/[slug]/respond — guest submits availability
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const plan = await prisma.plan.findUnique({
    where: { slug },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const body = await request.json();
  const { guestName, selectedDates, comment, selectedTimeWindows } = body;

  if (!guestName || !selectedDates || selectedDates.length === 0) {
    return NextResponse.json(
      { error: "Name and at least one date are required" },
      { status: 400 }
    );
  }

  if (plan.mode === "DATE_TIME_SELECTION" && !selectedTimeWindows) {
    return NextResponse.json(
      { error: "Time windows are required for this plan type" },
      { status: 400 }
    );
  }

  const response = await prisma.response.create({
    data: {
      planId: plan.id,
      guestName,
      selectedDates: selectedDates.map((d: string) => new Date(d)),
      comment: comment || null,
      selectedTimeWindows: selectedTimeWindows || null,
    },
  });

  return NextResponse.json(response, { status: 201 });
}
