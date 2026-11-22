import { test } from "node:test";
import assert from "node:assert/strict";
import { isScheduleDate, scheduleDates } from "./schedule-dates";

test("specific schedule dates reject impossible calendar days", () => {
  assert.equal(isScheduleDate("2026-02-31"), false);
  assert.equal(isScheduleDate("2028-02-29"), true);
});
test("bulk scheduling adds consecutive dates across month boundaries", () => {
  assert.deepEqual(scheduleDates("2026-11-30", { days: 3 }), ["2026-11-30", "2026-12-01", "2026-12-02"]);
});
test("weekly scheduling starts on or after the specified date and deduplicates weekdays", () => {
  assert.deepEqual(scheduleDates("2026-11-07", { weekdays: [0, 5, 5], weeks: 2 }), ["2026-11-07", "2026-11-09", "2026-11-14"]);
});