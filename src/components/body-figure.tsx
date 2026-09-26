import Svg, { Circle, G, Path } from "react-native-svg";
import type { Region } from "../data/store";
import { regionOpacity, type RegionCounts } from "../data/report";
import { colors } from "./ui";

// 입력 화면과 리포트에서 같은 신체 영역을 사용한다.
export function BodyFigure({
  selected,
  onSelect,
  counts,
  height = 300,
}: {
  selected?: Region | null;
  onSelect?: (region: Region) => void;
  counts?: RegionCounts;
  height?: number;
}) {
  const props = (region: Region) => ({
    fill: colors[region],
    fillOpacity: counts ? regionOpacity(counts[region], counts) : 1,
    stroke: selected === region ? colors.ink : counts ? "#D5DFD9" : "#FFFFFF",
    strokeWidth: selected === region ? 5 : 2,
    onPress: onSelect ? () => onSelect(region) : undefined,
  });
  return (
    <Svg
      width={(height * 240) / 330}
      height={height}
      viewBox="0 0 240 330"
      accessibilityLabel={
        counts
          ? `머리 ${counts.head}건, 몸통 ${counts.trunk}건, 팔다리 ${counts.limbs}건`
          : "머리, 몸통, 팔다리 중 아픈 영역을 선택하세요"
      }
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
  );
}
