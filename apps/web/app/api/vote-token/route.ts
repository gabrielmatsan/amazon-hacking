import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";
  const apiToken = process.env.X_API_TOKEN;

  if (!apiToken) {
    return NextResponse.json(
      { error: "failed", message: "X_API_TOKEN not configured" },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "failed", message: "Session not found" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const res = await fetch(`${apiUrl}/votes-token/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": apiToken,
      Cookie: `session_id=${sessionId}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
