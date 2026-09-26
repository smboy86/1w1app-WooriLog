import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { useStore } from "../data/context";
import {
  REGIONS,
  type Family,
  type HealthRecord,
  type Region,
} from "../data/store";
import {
  Page,
  Heading,
  Notice,
  Button,
  Card,
  Label,
  Input,
} from "../components/ui";
export default function Home() {
  const store = useStore();
  const [family, setFamily] = useState<Family | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const value = await store.getFamily();
      setFamily(value);
      setRecords(value ? await store.listRecords(value.id) : []);
    } catch {
      setError("가족 리포트를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [store]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function create() {
    setBusy(true);
    setError("");
    try {
      await store.createFamily(name);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "가족을 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <Page>
        <Notice>리포트를 불러오고 있어요.</Notice>
      </Page>
    );
  if (error && !family)
    return (
      <Page>
        <Notice>{error}</Notice>
        <Button title="다시 시도" onPress={() => void load()} />
      </Page>
    );
  if (!family)
    return (
      <Page>
        <Heading>우리 가족의 건강을{"\n"}함께 기억해요.</Heading>
        <Notice>가족 이름을 정하고 첫 기록을 시작해 보세요.</Notice>
        <Input
          accessibilityLabel="가족 이름"
          placeholder="예: 우리 가족"
          maxLength={40}
          value={name}
          onChangeText={setName}
        />
        <Button
          title="우리 가족 만들기"
          disabled={busy || !name.trim()}
          onPress={() => void create()}
        />
      </Page>
    );
  return (
    <Page>
      <Notice>우리 가족 건강 리포트</Notice>
      <Heading>{family.name}</Heading>
      <Button title="기록 시작" onPress={() => router.push("/record")} />
      {error ? <Notice>{error}</Notice> : null}
      <Card>
        <Label>최근 건강 기록</Label>
        {records[0] ? (
          <>
            <Label>
              {records[0].member_name} · {REGIONS[records[0].region]}
            </Label>
            <Notice>{records[0].symptom}</Notice>
            <Notice>
              {new Date(records[0].occurred_at).toLocaleString("ko-KR")}
            </Notice>
          </>
        ) : (
          <Notice>아직 기록이 없어요. 첫 건강 기록을 남겨 주세요.</Notice>
        )}
      </Card>
      <Card>
        <Label>영역별 기록 수</Label>
        <Notice>전체 기간 · 발병 횟수가 아닌 작성한 기록 수예요.</Notice>
        {(Object.keys(REGIONS) as Region[]).map((region) => (
          <Label key={region}>
            {REGIONS[region]}　
            {records.filter((record) => record.region === region).length}건
          </Label>
        ))}
      </Card>
      <Button
        secondary
        title="건강 기록 살펴보기"
        onPress={() => router.push("/history")}
      />
      <Button
        secondary
        title="가족 구성원 관리"
        onPress={() => router.push("/family")}
      />
    </Page>
  );
}
