import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { FirebaseError } from "firebase/app"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from

  const getAuthErrorMessage = (submitError: unknown) => {
    if (submitError instanceof FirebaseError) {
      const rawMessage = submitError.message.toUpperCase()

      if (rawMessage.includes("INVALID_LOGIN_CREDENTIALS")) {
        return "Invalid email or password. This account must exist in Firebase Authentication > Users."
      }
      if (rawMessage.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
        return "This API key is restricted for the current domain. Add localhost to the key referrer allowlist."
      }
      if (rawMessage.includes("API_KEY_INVALID")) {
        return "Invalid Firebase API key. Double-check your web app Firebase config values."
      }

      switch (submitError.code) {
        case "auth/invalid-email":
          return "Invalid email format."
        case "auth/invalid-credential":
        case "auth/wrong-password":
          return "Invalid email or password. This account must exist in Firebase Authentication > Users."
        case "auth/user-not-found":
          return "No account found for this email."
        case "auth/user-disabled":
          return "This account is disabled in Firebase Authentication."
        case "auth/too-many-requests":
          return "Too many attempts. Please wait and try again."
        case "auth/operation-not-allowed":
          return "Email/Password login is not enabled in Firebase Auth."
        case "auth/invalid-api-key":
          return "Invalid Firebase API key. Double-check your web app Firebase config values."
        case "auth/network-request-failed":
          return "Network error while contacting Firebase. Check your internet connection and try again."
        case "auth/popup-closed-by-user":
          return "Google sign-in popup was closed."
        case "auth/popup-blocked":
          return "Popup blocked by browser. Please allow popups."
        default:
          return `${submitError.message || "Failed to login."} (${submitError.code})`
      }
    }
    if (submitError instanceof Error) {
      return submitError.message
    }
    return "Failed to login."
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await login(email.trim(), password)
      toast({ title: "Login successful", variant: "success" })
      navigate(from ?? "/admin/dashboard", { replace: true })
    } catch (submitError) {
      const message = getAuthErrorMessage(submitError)
      setError(message)
      toast({ title: message, variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await loginWithGoogle()
      toast({ title: "Login successful", variant: "success" })
      navigate(from ?? "/admin/dashboard", { replace: true })
    } catch (submitError) {
      const message = getAuthErrorMessage(submitError)
      setError(message)
      toast({ title: message, variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] grid place-items-center p-6 overflow-hidden bg-[#07090d]">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute left-0 top-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        <div className="absolute right-0 top-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        <div className="absolute left-1/2 top-0 h-1/3 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />
        <div className="absolute left-1/2 bottom-0 h-1/3 w-px bg-gradient-to-t from-transparent via-slate-600 to-transparent" />
      </div>

      <Card className="w-full max-w-md border-slate-700/60 bg-slate-900/70 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 size-20 rounded-2xl bg-slate-800 border border-slate-700 grid place-items-center">
            <img src="/icon.png" alt="Bantay Bakir Logo" className="size-20" />
          </div>
          <CardTitle className="text-3xl font-semibold text-slate-100">Welcome Back</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in with your admin account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9 bg-slate-950/80 border-slate-700 text-slate-100"
                  placeholder="email address"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-9 pr-10 bg-slate-950/80 border-slate-700 text-slate-100"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-500" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
              disabled={isSubmitting}
              onClick={() => void handleGoogleLogin()}
            >
              Sign in with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
