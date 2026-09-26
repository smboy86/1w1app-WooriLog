import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { BodyPicker } from "../../components/body-picker";
import { Page, Heading, Notice, Button } from "../../components/ui";
import type { Region } from "../../data/store";
export default function ChooseRegion() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const [region, setRegion] = useState<Region | null>(null);
  return (
    <Page>
      <Heading>어디가 아픈가요?</Heading>
      <Notice>몸 그림에서 아픈 영역 하나를 눌러 주세요.</Notice>
      <BodyPicker selected={region} onSelect={setRegion} />
      <Button
        title="상세 내용 입력"
        disabled={!region || typeof memberId !== "string"}
        onPress={() => {
          if (region)
            router.push({
              pathname: "/record/detail",
              params: { memberId, region },
            });
        }}
      />
    </Page>
  );
}
