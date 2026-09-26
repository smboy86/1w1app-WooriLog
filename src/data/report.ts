import type { HealthRecord, Region } from "./store.ts";

export const MEMBER_COLORS = [
  "#287A68",
  "#C05B52",
  "#527FB5",
  "#A46CB1",
  "#B4802E",
  "#488C99",
  "#BF6A91",
  "#737A48",
] as const;
export const COLOR_NAMES = [
  "초록",
  "산호",
  "파랑",
  "보라",
  "황금",
  "청록",
  "분홍",
  "올리브",
] as const;
export type RegionCounts = Record<Region, number>;

// 저장된 UTC 시각을 기기의 현지 날짜로 묶는다.
export function localDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function monthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const length = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from(
    { length: first.getDay() },
    () => null,
  );
  for (let day = 1; day <= length; day++)
    cells.push(new Date(year, month, day));
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function countRegions(
  records: Pick<HealthRecord, "region">[],
): RegionCounts {
  const counts: RegionCounts = { head: 0, trunk: 0, limbs: 0 };
  for (const record of records) counts[record.region]++;
  return counts;
}
// 카드 안의 최대 기록 수를 100% 농도로 두고, 기록이 없는 영역은 12%로 표시한다.
export function regionOpacity(count: number, counts: RegionCounts) {
  const max = Math.max(counts.head, counts.trunk, counts.limbs);
  return count === 0 || max === 0 ? 0.12 : 0.25 + (0.75 * count) / max;
}
export function groupByDay(records: HealthRecord[]) {
  const days: Record<string, HealthRecord[]> = {};
  for (const record of records)
    (days[localDateKey(record.occurred_at)] ??= []).push(record);
  return days;
}
// 같은 구성원의 같은 영역은 한 줄로 묶되 원본 기록 수를 보존한다.
export function calendarEntries(records: HealthRecord[]) {
  const entries = new Map<
    string,
    {
      memberId: string;
      name: string;
      color: string;
      region: Region;
      count: number;
    }
  >();
  for (const record of records) {
    const key = `${record.member_id}:${record.region}`;
    const entry = entries.get(key);
    if (entry) entry.count++;
    else
      entries.set(key, {
        memberId: record.member_id,
        name: record.member_name,
        color: record.member_color,
        region: record.region,
        count: 1,
      });
  }
  return [...entries.values()];
}
