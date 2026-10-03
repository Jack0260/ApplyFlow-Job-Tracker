import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface Application {
  id: string;
  user_id: string;
  company: string;
  position: string;
  location: string;
  salary_range: string;
  status: ApplicationStatus;
  job_description: string;
  resume_text: string;
  match_score: number;
  job_url: string;
  application_date: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export type TimelineEventType =
  | 'status_change'
  | 'note'
  | 'interview'
  | 'offer'
  | 'rejection'
  | 'application'
  | 'follow_up';

export interface TimelineEvent {
  id: string;
  application_id: string;
  user_id: string;
  event_type: TimelineEventType;
  title: string;
  description: string;
  event_date: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  application_id: string;
  user_id: string;
  reminder_date: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export const STATUS_COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: 'wishlist', label: 'Wishlist', color: 'slate' },
  { id: 'applied', label: 'Applied', color: 'blue' },
  { id: 'interview', label: 'Interview', color: 'amber' },
  { id: 'offer', label: 'Offer', color: 'emerald' },
  { id: 'rejected', label: 'Rejected', color: 'rose' },
];
