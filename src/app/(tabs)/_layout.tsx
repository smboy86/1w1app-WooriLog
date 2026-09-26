import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { colors } from "../../components/ui";
export const unstable_settings = { initialRouteName: "index" };
function TabIcon({
  name,
  color,
}: {
  name: "calendar" | "home" | "settings";
  color: ColorValue;
}) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
    >
      {name === "calendar" ? (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={3} />
          <Path d="M7 2v6M17 2v6M3 11h18M7 15h2M12 15h2M7 18h2" />
        </>
      ) : name === "home" ? (
        <>
          <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
          <Path d="M8 21v-8h8v8" />
        </>
      ) : (
        <>
          <Circle cx={12} cy={12} r={4} />
          <Path d="M12 1v4M12 19v4M1 12h4M19 12h4M4 4l3 3M17 17l3 3M4 20l3-3M17 7l3-3" />
        </>
      )}
    </Svg>
  );
}
export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: "#7F8D86",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E3EAE4" },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: "달력",
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "홈 리포트",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "설정",
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
