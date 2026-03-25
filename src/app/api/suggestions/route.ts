import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/suggestions — list current user's suggestions
export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await prisma.featureSuggestion.findMany({
    where: { submitterId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(suggestions);
}

// POST /api/suggestions — submit a new suggestion
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, category, tool } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!description || !description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  if (!["EXISTING_TOOL", "NEW_TOOL"].includes(category)) {
    return NextResponse.json(
      { error: "Category must be EXISTING_TOOL or NEW_TOOL" },
      { status: 400 }
    );
  }

  const suggestion = await prisma.featureSuggestion.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      category,
      tool: tool?.trim() || null,
      submitterId: user.id,
      submitterName:
        user.user_metadata?.display_name || user.email || null,
    },
  });

  return NextResponse.json(suggestion, { status: 201 });
}
