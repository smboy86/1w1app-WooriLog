import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../data/context";
import { REGIONS, type Member, type Region } from "../../data/store";
import { Page, Heading, Notice, Input, Button } from "../../components/ui";
export default function Detail() {
  const { memberId, region } = useLocalSearchParams<{
    memberId: string;
    region: string;
  }>();
  const store = useStore();
  const [member, setMember] = useState<Member | null>(null);
  const [symptom, setSymptom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const validRegion =
    typeof region === "string" && Object.hasOwn(REGIONS, region);
  useEffect(() => {
    (async () => {
      const family = await store.getFamily();
      const rows = family ? await store.listMembers(family.id) : [];
      const found = rows.find((m) => m.id === memberId && !m.archived);
      setMember(found ?? null);
      if (!found) setError("기록할 가족을 다시 선택해 주세요.");
    })().catch(() => setError("구성원을 불러오지 못했어요."));
  }, [store, memberId]);
  async function save() {
    if (!member || !validRegion) return;
    setBusy(true);
    setError("");
    try {
      await store.createRecord(
        member.family_id,
        member.id,
        region as Region,
        symptom,
      );
      router.dismissAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading>{member?.name ?? "가족"}의 건강 기록</Heading>
      <Notice>
        {validRegion ? REGIONS[region as Region] : "영역을 다시 선택해 주세요."}
      </Notice>
      <Input
        accessibilityLabel="아픈 내용"
        placeholder="어떻게 아픈지 간단히 적어 주세요."
        multiline
        maxLength={500}
        value={symptom}
        onChangeText={setSymptom}
        editable={!busy}
        style={{ minHeight: 150, textAlignVertical: "top" }}
      />
      {error ? <Notice>{error}</Notice> : null}
      <Button
        title={busy ? "저장 중…" : "기록 저장"}
        disabled={busy || !member || !validRegion || !symptom.trim()}
        onPress={() => void save()}
      />
    </Page>
  );
}
