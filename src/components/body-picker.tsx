import { View, Pressable, Text } from "react-native";
import { BodyFigure } from "./body-figure";
import { REGIONS, type Region } from "../data/store";
import { colors } from "./ui";
export function BodyPicker({
  selected,
  onSelect,
}: {
  selected: Region | null;
  onSelect: (region: Region) => void;
}) {
  return (
    <View style={{ alignItems: "center", gap: 16 }}>
      <BodyFigure selected={selected} onSelect={onSelect} height={330} />
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
