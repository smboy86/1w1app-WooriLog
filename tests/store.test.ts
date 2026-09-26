import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SQLiteDatabase } from "expo-sqlite";
import { initializeDatabase, SCHEMA_SQL } from "../src/data/schema.ts";
import { createStore, type Region } from "../src/data/store.ts";

// Expo의 비동기 DB 호출을 실제 Node SQLite에 연결하여 같은 SQL과 저장 함수를 검증한다.
function open(path = ":memory:") {
  const sqlite = new DatabaseSync(path);
  const db = {
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
    runAsync: async (sql: string, ...params: (string | number)[]) =>
      sqlite.prepare(sql).run(...params),
    getFirstAsync: async (sql: string, ...params: (string | number)[]) =>
      sqlite.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql: string, ...params: (string | number)[]) =>
      sqlite.prepare(sql).all(...params),
  } as unknown as SQLiteDatabase;
  return { sqlite, db, store: createStore(db, randomUUID) };
}
test("등록·수정·삭제, 단일 가족과 구성원 연결, 입력 검증", async () => {
  const { sqlite, db, store } = open();
  try {
    await initializeDatabase(db);
    await initializeDatabase(db);
    assert.equal(await store.getFamily(), null);
    await assert.rejects(store.createFamily("   "));
    const family = await store.createFamily("우리 가족");
    await assert.rejects(store.createFamily("두 번째 가족"));
    const child = await store.addMember(family, "아이");
    await assert.rejects(store.addMember("other-family", "다른 가족"));
    await assert.rejects(
      store.createRecord(family, child, "invalid" as Region, "증상"),
    );
    await assert.rejects(store.createRecord(family, child, "head", "   "));
    await assert.rejects(
      store.createRecord(family, child, "head", "증상", "invalid-date"),
    );
    await assert.rejects(
      store.createRecord("other-family", child, "head", "증상"),
    );
    const old = await store.createRecord(
      family,
      child,
      "head",
      "머리가 아파요 ' %",
      "2026-09-01T10:00:00Z",
    );
    const latest = await store.createRecord(
      family,
      child,
      "trunk",
      "배가 아파요",
      "2026-09-02T10:00:00Z",
    );
    assert.equal((await store.listRecords(family))[0].id, latest);
    assert.deepEqual(await store.listRecords("other-family"), []);
    await assert.rejects(
      store.updateRecord("other-family", old, "limbs", "변경"),
    );
    await assert.rejects(store.deleteRecord("other-family", old));
    await store.updateRecord(family, old, "limbs", "팔이 아파요");
    await store.updateMember(family, child, "첫째", "#287A68");
    const records = await store.listRecords(family);
    assert.equal(records[1].member_name, "첫째");
    assert.equal(records[1].symptom, "팔이 아파요");
    assert.equal(records[1].region, "limbs");
    await store.deleteRecord(family, old);
    assert.equal((await store.listRecords(family)).length, 1);
  } finally {
    sqlite.close();
  }
});
test("기록이 있으면 보관하고 새 기록을 막으며 기존 이력을 보존한다", async () => {
  const { sqlite, db, store } = open();
  try {
    await initializeDatabase(db);
    const family = await store.createFamily("가족");
    const member = await store.addMember(family, "아이");
    const empty = await store.addMember(family, "기록 없음");
    await store.createRecord(family, member, "head", "두통");
    assert.equal(await store.removeMember(family, empty), "deleted");
    assert.equal(await store.removeMember(family, member), "archived");
    assert.equal((await store.listMembers(family))[0].archived, 1);
    assert.equal((await store.listRecords(family)).length, 1);
    await assert.rejects(store.createRecord(family, member, "head", "새 기록"));
    await assert.rejects(
      db.runAsync("DELETE FROM members WHERE id = ?", member),
    );
  } finally {
    sqlite.close();
  }
});
test("파일 DB를 닫고 다시 열어도 기록을 보존한다", async () => {
  const directory = mkdtempSync(join(tmpdir(), "woorilog-test-"));
  const path = join(directory, "test.db");
  let connection = open(path);
  try {
    await initializeDatabase(connection.db);
    const family = await connection.store.createFamily("영속 가족");
    const member = await connection.store.addMember(family, "아이");
    await connection.store.createRecord(family, member, "trunk", "복통");
    connection.sqlite.close();
    connection = open(path);
    await initializeDatabase(connection.db);
    assert.equal((await connection.store.getFamily())?.id, family);
    assert.equal(
      (await connection.store.listRecords(family))[0].symptom,
      "복통",
    );
  } finally {
    connection.sqlite.close();
    rmSync(directory, { recursive: true });
  }
});
test("지원하지 않는 미래 DB 버전은 초기화하지 않는다", async () => {
  const { sqlite, db } = open();
  try {
    sqlite.exec("PRAGMA user_version = 99");
    await assert.rejects(initializeDatabase(db), /업데이트/);
  } finally {
    sqlite.close();
  }
});

test("색상 등록·수정은 기존 기록의 달력 표시에도 반영된다", async () => {
  const { sqlite, db, store } = open();
  try {
    await initializeDatabase(db);
    const family = await store.createFamily("우리 가족");
    const member = await store.addMember(family, "첫째", "#C05B52");
    await store.createRecord(family, member, "head", "두통");
    assert.equal((await store.listMembers(family))[0].color, "#C05B52");
    await store.updateMember(family, member, "새 이름", "#527FB5");
    assert.equal((await store.listRecords(family))[0].member_color, "#527FB5");
    assert.equal((await store.listRecords(family))[0].member_name, "새 이름");
    await assert.rejects(store.addMember(family, "둘째", "invalid"));
    await assert.rejects(store.updateMember(family, member, "변경", "#FFFFFF"));
    await assert.rejects(
      store.updateMember("another-family", member, "변경", "#527FB5"),
    );
    assert.equal((await store.listMembers(family))[0].name, "새 이름");
  } finally {
    sqlite.close();
  }
});

test("v1 DB를 v2로 올릴 때 기록·보관 상태를 보존하고 색상을 한 번만 지정한다", async () => {
  const { sqlite, db, store } = open();
  try {
    sqlite.exec(
      `PRAGMA foreign_keys = ON; ${SCHEMA_SQL} PRAGMA user_version = 1;`,
    );
    sqlite.exec(`INSERT INTO families VALUES ('family', 1, '기존 가족');
      INSERT INTO members VALUES ('a', 'family', '아이', 0, '2026-09-01');
      INSERT INTO members VALUES ('b', 'family', '엄마', 1, '2026-09-02');
      INSERT INTO records VALUES ('r', 'family', 'a', 'head', '기존 기록', '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z');`);
    await initializeDatabase(db);
    assert.equal(sqlite.prepare("PRAGMA user_version").get()?.user_version, 2);
    const members = await store.listMembers("family");
    assert.equal(members[0].color, "#287A68");
    assert.equal(members[1].color, "#C05B52");
    assert.equal(members[1].archived, 1);
    assert.equal((await store.listRecords("family"))[0].symptom, "기존 기록");
    await store.updateMember("family", "a", "아이", "#A46CB1");
    await initializeDatabase(db);
    assert.equal((await store.listMembers("family"))[0].color, "#A46CB1");
  } finally {
    sqlite.close();
  }
});
