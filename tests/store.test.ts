import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SQLiteDatabase } from "expo-sqlite";
import { initializeDatabase } from "../src/data/schema.ts";
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
    await store.renameMember(family, child, "첫째");
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
