import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="fit">
      <Tabs.Screen name="fit" options={{ title: "Today" }} />
      <Tabs.Screen name="closet" options={{ title: "Closet" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
    </Tabs>
  );
}