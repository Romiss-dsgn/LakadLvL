import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { tabs } from "../constants";
import { styles } from "../styles";
import type { TabKey } from "../types";

type TabBarProps = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tabItem, selected && styles.tabItemActive]}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={selected ? "#C6FF43" : "#77839A"}
            />
            <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
