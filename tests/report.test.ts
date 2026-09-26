import assert from "node:assert/strict";
import { test } from "node:test";
import {
  monthCells,
  localDateKey,
  groupByDay,
  calendarEntries,
  countRegions,
  regionOpacity,
} from "../src/data/report.ts";
import type { HealthRecord } from "../src/data/store.ts";
process.env.TZ = "Asia/Seoul";
function record(
  member: string,
  region: HealthRecord["region"],
  occurredAt: string,
): HealthRecord {
  return {
    id: `${member}-${region}-${occurredAt}`,
    family_id: "family",
    member_id: member,
    member_name: member,
    member_color: member === "a" ? "#287A68" : "#C05B52",
    region,
    symptom: "증상",
    occurred_at: occurredAt,
    created_at: occurredAt,
    updated_at: occurredAt,
  };
}
test("월 달력은 일요일 시작·윤년·연도 경계를 처리한다", () => {
  const leap = monthCells(2024, 1);
  assert.equal(leap.filter(Boolean).length, 29);
  assert.equal(leap.findIndex(Boolean), 4);
  assert.equal(leap.length % 7, 0);
  assert.equal(monthCells(2023, 1).filter(Boolean).length, 28);
  assert.equal(monthCells(2025, 5)[0]?.getDate(), 1);
  assert.equal(monthCells(2026, 12).find(Boolean)?.getFullYear(), 2027);
  assert.equal(monthCells(2026, -1).find(Boolean)?.getMonth(), 11);
});
test("UTC 자정이 아닌 현지 날짜로 기록을 분류한다", () => {
  assert.equal(localDateKey("2026-09-26T15:30:00Z"), "2026-09-27");
  const days = groupByDay([
    record("a", "head", "2026-09-26T15:30:00Z"),
    record("a", "trunk", "2026-09-26T14:30:00Z"),
  ]);
  assert.equal(days["2026-09-27"][0].region, "head");
  assert.equal(days["2026-09-26"][0].region, "trunk");
});
test("같은 날 겹친 가족과 영역을 합치되 가족별 색상과 기록 수를 유지한다", () => {
  const rows = calendarEntries([
    record("a", "head", "2026-09-27T00:00:00Z"),
    record("a", "head", "2026-09-27T01:00:00Z"),
    record("b", "head", "2026-09-27T00:00:00Z"),
    record("a", "limbs", "2026-09-27T00:00:00Z"),
  ]);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].count, 2);
  assert.equal(rows[0].color, "#287A68");
  assert.equal(rows[1].color, "#C05B52");
  assert.equal(rows[2].region, "limbs");
});
test("영역 집계와 상대 농도는 0건·동률·큰 값도 처리한다", () => {
  const counts = countRegions([
    { region: "head" },
    { region: "head" },
    { region: "limbs" },
  ]);
  assert.deepEqual(counts, { head: 2, trunk: 0, limbs: 1 });
  assert.equal(regionOpacity(2, counts), 1);
  assert.equal(regionOpacity(0, counts), 0.12);
  assert.ok(regionOpacity(1, counts) < regionOpacity(2, counts));
  assert.equal(regionOpacity(0, countRegions([])), 0.12);
  assert.equal(regionOpacity(1000, { head: 1000, trunk: 1000, limbs: 0 }), 1);
});
