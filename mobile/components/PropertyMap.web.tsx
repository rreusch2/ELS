import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/theme";

interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

export function PropertyMap({ points, style }: { points: MapPoint[]; style?: object; scrollEnabled?: boolean }) {
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.title}>Map</Text>
      <Text style={styles.copy}>
        {points.length
          ? points.map((point) => point.title ?? "Home").join(" · ")
          : "The interactive map is on the iOS app."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.navy900,
    borderRadius: 20,
    padding: 20,
    justifyContent: "flex-end",
    minHeight: 180,
  },
  title: { fontFamily: fonts.semibold, color: colors.gold300, letterSpacing: 1, textTransform: "uppercase", fontSize: 12 },
  copy: { fontFamily: fonts.serif, color: colors.white, fontSize: 22, marginTop: 8 },
});
