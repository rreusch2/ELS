import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

export function Icon({ name, color, size = 22 }: { name: string; color?: ColorValue; size?: number }) {
  return <SymbolView name={name as SymbolViewProps["name"]} tintColor={color} size={size} />;
}
