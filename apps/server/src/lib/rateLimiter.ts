// Simple in-memory rate limiter for socket events
// Tracks how many events a player sends per window

interface RateEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateEntry> = new Map();

  // Returns true if the action is allowed, false if rate limited
  check(key: string, maxPerWindow: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    entry.count++;
    if (entry.count > maxPerWindow) {
      return false;
    }

    return true;
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits) {
      if (now >= entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Clean up every 30 seconds
setInterval(() => rateLimiter.cleanup(), 30000);

// Rate limit configs per event type
export const RATE_LIMITS = {
  draw: { max: 60, windowMs: 1000 },       // 60 strokes per second (drawing)
  guess: { max: 5, windowMs: 2000 },        // 5 guesses per 2 seconds
  roomCreate: { max: 3, windowMs: 10000 },  // 3 room creates per 10 seconds
  roomJoin: { max: 5, windowMs: 10000 },    // 5 join attempts per 10 seconds
  gameStart: { max: 2, windowMs: 5000 },    // 2 start attempts per 5 seconds
};
