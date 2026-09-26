import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "@/lib/format";
import { colors, fonts } from "@/theme";

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function DateField({
  label,
  value,
  onChange,
  required,
  minimumDate,
  maximumDate,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T12:00:00`) : new Date();

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : null}
      </Text>
      <Pressable style={styles.input} onPress={() => setOpen((current) => !current)}>
        <Text style={{ fontFamily: fonts.medium, color: value ? colors.navy900 : colors.slate400 }}>
          {value ? formatDate(value) : "Select a date"}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="inline"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={colors.navy900}
          themeVariant="light"
          onChange={(_event, date) => {
            if (date) onChange(toIsoDate(date));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 14 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
