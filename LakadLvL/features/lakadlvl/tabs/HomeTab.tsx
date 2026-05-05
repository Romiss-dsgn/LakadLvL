import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { ProgressBar } from "../components/ProgressBar";
import { styles } from "../styles";
import type {
  AiInsight,
  QuestProgress,
  StoryDay,
  StoryInsight,
} from "../types";

type HomeTabProps = {
  aiInsight: AiInsight;
  didCheckInToday: boolean;
  displayedHp: number;
  healthScore?: number;
  hpColor: string;
  isAiLoading: boolean;
  level: number;
  quests: QuestProgress[];
  rewardCompletedCount: number;
  storyDays: StoryDay[];
  storyInsight: StoryInsight;
  xpIntoLevel: number;
};

export function HomeTab({
  aiInsight,
  didCheckInToday,
  displayedHp,
  healthScore,
  hpColor,
  isAiLoading,
  level,
  quests,
  rewardCompletedCount,
  storyDays,
  storyInsight,
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
          This is your command center. Everything reacts to one thing: your daily
          check-in.
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
        <Text style={styles.aiTitle}>
          {isAiLoading ? "Generating AI Guidance..." : aiInsight.title}
        </Text>
        <Text style={styles.aiBody}>
          {isAiLoading
            ? "LakadLvL is analyzing today's check-in and preparing a focused recommendation for your energy, health, and work rhythm."
            : aiInsight.body}
        </Text>
      </View>

      <View style={styles.storyCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>RECOVERY STORY</Text>
          <Text
            style={[
              styles.storyTrend,
              storyInsight.trend === "recovery"
                ? styles.storyTrendRecovery
                : storyInsight.trend === "warning"
                  ? styles.storyTrendWarning
                  : styles.storyTrendSteady,
            ]}
          >
            {storyInsight.trend.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.storyTitle}>{storyInsight.title}</Text>
        <Text style={styles.storyBody}>{storyInsight.body}</Text>

        <View style={styles.storyTimeline}>
          {storyDays.length ? (
            storyDays.map((day) => (
              <View
                key={`${day.dayLabel}-${day.hp}-${day.mood}`}
                style={styles.storyDayCard}
              >
                <Text style={styles.storyDayLabel}>{day.dayLabel}</Text>
                <View
                  style={[
                    styles.storyDayBar,
                    {
                      height: Math.max(18, Math.round((day.hp / 100) * 72)),
                      backgroundColor:
                        day.hp >= 75
                          ? "#C6FF43"
                          : day.hp >= 50
                            ? "#F8D866"
                            : "#FF7C8A",
                    },
                  ]}
                />
                <Text style={styles.storyDayValue}>{day.hp}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.storyEmpty}>
              Build a few days of check-ins and LakadLvL will turn them into a
              visible recovery arc.
            </Text>
          )}
        </View>
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
