import { Ionicons } from "@expo/vector-icons";

import type { TabKey, UserState } from "./types";

export const TODAY_KEY = new Date().toISOString().slice(0, 10);

export const initialUser: UserState = {
  username: "Remote Ranger",
  hpBase: 78,
  totalXp: 140,
  streak: 3,
  questsDone: 11,
  totalCheckins: 5,
  kmTotal: 18.4,
};

export const tabs: {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "home", label: "HOME", icon: "home-outline" },
  { key: "checkin", label: "CHECK-IN", icon: "create-outline" },
  { key: "quests", label: "QUESTS", icon: "trophy-outline" },
  { key: "profile", label: "PROFILE", icon: "person-outline" },
];
