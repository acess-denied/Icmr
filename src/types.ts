export interface ParticipantRecord {
  participant_id: string;
  submission_id: string;
  enrolled_at: string;
  status: 'PENDING_CONSENT' | 'CONSENT_SIGNED' | 'INVESTIGATOR_SIGNED' | 'HRV_PENDING' | 'HRV_ATTACHED' | 'FINALIZED' | 'WITHDRAWAL_REQUESTED' | 'WITHDRAWN';
  year_of_study: string;
  department: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  breakfast_time: string;
  breakfast_skipped: string;
  dinner_time: string;
  night_snack: string;
  eating_duration: string;
  regular_timings: string;
  rmeq_total_score: number;
  chronotype_category: 'Morning type' | 'Intermediate type' | 'Evening type';
  sleep_duration: string;
  caffeine_frequency: string;
  physical_activity: string;
  participant_signature?: string;
  investigator_signature?: string;
  participant_signed_at?: string;
  investigator_signed_at?: string;
  hrv_record?: KubiosHrvRecord;
  pdf_sha256?: string;
  public_access_token?: string;
}

export interface KubiosHrvRecord {
  recording_date: string;
  recording_time: string;
  caffeine_avoided_12h: boolean;
  exercise_avoided_12h: boolean;
  rest_period_minutes: number;
  resting_heart_rate: number;
  rmssd: number;
  sdnn: number;
  lf_power: number;
  hf_power: number;
  lf_hf_ratio: number;
  readiness_percentage: number;
  pns_index: number;
  sns_index: number;
  mean_rr: number;
  stress_index: number;
  respiratory_rate: number;
  measurement_quality: 'GOOD' | 'OK' | 'POOR';
  screenshot_base64?: string;
  screenshot_sha256?: string;
}

export interface AuditEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  actor: string;
  participant_id?: string;
  details: string;
  event_hash: string;
}
