import { Tabs } from "expo-router";
import { Icon } from "@/components/Icon";
import { colors, fonts } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy900,
        tabBarInactiveTintColor: colors.slate400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.slate200,
          height: 88,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color }) => <Icon name="house.fill" color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="listings"
        options={{ title: "Rentals", tabBarIcon: ({ color }) => <Icon name="building.2.fill" color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="contact"
        options={{ title: "Contact", tabBarIcon: ({ color }) => <Icon name="phone.fill" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarIcon: ({ color }) => <Icon name="line.3.horizontal" color={color} size={22} /> }}
      />
    </Tabs>
  );
}
