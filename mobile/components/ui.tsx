import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { colors, fonts, shadow } from "@/theme";
import { Icon } from "./Icon";

export function Loader({ color = colors.navy400 }: { color?: string }) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={color} size="large" />
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}) {
  const palette = {
    primary: { bg: colors.navy900, fg: colors.white, border: colors.navy900 },
    gold: { bg: colors.gold400, fg: colors.navy950, border: colors.gold400 },
    outline: { bg: colors.white, fg: colors.navy900, border: colors.navy200 },
    ghost: { bg: "transparent", fg: colors.navy800, border: "transparent" },
    danger: { bg: colors.red, fg: colors.white, border: colors.red },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.5 : pressed ? 0.88 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={palette.fg} /> : icon ? <Icon name={icon} color={palette.fg} size={18} /> : null}
      <Text style={[styles.buttonLabel, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  required,
  hint,
  ...input
}: { label: string; required?: boolean; hint?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={colors.slate400}
        {...input}
        style={[styles.input, input.multiline && styles.multiline, input.style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[] | string[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const normalized = options.map((option) => (typeof option === "string" ? { label: option, value: option } : option));
  const current = normalized.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : null}
      </Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={{ fontFamily: fonts.medium, color: current ? colors.navy900 : colors.slate400 }}>
          {current?.label ?? "Select"}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {normalized.map((option) => (
              <Pressable
                key={option.value}
                style={styles.option}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionLabel, option.value === value && { color: colors.gold700 }]}>{option.label}</Text>
                {option.value === value ? <Icon name="checkmark" color={colors.gold700} size={18} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export { DateField } from "./DateField";

export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <Pressable style={styles.checkRow} onPress={() => onChange(!checked)}>
      <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Icon name="checkmark" color={colors.white} size={14} /> : null}</View>
      <Text style={styles.checkText}>{children}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = "gray" }: { label: string; tone?: "green" | "amber" | "navy" | "gray" | "red" | "sky" }) {
  const palette = {
    green: { bg: colors.emeraldBg, fg: colors.emerald },
    amber: { bg: colors.amberBg, fg: colors.amber },
    navy: { bg: colors.navy50, fg: colors.navy800 },
    gray: { bg: colors.slate100, fg: colors.slate600 },
    red: { bg: colors.redBg, fg: colors.red },
    sky: { bg: colors.skyBg, fg: colors.sky },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function Notice({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const palette = {
    error: { bg: colors.redBg, fg: colors.red },
    success: { bg: colors.emeraldBg, fg: colors.emerald },
    info: { bg: colors.navy50, fg: colors.navy800 },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg }]}>
      <Text style={{ color: palette.fg, fontFamily: fonts.medium, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: colors.slate50 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonLabel: { fontFamily: fonts.semibold, fontSize: 16 },
  field: { gap: 6 },
  label: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 14 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.navy900,
  },
  multiline: { minHeight: 110, textAlignVertical: "top" },
  hint: { fontFamily: fonts.sans, color: colors.slate500, fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,26,44,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, ...shadow },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy900, marginBottom: 8 },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate200 },
  optionLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.navy900 },
  checkRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.slate200, padding: 14 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.slate400, alignItems: "center", justifyContent: "center", marginTop: 1 },
  boxOn: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  checkText: { flex: 1, fontFamily: fonts.sans, color: colors.slate700, lineHeight: 20 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
  notice: { borderRadius: 12, padding: 12 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 16, ...shadow },
});
