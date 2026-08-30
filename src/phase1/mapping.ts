/**
 * Schema & Mapping Engine for Google Form (Document A) → Internal De-identified Research Data
 * Preserves verbatim questionnaire strings and precise scoring.
 */

import { GoogleFormSubmissionPayload, NormalizedQuestionnaireData } from './types';
import { generateParticipantId } from './crypto';

// Canonical Google Form Column Header Names matching Document A verbatim
export const FORM_FIELD_DEFINITIONS = {
  CONSENT_AGREEMENT: 'I have read and understood the participant information sheet and agree to participate in this study.',
  CHRONIC_ILLNESS: 'Are you having any chronic illness? Eg. Hypertension/diabetes/thyroid disease?',
  MEDICATIONS: 'Are you on any medications?',
  NAME_OPTIONAL: 'Name (optional)',
  AGE_YEARS: 'Age (years)',
  GENDER: 'Gender',
  MBBS_YEAR: 'MBBS Professional Year',
  HEIGHT_CM: 'Height (cm)',
  WEIGHT_KG: 'Weight (kg)',
  BREAKFAST_TIME: 'At what time do you usually eat breakfast?',
  BREAKFAST_SKIPPED_DAYS: 'How many days per week do you skip breakfast?',
  DINNER_TIME: 'At what time do you usually eat dinner?',
  NIGHT_SNACKS: 'How often do you eat snacks after dinner/night-time?',
  EATING_DURATION: 'What is your usual daily eating duration (time between first and last meal)?',
  MEAL_REGULARITY: 'Do you eat meals at regular timings daily?',
  RMEQ_Q1: 'At approximately what time would you get up if you were entirely free to plan your day?',
  RMEQ_Q2: 'During the first half hour after waking, how tired do you feel?',
  RMEQ_Q3: 'At what time in the evening do you usually feel tired and in need of sleep?',
  RMEQ_Q4: 'How easy do you find getting up in the morning?',
  RMEQ_Q5: 'At what time of day do you feel your best mentally and physically?',
  SLEEP_DURATION: 'Average sleep duration per day',
  CAFFEINE_FREQUENCY: 'How often do you consume caffeinated beverages (coffee/tea/energy drinks)?',
  PHYSICAL_ACTIVITY: 'Physical activity level',
} as const;

/**
 * Calculates rMEQ Score (Reduced Morningness-Eveningness Questionnaire)
 * Scoring criteria:
 * Q1: Wake time
 *   - 5:00–6:30 AM: 5 points
 *   - 6:30–7:45 AM: 4 points
 *   - 7:45–9:45 AM: 3 points
 *   - 9:45 AM–11:00 AM: 2 points
 *   - After 11:00 AM: 1 point
 * Q2: Tiredness first half hour after waking (Scale 1-5)
 *   - 1 (Very tired): 1 point
 *   - 2: 2 points
 *   - 3: 3 points
 *   - 4: 4 points
 *   - 5 (Very alert): 5 points
 * Q3: Evening tiredness time
 *   - 8:00–9:00 PM: 5 points
 *   - 9:00–10:15 PM: 4 points
 *   - 10:15 PM–12:30 AM: 3 points
 *   - After 12:30 AM: 1 point (or 2 points based on cutoff) -> Standard rMEQ: 8-9pm=5, 9-10:15pm=4, 10:15pm-12:30am=3, 12:30am-2am=2, 2am-3am=1
 * Q4: Morning ease (Scale 1-5)
 *   - 1 (Very difficult): 1 point
 *   - 2: 2 points
 *   - 3: 3 points
 *   - 4: 4 points
 *   - 5 (Very easy): 5 points
 * Q5: Best time of day
 *   - Early morning: 5 points (or 4/5 depending on 4-item options; standard: Early morning=5, Late morning=4, Afternoon=3, Evening/Night=1)
 */
