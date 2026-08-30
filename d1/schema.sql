-- ==============================================================================
-- ICMR STS Research Study — D1 Database Schema
-- Study: "Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students"
-- ==============================================================================

-- 1. Participants Table (Core Identity & Enrollment)
CREATE TABLE IF NOT EXISTS participants (
    participant_id TEXT PRIMARY KEY,               -- e.g. STS-2026-7F3A91 (Random cryptographic ID)
    submission_id TEXT UNIQUE NOT NULL,           -- Google Form / Sheet Submission ID
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK (status IN ('PENDING_CONSENT', 'CONSENT_SIGNED', 'INVESTIGATOR_SIGNED', 'HRV_PENDING', 'HRV_ATTACHED', 'FINALIZED', 'WITHDRAWAL_REQUESTED', 'WITHDRAWN')),
    department TEXT DEFAULT 'MBBS',
    year_of_study TEXT NOT NULL,                   -- 'First MBBS' | 'Second MBBS'
    investigator_name TEXT DEFAULT 'Dr. Principal Investigator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Direct Identifiers (Logical Separation for Privacy)
CREATE TABLE IF NOT EXISTS participant_identifiers (
    participant_id TEXT PRIMARY KEY,
    name_optional TEXT,
    contact_number TEXT,
    email_optional TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

-- 3. De-Identified Questionnaire & Biometric Research Data
CREATE TABLE IF NOT EXISTS research_data (
    participant_id TEXT PRIMARY KEY,
    age_years INTEGER NOT NULL CHECK (age_years >= 18 AND age_years <= 35),
    gender TEXT NOT NULL,
    height_cm REAL NOT NULL,
    weight_kg REAL NOT NULL,
    bmi REAL NOT NULL,                             -- Weight (kg) / (Height in m)^2
    
    -- Meal Timing
    breakfast_time TEXT NOT NULL,
    breakfast_skipped_days_per_week TEXT NOT NULL,
    dinner_time TEXT NOT NULL,
    night_snack_frequency TEXT NOT NULL,
    eating_duration_window TEXT NOT NULL,
    regular_meal_timings TEXT NOT NULL,
    is_late_eater INTEGER DEFAULT 0,               -- 1 if dinner after 9 PM >= 3 days/week

    -- Reduced Morningness-Eveningness Questionnaire (rMEQ)
    rmeq_q1_wake_time TEXT NOT NULL,
    rmeq_q2_tiredness INTEGER NOT NULL,
    rmeq_q3_bedtime_tired TEXT NOT NULL,
    rmeq_q4_morning_ease INTEGER NOT NULL,
    rmeq_q5_peak_time TEXT NOT NULL,
    rmeq_total_score INTEGER NOT NULL,             -- 4 to 25
    chronotype_category TEXT NOT NULL CHECK (chronotype_category IN ('Morning type', 'Intermediate type', 'Evening type')),

    -- Lifestyle
    sleep_duration TEXT NOT NULL,
    caffeine_frequency TEXT NOT NULL,
    physical_activity_level TEXT NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

-- 4. Signing Sessions & Ephemeral Single-Use Tokens
CREATE TABLE IF NOT EXISTS signing_sessions (
    session_id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,               -- SHA-256 hash of random 128-bit token
    expires_at DATETIME NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_at DATETIME,
    ip_address_hash TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

-- 5. Signatures & Consent Declarations
CREATE TABLE IF NOT EXISTS signatures (
    signature_id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    signer_role TEXT NOT NULL CHECK (signer_role IN ('PARTICIPANT', 'INVESTIGATOR')),
    signer_declaration TEXT NOT NULL,
    signature_r2_key TEXT NOT NULL,               -- R2 Object Key for PNG binary
    signature_sha256 TEXT NOT NULL,               -- SHA-256 of signature PNG
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    signing_ip_hash TEXT,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

-- 6. Kubios HRV Records & Verification Screenshots
CREATE TABLE IF NOT EXISTS hrv_records (
    hrv_id TEXT PRIMARY KEY,
    participant_id TEXT UNIQUE NOT NULL,
    recording_date TEXT NOT NULL,
    recording_time TEXT NOT NULL,
    caffeine_avoided_12h INTEGER NOT NULL DEFAULT 1,
    exercise_avoided_12h INTEGER NOT NULL DEFAULT 1,
    rest_period_minutes INTEGER NOT NULL DEFAULT 10,
    
    -- Extracted Kubios Parameters
    resting_heart_rate REAL NOT NULL,              -- bpm (e.g. 78)
    rmssd REAL NOT NULL,                           -- ms (e.g. 31)
    sdnn REAL NOT NULL,                            -- ms (e.g. 24.09)
    lf_power REAL NOT NULL,                        -- ms² (e.g. 83.84)
    hf_power REAL NOT NULL,                        -- ms² (e.g. 301.41)
    lf_hf_ratio REAL NOT NULL,                     -- ratio (e.g. 0.28)
    
    -- Additional Kubios Diagnostic Parameters
    readiness_percentage REAL,                     -- e.g. 55%
    pns_index REAL,                                -- e.g. -0.79
    sns_index REAL,                                -- e.g. 2.12
    mean_rr REAL,                                  -- e.g. 772.43 ms
    stress_index REAL,                             -- e.g. 19.16
    respiratory_rate REAL,                         -- e.g. 23.23 breaths/min
    measurement_quality TEXT DEFAULT 'GOOD',
    
    -- Verification Artifacts
    screenshot_r2_key TEXT,                        -- R2 Key for Kubios screenshot JPEG/PNG
    screenshot_sha256 TEXT,
    ocr_confidence REAL,
    ingested_by TEXT DEFAULT 'MACRODROID_AUTOMATION',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

-- 7. Finalized Case Record Form (CRF) Documents
CREATE TABLE IF NOT EXISTS consent_documents (
    document_id TEXT PRIMARY KEY,
    participant_id TEXT UNIQUE NOT NULL,
    crf_version TEXT NOT NULL DEFAULT '1.0',
    pdf_r2_key TEXT NOT NULL,
    pdf_sha256 TEXT NOT NULL,                      -- SHA-256 of final multi-page PDF
    page_count INTEGER NOT NULL DEFAULT 2,         -- Page 1: CRF & Signatures, Page 2+: HRV Screenshot Appendix
    finalized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    public_access_token_hash TEXT UNIQUE,          -- For participant self-service download
    access_token_expires_at DATETIME,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

-- 8. Immutable Append-Only Audit Trail
CREATE TABLE IF NOT EXISTS audit_events (
    event_id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    participant_id TEXT,
    document_id TEXT,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('SYSTEM', 'PARTICIPANT', 'INVESTIGATOR', 'GOOGLE_APPS_SCRIPT', 'MACRODROID_AUTOMATION')),
    actor_identifier TEXT,
    ip_hash TEXT,
    metadata_json TEXT,
    event_hash TEXT                                -- Cryptographic hash chaining for tamper evidence
);

-- 9. Ethical Withdrawal Requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    request_id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_IEC_REVIEW' CHECK (status IN ('PENDING_IEC_REVIEW', 'APPROVED_ANONYMIZED', 'PROCESSED_RETAINED_STATUTORY', 'REJECTED')),
    reviewed_by TEXT,
    reviewed_at DATETIME,
    resolution_notes TEXT,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

-- Indexes for performance & security queries
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_signing_sessions_token ON signing_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_events_participant ON audit_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_hrv_records_participant ON hrv_records(participant_id);
