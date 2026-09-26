import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useStore } from "./context";
import type { Family, Member, HealthRecord } from "./store";

// 탭 복귀 시 색상과 기록을 함께 읽고 이전 요청이나 떠난 화면의 응답을 무시한다.
export function useFamilyData() {
  const store = useStore();
  const requestId = useRef(0);
  const [data, setData] = useState<{
    family: Family | null;
    members: Member[];
    records: HealthRecord[];
  }>({ family: null, members: [], records: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const family = await store.getFamily();
      const [members, records] = family
        ? await Promise.all([
            store.listMembers(family.id),
            store.listRecords(family.id),
          ])
        : [[], []];
      if (request === requestId.current) setData({ family, members, records });
    } catch {
      if (request === requestId.current)
        setError("가족 기록을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [store]);
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        requestId.current++;
      };
    }, [reload]),
  );
  return { ...data, loading, error, reload };
}