export function calculateRmeqScore(q1: string, q2: string | number, q3: string, q4: string | number, q5: string): {
  totalScore: number;
  category: 'Morning type' | 'Intermediate type' | 'Evening type';
} {
  let score = 0;

  // Q1
  const q1Trim = (q1 || '').trim();
  if (q1Trim.includes('5:00') || q1Trim.includes('6:30 AM') && !q1Trim.includes('7:45')) score += 5;
  else if (q1Trim.includes('6:30') || q1Trim.includes('7:45 AM') && !q1Trim.includes('9:45')) score += 4;
  else if (q1Trim.includes('7:45') || q1Trim.includes('9:45 AM') && !q1Trim.includes('11:00')) score += 3;
  else if (q1Trim.includes('9:45') || q1Trim.includes('11:00 AM')) score += 2;
  else if (q1Trim.includes('After 11:00')) score += 1;
  else score += 3; // Neutral default if unmatched

  // Q2 (1 to 5 scale)
  const q2Num = Number(q2) || 3;
  score += Math.max(1, Math.min(5, q2Num));

  // Q3
  const q3Trim = (q3 || '').trim();
  if (q3Trim.includes('8:00') && q3Trim.includes('9:00')) score += 5;
  else if (q3Trim.includes('9:00') && q3Trim.includes('10:15')) score += 4;
  else if (q3Trim.includes('10:15') && q3Trim.includes('12:30')) score += 3;
  else if (q3Trim.includes('After 12:30')) score += 1;
  else score += 3;

  // Q4 (1 to 5 scale)
  const q4Num = Number(q4) || 3;
  score += Math.max(1, Math.min(5, q4Num));

  // Q5
  const q5Trim = (q5 || '').trim().toLowerCase();
  if (q5Trim.includes('early morning')) score += 5;
  else if (q5Trim.includes('late morning')) score += 4;
  else if (q5Trim.includes('afternoon')) score += 3;
  else if (q5Trim.includes('evening') || q5Trim.includes('night')) score += 1;
  else score += 3;

  // CRF Definition:
  // 18–25 = Morning type
  // 12–17 = Intermediate type
  // 4–11  = Evening type
  let category: 'Morning type' | 'Intermediate type' | 'Evening type';
  if (score >= 18) category = 'Morning type';
  else if (score >= 12) category = 'Intermediate type';
  else category = 'Evening type';

  return { totalScore: score, category };
}

/**
 * Calculates BMI from weight (kg) and height (cm)
 * Formula: BMI = Weight (kg) / (Height in metres)^2
 */
export function calculateBmi(weightKg: number, heightCm: number): number | undefined {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) return undefined;
  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);
  return Number(bmi.toFixed(2));
}

/**
 * Normalizes raw Google Form responses into structured, separated research data.
 */
