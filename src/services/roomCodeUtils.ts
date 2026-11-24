export const ROOM_CODE_REGEX = /^[A-Z0-9]{6,12}$/;

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Normalizes user-entered room codes by trimming surrounding whitespace,
 * converting to uppercase, and stripping spaces/hyphens used for readability.
 * Invalid symbols are preserved so validation rejects them cleanly.
 */
export function normalizeRoomCode(rawCode: string): string {
  return String(rawCode || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '');
}

/**
 * Checks whether a normalized room code matches the strict 6-12 alphanumeric format.
 */
export function isValidRoomCodeFormat(rawCode: string): boolean {
  const normalized = normalizeRoomCode(rawCode);
  return ROOM_CODE_REGEX.test(normalized);
}

/**
 * Generates an unambiguous 6-character alphanumeric room code (excluding 0/O/1/I).
 */
export function generateCandidateRoomCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[idx];
  }
  return code;
}
