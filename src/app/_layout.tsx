import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "../data/context";
import { colors } from "../components/ui";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: colors.ink,
            headerStyle: { backgroundColor: colors.paper },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="index" options={{ title: "WooriLog" }} />
          <Stack.Screen name="family" options={{ title: "우리 가족 관리" }} />
          <Stack.Screen
            name="record/index"
            options={{ title: "1 · 가족 구성원 선택" }}
          />
          <Stack.Screen
            name="record/region"
            options={{ title: "2 · 아픈 영역 선택" }}
          />
          <Stack.Screen
            name="record/detail"
            options={{ title: "3 · 아픈 내용 상세" }}
          />
          <Stack.Screen name="history" options={{ title: "건강 기록" }} />
        </Stack>
      </DataProvider>
    </SafeAreaProvider>
  );
}
