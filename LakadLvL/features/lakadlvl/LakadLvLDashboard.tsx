import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "./components/AppHeader";
import { LaunchScreen } from "./components/LaunchScreen";
import { LoginScreen } from "./components/LoginScreen";
import { TabBar } from "./components/TabBar";
import { useLakadLvLGame } from "./hooks/useLakadLvLGame";
import { styles } from "./styles";
import { CheckInTab } from "./tabs/CheckInTab";
import { HomeTab } from "./tabs/HomeTab";
import { ProfileTab } from "./tabs/ProfileTab";
import { QuestsTab } from "./tabs/QuestsTab";

export function LakadLvLDashboard() {
  const game = useLakadLvLGame();
  const [stage, setStage] = useState<"launch" | "login" | "app">("launch");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage("login");
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (stage === "launch") {
      return;
    }

    if (game.isAuthLoading || game.isDashboardLoading) {
      return;
    }

    setStage(game.isAuthenticated ? "app" : "login");
  }, [game.isAuthenticated, game.isAuthLoading, game.isDashboardLoading, stage]);

  const handleLogin = () => {
    void game.login(email, password);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.backgroundGlowTop} />
        <View style={styles.backgroundGlowBottom} />

        {stage === "launch" ? <LaunchScreen /> : null}

        {stage !== "launch" && (game.isAuthLoading || game.isDashboardLoading) ? (
          <LaunchScreen />
        ) : null}

        {stage === "login" && !game.isAuthLoading && !game.isDashboardLoading ? (
          <LoginScreen
            email={email}
            errorMessage={game.authError}
            isSubmitting={game.isAuthLoading}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
          />
        ) : null}

        {stage === "app" && !game.isAuthLoading && !game.isDashboardLoading ? (
          <>
            <AppHeader />

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {game.activeTab === "home" ? (
                <HomeTab
                  aiInsight={game.aiInsight}
                  didCheckInToday={game.didCheckInToday}
                  displayedHp={game.displayedHp}
                  healthScore={game.lastEntry?.healthScore}
                  hpColor={game.hpColor}
                  isAiLoading={game.isAiLoading}
                  level={game.level}
                  quests={game.quests}
                  rewardCompletedCount={game.reward.completedCount}
                  storyDays={game.storyDays}
                  storyInsight={game.storyInsight}
                  xpIntoLevel={game.xpIntoLevel}
                />
              ) : null}

              {game.activeTab === "checkin" ? (
                <CheckInTab
                  activity={game.activity}
                  activityKm={game.activityKm}
                  healthScore={game.lastEntry?.healthScore}
                  isSubmitting={game.isSubmitting}
                  mood={game.mood}
                  onActivityChange={game.setActivity}
                  onActivityKmChange={game.setActivityKm}
                  onMoodChange={game.setMood}
                  onSleepChange={game.setSleepHours}
                  onSubmit={game.submitCheckin}
                  onWaterChange={game.setWaterIntake}
                  sleepHours={game.sleepHours}
                  statusMessage={game.statusMessage}
                  waterIntake={game.waterIntake}
                />
              ) : null}

              {game.activeTab === "quests" ? (
                <QuestsTab
                  quests={game.quests}
                  rewardBonusXp={game.reward.bonusXp}
                  rewardCompletedCount={game.reward.completedCount}
                  rewardTotalXp={game.reward.totalXp}
                />
              ) : null}

              {game.activeTab === "profile" ? (
                <ProfileTab
                  displayedHp={game.displayedHp}
                  hpColor={game.hpColor}
                  isSeedingDemo={game.isSeedingDemo}
                  level={game.level}
                  onLoadDemoHistory={() => {
                    void game.loadDemoHistory();
                  }}
                  onLogout={() => {
                    void game.logout();
                    setStage("login");
                  }}
                  user={game.user}
                  xpIntoLevel={game.xpIntoLevel}
                />
              ) : null}
            </ScrollView>

            <TabBar activeTab={game.activeTab} onChange={game.setActiveTab} />
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
