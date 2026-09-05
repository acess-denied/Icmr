export interface ParticipantRecord {
  participant_id: string;
  submission_id: string;
  enrolled_at: string;
  participant_name: string;
  initials?: string;
  contact_number?: string;
  mobile_number?: string;
  investigator_name?: string;
  investigator_role?: string;
  status: 'PENDING_CONSENT' | 'CONSENT_SIGNED' | 'INVESTIGATOR_SIGNED' | 'HRV_PENDING' | 'HRV_ATTACHED' | 'FINALIZED' | 'WITHDRAWAL_REQUESTED' | 'WITHDRAWN';
  year_of_study: string;
  department: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  bedtime?: string;
  wake_time?: string;
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
  screenshot_base64?: string; // Part 1 or combined
  screenshot_part1_base64?: string; // Top dashboard
  screenshot_part2_base64?: string; // Scrolled bottom view
  screenshot_sha256?: string;
  screenshot_part2_sha256?: string;
  entry_mode?: 'MACRODROID_IMAP_INGESTED' | 'OCR_AUTO_CAPTURED' | 'MANUAL_BACKUP_OVERRIDE';
  ocr_confidence?: number;
  is_physically_verified?: boolean;
  verified_at?: string;
  verified_by?: string;
  manual_entry_reason?: string;
  manual_attestation_by?: string;
  imap_message_id?: string;
  imap_subject?: string;
  imap_sender?: string;
  imap_received_at?: string;
}

export interface ImapEmailMessage {
  id: string;
  sender: string;
  subject: string;
  received_at: string;
  timestamp_iso: string;
  detected_participant_id?: string;
  detected_participant_name?: string;
  screenshot_part1_url: string;
  screenshot_part2_url?: string;
  ocr_metrics: Partial<KubiosHrvRecord>;
  status: 'AUTO_MATCHED' | 'PENDING_CONFIRMATION' | 'UNMAPPED' | 'PROCESSED';
  assigned_participant_id?: string;
  assigned_participant_name?: string;
  notes?: string;
}

export interface ImapServerConfig {
  host: string;
  port: number;
  security: 'SSL/TLS' | 'STARTTLS' | 'None';
  username: string;
  password_configured: boolean;
  folder: string;
  polling_interval_sec: number;
  auto_ocr: boolean;
  auto_match_by_subject: boolean;
  is_connected: boolean;
  last_sync_time?: string;
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
