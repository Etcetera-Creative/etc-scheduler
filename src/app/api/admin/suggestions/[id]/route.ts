import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "BUILT"];

// PATCH /api/admin/suggestions/[id] — update suggestion status/notes (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, adminNotes } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const existing = await prisma.featureSuggestion.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.featureSuggestion.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(adminNotes !== undefined && { adminNotes }),
    },
  });

  return NextResponse.json(updated);
}
