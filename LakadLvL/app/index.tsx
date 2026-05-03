import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabKey = "home" | "checkin" | "quests" | "profile";

type UserState = {
  username: string;
  hpBase: number;
  totalXp: number;
  streak: number;
  questsDone: number;
  totalCheckins: number;
  kmTotal: number;
};

type CheckinEntry = {
  dateKey: string;
  sleepHours: number;
  waterIntake: number;
  mood: number;
  activity: string;
  activityKm: number;
  healthScore: number;
};

type QuestProgress = {
  id: string;
  title: string;
  description: string;
  progress: number;
  progressLabel: string;
  completed: boolean;
  xp: number;
};

const TODAY_KEY = new Date().toISOString().slice(0, 10);

const initialUser: UserState = {
  username: "Remote Ranger",
  hpBase: 78,
  totalXp: 140,
  streak: 3,
  questsDone: 11,
  totalCheckins: 5,
  kmTotal: 18.4,
};

const getLevel = (xp: number) => Math.floor(xp / 100) + 1;
const getXpIntoLevel = (xp: number) => xp % 100;
const getHpColor = (hp: number) => {
  if (hp >= 75) return "#C6FF43";
  if (hp >= 45) return "#F8D866";
  return "#FF7C8A";
};

const calculateHealthScore = (
  sleepHours: number,
  waterIntake: number,
  mood: number,
  activityKm: number
) => {
  const sleepScore = Math.min((sleepHours / 8) * 100, 100);
  const waterScore = Math.min((waterIntake / 2) * 100, 100);
  const moodScore = (mood / 5) * 100;
  const activityScore = activityKm > 0 ? Math.min((activityKm / 1) * 100, 100) : 60;

  return Math.round(
    sleepScore * 0.35 +
      waterScore * 0.3 +
      moodScore * 0.2 +
      activityScore * 0.15
  );
};

const getQuestProgress = (entry: CheckinEntry | null): QuestProgress[] => {
  const water = entry?.waterIntake ?? 0;
  const sleep = entry?.sleepHours ?? 0;
  const activityLogged = Boolean(entry?.activity?.trim().length);

  return [
    {
      id: "water",
      title: "Hydration Protocol",
      description: "Drink at least 2L of water today.",
      progress: Math.min(water / 2, 1),
      progressLabel: `${water.toFixed(1)} / 2.0 L`,
      completed: water >= 2,
      xp: 10,
    },
    {
      id: "sleep",
      title: "Sleep Buffer",
      description: "Reach 7 or more hours of sleep.",
      progress: Math.min(sleep / 7, 1),
      progressLabel: `${sleep.toFixed(1)} / 7.0 hrs`,
      completed: sleep >= 7,
      xp: 10,
    },
    {
      id: "activity",
      title: "Move Log",
      description: "Log one activity entry for the day.",
      progress: activityLogged ? 1 : 0,
      progressLabel: activityLogged ? "Activity logged" : "Not started",
      completed: activityLogged,
      xp: 10,
    },
  ];
};

const getQuestReward = (quests: QuestProgress[]) => {
  const completedCount = quests.filter((quest) => quest.completed).length;
  const baseXp = completedCount * 10;
  const bonusXp = completedCount === quests.length ? 20 : 0;
  return { completedCount, totalXp: baseXp + bonusXp, bonusXp };
};

const getAiInsight = (
  entry: CheckinEntry | null,
  displayedHp: number,
  quests: QuestProgress[]
) => {
  if (!entry) {
    return {
      title: "AI Coach Standby",
      body: "Complete your first check-in and I'll translate your sleep, water, mood, and movement into a recovery plan.",
      tag: "Awaiting data",
    };
  }

  if (displayedHp < 50) {
    return {
      title: "Recovery Priority",
      body: "Your HP is under pressure. Push hydration and sleep first, then keep activity light to avoid burning the next streak.",
      tag: "Protect HP",
    };
  }

  if (!quests.find((quest) => quest.id === "water")?.completed) {
    return {
      title: "Hydration Gap",
      body: "Water is the easiest XP on the board today. Finishing that quest also helps stabilize your health score.",
      tag: "Quick win",
    };
  }

  if (!quests.find((quest) => quest.id === "sleep")?.completed) {
    return {
      title: "Sleep Debt Alert",
      body: "You logged below the 7-hour target. Keep tomorrow lighter and aim for an earlier shutdown to recover HP faster.",
      tag: "Tomorrow fix",
    };
  }

  return {
    title: "Momentum Locked",
    body: "All core habits are online. Your next gain comes from repeating the loop tomorrow to preserve streak and level pace.",
    tag: "Chain streak",
  };
};

