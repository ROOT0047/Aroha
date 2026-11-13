export type Priority = "High" | "Medium" | "Low";

export type ScheduleBlock = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationLabel: string;
  priority: Priority;
  completed: boolean;
  color: "primary" | "secondary" | "success" | "warning" | "destructive";
};

export type Habit = {
  id: string;
  title: string;
  icon: string;
  cadence: "Daily" | "Weekly" | "Monthly";
  goal: number;
  unit: string;
  streak: number;
  bestStreak: number;
  completedToday: boolean;
  history: boolean[];
};

export type JournalEntry = {
  id: string;
  title: string;
  mood: "Focused" | "Calm" | "Tired" | "Driven";
  content: string;
  createdAt: string;
  entryDate?: string;
};

export type Achievement = {
  id: string;
  name: string;
  detail: string;
  unlocked: boolean;
};

export type CoachMessage = { id: string; role: "coach" | "user"; content: string };

export const profile = {
  name: "King",
  email: "king@aroha.app",
  level: 18,
  rank: "Elite",
  timezone: "Europe/Istanbul",
  quote: {
    text: "\u5f31\u3055\u3092\u96a0\u3059\u306e\u3067\u306f\u306a\u3044\u3001\u652f\u914d\u3059\u308b\u306e\u3060\u3002",
    translation: "Do not hide your weakness \u2014 govern it.",
    author: "Ayanokoji Kiyotaka",
  },
};

export const seedSchedule: ScheduleBlock[] = [
  { id: "s1", title: "Wake Up & Meditation", description: "Cold water, ten minutes of stillness", startTime: "05:30", endTime: "06:00", durationLabel: "30 min", priority: "High", completed: true, color: "success" },
  { id: "s2", title: "Workout", description: "Upper body \u2014 push focus", startTime: "06:00", endTime: "06:50", durationLabel: "50 min", priority: "High", completed: true, color: "primary" },
  { id: "s3", title: "Reading", description: "Non-fiction, no phone in the room", startTime: "07:00", endTime: "07:40", durationLabel: "40 min", priority: "Medium", completed: false, color: "secondary" },
  { id: "s4", title: "Work Block", description: "Primary project execution", startTime: "08:30", endTime: "18:00", durationLabel: "9h 30m", priority: "High", completed: false, color: "primary" },
  { id: "s5", title: "Skill Learning", description: "Systems design study", startTime: "18:00", endTime: "19:00", durationLabel: "1h", priority: "Medium", completed: false, color: "warning" },
  { id: "s6", title: "Exercise / Walk", description: "Zone 2, no phone", startTime: "19:30", endTime: "20:00", durationLabel: "30 min", priority: "Low", completed: false, color: "success" },
  { id: "s7", title: "Journal & Plan Tomorrow", description: "Review the day, set three priorities", startTime: "21:00", endTime: "21:30", durationLabel: "30 min", priority: "Medium", completed: false, color: "secondary" },
  { id: "s8", title: "Sleep", description: "Target 7h 30m", startTime: "22:00", endTime: "05:30", durationLabel: "7h 30m", priority: "High", completed: false, color: "primary" },
];

function streakHistory(days: number, missed: number[]): boolean[] {
  return Array.from({ length: 30 }, (_, i) => i >= 30 - days && !missed.includes(i));
}

export const seedHabits: Habit[] = [
  { id: "h1", title: "Wake up at 05:30", icon: "sunrise", cadence: "Daily", goal: 1, unit: "session", streak: 17, bestStreak: 41, completedToday: true, history: streakHistory(21, [12, 13]) },
  { id: "h2", title: "Workout", icon: "dumbbell", cadence: "Daily", goal: 50, unit: "minutes", streak: 22, bestStreak: 45, completedToday: true, history: streakHistory(26, [9]) },
  { id: "h3", title: "Read 30 minutes", icon: "book", cadence: "Daily", goal: 30, unit: "minutes", streak: 15, bestStreak: 38, completedToday: false, history: streakHistory(19, [4, 11]) },
  { id: "h4", title: "Meditation", icon: "brain", cadence: "Daily", goal: 10, unit: "minutes", streak: 10, bestStreak: 24, completedToday: true, history: streakHistory(14, [6]) },
  { id: "h5", title: "No sugar", icon: "ban", cadence: "Daily", goal: 1, unit: "day", streak: 7, bestStreak: 19, completedToday: false, history: streakHistory(9, [2]) },
  { id: "h6", title: "Drink 3L water", icon: "droplet", cadence: "Daily", goal: 3000, unit: "ml", streak: 16, bestStreak: 33, completedToday: true, history: streakHistory(20, [8]) },
  { id: "h7", title: "Weekly review", icon: "clipboard", cadence: "Weekly", goal: 1, unit: "review", streak: 6, bestStreak: 11, completedToday: false, history: streakHistory(12, [5]) },
  { id: "h8", title: "Monthly finance audit", icon: "wallet", cadence: "Monthly", goal: 1, unit: "audit", streak: 3, bestStreak: 5, completedToday: false, history: streakHistory(6, []) },
];

