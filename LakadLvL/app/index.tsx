import {
  Feather,
  Ionicons,
} from "@expo/vector-icons";
import { type Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  calculateHealthScore,
  ensureProfile,
  fetchDashboardData,
  submitDailyCheckin,
  submitRun,
} from "@/lib/fitness";
import { supabase } from "@/lib/supabase";
import type { Activity, DailyLog, Profile } from "@/lib/types";

type TabKey = "home" | "checkin" | "quests" | "profile";
type AuthMode = "sign-in" | "sign-up";

type QuestProgress = {
  completed: boolean;
  description: string;
  id: string;
  progress: number;
  progressLabel: string;
  title: string;
  xp: number;
};

const TODAY_KEY = new Date().toISOString().slice(0, 10);

const getLevel = (xp: number) => Math.floor(xp / 100) + 1;
const getXpIntoLevel = (xp: number) => xp % 100;
const getHpColor = (hp: number) => {
  if (hp >= 75) return "#C6FF43";
  if (hp >= 45) return "#F8D866";
  return "#FF7C8A";
};

const getQuestProgress = (entry: DailyLog | null): QuestProgress[] => {
  const water = entry?.water_intake ?? 0;
  const sleep = entry?.sleep_hours ?? 0;
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
  entry: DailyLog | null,
  displayedHp: number,
  quests: QuestProgress[]
) => {
  if (!entry) {
    return {
      title: "Coach Standing By",
      body: "Complete your first check-in to save today's health log and claim +10 HP on your profile.",
      tag: "MVP ready",
    };
  }

  if (displayedHp < 50) {
    return {
      title: "Recovery Priority",
      body: "Your HP is running low. Lock in today's check-in early and keep tomorrow's run short so recovery can catch up.",
      tag: "Protect HP",
    };
  }

  if (!quests.find((quest) => quest.id === "water")?.completed) {
    return {
      title: "Hydration Gap",
      body: "Water is the quickest win on the board. Finishing that target improves your health score and clears one daily quest.",
      tag: "Quick win",
    };
  }

  if (!quests.find((quest) => quest.id === "sleep")?.completed) {
    return {
      title: "Sleep Debt Alert",
      body: "Your check-in is saved, but your sleep target is still short. Use tonight to set up a stronger score tomorrow.",
      tag: "Tomorrow fix",
    };
  }

  return {
    title: "Momentum Locked",
    body: "Your latest log is in good shape. Keep stacking runs for XP while maintaining the check-in streak for steady HP gains.",
    tag: "Chain streak",
  };
};

