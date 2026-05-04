import { Text, View } from "react-native";

import { ProgressBar } from "../components/ProgressBar";
import { StatCard } from "../components/StatCard";
import { styles } from "../styles";
import type { UserState } from "../types";

type ProfileTabProps = {
  displayedHp: number;
  hpColor: string;
  level: number;
  user: UserState;
  xpIntoLevel: number;
};

export function ProfileTab({
  displayedHp,
  hpColor,
  level,
  user,
  xpIntoLevel,
}: ProfileTabProps) {
  return (
    <View style={styles.contentStack}>
      <View style={styles.profileCard}>
        <View style={styles.avatarShell}>
          <Text style={styles.avatarLetter}>L</Text>
        </View>
        <Text style={styles.profileName}>{user.username}</Text>
        <Text style={styles.profileClass}>LakadLvL Remote Worker</Text>
      </View>

      <View style={styles.summaryStrip}>
        <StatCard
          label="Current HP"
          value={`${displayedHp}`}
          accent={hpColor}
          suffix="/100"
        />
        <StatCard
          label="Streak"
          value={`${user.streak}`}
          accent="#45F26A"
          suffix="days"
        />
      </View>

      <View style={styles.summaryStrip}>
        <StatCard
          label="Check-ins"
          value={`${user.totalCheckins}`}
          accent="#D7E1F3"
          suffix="saved"
        />
        <StatCard
          label="Distance"
          value={user.kmTotal.toFixed(1)}
          accent="#C6FF43"
          suffix="km"
        />
      </View>

      <View style={styles.metricCard}>
        <View style={styles.metricHeaderRow}>
          <Text style={styles.metricLabel}>EXPERIENCE</Text>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
        <ProgressBar progress={xpIntoLevel / 100} tint="#C6FF43" />
        <Text style={styles.metricHint}>{xpIntoLevel} / 100 XP in the current level</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>SUPABASE READY</Text>
        <Text style={styles.sectionDescription}>
          Wire this screen to `users` and `checkins` tables next. The current state
          model already mirrors your MVP schema.
        </Text>
      </View>
    </View>
  );
}
