import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "API is working",
    env: {
      linkedinConfigured: !!process.env.LINKEDIN_CLIENT_ID,
      threadsConfigured: !!process.env.THREADS_APP_ID,
    }
  });
}