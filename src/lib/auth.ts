const parseAdminEmails = () => {
  const fromEnv = import.meta.env.VITE_ADMIN_EMAILS as string | undefined
  if (!fromEnv) return ["youradmin@email.com"]
  return fromEnv
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export const ADMIN_EMAILS = parseAdminEmails()

export const isAdminEmail = (email?: string | null) => {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
