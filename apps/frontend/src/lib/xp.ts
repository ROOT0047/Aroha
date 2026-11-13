/**
 * Single source of truth for AROHA XP rules.
 * Each input is already deduplicated by (source, item, day) by the caller,
 * so repeating an action on the same day never counts twice.
 */
export const XP_RULES = {
  habitCheckin: 12, // per habit per day
  completedBlock: 6, // per block
  focusSession: 10, // per completed focus session
  journalDay: 15, // per day with at least one entry
  healthLogDay: 5, // per day with water or sleep logged
  goalCompleted: 50, // per completed goal
  streakDay: 20, // per day of best streak
  badge: 75, // per unlocked badge
} as const;

export type XpInput = {
  checkins: number;
  completedBlocks: number;
  bestStreak: number;
  disciplineScore: number;
  badges: number;
  focusSessions?: number;
  journalDays?: number;
  healthDays?: number;
  goalsCompleted?: number;
};

export function totalXp(i: XpInput) {
  return Math.round(
    i.checkins * XP_RULES.habitCheckin +
      i.completedBlocks * XP_RULES.completedBlock +
      i.bestStreak * XP_RULES.streakDay +
      i.badges * XP_RULES.badge +
      (i.focusSessions ?? 0) * XP_RULES.focusSession +
      (i.journalDays ?? 0) * XP_RULES.journalDay +
      (i.healthDays ?? 0) * XP_RULES.healthLogDay +
      (i.goalsCompleted ?? 0) * XP_RULES.goalCompleted +
      i.disciplineScore,
  );
}
