import { router } from "expo-router";
import { View, Text } from "react-native";
import { useFamilyData } from "../../data/use-family-data";
import {
  Page,
  Heading,
  Notice,
  Card,
  Label,
  Button,
  colors,
} from "../../components/ui";
export default function Settings() {
  const { family, loading, error, reload } = useFamilyData();
  return (
    <Page tab>
      <Heading>우리 가족 설정</Heading>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#E1EDE3",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color: colors.green, fontSize: 22, fontWeight: "700" }}
            >
              나
            </Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Label>로컬 관리자</Label>
            <Notice>
              {loading
                ? "가족을 불러오는 중"
                : (family?.name ?? "가족 설정 전")}
            </Notice>
          </View>
        </View>
        <Notice>
          회원가입 없이 이 기기에서 가족의 건강 기록을 관리하고 있어요.
        </Notice>
      </Card>
      {error ? (
        <>
          <Notice>{error}</Notice>
          <Button title="다시 시도" onPress={reload} />
        </>
      ) : null}
      <Button
        secondary
        title="가족 구성원 설정"
        disabled={loading || !!error}
        onPress={() => router.push(family ? "/family" : "/")}
      />
      <Button
        secondary
        title="가족 구성원 초대"
        onPress={() => router.push("/invite")}
      />
    </Page>
  );
}
