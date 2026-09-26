import { Page, Heading, Notice, Card, Label, Button } from "../components/ui";
export default function Invite() {
  return (
    <Page>
      <Heading>가족과 함께{"\n"}건강을 기록해요.</Heading>
      <Notice>초대 기능은 준비 중이에요.</Notice>
      <Card>
        <Label>초대 코드로 가족 참여</Label>
        <Notice>
          공유 기능이 열리면 초대 코드를 발급하고, 가족이 로그인한 뒤 코드를
          입력하여 같은 리포트를 볼 수 있어요.
        </Notice>
        <Button title="초대 코드 발급 · 준비 중" disabled onPress={() => {}} />
      </Card>
      <Notice>
        현재 기록은 이 기기에만 저장되어 다른 사람에게 공유되지 않아요.
      </Notice>
    </Page>
  );
}
