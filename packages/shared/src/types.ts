export type Mission = {
  id: string;
  title: string;
  attribute: string;
  done: boolean;
};

export type PlanBlock = {
  title: string;
  start: string;
  end: string;
  priority: string;
};

export type DailyReviewKind = "morning" | "evening";

export type DailyReview = {
  id?: string;
  user_id: string;
  review_date: string;
  kind: DailyReviewKind;
  summary: string;
  missions: Mission[];
  plan: PlanBlock[];
  insights: string[];
  created_at?: string;
  updated_at?: string;
};

export type CoachMessage = {
  id?: string;
  user_id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

export type CoachInput = {
  message: string;
};

export type ReviewInput = {
  kind: DailyReviewKind;
  date: string;
  now: string;
};
