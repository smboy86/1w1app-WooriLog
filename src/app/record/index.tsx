import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { useStore } from "../../data/context";
import type { Member } from "../../data/store";
import { Page, Heading, Notice, Button } from "../../components/ui";
export default function ChooseMember() {
  const store = useStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError("");
      (async () => {
        const family = await store.getFamily();
        const rows = family ? await store.listMembers(family.id) : [];
        if (active) setMembers(rows.filter((m) => !m.archived));
      })()
        .catch(() => {
          if (active) setError("구성원을 불러오지 못했어요.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [store]),
  );
  return (
    <Page>
      <Heading>누가 아픈가요?</Heading>
      <Notice>건강을 기록할 가족을 선택해 주세요.</Notice>
      {loading ? (
        <Notice>가족을 불러오고 있어요.</Notice>
      ) : error ? (
        <Notice>{error}</Notice>
      ) : members.length ? (
        members.map((member) => (
          <Button
            key={member.id}
            title={member.name}
            onPress={() =>
              router.push({
                pathname: "/record/region",
                params: { memberId: member.id },
              })
            }
          />
        ))
      ) : (
        <>
          <Notice>먼저 가족 구성원을 추가해 주세요.</Notice>
          <Button
            title="가족 구성원 추가"
            onPress={() => router.push("/family")}
          />
        </>
      )}
    </Page>
  );
}
