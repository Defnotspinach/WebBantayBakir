import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  assertValidEmail,
  assertValidPassword,
  assertWithinRateLimit,
  trackRateLimitAttempt,
} from "@/lib/security"
import { isAdminEmail } from "@/lib/auth"

const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsLoading(false)
    })
    return () => unsub()
  }, [])

  const login = async (email: string, password: string) => {
    const normalizedEmail = assertValidEmail(email)
    const normalizedPassword = assertValidPassword(password)
    const bucketKey = `login:email:${normalizedEmail}`

    assertWithinRateLimit(bucketKey, LOGIN_RATE_LIMIT)

    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword)
      trackRateLimitAttempt(bucketKey, LOGIN_RATE_LIMIT, true)
    } catch (error) {
      trackRateLimitAttempt(bucketKey, LOGIN_RATE_LIMIT, false)
      throw error
    }
  }

  const loginWithGoogle = async () => {
    const bucketKey = "login:google"
    assertWithinRateLimit(bucketKey, LOGIN_RATE_LIMIT)

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    try {
      await signInWithPopup(auth, provider)
      trackRateLimitAttempt(bucketKey, LOGIN_RATE_LIMIT, true)
    } catch (error) {
      trackRateLimitAttempt(bucketKey, LOGIN_RATE_LIMIT, false)
      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAdmin: isAdminEmail(user?.email),
      login,
      loginWithGoogle,
      logout,
    }),
    [user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
