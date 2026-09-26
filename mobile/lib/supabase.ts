import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in mobile/.env");
}

const memory = new Map<string, string>();
const CHUNK = 1800;

async function read(key: string) {
  if (Platform.OS === "web") return memory.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string) {
  if (Platform.OS === "web") {
    memory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string) {
  if (Platform.OS === "web") {
    memory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

const storage = {
  async getItem(key: string) {
    const countRaw = await read(`${key}.chunks`);
    if (!countRaw) return read(key);
    let value = "";
    for (let i = 0; i < Number(countRaw); i++) value += (await read(`${key}.${i}`)) ?? "";
    return value || null;
  },
  async setItem(key: string, value: string) {
    await this.removeItem(key);
    if (value.length <= CHUNK) {
      await write(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK);
    await write(`${key}.chunks`, String(count));
    for (let i = 0; i < count; i++) await write(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
  },
  async removeItem(key: string) {
    const countRaw = await read(`${key}.chunks`);
    if (countRaw) {
      for (let i = 0; i < Number(countRaw); i++) await remove(`${key}.${i}`);
      await remove(`${key}.chunks`);
    }
    await remove(key);
  },
};

export const supabase = createClient(url, key, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
