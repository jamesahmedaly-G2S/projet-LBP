import { NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const { profile } = await requireSession();
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
