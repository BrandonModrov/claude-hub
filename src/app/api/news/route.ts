import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/news-fetcher";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await fetchAllNews();
  return NextResponse.json(data);
}
