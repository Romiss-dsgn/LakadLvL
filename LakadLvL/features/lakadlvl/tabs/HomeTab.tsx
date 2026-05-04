import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { ProgressBar } from "../components/ProgressBar";
import { styles } from "../styles";
import type { AiInsight, QuestProgress } from "../types";

type HomeTabProps = {
  aiInsight: AiInsight;
  didCheckInToday: boolean;
  displayedHp: number;
  healthScore?: number;
  hpColor: string;
  level: number;
  quests: QuestProgress[];
  rewardCompletedCount: number;
  xpIntoLevel: number;
};

export function HomeTab({
  aiInsight,
  didCheckInToday,
  displayedHp,
  healthScore,
  hpColor,
  level,
  quests,
  rewardCompletedCount,
  xpIntoLevel,
}: HomeTabProps) {
  return (
    <View style={styles.contentStack}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Estimated Health Score</Text>
        <View style={styles.scoreFrame}>
          <Text style={styles.scoreValue}>{healthScore ?? 72}</Text>
          <Text style={styles.scoreUnit}>TODAY SCORE</Text>
        </View>
        <Text style={styles.heroNote}>
          LakadLvL turns daily habits into survivability. Keep HP alive, stack XP,
          and protect your streak.
        </Text>
      </View>

      <View style={styles.dualCardRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeaderRow}>
            <Text style={styles.metricLabel}>VITALITY (HP)</Text>
            <Text style={[styles.metricValue, { color: hpColor }]}>
              {displayedHp}
              <Text style={styles.metricMuted}>/100</Text>
            </Text>
          </View>
          <ProgressBar progress={displayedHp / 100} tint={hpColor} />
          {!didCheckInToday ? (
            <Text style={styles.metricHint}>
              Decay active until today&apos;s check-in is completed.
            </Text>
          ) : (
            <Text style={styles.metricHint}>
              Daily recovery secured. Maintain it tomorrow.
            </Text>
          )}
        </View>

        <View style={[styles.metricCard, styles.metricCardAlt]}>
          <View style={styles.metricHeaderRow}>
            <Text style={styles.metricLabel}>EXPERIENCE (XP)</Text>
            <Text style={styles.levelText}>LVL {level}</Text>
          </View>
          <ProgressBar progress={xpIntoLevel / 100} tint="#C6FF43" />
          <Text style={styles.metricHint}>{xpIntoLevel} / 100 XP to next level</Text>
        </View>
      </View>

      <View style={styles.aiCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>AI COACH</Text>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#05111F" />
            <Text style={styles.aiBadgeText}>{aiInsight.tag}</Text>
          </View>
        </View>
        <Text style={styles.aiTitle}>{aiInsight.title}</Text>
        <Text style={styles.aiBody}>{aiInsight.body}</Text>
      </View>

      <View style={styles.questPanel}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>ACTIVE QUESTS</Text>
          <Text style={styles.sectionValue}>{rewardCompletedCount}/3</Text>
        </View>
        {quests.map((quest) => (
          <View key={quest.id} style={styles.questRow}>
            <View style={styles.questIconWrap}>
              <MaterialCommunityIcons
                name={
                  quest.id === "water"
                    ? "water-outline"
                    : quest.id === "sleep"
                      ? "weather-night"
                      : "walk"
                }
                size={22}
                color={quest.completed ? "#C6FF43" : "#8190A6"}
              />
            </View>
            <View style={styles.questMain}>
              <View style={styles.questTitleRow}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                <Text style={styles.questXp}>+{quest.xp} XP</Text>
              </View>
              <Text style={styles.questDescription}>{quest.description}</Text>
              <Text style={styles.questProgressLabel}>{quest.progressLabel}</Text>
              <ProgressBar
                progress={quest.progress}
                tint={quest.completed ? "#45F26A" : "#5C9DFF"}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