export function normalizeFormResponse(
  raw: Record<string, any>,
  existingParticipantId?: string
): {
  normalized: NormalizedQuestionnaireData;
  warnings: string[];
} {
  const warnings: string[] = [];
  const participantId = existingParticipantId || generateParticipantId('2026');

  // Extract by flexible key lookup (exact header or fuzzy normalized key)
  const getVal = (header: string, fallbackKey?: string): any => {
    if (raw[header] !== undefined && raw[header] !== null && raw[header] !== '') {
      return raw[header];
    }
    if (fallbackKey && raw[fallbackKey] !== undefined) {
      return raw[fallbackKey];
    }
    // Try lowercased / trimmed matching
    const headerClean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, v] of Object.entries(raw)) {
      const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (kClean === headerClean || (fallbackKey && kClean === fallbackKey.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
        return v;
      }
    }
    return '';
  };

  const consentRaw = String(getVal(FORM_FIELD_DEFINITIONS.CONSENT_AGREEMENT, 'consent_agreement')).trim();
  const consent_agreement: 'Yes' | 'No' = consentRaw.toLowerCase() === 'yes' ? 'Yes' : 'No';

  const has_chronic_illness: 'Yes' | 'No' = String(getVal(FORM_FIELD_DEFINITIONS.CHRONIC_ILLNESS, 'has_chronic_illness')).toLowerCase() === 'yes' ? 'Yes' : 'No';
  const is_on_medications: 'Yes' | 'No' = String(getVal(FORM_FIELD_DEFINITIONS.MEDICATIONS, 'is_on_medications')).toLowerCase() === 'yes' ? 'Yes' : 'No';

  const name_optional = String(getVal(FORM_FIELD_DEFINITIONS.NAME_OPTIONAL, 'name_optional') || '').trim();
  const age_years = Number(getVal(FORM_FIELD_DEFINITIONS.AGE_YEARS, 'age_years')) || 0;
  const gender = String(getVal(FORM_FIELD_DEFINITIONS.GENDER, 'gender') || '').trim();
  const mbbs_year = String(getVal(FORM_FIELD_DEFINITIONS.MBBS_YEAR, 'mbbs_year') || '').trim();

  const height_cm = Number(getVal(FORM_FIELD_DEFINITIONS.HEIGHT_CM, 'height_cm')) || 0;
  const weight_kg = Number(getVal(FORM_FIELD_DEFINITIONS.WEIGHT_KG, 'weight_kg')) || 0;
  const bmi = calculateBmi(weight_kg, height_cm);

  const breakfast_time = String(getVal(FORM_FIELD_DEFINITIONS.BREAKFAST_TIME, 'breakfast_time') || '').trim();
  const breakfast_skipped_days_per_week = String(getVal(FORM_FIELD_DEFINITIONS.BREAKFAST_SKIPPED_DAYS, 'breakfast_skipped_days_per_week') || '').trim();
  const dinner_time = String(getVal(FORM_FIELD_DEFINITIONS.DINNER_TIME, 'dinner_time') || '').trim();
  const night_snack_frequency = String(getVal(FORM_FIELD_DEFINITIONS.NIGHT_SNACKS, 'night_snack_frequency') || '').trim();
  const eating_duration_window = String(getVal(FORM_FIELD_DEFINITIONS.EATING_DURATION, 'eating_duration_window') || '').trim();
  const regular_meal_timings = String(getVal(FORM_FIELD_DEFINITIONS.MEAL_REGULARITY, 'regular_meal_timings') || '').trim();

  // rMEQ fields
  const rmeq_q1_wake_time = String(getVal(FORM_FIELD_DEFINITIONS.RMEQ_Q1, 'rmeq_q1_wake_time') || '').trim();
  const rmeq_q2_tiredness = getVal(FORM_FIELD_DEFINITIONS.RMEQ_Q2, 'rmeq_q2_tiredness');
  const rmeq_q3_bedtime_tired = String(getVal(FORM_FIELD_DEFINITIONS.RMEQ_Q3, 'rmeq_q3_bedtime_tired') || '').trim();
  const rmeq_q4_morning_ease = getVal(FORM_FIELD_DEFINITIONS.RMEQ_Q4, 'rmeq_q4_morning_ease');
  const rmeq_q5_peak_time = String(getVal(FORM_FIELD_DEFINITIONS.RMEQ_Q5, 'rmeq_q5_peak_time') || '').trim();

  const { totalScore: rmeq_total_score, category: chronotype_category } = calculateRmeqScore(
    rmeq_q1_wake_time,
    rmeq_q2_tiredness,
    rmeq_q3_bedtime_tired,
    rmeq_q4_morning_ease,
    rmeq_q5_peak_time
  );

  // Lifestyle
  const sleep_duration = String(getVal(FORM_FIELD_DEFINITIONS.SLEEP_DURATION, 'sleep_duration') || '').trim();
  const caffeine_frequency = String(getVal(FORM_FIELD_DEFINITIONS.CAFFEINE_FREQUENCY, 'caffeine_frequency') || '').trim();
  const physical_activity_level = String(getVal(FORM_FIELD_DEFINITIONS.PHYSICAL_ACTIVITY, 'physical_activity_level') || '').trim();

  // Validate inclusion criteria (Age 18-25)
  if (age_years < 18 || age_years > 25) {
    warnings.push(`Age ${age_years} is outside protocol target (18–25 years).`);
  }
  if (has_chronic_illness === 'Yes') {
    warnings.push('Participant reported chronic illness (exclusion flag).');
  }
  if (is_on_medications === 'Yes') {
    warnings.push('Participant reported current medication usage (exclusion flag).');
  }
  if (consent_agreement !== 'Yes') {
    warnings.push('Participant did not provide consent.');
  }

  const normalized: NormalizedQuestionnaireData = {
    consent_agreement,
    has_chronic_illness,
    is_on_medications,
    identifiers: {
      participant_id: participantId,
      name_optional: name_optional || undefined,
    },
    research: {
      participant_id: participantId,
      age_years,
      gender,
      mbbs_year,
      height_cm,
      weight_kg,
      bmi,
      breakfast_time,
      breakfast_skipped_days_per_week,
      dinner_time,
      night_snack_frequency,
      eating_duration_window,
      regular_meal_timings,
      rmeq_q1_wake_time,
      rmeq_q2_tiredness,
      rmeq_q3_bedtime_tired,
      rmeq_q4_morning_ease,
      rmeq_q5_peak_time,
      rmeq_total_score,
      chronotype_category,
      sleep_duration,
      caffeine_frequency,
      physical_activity_level,
    },
  };

  return { normalized, warnings };
}
