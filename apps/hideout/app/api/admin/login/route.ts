import { NextResponse } from "next/server"
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionToken,
  isAdminLoginValid,
} from "@/lib/auth/session"

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}))
  const identifier =
    typeof payload.identifier === "string" ? payload.identifier : ""
  const password = typeof payload.password === "string" ? payload.password : ""

  if (!isAdminLoginValid(identifier, password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: getAdminSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  return response
}
