export type UserPlan = 'free' | 'pro';

export interface Profile {
  id: string;
  email: string;
  plan: UserPlan;
  tab_quota: number;
  created_at: string;
}
