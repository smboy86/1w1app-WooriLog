import { View, Pressable, Text } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { REGIONS, type Region } from "../data/store";
import { colors } from "./ui";
export function BodyPicker({
  selected,
  onSelect,
}: {
  selected: Region | null;
  onSelect: (region: Region) => void;
}) {
  const props = (region: Region) => ({
    fill: colors[region],
    stroke: selected === region ? colors.ink : "#FFFFFF",
    strokeWidth: selected === region ? 5 : 2,
    onPress: () => onSelect(region),
  });
  return (
    <View style={{ alignItems: "center", gap: 16 }}>
      <Svg
        width={240}
        height={330}
        viewBox="0 0 240 330"
        accessibilityLabel="머리, 몸통, 팔다리 중 아픈 영역을 선택하세요"
      >
        <Circle cx={120} cy={42} r={29} {...props("head")} />
        <Path
          d="M92 80 Q120 70 148 80 L155 190 Q120 206 85 190 Z"
          {...props("trunk")}
        />
        <G {...props("limbs")}>
          <Path d="M89 83 Q69 80 63 104 L38 179 Q33 196 46 200 Q59 205 66 187 L90 126 Z" />
          <Path d="M151 83 Q171 80 177 104 L202 179 Q207 196 194 200 Q181 205 174 187 L150 126 Z" />
          <Path d="M85 196 L115 203 L112 304 Q111 318 96 316 Q82 316 82 304 Z" />
          <Path d="M125 203 L155 196 L158 304 Q158 316 144 316 Q129 318 128 304 Z" />
        </G>
      </Svg>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {(Object.keys(REGIONS) as Region[]).map((region) => (
          <Pressable
            key={region}
            accessibilityRole="radio"
            accessibilityLabel={REGIONS[region]}
            accessibilityState={{ selected: selected === region }}
            onPress={() => onSelect(region)}
            style={{
              minHeight: 48,
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors[region],
              borderWidth: 2,
              borderColor: selected === region ? colors.ink : "transparent",
            }}
          >
            <Text style={{ color: colors.ink, fontWeight: "700" }}>
              {selected === region ? "✓ " : ""}
              {REGIONS[region]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
