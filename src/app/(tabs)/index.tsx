import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useStore } from "../../data/context";
import { useFamilyData } from "../../data/use-family-data";
import { REGIONS, type Region } from "../../data/store";
import { countRegions } from "../../data/report";
import { BodyFigure } from "../../components/body-figure";
import {
  Page,
  Heading,
  Notice,
  Button,
  Label,
  Input,
  colors,
} from "../../components/ui";

export default function Home() {
  const store = useStore();
  const { family, members, records, loading, error, reload } = useFamilyData();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 64, 380);
  async function create() {
    setBusy(true);
    setSaveError("");
    try {
      await store.createFamily(name);
      reload();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "가족을 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <Page tab>
        <Notice>리포트를 불러오고 있어요.</Notice>
      </Page>
    );
  if (error)
    return (
      <Page tab>
        <Notice>{error}</Notice>
        <Button title="다시 시도" onPress={reload} />
      </Page>
    );
  if (!family)
    return (
      <Page tab>
        <Heading>우리 가족의 건강을{"\n"}함께 기억해요.</Heading>
        <Notice>가족 이름을 정하고 첫 기록을 시작해 보세요.</Notice>
        <Input
          accessibilityLabel="가족 이름"
          placeholder="예: 우리 가족"
          maxLength={40}
          value={name}
          onChangeText={setName}
        />
        {saveError ? <Notice>{saveError}</Notice> : null}
        <Button
          title="우리 가족 만들기"
          disabled={busy || !name.trim()}
          onPress={() => void create()}
        />
      </Page>
    );
  const counts = countRegions(records);
  return (
    <Page tab>
      <Notice>{family.name}의 건강 다이어리</Notice>
      <Heading>함께 쌓은{"\n"}건강의 기록</Heading>
      <View style={s.dashboard}>
        <Text style={s.overline}>전체 기간 · 누적 건강 기록</Text>
        <View style={s.totalRow}>
          <Text style={s.total}>{records.length}</Text>
          <Text style={s.unit}>건</Text>
        </View>
        <View style={s.stats}>
          {(Object.keys(REGIONS) as Region[]).map((region) => (
            <View key={region} style={s.stat}>
              <View
                style={{
                  width: 20,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors[region],
                }}
              />
              <Text style={s.statNumber}>{counts[region]}</Text>
              <Text style={s.overline}>{REGIONS[region]}</Text>
            </View>
          ))}
        </View>
      </View>
      <Button title="기록 시작" onPress={() => router.push("/record")} />
      <View style={s.section}>
        <Label>가족별 몸 상태</Label>
        <Notice>{members.length}명</Notice>
      </View>
      <Notice>
        좌우로 넘겨 가족을 살펴보세요. 기록이 많은 영역일수록 진하게 표시돼요.
      </Notice>
      {members.length ? (
        <FlatList
          horizontal
          data={members}
          keyExtractor={(member) => member.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + 16}
          decelerationRate="fast"
          disableIntervalMomentum
          style={{ marginHorizontal: -24 }}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          renderItem={({ item: member }) => {
            const entries = records.filter(
              (record) => record.member_id === member.id,
            );
            const memberCounts = countRegions(entries);
            return (
              <View style={[s.memberCard, { width: cardWidth }]}>
                <View style={s.memberHeading}>
                  <View style={[s.dot, { backgroundColor: member.color }]} />
                  <Label>{member.name}</Label>
                </View>
                <Text style={s.memberMeta}>
                  {member.archived ? "보관된 구성원 · " : ""}전체{" "}
                  {entries.length}건
                </Text>
                <View style={{ alignItems: "center" }}>
                  <BodyFigure counts={memberCounts} height={270} />
                </View>
                <View style={s.regionRow}>
                  {(Object.keys(REGIONS) as Region[]).map((region) => (
                    <View key={region} style={{ alignItems: "center", gap: 5 }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          backgroundColor: colors[region],
                          borderRadius: 4,
                        }}
                      />
                      <Text style={s.memberMeta}>{REGIONS[region]}</Text>
                      <Text style={s.regionCount}>
                        {memberCounts[region]}건
                      </Text>
                    </View>
                  ))}
                </View>
                {!entries.length ? (
                  <Notice>아직 남긴 기록이 없어요.</Notice>
                ) : (
                  <Notice>최근 · {REGIONS[entries[0].region]}</Notice>
                )}
              </View>
            );
          }}
        />
      ) : (
        <Button
          secondary
          title="첫 가족 구성원 추가"
          onPress={() => router.push("/family")}
        />
      )}
      <Notice>
        색 농도는 각 구성원 안에서 비교한 기록 수입니다. 건강 상태의 진단이나
        가족 간 비교 점수가 아니에요.
      </Notice>
      <Button
        secondary
        title="전체 건강 기록 보기"
        onPress={() => router.push("/history")}
      />
    </Page>
  );
}
const s = StyleSheet.create({
  dashboard: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 24,
    gap: 8,
  },
  overline: { color: "#D6E4DD", fontSize: 13 },
  totalRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  total: {
    color: "#FFFFFF",
    fontSize: 64,
    lineHeight: 78,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  unit: { color: "#D6E4DD", fontSize: 18 },
  stats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#4D665C",
    paddingTop: 20,
    marginTop: 4,
  },
  stat: { flex: 1, gap: 8 },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E0E8DF",
  },
  memberHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  memberMeta: { fontSize: 13, color: colors.muted },
  regionCount: { fontSize: 17, fontWeight: "600", color: colors.ink },
  regionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#EDF1EB",
    paddingTop: 16,
  },
});
