import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFamilyData } from "../../data/use-family-data";
import {
  calendarEntries,
  groupByDay,
  localDateKey,
  monthCells,
} from "../../data/report";
import { REGIONS } from "../../data/store";
import {
  Page,
  Heading,
  Notice,
  Button,
  Card,
  Label,
  colors,
} from "../../components/ui";
import { router } from "expo-router";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export default function Calendar() {
  const { family, members, records, loading, error, reload } = useFamilyData();
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState(() => localDateKey(new Date()));
  const byDay = groupByDay(records);
  const cells = monthCells(month.getFullYear(), month.getMonth());
  const selectedRecords = byDay[selected] ?? [];
  const today = localDateKey(new Date());
  function changeMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    setMonth(next);
    setSelected(localDateKey(next));
  }
  if (loading)
    return (
      <Page tab>
        <Notice>달력을 불러오고 있어요.</Notice>
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
        <Heading>건강 기록 달력</Heading>
        <Notice>홈에서 우리 가족을 먼저 만들어 주세요.</Notice>
        <Button title="홈 리포트로" onPress={() => router.navigate("/")} />
      </Page>
    );
  return (
    <Page tab>
      <Heading>건강 기록 달력</Heading>
      <Notice>날짜를 누르면 가족별 기록을 볼 수 있어요.</Notice>
      <View style={s.monthHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          onPress={() => changeMonth(-1)}
          style={s.arrow}
        >
          <Text style={s.arrowText}>‹</Text>
        </Pressable>
        <Label>
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </Label>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          onPress={() => changeMonth(1)}
          style={s.arrow}
        >
          <Text style={s.arrowText}>›</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const date = new Date();
          setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
          setSelected(localDateKey(date));
        }}
        style={{
          alignSelf: "flex-end",
          minHeight: 44,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: colors.green }}>오늘로 이동</Text>
      </Pressable>
      <View style={s.calendar}>
        <View style={s.week}>
          {WEEKDAYS.map((day, index) => (
            <Text
              key={day}
              style={[s.weekday, index === 0 && { color: "#B95D55" }]}
            >
              {day}
            </Text>
          ))}
        </View>
        <View style={s.grid}>
          {cells.map((date, index) => {
            if (!date) return <View key={`empty-${index}`} style={s.day} />;
            const key = localDateKey(date);
            const entries = calendarEntries(byDay[key] ?? []);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: key === selected }}
                accessibilityLabel={`${date.getMonth() + 1}월 ${date.getDate()}일${key === today ? ", 오늘" : ""}, ${entries.length ? entries.map((entry) => `${entry.name} ${REGIONS[entry.region]} ${entry.count}건`).join(", ") : "기록 없음"}`}
                onPress={() => setSelected(key)}
                style={[s.day, key === selected && s.selected]}
              >
                <Text style={[s.date, key === today && s.today]}>
                  {date.getDate()}
                </Text>
                {entries.slice(0, 2).map((entry) => (
                  <View
                    key={`${entry.memberId}-${entry.region}`}
                    style={s.entry}
                  >
                    <View style={[s.dot, { backgroundColor: entry.color }]} />
                    <Text numberOfLines={1} style={s.entryText}>
                      {REGIONS[entry.region]}
                      {entry.count > 1 ? ` ${entry.count}` : ""}
                    </Text>
                  </View>
                ))}
                {entries.length > 2 ? (
                  <Text style={s.more}>+{entries.length - 2}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={s.legend}>
        {members.map((member) => (
          <View key={member.id} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: member.color }]} />
            <Text style={s.legendText}>
              {member.name}
              {member.archived ? " (보관)" : ""}
            </Text>
          </View>
        ))}
      </View>
      <Label>
        {Number(selected.slice(5, 7))}월 {Number(selected.slice(8, 10))}일 ·{" "}
        {selectedRecords.length}건
      </Label>
      {!selectedRecords.length ? (
        <Notice>이 날에 남긴 건강 기록이 없어요.</Notice>
      ) : (
        selectedRecords.map((record) => (
          <Card key={record.id}>
            <View style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: record.member_color }]} />
              <Label>
                {record.member_name} · {REGIONS[record.region]}
              </Label>
            </View>
            <Notice>{record.symptom}</Notice>
            <Notice>
              {new Date(record.occurred_at).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Notice>
          </Card>
        ))
      )}
    </Page>
  );
}
const s = StyleSheet.create({
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7EFE9",
    borderRadius: 16,
  },
  arrowText: { fontSize: 32, color: colors.green },
  calendar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2EAE3",
    marginHorizontal: -12,
  },
  week: {
    flexDirection: "row",
    backgroundColor: "#EAF0E9",
    paddingVertical: 12,
  },
  weekday: {
    width: "14.285714%",
    textAlign: "center",
    fontSize: 12,
    color: colors.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: {
    width: "14.285714%",
    minHeight: 98,
    padding: 3,
    borderWidth: 1,
    borderColor: "#F0F3EE",
    gap: 4,
  },
  selected: { backgroundColor: "#E2EEE5", borderColor: colors.green },
  date: {
    color: colors.ink,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 3,
  },
  today: {
    fontWeight: "800",
    color: colors.green,
    textDecorationLine: "underline",
  },
  entry: { flexDirection: "row", alignItems: "center", gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  entryText: { fontSize: 10, flex: 1, color: colors.ink },
  more: { fontSize: 10, color: colors.muted, textAlign: "center" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  legendText: { color: colors.muted, fontSize: 12 },
});
