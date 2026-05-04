import { Feather, Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { styles } from "../styles";

export function AppHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <Feather name="activity" size={18} color="#06111E" />
        </View>
        <View>
          <Text style={styles.brandName}>LAKADLVL</Text>
          <Text style={styles.brandSub}>HP + XP FOR REMOTE WORKERS</Text>
        </View>
      </View>
      <View style={styles.headerBadge}>
        <Ionicons name="sparkles" size={16} color="#C6FF43" />
      </View>
    </View>
  );
}
