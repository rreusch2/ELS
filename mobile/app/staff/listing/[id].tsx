import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Button, Field, Loader, Notice, SelectField } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { listingStatusLabels, propertyTypeLabels, slugify } from "@/lib/format";
import type { Listing, ListingStatus, PropertyType } from "@/lib/types";
import { colors, fonts } from "@/theme";

export default function ListingEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "listing", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*, listing_photos(*)").eq("id", id!).single();
      if (error) throw error;
      return data as Listing;
    },
  });
  const [form, setForm] = useState({
    title: "", slug: "", description: "", address_line1: "", city: "Henderson", state: "KY", zip: "42420",
    rent: "", deposit: "", bedrooms: "2", bathrooms: "1", status: "draft" as ListingStatus, property_type: "house" as PropertyType, pets_allowed: "No",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      title: data.title,
      slug: data.slug,
      description: data.description,
      address_line1: data.address_line1,
      city: data.city,
      state: data.state,
      zip: data.zip,
      rent: String(data.rent_cents / 100),
      deposit: data.deposit_cents != null ? String(data.deposit_cents / 100) : "",
      bedrooms: String(Number(data.bedrooms)),
      bathrooms: String(Number(data.bathrooms)),
      status: data.status,
      property_type: data.property_type,
      pets_allowed: data.pets_allowed ? "Yes" : "No",
    });
  }, [data]);

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value, ...(key === "title" && isNew ? { slug: slugify(value) } : {}) }));

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      description: form.description.trim(),
      address_line1: form.address_line1.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      zip: form.zip.trim(),
      rent_cents: Math.round(Number(form.rent) * 100),
      deposit_cents: form.deposit ? Math.round(Number(form.deposit) * 100) : null,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      status: form.status,
      property_type: form.property_type,
      pets_allowed: form.pets_allowed === "Yes",
    };
    const query = isNew
      ? supabase.from("listings").insert(payload).select("id").single()
      : supabase.from("listings").update(payload).eq("id", id!).select("id").single();
    const { data: saved, error: saveError } = await query;
    setSaving(false);
    if (saveError) {
      setError(saveError.code === "23505" ? "That URL slug is already used." : saveError.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    if (isNew) router.replace(`/staff/listing/${saved.id}`);
    else setError("Saved.");
  }

  async function addPhoto() {
    if (isNew || !id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo access is needed to add listing pictures.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.85 });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    const path = `${id}/${crypto.randomUUID()}.jpg`;
    const body = await (await fetch(asset.uri)).arrayBuffer();
    const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, body, { contentType: "image/jpeg" });
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
    const order = data?.listing_photos.length ?? 0;
    const { error: rowError } = await supabase.from("listing_photos").insert({ listing_id: id, url: pub.publicUrl, storage_path: path, sort_order: order });
    if (rowError) setError(rowError.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "listing", id] });
  }

  if (!isNew && isLoading) return <Loader />;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="Title" value={form.title} onChangeText={set("title")} />
      <Field label="Street address" value={form.address_line1} onChangeText={set("address_line1")} />
      <Field label="City" value={form.city} onChangeText={set("city")} />
      <Field label="Monthly rent" keyboardType="number-pad" value={form.rent} onChangeText={set("rent")} />
      <Field label="Deposit" keyboardType="number-pad" value={form.deposit} onChangeText={set("deposit")} />
      <Field label="Bedrooms" keyboardType="number-pad" value={form.bedrooms} onChangeText={set("bedrooms")} />
      <Field label="Bathrooms" keyboardType="decimal-pad" value={form.bathrooms} onChangeText={set("bathrooms")} />
      <SelectField label="Status" value={form.status} options={(Object.keys(listingStatusLabels) as ListingStatus[]).map((key) => ({ label: listingStatusLabels[key], value: key }))} onChange={(value) => set("status")(value)} />
      <SelectField label="Type" value={form.property_type} options={(Object.keys(propertyTypeLabels) as PropertyType[]).map((key) => ({ label: propertyTypeLabels[key], value: key }))} onChange={(value) => set("property_type")(value)} />
      <SelectField label="Pets allowed" value={form.pets_allowed} options={["No", "Yes"]} onChange={set("pets_allowed")} />
      <Field label="Description" multiline value={form.description} onChangeText={set("description")} />
      {error ? <Notice tone={error === "Saved." ? "success" : "error"}>{error}</Notice> : null}
      <Button label={isNew ? "Create listing" : "Save changes"} loading={saving} onPress={save} />
      {!isNew ? (
        <>
          <Text style={styles.photos}>Photos</Text>
          {data?.listing_photos.sort((a, b) => a.sort_order - b.sort_order).map((photo) => (
            <Image key={photo.id} source={{ uri: photo.url }} style={styles.photo} contentFit="cover" />
          ))}
          <Button label="Add photo" variant="outline" onPress={addPhoto} />
        </>
      ) : (
        <Text style={styles.hint}>Save the listing first, then add photos.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  photos: { fontFamily: fonts.semibold, color: colors.navy900, marginTop: 8 },
  photo: { height: 160, borderRadius: 16, backgroundColor: colors.slate100 },
  hint: { fontFamily: fonts.sans, color: colors.slate500 },
});
