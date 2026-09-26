import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useStore } from "../data/context";
import { REGIONS, type HealthRecord } from "../data/store";
import {
  Page,
  Heading,
  Notice,
  Button,
  Card,
  Label,
  Input,
} from "../components/ui";
export default function History() {
  const store = useStore();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [symptom, setSymptom] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const read = useCallback(async () => {
    const family = await store.getFamily();
    return family ? await store.listRecords(family.id) : [];
  }, [store]);
  const apply = useCallback((data: HealthRecord[]) => setRecords(data), []);
  const load = () => read().then(apply);
  useEffect(() => {
    read()
      .then(apply)
      .catch(() => setError("기록을 불러오지 못했어요."))
      .finally(() => setBusy(false));
  }, [read, apply]);
  async function save() {
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      await store.updateRecord(
        editing.family_id,
        editing.id,
        editing.region,
        symptom,
      );
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  function remove(record: HealthRecord) {
    Alert.alert("건강 기록 삭제", "이 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          setError("");
          try {
            await store.deleteRecord(record.family_id, record.id);
            if (editing?.id === record.id) setEditing(null);
            await load();
          } catch {
            setError("삭제하지 못했어요.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }
  const filtered = records.filter((r) =>
    `${r.member_name} ${REGIONS[r.region]} ${r.symptom}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <Page>
      <Heading>가족의 건강 이력</Heading>
      <Input
        accessibilityLabel="건강 기록 검색"
        placeholder="가족 이름, 영역, 증상 검색"
        value={query}
        onChangeText={setQuery}
      />
      {error ? <Notice>{error}</Notice> : null}
      {editing ? (
        <Card>
          <Label>{editing.member_name} · 기록 수정</Label>
          <Input
            accessibilityLabel="아픈 내용 수정"
            multiline
            maxLength={500}
            value={symptom}
            onChangeText={setSymptom}
            editable={!busy}
          />
          <Button
            title="수정 저장"
            disabled={busy || !symptom.trim()}
            onPress={() => void save()}
          />
          <Button
            secondary
            title="취소"
            disabled={busy}
            onPress={() => setEditing(null)}
          />
        </Card>
      ) : null}
      {busy ? (
        <Notice>기록을 처리하고 있어요.</Notice>
      ) : !filtered.length ? (
        <Notice>표시할 기록이 없어요.</Notice>
      ) : null}
      {filtered.map((record) => (
        <Card key={record.id}>
          <Label>
            {record.member_name} · {REGIONS[record.region]}
          </Label>
          <Notice>
            {new Date(record.occurred_at).toLocaleString("ko-KR")}
          </Notice>
          <Notice>{record.symptom}</Notice>
          <Button
            secondary
            title="기록 수정"
            disabled={busy}
            onPress={() => {
              setEditing(record);
              setSymptom(record.symptom);
            }}
          />
          <Button
            secondary
            title="기록 삭제"
            disabled={busy}
            onPress={() => remove(record)}
          />
        </Card>
      ))}
    </Page>
  );
}
