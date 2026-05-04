import { useMemo, useState } from "react";

import { TODAY_KEY, initialUser } from "../constants";
import type { CheckinEntry, TabKey, UserState } from "../types";
import {
  calculateHealthScore,
  getAiInsight,
  getHpColor,
  getLevel,
  getQuestProgress,
  getQuestReward,
  getXpIntoLevel,
} from "../utils/game";

export function useLakadLvLGame() {
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
  const displayedHp = didCheckInToday
    ? user.hpBase
    : Math.max(0, user.hpBase - 5);
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
      setStatusMessage(
        "Complete sleep, water, activity text, and distance before saving the daily check-in."
      );
      return;
    }

    const healthScore = calculateHealthScore(
      parsedSleep,
      parsedWater,
      mood,
      parsedKm
    );
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
      totalCheckins: didCheckInToday
        ? current.totalCheckins
        : current.totalCheckins + 1,
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

  return {
    activeTab,
    activity,
    activityKm,
    aiInsight,
    didCheckInToday,
    displayedHp,
    hpColor,
    lastEntry,
    level,
    mood,
    quests,
    reward,
    setActiveTab,
    setActivity,
    setActivityKm,
    setMood,
    setSleepHours,
    setWaterIntake,
    sleepHours,
    statusMessage,
    submitCheckin,
    user,
    waterIntake,
    xpIntoLevel,
  };
}
