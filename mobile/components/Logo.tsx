import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts } from "@/theme";
import { Icon } from "./Icon";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { backgroundColor: light ? colors.gold400 : colors.navy900 }]}>
        <Icon name="house.fill" color={light ? colors.navy950 : colors.gold400} size={20} />
      </View>
      <View>
        <Text style={[styles.word, { color: light ? colors.white : colors.navy900 }]}>ELS</Text>
        <Text style={[styles.sub, { color: light ? colors.gold300 : colors.gold700 }]}>PROPERTIES</Text>
      </View>
    </View>
  );
}

export function BackButton({ light = false }: { light?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      style={[styles.back, light && styles.backLight]}
      hitSlop={8}
      accessibilityLabel="Go back"
    >
      <Icon name="chevron.left" color={light ? colors.white : colors.navy900} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  word: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 24 },
  sub: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 2.4, marginTop: 1 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  backLight: { backgroundColor: "rgba(15,26,44,0.45)" },
});
