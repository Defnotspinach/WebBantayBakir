const isControlChar = (character: string) => {
  const code = character.charCodeAt(0)
  return code <= 31 || code === 127
}

export class SecurityValidationError extends Error {
  readonly code = "security/invalid-input"

  constructor(message: string) {
    super(message)
    this.name = "SecurityValidationError"
  }
}

export class RateLimitError extends Error {
  readonly code = "security/rate-limit-exceeded"
  readonly retryAfterMs: number

  constructor(message: string, retryAfterMs: number) {
    super(message)
    this.name = "RateLimitError"
    this.retryAfterMs = retryAfterMs
  }
}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

interface RateLimitBucket {
  attempts: number
  windowStart: number
}

type RateLimitState = Record<string, RateLimitBucket>

const RATE_LIMIT_STORAGE_KEY = "bb:rate-limit:v1"

function readRateLimitState(): RateLimitState {
  if (typeof window === "undefined") return {}

  try {
    const raw = window.localStorage.getItem(RATE_LIMIT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as RateLimitState
  } catch {
    return {}
  }
}

function writeRateLimitState(state: RateLimitState) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage failures and avoid blocking auth flow.
  }
}

function getOrCreateBucket(state: RateLimitState, bucketKey: string, nowMs: number, windowMs: number) {
  const existing = state[bucketKey]
  if (!existing || nowMs - existing.windowStart >= windowMs) {
    const next: RateLimitBucket = { attempts: 0, windowStart: nowMs }
    state[bucketKey] = next
    return next
  }
  return existing
}

export function assertWithinRateLimit(bucketKey: string, config: RateLimitConfig) {
  const nowMs = Date.now()
  const state = readRateLimitState()
  const bucket = getOrCreateBucket(state, bucketKey, nowMs, config.windowMs)

  if (bucket.attempts >= config.maxAttempts) {
    const retryAfterMs = Math.max(0, bucket.windowStart + config.windowMs - nowMs)
    throw new RateLimitError("Too many attempts. Please wait and try again.", retryAfterMs)
  }
}

export function trackRateLimitAttempt(bucketKey: string, config: RateLimitConfig, success: boolean) {
  const nowMs = Date.now()
  const state = readRateLimitState()

  if (success) {
    if (state[bucketKey]) {
      delete state[bucketKey]
      writeRateLimitState(state)
    }
    return
  }

  const bucket = getOrCreateBucket(state, bucketKey, nowMs, config.windowMs)
  bucket.attempts += 1
  writeRateLimitState(state)
}

export function sanitizeText(input: string, maxLength = 256) {
  const stripped = Array.from(input)
    .filter((character) => !isControlChar(character))
    .join("")
  const normalized = stripped.trim()
  if (normalized.length === 0) return ""
  if (normalized.length > maxLength) {
    throw new SecurityValidationError(`Input exceeds maximum length of ${maxLength} characters.`)
  }
  return normalized
}

export function assertValidEmail(email: string) {
  const normalized = sanitizeText(email, 254).toLowerCase()
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!EMAIL_REGEX.test(normalized)) {
    throw new SecurityValidationError("Invalid email format.")
  }
  return normalized
}

export function assertValidPassword(password: string) {
  if (password.length < 1) {
    throw new SecurityValidationError("Password is required.")
  }
  if (password.length > 128) {
    throw new SecurityValidationError("Password exceeds maximum allowed length.")
  }
  return password
}

type SanitizedValue = string | number | boolean | null | SanitizedValue[] | { [key: string]: SanitizedValue }

interface PayloadValidationOptions {
  maxDepth?: number
  maxKeysPerObject?: number
  maxArrayLength?: number
  maxStringLength?: number
}

const DEFAULT_PAYLOAD_OPTIONS: Required<PayloadValidationOptions> = {
  maxDepth: 6,
  maxKeysPerObject: 150,
  maxArrayLength: 200,
  maxStringLength: 2000,
}

function sanitizePayloadValue(
  value: unknown,
  depth: number,
  options: Required<PayloadValidationOptions>
): SanitizedValue {
  if (depth > options.maxDepth) {
    throw new SecurityValidationError("Input payload is too deeply nested.")
  }

  if (value === null) return null

  switch (typeof value) {
    case "string":
      return sanitizeText(value, options.maxStringLength)
    case "number":
      if (!Number.isFinite(value)) {
        throw new SecurityValidationError("Invalid numeric value in payload.")
      }
      return value
    case "boolean":
      return value
    case "undefined":
    case "function":
    case "symbol":
    case "bigint":
      throw new SecurityValidationError("Unsupported value type in payload.")
    case "object": {
      if (Array.isArray(value)) {
        if (value.length > options.maxArrayLength) {
          throw new SecurityValidationError("Array input exceeds maximum allowed length.")
        }
        return value.map((item) => sanitizePayloadValue(item, depth + 1, options))
      }

      if (value instanceof Date) {
        return value.toISOString()
      }

      const entries = Object.entries(value as Record<string, unknown>)
      if (entries.length > options.maxKeysPerObject) {
        throw new SecurityValidationError("Input object contains too many keys.")
      }

      return entries.reduce<Record<string, SanitizedValue>>((acc, [rawKey, rawValue]) => {
        const sanitizedKey = sanitizeText(rawKey, 80)
        if (!sanitizedKey) {
          throw new SecurityValidationError("Payload contains an empty key.")
        }
        acc[sanitizedKey] = sanitizePayloadValue(rawValue, depth + 1, options)
        return acc
      }, {})
    }
    default:
      throw new SecurityValidationError("Unsupported value in payload.")
  }
}

export function sanitizeAndValidatePayload(
  payload: Record<string, unknown>,
  options?: PayloadValidationOptions
) {
  const mergedOptions = { ...DEFAULT_PAYLOAD_OPTIONS, ...options }
  return sanitizePayloadValue(payload, 0, mergedOptions) as Record<string, unknown>
}
