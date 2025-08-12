import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from "react-native";

type OutfitItem = { id: string; name: string; category: string };
type Outfit = { occasion: string; items: OutfitItem[]; notes?: string | null };

const API = "http://127.0.0.1:8000";

const OCCASIONS = ["casual", "business", "formal", "athleisure"] as const;
type Occasion = (typeof OCCASIONS)[number];

export default function Fit() {
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [tempF, setTempF] = useState<string>(""); // Fahrenheit now
  const [raining, setRaining] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outfit, setOutfit] = useState<Outfit | null>(null);

  const recommend = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: any = { occasion };
      if (tempF.trim() !== "") {
        const f = Number(tempF);
        // Convert F to C for backend logic if needed
        const c = ((f - 32) * 5) / 9;
        body.temp_c = Math.round(c * 10) / 10;
      }
      if (raining) body.raining = true;

      const r = await fetch(`${API}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as Outfit;
      setOutfit(data);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const ItemRow = ({ item }: { item: OutfitItem }) => (
    <View
      style={{
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <View>
        <Text style={{ fontWeight: "600" }}>{item.name}</Text>
        <Text style={{ opacity: 0.7 }}>{item.category}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Today’s Fit</Text>

      {/* Occasion selector */}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {OCCASIONS.map((o) => {
          const selected = occasion === o;
          return (
            <TouchableOpacity
              key={o}
              onPress={() => setOccasion(o)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                borderWidth: 1,
                backgroundColor: selected ? "#e6f0ff" : "transparent",
              }}
            >
              <Text style={{ fontWeight: selected ? "700" : "400" }}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Optional weather inputs */}
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text>Temp °F</Text>
          <TextInput
            value={tempF}
            onChangeText={setTempF}
            keyboardType="numeric"
            placeholder="e.g. 68"
            style={{ borderWidth: 1, padding: 8, width: 80, borderRadius: 8 }}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text>Raining</Text>
          <Switch value={raining} onValueChange={setRaining} />
        </View>
      </View>

      <Button title={loading ? "Picking..." : "Recommend outfit"} onPress={recommend} />

      {error ? <Text style={{ color: "crimson" }}>{error}</Text> : null}

      {loading ? <ActivityIndicator /> : null}

      {/* Results */}
      {outfit && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            Occasion: {outfit.occasion}
          </Text>
          {outfit.notes ? (
            <Text style={{ opacity: 0.7 }}>Notes: {outfit.notes}</Text>
          ) : null}

          {outfit.items.length === 0 ? (
            <Text style={{ marginTop: 8 }}>
              No valid combo yet. Add at least one top and one bottom in your Closet.
            </Text>
          ) : (
            <FlatList
              data={outfit.items}
              keyExtractor={(x) => x.id}
              renderItem={ItemRow}
            />
          )}
        </View>
      )}
    </View>
  );
}