const computeStreak = (logs: DailyLog[]) => {
  if (!logs.length) {
    return 0;
  }

  const uniqueDates = Array.from(
    new Set(logs.map((log) => log.log_date).sort((a, b) => b.localeCompare(a)))
  );
  let streak = 0;
  const cursor = new Date(`${TODAY_KEY}T00:00:00Z`);

  for (const dateKey of uniqueDates) {
    const currentKey = cursor.toISOString().slice(0, 10);
    if (dateKey !== currentKey) {
      break;
    }

    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
};

function StatCard({
  label,
  value,
  accent,
  suffix,
}: {
  accent: string;
  label: string;
  suffix?: string;
  value: string;
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

function ScreenShell({
  children,
  headerRight,
}: {
  children: ReactNode;
  headerRight?: ReactNode;
}) {
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
              <Text style={styles.brandSub}>SUPABASE MVP CONNECTED</Text>
            </View>
          </View>
          {headerRight ?? (
            <View style={styles.headerBadge}>
              <Ionicons name="sparkles" size={16} color="#C6FF43" />
            </View>
          )}
        </View>

        {children}
      </View>
    </SafeAreaView>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [savingRun, setSavingRun] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [sleepHours, setSleepHours] = useState("6.5");
  const [waterIntake, setWaterIntake] = useState("1.4");
  const [mood, setMood] = useState(3);
  const [checkinActivity, setCheckinActivity] = useState("Desk break walk");
  const [checkinKm, setCheckinKm] = useState("0.8");
  const [runTitle, setRunTitle] = useState("Evening run");
  const [runDistanceKm, setRunDistanceKm] = useState("2.5");
  const [statusMessage, setStatusMessage] = useState(
    "Sign in to sync your profile, runs, and daily logs with Supabase."
  );

  const user = session?.user ?? null;
  const latestLog = logs[0] ?? null;
  const didCheckInToday = latestLog?.log_date === TODAY_KEY;
  const totalKm = useMemo(
    () =>
      activities.reduce((sum, activity) => sum + Number(activity.distance_km ?? 0), 0),
    [activities]
  );
  const streak = useMemo(() => computeStreak(logs), [logs]);
  const displayedHp = profile?.hp ?? 0;
  const totalXp = profile?.xp ?? 0;
  const quests = useMemo(() => getQuestProgress(latestLog), [latestLog]);
  const reward = useMemo(() => getQuestReward(quests), [quests]);
  const level = getLevel(totalXp);
  const xpIntoLevel = getXpIntoLevel(totalXp);
  const hpColor = getHpColor(displayedHp);
  const aiInsight = getAiInsight(latestLog, displayedHp, quests);
  const averageScore =
    logs.length > 0
      ? Math.round(
          logs.reduce((sum, log) => sum + Number(log.health_score ?? 0), 0) / logs.length
        )
      : 0;

  const loadDashboard = useCallback(async (userId: string) => {
    setDashboardLoading(true);

    try {
      const data = await fetchDashboardData(userId);
      setProfile(data.profile);
      setActivities(data.activities);
      setLogs(data.logs);
      setStatusMessage("Supabase sync complete. Your profile, runs, and check-ins are live.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load dashboard data.";
      setStatusMessage(message);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(currentSession);
        setAuthLoading(false);

        if (currentSession?.user) {
          const nextUsername =
            (currentSession.user.user_metadata.username as string | undefined) ??
            currentSession.user.email?.split("@")[0] ??
            null;

          await ensureProfile(currentSession.user.id, nextUsername);
          await loadDashboard(currentSession.user.id);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unable to restore session.";
        setAuthLoading(false);
        setStatusMessage(message);
      }
    }

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);
      setAuthLoading(false);

      if (!nextSession?.user) {
        setProfile(null);
        setActivities([]);
        setLogs([]);
        setStatusMessage("Signed out. Sign back in to keep syncing with Supabase.");
        return;
      }

      const nextUsername =
        (nextSession.user.user_metadata.username as string | undefined) ??
        nextSession.user.email?.split("@")[0] ??
        null;

      try {
        await ensureProfile(nextSession.user.id, nextUsername);
        await loadDashboard(nextSession.user.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to sync signed-in user.";
        setStatusMessage(message);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadDashboard]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setStatusMessage("Enter an email and password to continue.");
      return;
    }

    setSubmittingAuth(true);

    try {
      if (authMode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: username.trim() || email.trim().split("@")[0],
            },
          },
        });

        if (error) {
          throw error;
        }

        setStatusMessage(
          "Account created. If email confirmation is enabled in Supabase, confirm your email before signing in."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        setStatusMessage("Signed in. Pulling your Supabase profile now.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed.";
      setStatusMessage(message);
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleRunSubmit = async () => {
    if (!user) {
      return;
    }

    const distance = Number.parseFloat(runDistanceKm);

    if (!runTitle.trim() || Number.isNaN(distance) || distance <= 0) {
      setStatusMessage("Enter a run title and a distance greater than 0 km.");
      return;
    }

    setSavingRun(true);

    try {
      const updatedProfile = await submitRun(user.id, runTitle, distance);
      setProfile(updatedProfile);
      await loadDashboard(user.id);
      setStatusMessage(
        `Run saved. ${distance.toFixed(1)} km added to activities and +${Math.round(
          distance * 50
        )} XP applied through RPC.`
      );
      setRunTitle("Next run");
      setRunDistanceKm("1.0");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save run.";
      setStatusMessage(message);
    } finally {
      setSavingRun(false);
    }
  };

  const handleCheckinSubmit = async () => {
    if (!user) {
      return;
    }

    const parsedSleep = Number.parseFloat(sleepHours);
    const parsedWater = Number.parseFloat(waterIntake);
    const parsedKm = Number.parseFloat(checkinKm || "0");

    if (
      Number.isNaN(parsedSleep) ||
      Number.isNaN(parsedWater) ||
      Number.isNaN(parsedKm) ||
      !checkinActivity.trim()
    ) {
      setStatusMessage(
        "Complete sleep, water, activity, and distance before saving the daily check-in."
      );
      return;
    }

    setSavingCheckin(true);

    try {
      const result = await submitDailyCheckin(user.id, {
        sleepHours: parsedSleep,
        waterIntake: parsedWater,
        mood,
        activity: checkinActivity,
        activityKm: parsedKm,
      });

      setProfile(result.profile);
      await loadDashboard(user.id);
      setStatusMessage(
        result.awardedHp
          ? `Check-in saved for ${TODAY_KEY}. Health score ${result.latestLog.health_score} and +10 HP applied through RPC.`
          : `Check-in updated for ${TODAY_KEY}. Health score ${result.latestLog.health_score}. HP was not added twice for the same day.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save daily check-in.";
      setStatusMessage(message);
    } finally {
      setSavingCheckin(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const renderHome = () => (
    <View style={styles.contentStack}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Health Score Snapshot</Text>
        <View style={styles.scoreFrame}>
          <Text style={styles.scoreValue}>
            {latestLog?.health_score ?? averageScore ?? 0}
          </Text>
          <Text style={styles.scoreUnit}>LATEST SCORE</Text>
        </View>
        <Text style={styles.heroNote}>
          Supabase now drives the core loop: Auth signs the player in, runs write to
          `activities`, check-ins write to `daily_logs`, and RPC functions update HP and XP.
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
          <Text style={styles.metricHint}>
            {didCheckInToday
              ? "Today's check-in is saved."
              : "No check-in saved for today yet. Submit one to gain +10 HP."}
          </Text>
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

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>RUN TRACKER</Text>
          <Text style={styles.sectionValue}>50 XP / km</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Complete a run to insert into `activities` and award XP through the Supabase
          RPC function.
        </Text>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Run title</Text>
          <TextInput
            value={runTitle}
            onChangeText={setRunTitle}
            placeholder="Morning run"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Distance (km)</Text>
          <TextInput
            value={runDistanceKm}
            onChangeText={setRunDistanceKm}
            keyboardType="decimal-pad"
            placeholder="3.0"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleRunSubmit} disabled={savingRun}>
          {savingRun ? (
            <ActivityIndicator color="#08111E" />
          ) : (
            <Ionicons name="walk-outline" size={18} color="#08111E" />
          )}
          <Text style={styles.primaryButtonText}>SAVE RUN</Text>
        </Pressable>
      </View>

      <View style={styles.aiCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>COACH FEED</Text>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#05111F" />
            <Text style={styles.aiBadgeText}>{aiInsight.tag}</Text>
          </View>
        </View>
        <Text style={styles.aiTitle}>{aiInsight.title}</Text>
        <Text style={styles.aiBody}>{aiInsight.body}</Text>
      </View>
    </View>
  );

  const renderCheckIn = () => (
    <View style={styles.contentStack}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>DAILY CHECK-IN</Text>
        <Text style={styles.sectionDescription}>
          Save one health check-in per day. This writes to `daily_logs` and adds +10 HP
          through the `add_profile_hp` RPC.
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
          <Text style={styles.inputLabel}>Activity log</Text>
          <TextInput
            value={checkinActivity}
            onChangeText={setCheckinActivity}
            placeholder="Walked after lunch"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Activity distance (km)</Text>
          <TextInput
            value={checkinKm}
            onChangeText={setCheckinKm}
            keyboardType="decimal-pad"
            placeholder="1.0"
            placeholderTextColor="#657288"
            style={styles.input}
          />
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={handleCheckinSubmit}
          disabled={savingCheckin}
        >
          {savingCheckin ? (
            <ActivityIndicator color="#08111E" />
          ) : (
            <Ionicons name="flash-outline" size={18} color="#08111E" />
          )}
          <Text style={styles.primaryButtonText}>SAVE CHECK-IN</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TODAY SNAPSHOT</Text>
          <Text style={styles.sectionValue}>
            {latestLog?.health_score ?? calculateHealthScore(6.5, 1.4, 3, 0.8)}
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
          Quest progress is now derived from the latest `daily_logs` row in Supabase.
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
              {quest.completed ? "SYNCED" : "IN PROGRESS"}
            </Text>
            {quest.completed ? (
              <Ionicons name="checkmark-circle" size={18} color="#45F26A" />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );

  const renderProfile = () => (
    <View style={styles.contentStack}>
      <View style={styles.profileCard}>
        <View style={styles.avatarShell}>
          <Text style={styles.avatarLetter}>
            {(profile?.username ?? user?.email?.charAt(0) ?? "L").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>
          {profile?.username ?? user?.email?.split("@")[0] ?? "LakadLvL User"}
        </Text>
        <Text style={styles.profileClass}>{user?.email ?? "Connected through Supabase Auth"}</Text>
      </View>

      <View style={styles.summaryStrip}>
        <StatCard label="Current HP" value={`${displayedHp}`} accent={hpColor} suffix="/100" />
        <StatCard label="Streak" value={`${streak}`} accent="#45F26A" suffix="days" />
      </View>

      <View style={styles.summaryStrip}>
        <StatCard
          label="Check-ins"
          value={`${logs.length}`}
          accent="#D7E1F3"
          suffix="saved"
        />
        <StatCard
          label="Distance"
          value={totalKm.toFixed(1)}
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
        <Text style={styles.sectionTitle}>BACKEND STATUS</Text>
        <Text style={styles.sectionDescription}>
          Profile data is fetched from `profiles`, run history comes from `activities`, and
          daily health data comes from `daily_logs`.
        </Text>
      </View>
    </View>
  );

  if (authLoading) {
    return (
      <ScreenShell>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#C6FF43" />
          <Text style={styles.loadingText}>Restoring Supabase session...</Text>
        </View>
      </ScreenShell>
    );
  }

  if (!session) {
    return (
      <ScreenShell>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentStack}>
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Authentication</Text>
              <View style={styles.scoreFrame}>
                <Ionicons name="shield-checkmark-outline" size={62} color="#C6FF43" />
                <Text style={styles.scoreUnit}>SUPABASE AUTH</Text>
              </View>
              <Text style={styles.heroNote}>
                Sign in or create an account to connect the finished frontend to your
                Supabase backend and persist all MVP fitness data.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.authToggleRow}>
                <Pressable
                  onPress={() => setAuthMode("sign-in")}
                  style={[
                    styles.authToggle,
                    authMode === "sign-in" && styles.authToggleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.authToggleText,
                      authMode === "sign-in" && styles.authToggleTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAuthMode("sign-up")}
                  style={[
                    styles.authToggle,
                    authMode === "sign-up" && styles.authToggleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.authToggleText,
                      authMode === "sign-up" && styles.authToggleTextActive,
                    ]}
                  >
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              {authMode === "sign-up" ? (
                <View style={styles.inputBlock}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Remote Ranger"
                    placeholderTextColor="#657288"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              ) : null}

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#657288"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#657288"
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <Pressable style={styles.primaryButton} onPress={handleAuth} disabled={submittingAuth}>
                {submittingAuth ? (
                  <ActivityIndicator color="#08111E" />
                ) : (
                  <Ionicons name="log-in-outline" size={18} color="#08111E" />
                )}
                <Text style={styles.primaryButtonText}>
                  {authMode === "sign-up" ? "CREATE ACCOUNT" : "SIGN IN"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{statusMessage}</Text>
            </View>
          </View>
        </ScrollView>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      headerRight={
        <Pressable onPress={handleSignOut} style={styles.headerBadge}>
          <Ionicons name="log-out-outline" size={16} color="#C6FF43" />
        </Pressable>
      }
    >
      {dashboardLoading && !profile ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#C6FF43" />
          <Text style={styles.loadingText}>Loading your Supabase dashboard...</Text>
        </View>
      ) : (
        <>
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
        </>
      )}
    </ScreenShell>
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
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: {
    color: "#DCE3F0",
    fontSize: 15,
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
    gap: 8,
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
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  authToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  authToggle: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B1322",
    paddingVertical: 12,
    alignItems: "center",
  },
  authToggleActive: {
    backgroundColor: "#C6FF43",
    borderColor: "#C6FF43",
  },
  authToggleText: {
    color: "#DDE5F2",
    fontWeight: "800",
  },
  authToggleTextActive: {
    color: "#07111F",
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
