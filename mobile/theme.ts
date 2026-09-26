import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
  navy950: "#0f1a2c",
  navy900: "#1b2b44",
  navy800: "#243855",
  navy700: "#2a4266",
  navy400: "#6585b3",
  navy200: "#c5d3e5",
  navy100: "#e3eaf3",
  navy50: "#f3f6fa",
  gold400: "#cfa75c",
  gold300: "#dcc183",
  gold100: "#f5eedb",
  gold700: "#8a5b32",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  emerald: "#047857",
  emeraldBg: "#ecfdf5",
  amber: "#b45309",
  amberBg: "#fffbeb",
  red: "#b91c1c",
  redBg: "#fef2f2",
  sky: "#0369a1",
  skyBg: "#f0f9ff",
};

export const fonts = {
  serif: "PlayfairDisplay_600SemiBold",
  serifBold: "PlayfairDisplay_700Bold",
  sans: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const shadow: ViewStyle = {
  shadowColor: "#0f1a2c",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 5,
};

export const text = {
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold700,
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.navy900,
  } satisfies TextStyle,
};
