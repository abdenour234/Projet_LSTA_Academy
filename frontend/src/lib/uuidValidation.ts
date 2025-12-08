/**
 * UUID Validation Utilities
 * Provides validation functions for UUID strings used in messaging system
 */

/**
 * RFC 4122 compliant UUID regex
 * Matches standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID
 * @param id - String to validate
 * @returns true if valid UUID, false otherwise
 * 
 * @example
 * validateUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * validateUUID('invalid-uuid') // false
 */
export function validateUUID(id: string | undefined | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Assert that a value is a valid UUID, throw error if not
 * @param id - String to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if UUID is invalid
 * 
 * @example
 * assertValidUUID(conversationId, 'conversationId')
 */
export function assertValidUUID(id: string | undefined | null, fieldName: string = 'UUID'): asserts id is string {
  if (!validateUUID(id)) {
    throw new Error(`Invalid ${fieldName}: ${id}. Expected valid UUID format.`);
  }
}

/**
 * Validate multiple UUIDs at once
 * @param ids - Object with UUID strings to validate
 * @returns Object with validation results
 * 
 * @example
 * const validation = validateUUIDs({
 *   conversationId: '550e8400-e29b-41d4-a716-446655440000',
 *   messageId: 'invalid'
 * });
 * // { conversationId: true, messageId: false }
 */
export function validateUUIDs(ids: Record<string, string | undefined | null>): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  
  for (const [key, value] of Object.entries(ids)) {
    results[key] = validateUUID(value);
  }
  
  return results;
}

/**
 * Sanitize UUID by trimming and lowercasing
 * @param id - UUID string to sanitize
 * @returns Sanitized UUID or null if invalid
 */
export function sanitizeUUID(id: string | undefined | null): string | null {
  if (!id) return null;
  
  const sanitized = id.trim().toLowerCase();
  return validateUUID(sanitized) ? sanitized : null;
}
