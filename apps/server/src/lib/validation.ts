// Input validation and sanitization

// Strip HTML tags and limit length
export function sanitizeString(input: unknown, maxLength: number = 100): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/<[^>]*>/g, "").trim();
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, maxLength);
}

export function isValidUsername(input: unknown): input is string {
  if (typeof input !== "string") return false;
  const trimmed = input.trim();
  return trimmed.length >= 1 && trimmed.length <= 20;
}

export function isValidRoomCode(input: unknown): input is string {
  if (typeof input !== "string") return false;
  return /^[A-Z0-9]{4,8}$/i.test(input.trim());
}

export function isValidGuess(input: unknown): input is string {
  if (typeof input !== "string") return false;
  const trimmed = input.trim();
  return trimmed.length >= 1 && trimmed.length <= 50;
}
