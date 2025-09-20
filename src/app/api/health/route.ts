import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  } as const;

  return NextResponse.json({
    ok: Object.values(envStatus).every(Boolean),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    env: envStatus,
  });
}
