import { NextResponse } from "next/server";
import { clearSessionCache } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function POST() {
  clearSessionCache();
  return NextResponse.json({ ok: true });
}
