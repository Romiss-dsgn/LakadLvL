import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

import { styles } from "../styles";

type CheckInTabProps = {
  activity: string;
  activityKm: string;
  healthScore?: number;
  isSubmitting: boolean;
  mood: number;
  onActivityChange: (value: string) => void;
  onActivityKmChange: (value: string) => void;
  onMoodChange: (value: number) => void;
  onSleepChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onWaterChange: (value: string) => void;
  sleepHours: string;
  statusMessage: string;
  waterIntake: string;
};

export function CheckInTab({
  activity,
  activityKm,
  healthScore,
  isSubmitting,
  mood,
  onActivityChange,
  onActivityKmChange,
  onMoodChange,
  onSleepChange,
  onSubmit,
  onWaterChange,
  sleepHours,
  statusMessage,
  waterIntake,
}: CheckInTabProps) {
  return (
    <View style={styles.contentStack}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>DAILY CHECK-IN</Text>
        <Text style={styles.sectionDescription}>
          Log one daily check-in to drive the entire system: HP, XP, quests, and
          your AI coach response.
        </Text>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>😴 Sleep hours</Text>
          <TextInput
            value={sleepHours}
            onChangeText={onSleepChange}
            keyboardType="decimal-pad"
            placeholder="7.5"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>💧 Water intake (liters)</Text>
          <TextInput
            value={waterIntake}
            onChangeText={onWaterChange}
            keyboardType="decimal-pad"
            placeholder="2.0"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>😐 Mood</Text>
          <View style={styles.moodRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => onMoodChange(value)}
                style={[styles.moodChip, mood === value && styles.moodChipActive]}
              >
                <Text
                  style={[
                    styles.moodChipText,
                    mood === value && styles.moodChipTextActive,
                  ]}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>🏃 Activity log</Text>
          <TextInput
            value={activity}
            onChangeText={onActivityChange}
            placeholder="Walked after lunch"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Distance (km)</Text>
          <TextInput
            value={activityKm}
            onChangeText={onActivityKmChange}
            keyboardType="decimal-pad"
            placeholder="1.0"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <Pressable
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={() => {
            void onSubmit();
          }}
          disabled={isSubmitting}
        >
          <Ionicons name="flash-outline" size={18} color="#08111E" />
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "PROCESSING..." : "SAVE CHECK-IN"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TODAY SNAPSHOT</Text>
          <Text style={styles.sectionValue}>{healthScore ?? "--"}</Text>
        </View>
        <Text style={styles.summaryText}>{statusMessage}</Text>
      </View>
    </View>
  );
}
