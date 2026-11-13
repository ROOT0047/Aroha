import type { Priority } from "./mock";

export type TemplateBlock = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  priority: Priority;
  color: "primary" | "secondary" | "success" | "warning" | "destructive";
};

export type ScheduleTemplate = {
  id: string;
  name: string;
  tagline: string;
  blocks: TemplateBlock[];
};

export const scheduleTemplates: ScheduleTemplate[] = [
  {
    id: "student",
    name: "Student",
    tagline: "Classes, deep study and recovery — built around focus peaks.",
    blocks: [
      { title: "Wake Up & Hydrate", description: "Water, sunlight, no phone for 20 minutes", startTime: "06:30", endTime: "07:00", priority: "Medium", color: "success" },
      { title: "Morning Revision", description: "Hardest subject first — active recall, not re-reading", startTime: "07:00", endTime: "08:00", priority: "High", color: "primary" },
      { title: "Classes / Lectures", description: "Take notes by hand; mark questions to revisit", startTime: "09:00", endTime: "15:00", priority: "High", color: "secondary" },
      { title: "Exercise / Walk", description: "Reset the brain before the evening session", startTime: "16:00", endTime: "16:45", priority: "Medium", color: "success" },
      { title: "Deep Study Block", description: "Two 50-minute focus sessions, 10-minute break between", startTime: "18:00", endTime: "20:00", priority: "High", color: "primary" },
      { title: "Flashcards & Review", description: "Spaced repetition for today's material", startTime: "20:30", endTime: "21:00", priority: "Medium", color: "warning" },
      { title: "Plan Tomorrow & Sleep", description: "Three priorities written down; screens off by 22:30", startTime: "22:00", endTime: "22:30", priority: "Medium", color: "secondary" },
    ],
  },
  {
    id: "job-worker",
    name: "Job Worker",
    tagline: "A 9-to-5 day with the margins protected for growth.",
    blocks: [
      { title: "Wake Up & Movement", description: "20 minutes of mobility or a short run", startTime: "06:00", endTime: "06:45", priority: "High", color: "success" },
      { title: "Skill Before Work", description: "45 minutes on your own goals before someone else's", startTime: "07:00", endTime: "07:45", priority: "High", color: "primary" },
      { title: "Commute + Podcast", description: "Learn on the way — no doom-scrolling", startTime: "08:15", endTime: "09:00", priority: "Low", color: "secondary" },
      { title: "Deep Work — AM", description: "Most important task first; messages off", startTime: "09:00", endTime: "12:30", priority: "High", color: "primary" },
      { title: "Lunch & Walk", description: "Eat away from the desk; 15-minute walk", startTime: "12:30", endTime: "13:30", priority: "Medium", color: "success" },
      { title: "Work — PM", description: "Meetings, email and shallow tasks batched here", startTime: "13:30", endTime: "17:30", priority: "Medium", color: "secondary" },
      { title: "Exercise", description: "Gym or home workout — non-negotiable", startTime: "18:00", endTime: "19:00", priority: "High", color: "warning" },
      { title: "Reading & Wind Down", description: "30 pages; journal three lines; bed by 22:30", startTime: "21:30", endTime: "22:15", priority: "Medium", color: "secondary" },
    ],
  },
  {
    id: "bodybuilder",
    name: "Bodybuilder",
    tagline: "Training, meals and recovery timed for growth.",
    blocks: [
      { title: "Wake Up & Weigh-in", description: "Fasted weight, water, 10 minutes of mobility", startTime: "05:30", endTime: "06:00", priority: "Medium", color: "success" },
      { title: "Meal 1 — Breakfast", description: "High protein; log it", startTime: "06:15", endTime: "06:45", priority: "High", color: "warning" },
      { title: "Morning Cardio", description: "30 minutes fasted low-intensity cardio", startTime: "07:00", endTime: "07:30", priority: "Medium", color: "success" },
      { title: "Work / Study Block", description: "Deep work while energy is high", startTime: "09:00", endTime: "13:00", priority: "High", color: "primary" },
      { title: "Meal 2 — Pre-workout", description: "Carbs + protein, 90 minutes before training", startTime: "13:00", endTime: "13:30", priority: "High", color: "warning" },
      { title: "Weight Training", description: "Today's split — progressive overload, log every set", startTime: "15:00", endTime: "16:30", priority: "High", color: "destructive" },
      { title: "Meal 3 — Post-workout", description: "Protein within 45 minutes of the last set", startTime: "16:45", endTime: "17:15", priority: "High", color: "warning" },
      { title: "Meal 4 — Dinner", description: "Whole foods; hit remaining macros", startTime: "19:30", endTime: "20:00", priority: "Medium", color: "warning" },
      { title: "Stretch & Sleep Prep", description: "15 minutes stretching; bed by 22:00 — growth happens asleep", startTime: "21:30", endTime: "22:00", priority: "High", color: "secondary" },
    ],
  },
  {
    id: "ayanokoji",
    name: "Ayanokoji Training",
    tagline: "The White Room regimen — body, mind and strategy, trained in silence.",
    blocks: [
      { title: "Wake Before Dawn", description: "05:00 sharp. No alarm snooze, no words, no wasted motion", startTime: "05:00", endTime: "05:15", priority: "High", color: "primary" },
      { title: "Meditation & Breath Control", description: "Stillness under pressure — 30 minutes of controlled breathing", startTime: "05:15", endTime: "05:45", priority: "High", color: "secondary" },
      { title: "Physical Conditioning", description: "Calisthenics to failure: push, pull, legs, core. Every rep exact", startTime: "06:00", endTime: "07:00", priority: "High", color: "destructive" },
      { title: "Cold Exposure", description: "Cold shower — train the nervous system to obey", startTime: "07:00", endTime: "07:15", priority: "Medium", color: "secondary" },
      { title: "Academic Study", description: "Mathematics, science, literature — mastery, not memorization", startTime: "08:00", endTime: "12:00", priority: "High", color: "primary" },
      { title: "Chess & Strategy", description: "Chess, Go, scenario planning — think five moves ahead", startTime: "13:00", endTime: "14:30", priority: "High", color: "warning" },
      { title: "Skill Acquisition", description: "One practical skill drilled to competence: languages, instruments, code", startTime: "15:00", endTime: "16:30", priority: "Medium", color: "primary" },
      { title: "Observation Practice", description: "People-watching and analysis — read motives, predict behavior", startTime: "17:00", endTime: "17:45", priority: "Medium", color: "secondary" },
      { title: "Second Training Session", description: "Martial arts or endurance work — the body is a tool, keep it sharp", startTime: "18:30", endTime: "19:30", priority: "High", color: "destructive" },
      { title: "Reading & Self-Review", description: "Philosophy and psychology; journal the day's weaknesses without emotion", startTime: "20:30", endTime: "21:30", priority: "Medium", color: "secondary" },
      { title: "Sleep", description: "22:00 — 7 hours. Recovery is part of the training", startTime: "22:00", endTime: "22:05", priority: "High", color: "primary" },
    ],
  },
];