function StatCard({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: string;
  accent: string;
  suffix?: string;
}) {
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

function ProgressBar({
  progress,
  tint,
  trackStyle,
}: {
  progress: number;
  tint: string;
  trackStyle?: object;
}) {
  return (
    <View style={[styles.progressTrack, trackStyle]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            backgroundColor: tint,
          },
        ]}
      />
    </View>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [user, setUser] = useState<UserState>(initialUser);
  const [sleepHours, setSleepHours] = useState("6.5");
  const [waterIntake, setWaterIntake] = useState("1.4");
  const [mood, setMood] = useState(3);
  const [activity, setActivity] = useState("Desk break walk");
  const [activityKm, setActivityKm] = useState("0.8");
  const [lastEntry, setLastEntry] = useState<CheckinEntry | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "No check-in yet today. LakadLvL will apply a -5 HP decay until you log one."
  );

  const didCheckInToday = lastEntry?.dateKey === TODAY_KEY;
  const displayedHp = didCheckInToday ? user.hpBase : Math.max(0, user.hpBase - 5);
  const quests = useMemo(() => getQuestProgress(lastEntry), [lastEntry]);
  const reward = useMemo(() => getQuestReward(quests), [quests]);
  const level = getLevel(user.totalXp);
  const xpIntoLevel = getXpIntoLevel(user.totalXp);
  const hpColor = getHpColor(displayedHp);
  const aiInsight = getAiInsight(lastEntry, displayedHp, quests);

  const submitCheckin = () => {
    const parsedSleep = Number.parseFloat(sleepHours);
    const parsedWater = Number.parseFloat(waterIntake);
    const parsedKm = Number.parseFloat(activityKm || "0");

    if (
      Number.isNaN(parsedSleep) ||
      Number.isNaN(parsedWater) ||
      Number.isNaN(parsedKm) ||
      !activity.trim()
    ) {
      setStatusMessage("Complete sleep, water, activity text, and distance before saving the daily check-in.");
      return;
    }

    const healthScore = calculateHealthScore(parsedSleep, parsedWater, mood, parsedKm);
    const nextEntry: CheckinEntry = {
      dateKey: TODAY_KEY,
      sleepHours: parsedSleep,
      waterIntake: parsedWater,
      mood,
      activity: activity.trim(),
      activityKm: parsedKm,
      healthScore,
    };

    const nextQuests = getQuestProgress(nextEntry);
    const nextReward = getQuestReward(nextQuests);
    const previousReward = didCheckInToday
      ? getQuestReward(getQuestProgress(lastEntry))
      : { totalXp: 0, completedCount: 0, bonusXp: 0 };
    const gainedXp = Math.max(0, nextReward.totalXp - previousReward.totalXp);
    const nextHpBase = didCheckInToday
      ? user.hpBase
      : Math.min(100, Math.max(0, user.hpBase - 5) + 10);

    setUser((current) => ({
      ...current,
      hpBase: nextHpBase,
      totalXp: current.totalXp + gainedXp,
      streak: didCheckInToday ? current.streak : current.streak + 1,
      questsDone: didCheckInToday
        ? current.questsDone
        : current.questsDone + nextReward.completedCount,
      totalCheckins: didCheckInToday ? current.totalCheckins : current.totalCheckins + 1,
      kmTotal: didCheckInToday
        ? current.kmTotal
        : Number((current.kmTotal + parsedKm).toFixed(1)),
    }));
    setLastEntry(nextEntry);
    setStatusMessage(
      didCheckInToday
        ? `Check-in updated. Health score ${healthScore}, additional rewards claimed: +${gainedXp} XP.`
        : `Check-in saved. HP restored to ${nextHpBase}, health score ${healthScore}, rewards +${nextReward.totalXp} XP.`
    );
  };

  const renderHome = () => (
    <View style={styles.contentStack}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Estimated Health Score</Text>
        <View style={styles.scoreFrame}>
          <Text style={styles.scoreValue}>{lastEntry?.healthScore ?? 72}</Text>
          <Text style={styles.scoreUnit}>TODAY SCORE</Text>
        </View>
        <Text style={styles.heroNote}>
          LakadLvL turns daily habits into survivability. Keep HP alive, stack XP, and protect your streak.
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
            <Text style={styles.metricHint}>Decay active until today&apos;s check-in is completed.</Text>
          ) : (
            <Text style={styles.metricHint}>Daily recovery secured. Maintain it tomorrow.</Text>
          )}
        </View>

        <View style={[styles.metricCard, styles.metricCardAlt]}>
          <View style={styles.metricHeaderRow}>
            <Text style={styles.metricLabel}>EXPERIENCE (XP)</Text>
            <Text style={styles.levelText}>LVL {level}</Text>
          </View>
          <ProgressBar progress={xpIntoLevel / 100} tint="#C6FF43" />
          <Text style={styles.metricHint}>
            {xpIntoLevel} / 100 XP to next level
          </Text>
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
          <Text style={styles.sectionValue}>
            {reward.completedCount}/3
          </Text>
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
              <ProgressBar progress={quest.progress} tint={quest.completed ? "#45F26A" : "#5C9DFF"} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCheckIn = () => (
    <View style={styles.contentStack}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>DAILY CHECK-IN</Text>
        <Text style={styles.sectionDescription}>
          Log sleep, water, mood, and movement once per day to stabilize HP and unlock quest XP.
        </Text>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Sleep hours</Text>
          <TextInput
            value={sleepHours}
            onChangeText={setSleepHours}
            keyboardType="decimal-pad"
            placeholder="7.5"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Water intake (liters)</Text>
          <TextInput
            value={waterIntake}
            onChangeText={setWaterIntake}
            keyboardType="decimal-pad"
            placeholder="2.0"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Mood</Text>
          <View style={styles.moodRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => setMood(value)}
                style={[
                  styles.moodChip,
                  mood === value && styles.moodChipActive,
                ]}
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
          <Text style={styles.inputLabel}>Activity log</Text>
          <TextInput
            value={activity}
            onChangeText={setActivity}
            placeholder="Walked after lunch"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Activity distance (km)</Text>
          <TextInput
            value={activityKm}
            onChangeText={setActivityKm}
            keyboardType="decimal-pad"
            placeholder="1.0"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={submitCheckin}>
          <Ionicons name="flash-outline" size={18} color="#08111E" />
          <Text style={styles.primaryButtonText}>SAVE CHECK-IN</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TODAY SNAPSHOT</Text>
          <Text style={styles.sectionValue}>
            {lastEntry?.healthScore ?? "--"}
          </Text>
        </View>
        <Text style={styles.summaryText}>{statusMessage}</Text>
      </View>
    </View>
  );

  const renderQuests = () => (
    <View style={styles.contentStack}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>QUEST LOG</Text>
          <Text style={styles.sectionValue}>+{reward.totalXp} XP</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Static daily quests keep the demo reliable: hydrate, sleep well, and log one activity.
        </Text>
      </View>

      <View style={styles.summaryStrip}>
        <StatCard label="Completed" value={`${reward.completedCount}`} accent="#C6FF43" suffix="/3" />
        <StatCard label="Bonus" value={`+${reward.bonusXp}`} accent="#5C9DFF" suffix="XP" />
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
          Completing all three quests grants an extra +20 XP and reinforces the LakadLvL loop for demo day.
        </Text>
      </View>
    </View>
  );

  const renderProfile = () => (
    <View style={styles.contentStack}>
      <View style={styles.profileCard}>
        <View style={styles.avatarShell}>
          <Text style={styles.avatarLetter}>L</Text>
        </View>
        <Text style={styles.profileName}>{user.username}</Text>
        <Text style={styles.profileClass}>LakadLvL Remote Worker</Text>
      </View>

      <View style={styles.summaryStrip}>
        <StatCard label="Current HP" value={`${displayedHp}`} accent={hpColor} suffix="/100" />
        <StatCard label="Streak" value={`${user.streak}`} accent="#45F26A" suffix="days" />
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
        <Text style={styles.metricHint}>
          {xpIntoLevel} / 100 XP in the current level
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>SUPABASE READY</Text>
        <Text style={styles.sectionDescription}>
          Wire this screen to `users` and `checkins` tables next. The current state model already mirrors your MVP schema.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.backgroundGlowTop} />
        <View style={styles.backgroundGlowBottom} />

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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "home" && renderHome()}
          {activeTab === "checkin" && renderCheckIn()}
          {activeTab === "quests" && renderQuests()}
          {activeTab === "profile" && renderProfile()}
        </ScrollView>

        <View style={styles.tabBar}>
          {[
            { key: "home", label: "HOME", icon: "home-outline" },
            { key: "checkin", label: "CHECK-IN", icon: "create-outline" },
            { key: "quests", label: "QUESTS", icon: "trophy-outline" },
            { key: "profile", label: "PROFILE", icon: "person-outline" },
          ].map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as TabKey)}
                style={[styles.tabItem, selected && styles.tabItemActive]}
              >
                <Ionicons
                  name={tab.icon as keyof typeof Ionicons.glyphMap}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#08111E",
  },
  screen: {
    flex: 1,
    backgroundColor: "#08111E",
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -80,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(198,255,67,0.08)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: 40,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(92,157,255,0.08)",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198,255,67,0.18)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#C6FF43",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C6FF43",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  brandName: {
    color: "#B7F24A",
    fontSize: 26,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1.4,
  },
  brandSub: {
    color: "#7F8BA2",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(198,255,67,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E1627",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  contentStack: {
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#111C2C",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(198,255,67,0.18)",
    padding: 22,
  },
  heroEyebrow: {
    color: "#BFC8D6",
    textAlign: "center",
    letterSpacing: 2.2,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 16,
  },
  scoreFrame: {
    minHeight: 190,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "#B7F24A",
    backgroundColor: "#1A2431",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B7F24A",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  scoreValue: {
    color: "#C6FF43",
    fontSize: 62,
    fontWeight: "900",
  },
  scoreUnit: {
    color: "#E6ECF6",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginTop: 6,
  },
  heroNote: {
    color: "#9AA8BC",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
  },
  dualCardRow: {
    gap: 18,
  },
  metricCard: {
    backgroundColor: "#1A2437",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metricCardAlt: {
    backgroundColor: "#223229",
    borderColor: "rgba(198,255,67,0.15)",
  },
  metricHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  metricLabel: {
    color: "#CED5E1",
    letterSpacing: 1.8,
    fontSize: 13,
    fontWeight: "800",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  metricMuted: {
    color: "#B8C1CF",
    fontSize: 16,
    fontWeight: "700",
  },
  levelText: {
    color: "#C6FF43",
    fontSize: 22,
    fontWeight: "900",
  },
  metricHint: {
    color: "#A2AFC3",
    marginTop: 10,
    fontSize: 13,
  },
  progressTrack: {
    height: 18,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#0B1322",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  aiCard: {
    backgroundColor: "#142131",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(69,242,106,0.18)",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#E7EDF8",
    fontSize: 14,
    letterSpacing: 1.8,
    fontWeight: "900",
  },
  sectionValue: {
    color: "#C6FF43",
    fontSize: 18,
    fontWeight: "900",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#C6FF43",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  aiBadgeText: {
    color: "#08111E",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  aiTitle: {
    color: "#C6FF43",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  aiBody: {
    color: "#CDD6E4",
    lineHeight: 22,
    marginTop: 8,
    fontSize: 15,
  },
  questPanel: {
    backgroundColor: "#121C2B",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 16,
  },
  questRow: {
    flexDirection: "row",
    gap: 14,
  },
  questIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#202B3F",
    alignItems: "center",
    justifyContent: "center",
  },
  questMain: {
    flex: 1,
    gap: 6,
  },
  questTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questTitle: {
    color: "#EFF4FD",
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    paddingRight: 10,
  },
  questXp: {
    color: "#45F26A",
    fontWeight: "900",
    fontSize: 15,
  },
  questDescription: {
    color: "#98A5B9",
    fontSize: 14,
    lineHeight: 21,
  },
  questProgressLabel: {
    color: "#DCE3F0",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#131E2E",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(198,255,67,0.15)",
    padding: 18,
  },
  sectionDescription: {
    color: "#A7B4C8",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  inputBlock: {
    marginTop: 16,
  },
  inputLabel: {
    color: "#D8E0ED",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0B1322",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#F4F7FB",
    fontSize: 15,
  },
  moodRow: {
    flexDirection: "row",
    gap: 10,
  },
  moodChip: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0B1322",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  moodChipActive: {
    backgroundColor: "#C6FF43",
    borderColor: "#C6FF43",
  },
  moodChipText: {
    color: "#DDE5F2",
    fontWeight: "800",
  },
  moodChipTextActive: {
    color: "#07111F",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#C6FF43",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#08111E",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  summaryCard: {
    backgroundColor: "#202834",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  summaryText: {
    color: "#D1DAE7",
    lineHeight: 23,
    fontSize: 15,
  },
  summaryStrip: {
    gap: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#151F2F",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statLabel: {
    color: "#B9C4D5",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  statValue: {
    fontSize: 42,
    fontWeight: "900",
  },
  statSuffix: {
    color: "#B6C0CE",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  questDetailCard: {
    backgroundColor: "#1B2434",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  questDetailCardComplete: {
    borderColor: "rgba(69,242,106,0.28)",
  },
  questTrack: {
    height: 14,
  },
  questFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questState: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  profileCard: {
    backgroundColor: "#202A3A",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(198,255,67,0.14)",
  },
  avatarShell: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: "#C6FF43",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#C6FF43",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarLetter: {
    color: "#06111E",
    fontSize: 44,
    fontWeight: "900",
  },
  profileName: {
    color: "#F0F4FB",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
  },
  profileClass: {
    color: "#B7F24A",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(6,12,21,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(198,255,67,0.18)",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 18,
  },
  tabItemActive: {
    backgroundColor: "rgba(198,255,67,0.08)",
    shadowColor: "#C6FF43",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  tabLabel: {
    color: "#7C879E",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  tabLabelActive: {
    color: "#C6FF43",
  },
});
