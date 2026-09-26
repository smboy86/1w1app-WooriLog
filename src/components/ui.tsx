import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const colors = {
  ink: "#203C36",
  muted: "#63756D",
  paper: "#F5F7F2",
  green: "#26705C",
  head: "#DFA85B",
  trunk: "#73AE94",
  limbs: "#83A9CD",
};
export function Page({ children }: PropsWithChildren) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={["bottom", "left", "right"]}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.page}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Heading({ children }: PropsWithChildren) {
  return <Text style={styles.heading}>{children}</Text>;
}
export function Notice({ children }: PropsWithChildren) {
  return <Text style={styles.notice}>{children}</Text>;
}
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: colors.green }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}
export const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: "700", color: colors.ink },
  notice: { fontSize: 15, lineHeight: 23, color: colors.muted },
  label: { fontSize: 18, fontWeight: "600", color: colors.ink },
  card: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 20, gap: 12 },
  button: {
    backgroundColor: colors.green,
    minHeight: 50,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: "#E7EFE9" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5D5CB",
    borderRadius: 12,
    padding: 14,
    color: colors.ink,
    fontSize: 16,
    minHeight: 50,
  },
});
