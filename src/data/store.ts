import type { SQLiteDatabase } from "expo-sqlite";

export const REGIONS = {
  head: "머리",
  trunk: "몸통",
  limbs: "팔다리",
} as const;
export type Region = keyof typeof REGIONS;
export type Family = { id: string; name: string };
export type Member = {
  id: string;
  family_id: string;
  name: string;
  archived: number;
};
export type HealthRecord = {
  id: string;
  family_id: string;
  member_id: string;
  member_name: string;
  region: Region;
  symptom: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
};

function text(value: string, max: number) {
  const clean = value.trim();
  if (!clean || clean.length > max)
    throw new Error(`1~${max}자로 입력해 주세요.`);
  return clean;
}
function regionValue(region: Region) {
  if (!Object.hasOwn(REGIONS, region))
    throw new Error("아픈 영역을 선택해 주세요.");
  return region;
}
function timestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("날짜를 확인해 주세요.");
  return date.toISOString();
}

// 화면은 이 비동기 함수만 사용한다. Supabase 전환 시 저장 구현을 이곳에서 교체한다.
export function createStore(db: SQLiteDatabase, makeId: () => string) {
  return {
    getFamily: () =>
      db.getFirstAsync<Family>("SELECT id, name FROM families WHERE slot = 1"),
    async createFamily(name: string) {
      const id = makeId();
      await db.runAsync(
        "INSERT INTO families (id, slot, name) VALUES (?, 1, ?)",
        id,
        text(name, 40),
      );
      return id;
    },
    listMembers: (familyId: string) =>
      db.getAllAsync<Member>(
        "SELECT * FROM members WHERE family_id = ? ORDER BY archived, created_at, id",
        familyId,
      ),
    async addMember(familyId: string, name: string) {
      const id = makeId();
      await db.runAsync(
        "INSERT INTO members (id, family_id, name, created_at) VALUES (?, ?, ?, ?)",
        id,
        familyId,
        text(name, 40),
        new Date().toISOString(),
      );
      return id;
    },
    async renameMember(familyId: string, id: string, name: string) {
      const result = await db.runAsync(
        "UPDATE members SET name = ? WHERE id = ? AND family_id = ?",
        text(name, 40),
        id,
        familyId,
      );
      if (!result.changes) throw new Error("구성원을 찾을 수 없습니다.");
    },
    async removeMember(familyId: string, id: string) {
      // 먼저 보관하여 새 기록 생성을 막고, 기록이 없는 경우에만 물리 삭제한다.
      const result = await db.runAsync(
        "UPDATE members SET archived = 1 WHERE id = ? AND family_id = ?",
        id,
        familyId,
      );
      if (!result.changes) throw new Error("구성원을 찾을 수 없습니다.");
      const deleted = await db.runAsync(
        `DELETE FROM members WHERE id = ? AND family_id = ?
        AND NOT EXISTS (SELECT 1 FROM records WHERE member_id = members.id)`,
        id,
        familyId,
      );
      return deleted.changes ? "deleted" : "archived";
    },
    async createRecord(
      familyId: string,
      memberId: string,
      region: Region,
      symptom: string,
      occurredAt = new Date().toISOString(),
    ) {
      const id = makeId();
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO records
        (id, family_id, member_id, region, symptom, occurred_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        familyId,
        memberId,
        regionValue(region),
        text(symptom, 500),
        timestamp(occurredAt),
        now,
        now,
      );
      return id;
    },
    async updateRecord(
      familyId: string,
      id: string,
      region: Region,
      symptom: string,
    ) {
      const result = await db.runAsync(
        `UPDATE records SET region = ?, symptom = ?, updated_at = ?
        WHERE id = ? AND family_id = ?`,
        regionValue(region),
        text(symptom, 500),
        new Date().toISOString(),
        id,
        familyId,
      );
      if (!result.changes) throw new Error("기록을 찾을 수 없습니다.");
    },
    async deleteRecord(familyId: string, id: string) {
      const result = await db.runAsync(
        "DELETE FROM records WHERE id = ? AND family_id = ?",
        id,
        familyId,
      );
      if (!result.changes) throw new Error("기록을 찾을 수 없습니다.");
    },
    listRecords: (familyId: string) =>
      db.getAllAsync<HealthRecord>(
        `SELECT r.*, m.name AS member_name
      FROM records r JOIN members m ON m.id = r.member_id AND m.family_id = r.family_id
      WHERE r.family_id = ? ORDER BY r.occurred_at DESC, r.created_at DESC, r.id DESC`,
        familyId,
      ),
  };
}
