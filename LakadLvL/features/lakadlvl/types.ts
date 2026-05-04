export type TabKey = "home" | "checkin" | "quests" | "profile";

export type UserState = {
  username: string;
  hpBase: number;
  totalXp: number;
  streak: number;
  questsDone: number;
  totalCheckins: number;
  kmTotal: number;
};

export type CheckinEntry = {
  dateKey: string;
  sleepHours: number;
  waterIntake: number;
  mood: number;
  activity: string;
  activityKm: number;
  healthScore: number;
};

export type QuestProgress = {
  id: string;
  title: string;
  description: string;
  progress: number;
  progressLabel: string;
  completed: boolean;
  xp: number;
};

export type AiInsight = {
  title: string;
  body: string;
  tag: string;
};
