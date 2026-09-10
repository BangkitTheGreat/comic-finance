import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchTransactionUrl, buildTransactionDetailUrl, MAX_SEARCH_LENGTH } from "./url.ts";

test("buildSearchTransactionUrl handles simple queries", () => {
  assert.equal(buildSearchTransactionUrl("kopi"), "/transactions?q=kopi");
});

test("buildSearchTransactionUrl handles spaces properly", () => {
  // Intra-word spaces should be encoded with +
  assert.equal(buildSearchTransactionUrl("kopi susu"), "/transactions?q=kopi+susu");
  
  // Leading and trailing spaces should be trimmed
  assert.equal(buildSearchTransactionUrl("   kopi susu   "), "/transactions?q=kopi+susu");
});

test("buildSearchTransactionUrl handles empty or whitespace-only queries", () => {
  assert.equal(buildSearchTransactionUrl(""), "/transactions");
  assert.equal(buildSearchTransactionUrl("   "), "/transactions");
  assert.equal(buildSearchTransactionUrl("\t\n"), "/transactions");
  assert.equal(buildSearchTransactionUrl(null as unknown as string), "/transactions");
  assert.equal(buildSearchTransactionUrl(undefined as unknown as string), "/transactions");
});

test("buildSearchTransactionUrl securely encodes URL special characters", () => {
  // Ampersand (&) and equals (=) should not pollute parameters
  assert.equal(buildSearchTransactionUrl("Netflix & Chill"), "/transactions?q=Netflix+%26+Chill");
  assert.equal(buildSearchTransactionUrl("account=all"), "/transactions?q=account%3Dall");

  // Hash (#) should not truncate the query as a URL fragment
  assert.equal(buildSearchTransactionUrl("Tag #1"), "/transactions?q=Tag+%231");

  // Percent (%) should be encoded to prevent URIError
  assert.equal(buildSearchTransactionUrl("100% Cotton"), "/transactions?q=100%25+Cotton");

  // Question mark (?) should not create a secondary query string
  assert.equal(buildSearchTransactionUrl("Really? Yes"), "/transactions?q=Really%3F+Yes");

  // Plus (+) should be encoded so it is not treated as a space
  assert.equal(buildSearchTransactionUrl("C++"), "/transactions?q=C%2B%2B");
});

test("buildSearchTransactionUrl securely encodes XSS attempts", () => {
  const xssPayload = "<script>alert('xss')</script>";
  const target = buildSearchTransactionUrl(xssPayload);
  assert.equal(target, "/transactions?q=%3Cscript%3Ealert%28%27xss%27%29%3C%2Fscript%3E");
  
  // Ensure the raw opening/closing angle brackets are not present in URL
  assert.equal(target.includes("<script>"), false);
});

test("buildSearchTransactionUrl clamps excessively long input strings", () => {
  const longInput = "a".repeat(200);
  const target = buildSearchTransactionUrl(longInput);
  const parsed = new URL(`http://localhost${target}`);
  const q = parsed.searchParams.get("q");
  assert.equal(q?.length, MAX_SEARCH_LENGTH);
});

test("buildSearchTransactionUrl preserves unicode and emoji characters", () => {
  assert.equal(buildSearchTransactionUrl("café ☕"), "/transactions?q=caf%C3%A9+%E2%98%95");
});

test("buildTransactionDetailUrl generates correct transaction URL", () => {
  assert.equal(buildTransactionDetailUrl("t1"), "/transactions?transactionId=t1");
  assert.equal(buildTransactionDetailUrl("t10"), "/transactions?transactionId=t10");
});

test("buildTransactionDetailUrl handles empty and whitespace-only IDs", () => {
  assert.equal(buildTransactionDetailUrl(""), "/transactions");
  assert.equal(buildTransactionDetailUrl("   "), "/transactions");
  assert.equal(buildTransactionDetailUrl(null as unknown as string), "/transactions");
});

test("buildTransactionDetailUrl securely encodes special characters in IDs", () => {
  assert.equal(buildTransactionDetailUrl("t 1"), "/transactions?transactionId=t+1");
  assert.equal(buildTransactionDetailUrl("t&1"), "/transactions?transactionId=t%261");
  assert.equal(buildTransactionDetailUrl("t#1"), "/transactions?transactionId=t%231");
});

