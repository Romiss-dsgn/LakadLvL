import { Text, View } from "react-native";

import { styles } from "../styles";

type StatCardProps = {
  label: string;
  value: string;
  accent: string;
  suffix?: string;
};

export function StatCard({ label, value, accent, suffix }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
        {suffix ? <Text style={styles.statSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}
