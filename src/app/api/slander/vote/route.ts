import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { VoteSchema } from "@/lib/validation";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const json = await req.json();
  const parsed = VoteSchema.parse(json);

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = parsed.vote === 0
    ? await supabase.rpc("unvote", { in_slander_id: parsed.slanderId })
    : await supabase.rpc("cast_vote", { in_slander_id: parsed.slanderId, in_vote: parsed.vote });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
