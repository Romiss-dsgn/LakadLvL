import { StatusBar } from "expo-status-bar";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "./components/AppHeader";
import { TabBar } from "./components/TabBar";
import { useLakadLvLGame } from "./hooks/useLakadLvLGame";
import { styles } from "./styles";
import { CheckInTab } from "./tabs/CheckInTab";
import { HomeTab } from "./tabs/HomeTab";
import { ProfileTab } from "./tabs/ProfileTab";
import { QuestsTab } from "./tabs/QuestsTab";

export function LakadLvLDashboard() {
  const game = useLakadLvLGame();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.backgroundGlowTop} />
        <View style={styles.backgroundGlowBottom} />

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
              level={game.level}
              quests={game.quests}
              rewardCompletedCount={game.reward.completedCount}
              xpIntoLevel={game.xpIntoLevel}
            />
          ) : null}

          {game.activeTab === "checkin" ? (
            <CheckInTab
              activity={game.activity}
              activityKm={game.activityKm}
              healthScore={game.lastEntry?.healthScore}
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
              level={game.level}
              user={game.user}
              xpIntoLevel={game.xpIntoLevel}
            />
          ) : null}
        </ScrollView>

        <TabBar activeTab={game.activeTab} onChange={game.setActiveTab} />
      </View>
    </SafeAreaView>
  );
}
