import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { currentMonth, isoOffsetDays, toIsoDate, toIsoMonth, todayIso } from "./dates";

// The suite runs pinned to Asia/Jakarta (UTC+7) via vitest.config.ts, so these
// assertions are reproducible anywhere. 00:30 local on the 1st is 17:30 UTC on
// the last day of the previous month — the window where a UTC-derived "today"
// names the wrong day, and on the 1st, the wrong month.
const EARLY_MORNING_ON_THE_FIRST = new Date("2026-09-01T00:30:00+07:00");

describe("local calendar helpers", () => {
  it("formats a date from its local fields", () => {
    // Constructed from local components, so this holds in any timezone.
    expect(toIsoDate(new Date(2026, 8, 1, 0, 30))).toBe("2026-09-01");
    expect(toIsoMonth(new Date(2026, 8, 1, 0, 30))).toBe("2026-09");
  });

  it("zero-pads single-digit months and days", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  describe("in the early-morning window where UTC is still on the previous day", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(EARLY_MORNING_ON_THE_FIRST);
    });
    afterEach(() => vi.useRealTimers());

    it("reports today by the local calendar, not UTC", () => {
      expect(todayIso()).toBe("2026-09-01");
      // Locks the regression: the old implementation returned this instead.
      expect(new Date().toISOString().slice(0, 10)).toBe("2026-08-31");
      expect(todayIso()).not.toBe(new Date().toISOString().slice(0, 10));
    });

    it("reports the current month by the local calendar, not UTC", () => {
      expect(currentMonth()).toBe("2026-09");
      expect(new Date().toISOString().slice(0, 7)).toBe("2026-08");
    });

    it("offsets days against the local calendar", () => {
      expect(isoOffsetDays(0)).toBe("2026-09-01");
      expect(isoOffsetDays(1)).toBe("2026-09-02");
      expect(isoOffsetDays(-1)).toBe("2026-08-31");
    });
  });

  it("crosses month and year boundaries when offsetting", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T23:00:00+07:00"));
    expect(isoOffsetDays(1)).toBe("2027-01-01");
    expect(isoOffsetDays(-31)).toBe("2026-11-30");
    vi.useRealTimers();
  });
});
