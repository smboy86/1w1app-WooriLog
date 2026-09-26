import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { openDatabaseAsync } from "expo-sqlite";
import { randomUUID } from "expo-crypto";
import { initializeDatabase } from "./schema";
import { createStore } from "./store";
import { Button, Page, Heading, Notice } from "../components/ui";

const Context = createContext<ReturnType<typeof createStore> | null>(null);
let opening: Promise<ReturnType<typeof createStore>> | undefined;
function openStore() {
  return (opening ??= (async () => {
    const db = await openDatabaseAsync("woorilog.db");
    try {
      await initializeDatabase(db);
      return createStore(db, randomUUID);
    } catch (error) {
      await db.closeAsync();
      throw error;
    }
  })().catch((error) => {
    opening = undefined;
    throw error;
  }));
}
export function DataProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<ReturnType<typeof createStore> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    openStore()
      .then((value) => {
        if (active) setStore(value);
      })
      .catch(() => {
        if (active) setError("기록을 불러오지 못했어요. 다시 시도해 주세요.");
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (!store)
    return (
      <Page>
        <Heading>WooriLog</Heading>
        <Notice>{error || "우리 가족 기록을 준비하고 있어요."}</Notice>
        {error ? (
          <Button
            title="다시 시도"
            onPress={() => {
              setError("");
              setAttempt((v) => v + 1);
            }}
          />
        ) : null}
      </Page>
    );
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("저장소가 준비되지 않았습니다.");
  return store;
}
