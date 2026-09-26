import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useStore } from "../data/context";
import { type Family, type Member } from "../data/store";
import {
  Page,
  Heading,
  Notice,
  Button,
  Card,
  Label,
  Input,
} from "../components/ui";
export default function FamilyScreen() {
  const store = useStore();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const read = useCallback(async () => {
    const family = await store.getFamily();
    return {
      family,
      members: family ? await store.listMembers(family.id) : [],
    };
  }, [store]);
  const apply = useCallback(
    (data: { family: Family | null; members: Member[] }) => {
      setFamily(data.family);
      setMembers(data.members);
    },
    [],
  );
  const load = () => read().then(apply);
  useEffect(() => {
    read()
      .then(apply)
      .catch(() => setError("가족을 불러오지 못했어요."))
      .finally(() => setBusy(false));
  }, [read, apply]);
  async function save() {
    if (!family) return;
    setBusy(true);
    setError("");
    try {
      if (editing) await store.renameMember(family.id, editing, name);
      else await store.addMember(family.id, name);
      setName("");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  function remove(member: Member) {
    Alert.alert(
      `${member.name} 삭제 또는 보관`,
      "건강 기록이 있으면 삭제하지 않고 보관합니다. 기록은 그대로 남습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "진행",
          onPress: async () => {
            if (!family) return;
            setBusy(true);
            setError("");
            try {
              await store.removeMember(family.id, member.id);
              if (editing === member.id) {
                setEditing(null);
                setName("");
              }
              await load();
            } catch {
              setError("처리하지 못했어요. 다시 시도해 주세요.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }
  return (
    <Page>
      <Heading>함께 돌보는 가족</Heading>
      <Notice>건강을 기록할 가족 구성원을 등록해 주세요.</Notice>
      <Input
        accessibilityLabel="구성원 이름"
        placeholder="구성원 이름"
        maxLength={40}
        value={name}
        onChangeText={setName}
        editable={!busy}
      />
      <Button
        title={editing ? "이름 수정" : "가족 구성원 추가"}
        disabled={busy || !family || !name.trim()}
        onPress={() => void save()}
      />
      {editing ? (
        <Button
          secondary
          title="수정 취소"
          disabled={busy}
          onPress={() => {
            setEditing(null);
            setName("");
          }}
        />
      ) : null}
      {error ? <Notice>{error}</Notice> : null}
      {!busy && !members.length ? (
        <Notice>아직 등록된 가족이 없어요.</Notice>
      ) : null}
      {members.map((member) => (
        <Card key={member.id}>
          <Label>
            {member.name}
            {member.archived ? " · 보관됨" : ""}
          </Label>
          <Button
            secondary
            title="이름 수정"
            disabled={busy}
            onPress={() => {
              setEditing(member.id);
              setName(member.name);
            }}
          />
          {!member.archived ? (
            <Button
              secondary
              title="삭제 또는 보관"
              disabled={busy}
              onPress={() => remove(member)}
            />
          ) : (
            <Notice>기존 기록은 건강 기록 화면에서 볼 수 있어요.</Notice>
          )}
        </Card>
      ))}
    </Page>
  );
}
