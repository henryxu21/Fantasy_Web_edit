// app/api/leagues/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, userId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "League name is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Create league using admin client (bypasses RLS)
    const { data: league, error: createError } = await supabaseAdmin
      .from("leagues")
      .insert({
        name: trimmedName,
        commissioner_id: userId,
        max_teams: 10,
        draft_type: "snake",
      })
      .select()
      .single();

    if (createError) {
      console.error("Create league error:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Create draft settings
    await supabaseAdmin.from("draft_settings").insert({
      league_id: league.id,
      draft_type: "snake",
    });

    return NextResponse.json({ status: "success", league });
  } catch (error: any) {
    console.error("Leagues POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
