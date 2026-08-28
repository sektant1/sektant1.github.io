import type { NextRequest } from "next/server"

export const ADMIN_SESSION_COOKIE = "hideout_admin"

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "change-me",
  }
}

export function getAdminSessionToken() {
  const credentials = getAdminCredentials()
  return (
    process.env.ADMIN_SESSION_TOKEN ||
    `${credentials.username}:${credentials.password}`
  )
}

export function isAdminSessionAuthorized(request: NextRequest) {
  return (
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value === getAdminSessionToken()
  )
}

export function isAdminLoginValid(identifier: string, password: string) {
  const credentials = getAdminCredentials()
  return (
    identifier === credentials.username && password === credentials.password
  )
}
