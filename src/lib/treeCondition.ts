export type TreeConditionCode = 1 | 2 | 3
export type TreeStatusLabel = "Healthy" | "Monitor" | "Ready to Cut" | "Cut"

export function normalizeConditionCode(value: unknown): TreeConditionCode {
  const numeric = Number(value)
  if (numeric === 2) return 2
  if (numeric === 3) return 3
  return 1
}

function normalizeStemQualityCode(value: unknown): TreeConditionCode | null {
  if (typeof value === "number") {
    if (value === 1 || value === 2 || value === 3) return value
    return null
  }

  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return null

  if (["1", "code 1", "code1", "good", "healthy", "excellent", "fairly good"].includes(normalized)) return 1
  if (["2", "code 2", "code2", "slightly damaged", "damaged", "moderate", "fair", "medium"].includes(normalized)) return 2
  if (["3", "code 3", "code3", "poor", "dying", "bad", "severely damaged", "critical"].includes(normalized)) return 3

  return null
}

export function resolveTreeConditionCodeFromData(data: Record<string, unknown>): TreeConditionCode {
  const candidates = [
    data.stemQuality,
    data.stem_quality,
    data.stemquality,
    data.condition_code,
    data.conditionCode,
    data.condition,
    data.treeCondition,
    data.tree_condition,
    data.code,
    data.treeCode,
    data.tree_code,
    data.status,
  ]

  for (const candidate of candidates) {
    const stemQualityCode = normalizeStemQualityCode(candidate)
    if (stemQualityCode) {
      return stemQualityCode
    }
  }

  return 1
}

export function normalizeIsCut(value: unknown, legacyValue?: unknown) {
  return value === true || legacyValue === true
}

export function getConditionCodeLabel(code: TreeConditionCode) {
  if (code === 2) return "Code 2 - Slightly Damaged"
  if (code === 3) return "Code 3 - Poor / Dying"
  return "Code 1 - Good"
}

export function getTreeStatusLabel(conditionCode: TreeConditionCode, isCut: boolean): TreeStatusLabel {
  if (isCut) return "Cut"
  if (conditionCode === 2) return "Monitor"
  if (conditionCode === 3) return "Ready to Cut"
  return "Healthy"
}
