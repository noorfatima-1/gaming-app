import { describe, it } from "node:test";
import assert from "node:assert";
import { sanitizeString, isValidUsername, isValidRoomCode, isValidGuess } from "../lib/validation";

describe("sanitizeString", () => {
  it("strips HTML tags", () => {
    assert.strictEqual(sanitizeString("<script>alert('xss')</script>hello"), "alert('xss')hello");
  });

  it("returns null for empty input", () => {
    assert.strictEqual(sanitizeString(""), null);
    assert.strictEqual(sanitizeString("   "), null);
  });

  it("returns null for non-string input", () => {
    assert.strictEqual(sanitizeString(123), null);
    assert.strictEqual(sanitizeString(null), null);
    assert.strictEqual(sanitizeString(undefined), null);
  });

  it("truncates to maxLength", () => {
    const result = sanitizeString("hello world", 5);
    assert.strictEqual(result, "hello");
  });

  it("trims whitespace", () => {
    assert.strictEqual(sanitizeString("  hello  "), "hello");
  });
});

describe("isValidUsername", () => {
  it("accepts valid usernames", () => {
    assert.strictEqual(isValidUsername("Player1"), true);
    assert.strictEqual(isValidUsername("A"), true);
    assert.strictEqual(isValidUsername("a".repeat(20)), true);
  });

  it("rejects empty or too long", () => {
    assert.strictEqual(isValidUsername(""), false);
    assert.strictEqual(isValidUsername("a".repeat(21)), false);
  });

  it("rejects non-strings", () => {
    assert.strictEqual(isValidUsername(123), false);
    assert.strictEqual(isValidUsername(null), false);
  });
});

describe("isValidRoomCode", () => {
  it("accepts valid room codes", () => {
    assert.strictEqual(isValidRoomCode("ABC123"), true);
    assert.strictEqual(isValidRoomCode("ABCD"), true);
    assert.strictEqual(isValidRoomCode("12345678"), true);
  });

  it("rejects too short or too long", () => {
    assert.strictEqual(isValidRoomCode("AB"), false);
    assert.strictEqual(isValidRoomCode("A".repeat(9)), false);
  });

  it("rejects special characters", () => {
    assert.strictEqual(isValidRoomCode("ABC-12"), false);
    assert.strictEqual(isValidRoomCode("ABC 12"), false);
  });
});

describe("isValidGuess", () => {
  it("accepts valid guesses", () => {
    assert.strictEqual(isValidGuess("cat"), true);
    assert.strictEqual(isValidGuess("a"), true);
  });

  it("rejects empty strings", () => {
    assert.strictEqual(isValidGuess(""), false);
    assert.strictEqual(isValidGuess("   "), false);
  });

  it("rejects too long guesses", () => {
    assert.strictEqual(isValidGuess("a".repeat(51)), false);
  });
});
