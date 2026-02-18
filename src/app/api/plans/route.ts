import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

// GET /api/plans — list plans for the authenticated user
export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.plan.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  });

  return NextResponse.json(plans);
}

// POST /api/plans — create a new plan
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, startDate, endDate, mode, availableDates, timeWindows, desiredDuration } = body;

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "Name, start date, and end date are required" }, { status: 400 });
  }

  const validModes = ["DATE_RANGE", "DATE_SELECTION", "DATE_TIME_SELECTION"];
  const planMode = validModes.includes(mode) ? mode : "DATE_RANGE";

  const slug = nanoid(10);
  const creatorName = user.user_metadata?.display_name || null;

  const plan = await prisma.plan.create({
    data: {
      slug,
      name,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      mode: planMode,
      availableDates: Array.isArray(availableDates)
        ? availableDates.map((d: string) => new Date(d))
        : [],
      timeWindows: timeWindows || null,
      desiredDuration: desiredDuration ? parseInt(desiredDuration) : null,
      creatorId: user.id,
      creatorName,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
