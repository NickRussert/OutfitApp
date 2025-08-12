import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This tells the root stack to render the tabs group */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
