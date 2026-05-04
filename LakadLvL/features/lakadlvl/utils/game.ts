import type { AiInsight, CheckinEntry, QuestProgress } from "../types";

export const getLevel = (xp: number) => Math.floor(xp / 100) + 1;

export const getXpIntoLevel = (xp: number) => xp % 100;

export const getHpColor = (hp: number) => {
  if (hp >= 75) return "#C6FF43";
  if (hp >= 45) return "#F8D866";
  return "#FF7C8A";
};

export const calculateHealthScore = (
  sleepHours: number,
  waterIntake: number,
  mood: number,
  activityKm: number
) => {
  const sleepScore = Math.min((sleepHours / 8) * 100, 100);
  const waterScore = Math.min((waterIntake / 2) * 100, 100);
  const moodScore = (mood / 5) * 100;
  const activityScore =
    activityKm > 0 ? Math.min((activityKm / 1) * 100, 100) : 60;

  return Math.round(
    sleepScore * 0.35 +
      waterScore * 0.3 +
      moodScore * 0.2 +
      activityScore * 0.15
  );
};

export const getQuestProgress = (
  entry: CheckinEntry | null
): QuestProgress[] => {
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

export const getQuestReward = (quests: QuestProgress[]) => {
  const completedCount = quests.filter((quest) => quest.completed).length;
  const baseXp = completedCount * 10;
  const bonusXp = completedCount === quests.length ? 20 : 0;

  return {
    completedCount,
    totalXp: baseXp + bonusXp,
    bonusXp,
  };
};

export const getAiInsight = (
  entry: CheckinEntry | null,
  displayedHp: number,
  quests: QuestProgress[]
): AiInsight => {
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
