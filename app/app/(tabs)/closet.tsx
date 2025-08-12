// app/(tabs)/closet.tsx
import { useEffect, useState } from "react";
import {
  View, Text, TextInput, Button, FlatList,
  TouchableOpacity, Image, Alert, ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";

type Item = {
  id: string;
  name: string;
  category: "top" | "bottom" | "outerwear" | "shoes" | "accessory";
  formality?: "casual" | "athleisure" | "business" | "formal" | null;
  image_url?: string | null;
};

const API = "http://127.0.0.1:8000";
const CATEGORIES = ["top", "bottom", "outerwear", "shoes", "accessory"] as const;
const FORMALITIES = ["casual", "athleisure", "business", "formal"] as const;

export default function Closet() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("top");
  const [formality, setFormality] = useState<(typeof FORMALITIES)[number]>("casual");
  const [imgUri, setImgUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/closet`);
      setItems(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission required to pick images.");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled) setImgUri(res.assets[0].uri);
  };

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      // For now: send metadata only (image upload comes later)
      const r = await fetch(`${API}/closet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          formality,
          image_url: null, // TODO: replace when we add upload
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setName("");
      setImgUri(null);
      await load();
    } catch (e: any) {
      Alert.alert("Error", String(e.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`${API}/closet/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const Seg = ({
    options, selected, onSelect, label,
  }: {
    options: readonly string[];
    selected: string;
    onSelect: (v: any) => void;
    label: string;
  }) => (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600" }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => {
          const isSel = selected === o;
          return (
            <TouchableOpacity
              key={o}
              onPress={() => onSelect(o)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                backgroundColor: isSel ? "#e6f0ff" : "transparent",
              }}
            >
              <Text style={{ fontWeight: isSel ? "700" : "400" }}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const ItemRow = ({ item }: { item: Item }) => (
    <View
      style={{
        padding: 12,
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={{ width: 48, height: 48, borderRadius: 8 }} />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>🧥</Text>
          </View>
        )}
        <View>
          <Text style={{ fontWeight: "700" }}>{item.name}</Text>
          <Text style={{ opacity: 0.7 }}>
            {item.category} · {item.formality}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => remove(item.id)}>
        <Text style={{ color: "crimson" }}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ padding: 16, gap: 14 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Your Closet</Text>

      {/* Name */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "600" }}>Name</Text>
        <TextInput
          placeholder="e.g., White T-Shirt"
          value={name}
          onChangeText={setName}
          style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
        />
      </View>

      {/* Category + Formality */}
      <Seg options={CATEGORIES as unknown as string[]} selected={category} onSelect={setCategory} label="Category" />
      <Seg options={FORMALITIES as unknown as string[]} selected={formality} onSelect={setFormality} label="Formality" />

      {/* Image picker (preview only) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Button title={imgUri ? "Pick another image" : "Pick image"} onPress={pickImage} />
        {imgUri ? <Image source={{ uri: imgUri }} style={{ width: 48, height: 48, borderRadius: 8 }} /> : null}
      </View>

      <Button title={busy ? "Adding..." : "Add item"} onPress={add} disabled={busy} />

      {loading ? (
        <ActivityIndicator />
      ) : items.length === 0 ? (
        <Text style={{ marginTop: 12, opacity: 0.7 }}>No items yet. Add your first piece above.</Text>
      ) : (
        <FlatList data={items} keyExtractor={(x) => x.id} renderItem={ItemRow} />
      )}
    </View>
  );
}
