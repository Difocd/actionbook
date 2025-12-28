/**
 * Error codes for Actionbook SDK
 */
export const ErrorCodes = {
  INVALID_ACTION_ID: 'INVALID_ACTION_ID',
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  SCENARIO_NOT_FOUND: 'SCENARIO_NOT_FOUND',
  INVALID_QUERY: 'INVALID_QUERY',
  SELECTOR_INVALID: 'SELECTOR_INVALID',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  API_ERROR: 'API_ERROR',
  TIMEOUT: 'TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ActionbookErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * Custom error class for Actionbook SDK
 */
export class ActionbookError extends Error {
  public readonly code: ActionbookErrorCode
  public readonly suggestion?: string

  constructor(code: ActionbookErrorCode, message: string, suggestion?: string) {
    super(message)
    this.name = 'ActionbookError'
    this.code = code
    this.suggestion = suggestion
  }
}

/**
 * Type guard for ActionbookError
 */
export function isActionbookError(error: unknown): error is ActionbookError {
  return error instanceof ActionbookError
}
