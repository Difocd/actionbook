/**
 * Action ID utilities for converting between URL-based IDs and database references.
 *
 * Format:
 * - chunk_index = 0: document URL (e.g., "https://example.com/page")
 * - chunk_index > 0: document URL + fragment (e.g., "https://example.com/page#chunk-1")
 */

export interface ParsedActionId {
  documentUrl: string
  chunkIndex: number
}

/**
 * Generate a URL-based action ID from document URL and chunk index
 */
export function generateActionId(
  documentUrl: string,
  chunkIndex: number
): string {
  if (chunkIndex === 0) {
    return documentUrl
  }
  return `${documentUrl}#chunk-${chunkIndex}`
}

/**
 * Parse a URL-based action ID into document URL and chunk index
 *
 * Examples:
 * - "https://example.com/page" => { documentUrl: "https://example.com/page", chunkIndex: 0 }
 * - "https://example.com/page#chunk-1" => { documentUrl: "https://example.com/page", chunkIndex: 1 }
 * - "https://example.com/page#section" => { documentUrl: "https://example.com/page#section", chunkIndex: 0 }
 */
export function parseActionId(actionId: string): ParsedActionId {
  // Check for #chunk-N pattern at the end
  const chunkMatch = actionId.match(/#chunk-(\d+)$/)

  if (chunkMatch) {
    const chunkIndex = parseInt(chunkMatch[1], 10)
    const documentUrl = actionId.slice(0, -chunkMatch[0].length)
    return { documentUrl, chunkIndex }
  }

  // No chunk fragment - treat entire string as document URL, chunk index 0
  return { documentUrl: actionId, chunkIndex: 0 }
}

/**
 * Validate that a string looks like a valid action ID (URL-based)
 */
export function isValidActionId(actionId: string): boolean {
  try {
    const { documentUrl } = parseActionId(actionId)
    // Must be a valid URL
    new URL(documentUrl)
    return true
  } catch {
    return false
  }
}
