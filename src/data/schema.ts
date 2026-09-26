import type { SQLiteDatabase } from "expo-sqlite";
import { MEMBER_COLORS } from "./report.ts";

export const SCHEMA_VERSION = 2;
export const SCHEMA_SQL = `
CREATE TABLE families (
 id TEXT PRIMARY KEY NOT NULL,
 slot INTEGER NOT NULL UNIQUE CHECK(slot = 1),
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 40)
);
CREATE TABLE members (
 id TEXT PRIMARY KEY NOT NULL,
 family_id TEXT NOT NULL REFERENCES families(id),
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 40),
 archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0, 1)),
 created_at TEXT NOT NULL,
 UNIQUE(id, family_id)
);
CREATE TABLE records (
 id TEXT PRIMARY KEY NOT NULL,
 family_id TEXT NOT NULL REFERENCES families(id),
 member_id TEXT NOT NULL,
 region TEXT NOT NULL CHECK(region IN ('head', 'trunk', 'limbs')),
 symptom TEXT NOT NULL CHECK(length(trim(symptom)) BETWEEN 1 AND 500),
 occurred_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 FOREIGN KEY(member_id, family_id) REFERENCES members(id, family_id) ON DELETE RESTRICT
);
CREATE INDEX records_by_member ON records(family_id, member_id, occurred_at DESC);
CREATE TRIGGER records_active_member BEFORE INSERT ON records
WHEN EXISTS (SELECT 1 FROM members WHERE id = NEW.member_id AND archived = 1)
BEGIN SELECT RAISE(ABORT, '보관한 구성원에게 새 기록을 작성할 수 없습니다.'); END;
`;

// 앱 시작 시 외래키를 활성화하고 기존 데이터를 보존하면서 버전을 올린다.
export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const version = row?.user_version ?? 0;
  if (version > SCHEMA_VERSION)
    throw new Error(
      "더 최신 앱에서 만든 데이터입니다. 앱을 업데이트해 주세요.",
    );
  if (version === 0) {
    try {
      await db.execAsync(
        `BEGIN IMMEDIATE; ${SCHEMA_SQL} PRAGMA user_version = 1; COMMIT;`,
      );
    } catch (error) {
      await db.execAsync("ROLLBACK;").catch(() => {});
      throw error;
    }
  }
  if (version < 2) {
    try {
      await db.execAsync(`BEGIN IMMEDIATE;
        ALTER TABLE members ADD COLUMN color TEXT NOT NULL DEFAULT '#287A68';`);
      const members = await db.getAllAsync<{ id: string }>(
        "SELECT id FROM members ORDER BY created_at, id",
      );
      for (let index = 0; index < members.length; index++) {
        await db.runAsync(
          "UPDATE members SET color = ? WHERE id = ?",
          MEMBER_COLORS[index % MEMBER_COLORS.length],
          members[index].id,
        );
      }
      await db.execAsync("PRAGMA user_version = 2; COMMIT;");
    } catch (error) {
      await db.execAsync("ROLLBACK;").catch(() => {});
      throw error;
    }
  }
}
