import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { ProgressBar } from "../components/ProgressBar";
import { StatCard } from "../components/StatCard";
import { styles } from "../styles";
import type { QuestProgress } from "../types";

type QuestsTabProps = {
  quests: QuestProgress[];
  rewardBonusXp: number;
  rewardCompletedCount: number;
  rewardTotalXp: number;
};

export function QuestsTab({
  quests,
  rewardBonusXp,
  rewardCompletedCount,
  rewardTotalXp,
}: QuestsTabProps) {
  return (
    <View style={styles.contentStack}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>QUEST LOG</Text>
          <Text style={styles.sectionValue}>+{rewardTotalXp} XP</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Static daily quests keep the demo reliable: hydrate, sleep well, and log
          one activity.
        </Text>
      </View>

      <View style={styles.summaryStrip}>
        <StatCard
          label="Completed"
          value={`${rewardCompletedCount}`}
          accent="#C6FF43"
          suffix="/3"
        />
        <StatCard
          label="Bonus"
          value={`+${rewardBonusXp}`}
          accent="#5C9DFF"
          suffix="XP"
        />
      </View>

      {quests.map((quest) => (
        <View
          key={quest.id}
          style={[
            styles.questDetailCard,
            quest.completed && styles.questDetailCardComplete,
          ]}
        >
          <View style={styles.questTitleRow}>
            <Text style={styles.questTitle}>{quest.title}</Text>
            <Text style={styles.questXp}>+{quest.xp} XP</Text>
          </View>
          <Text style={styles.questDescription}>{quest.description}</Text>
          <Text style={styles.questProgressLabel}>{quest.progressLabel}</Text>
          <ProgressBar
            progress={quest.progress}
            tint={quest.completed ? "#45F26A" : "#5C9DFF"}
            trackStyle={styles.questTrack}
          />
          <View style={styles.questFooterRow}>
            <Text
              style={[
                styles.questState,
                { color: quest.completed ? "#45F26A" : "#8A97AD" },
              ]}
            >
              {quest.completed ? "CLAIMED" : "IN PROGRESS"}
            </Text>
            {quest.completed ? (
              <Ionicons name="checkmark-circle" size={18} color="#45F26A" />
            ) : null}
          </View>
        </View>
      ))}

      <View style={styles.aiCard}>
        <Text style={styles.sectionTitle}>BONUS RULE</Text>
        <Text style={styles.aiBody}>
          Completing all three quests grants an extra +20 XP and reinforces the
          LakadLvL loop for demo day.
        </Text>
      </View>
    </View>
  );
}