export const seedJournal: JournalEntry[] = [
  { id: "j1", title: "Held the line", mood: "Focused", content: "Two hours of uninterrupted work before the first message. The morning block is where the day is decided.", createdAt: "21 May 2026" },
  { id: "j2", title: "Slower, but honest", mood: "Tired", content: "Slept 6h 20m and it showed after lunch. Sleep is the input, not the reward.", createdAt: "20 May 2026" },
  { id: "j3", title: "Quiet compounding", mood: "Calm", content: "Nothing dramatic. Read 40 pages, trained, no sugar. Consistency is the strategy.", createdAt: "19 May 2026" },
];

export const seedAchievements: Achievement[] = [
  { id: "a1", name: "30-Day Streak", detail: "Held one habit for a full month", unlocked: true },
  { id: "a2", name: "Early Riser", detail: "05:30 wake-up, 14 days running", unlocked: true },
  { id: "a3", name: "Deep Focus", detail: "Four 50-minute sessions in one day", unlocked: true },
  { id: "a4", name: "Consistency Master", detail: "90% habit rate for a month", unlocked: true },
  { id: "a5", name: "Iron Month", detail: "Workout every day for 30 days", unlocked: false },
  { id: "a6", name: "Dopamine Detox", detail: "Complete the 7-day detox mission", unlocked: false },
];

export const disciplineTrend = [
  { label: "Mon", score: 74, focus: 120 },
  { label: "Tue", score: 81, focus: 145 },
  { label: "Wed", score: 78, focus: 95 },
  { label: "Thu", score: 86, focus: 165 },
  { label: "Fri", score: 83, focus: 130 },
  { label: "Sat", score: 90, focus: 185 },
  { label: "Sun", score: 87, focus: 150 },
];

export const monthTrend = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1}`,
  score: 62 + Math.round(22 * Math.sin(i / 3.4) + i * 0.55),
  focus: 80 + Math.round(70 * Math.abs(Math.sin(i / 2.2))),
}));

export const yearTrend = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(
  (label, i) => ({ label, score: 58 + i * 2 + (i % 3) * 3, focus: 1800 + i * 140 }),
);

export const heatmap = Array.from({ length: 91 }, (_, i) =>
  Math.max(0, Math.round(2.4 + 1.6 * Math.sin(i / 5) - (i % 11 === 0 ? 3 : 0))),
);

export const learningItems = [
  { id: "l1", title: "Thinking in Systems", type: "Book", progress: 62, detail: "212 / 340 pages" },
  { id: "l2", title: "Distributed Systems", type: "Course", progress: 38, detail: "9 / 24 lessons" },
  { id: "l3", title: "Japanese N4", type: "Language", progress: 71, detail: "412 cards mastered" },
  { id: "l4", title: "Algorithms drill", type: "Practice", progress: 45, detail: "18 problems / week" },
];

export const healthStats = {
  water: 2100,
  waterGoal: 3000,
  sleep: 7.4,
  sleepGoal: 7.5,
  weight: 72,
  steps: 11240,
  calories: 2380,
  workoutsThisWeek: 5,
};

export const reminders = [
  { id: "r1", title: "Wake Up", time: "05:30", repeat: "Daily", voice: true, enabled: true },
  { id: "r2", title: "Workout", time: "06:00", repeat: "Mon\u2013Fri", voice: true, enabled: true },
  { id: "r3", title: "Hydrate", time: "Every 2h", repeat: "Daily", voice: false, enabled: true },
  { id: "r4", title: "Journal", time: "21:00", repeat: "Daily", voice: false, enabled: false },
];

export const notifications = [
  { id: "n1", title: "Workout window opens in 10 minutes", time: "05:50", read: false },
  { id: "n2", title: "Reading streak at risk \u2014 15 days on the line", time: "18:20", read: false },
  { id: "n3", title: "Weekly review is ready", time: "Yesterday", read: true },
];

export const seedCoach: CoachMessage[] = [
  { id: "c1", role: "coach", content: "Good morning. You slept 7h 24m and closed 92% of yesterday's plan. Today's three priorities: workout, the 08:30 work block, and 30 minutes of reading." },
  { id: "c2", role: "coach", content: "One pattern worth naming: you skip reading on days the work block runs past 18:00. Move reading before dinner and the streak holds." },
];

export const coachReplies: string[] = [
  "Your focus peaks between 19:00 and 21:00. Put the hardest task there tomorrow and protect it.",
  "Tomorrow's single improvement: be in bed by 22:15. Every metric you track improves after 7.5 hours.",
  "You've completed 5 of 7 workouts this week. Thursday is the recurring gap \u2014 schedule it at 06:00, not the evening.",
  "Discipline is trending up 4 points over the last 7 days. Hold the current routine; don't add anything new this week.",
];
