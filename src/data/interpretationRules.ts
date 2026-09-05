import { ParticipantRecord, KubiosHrvRecord } from '../types';

/**
 * Clinical Interpretation Criteria & Actionable Recommendations Engine
 * ICMR STS 2026: Meal Timing, Chronotype, and Heart Rate Variability
 *
 * All thresholds and clinical messages are defined here for easy modification.
 */

export interface InterpretationResult {
  participantId: string;
  summaryTitle: string;
  overallStatus: 'OPTIMAL' | 'MODERATE_RISK' | 'HIGH_RISK';
  
  // BMI Analysis (Asian-Indian Consensus Criteria)
  bmiAnalysis: {
    category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese';
    riskLevel: 'Low' | 'Normal' | 'Elevated' | 'High';
    explanation: string;
    clinicalAdvice: string;
  };

  // Circadian & rMEQ Chronotype Analysis
  chronotypeAnalysis: {
    category: 'Morning type' | 'Intermediate type' | 'Evening type';
    score: number;
    scoreRange: string;
    circadianProfile: string;
    academicWorkAdvice: string;
  };

  // Chrononutrition & Meal Timing Analysis
  nutritionAnalysis: {
    eatingWindowEvaluation: string;
    breakfastStatus: string;
    nightSnackingRisk: string;
    metabolicRiskScore: 'Low' | 'Moderate' | 'High';
    dietaryRecommendations: string[];
  };

  // HRV Autonomic Nervous System (ANS) Balance
  hrvAnalysis: {
    parasympatheticTone: 'Low / Suppressed' | 'Normal' | 'Enhanced';
    sympathovagalBalance: 'Sympathetic Dominance' | 'Balanced Sympathovagal' | 'Vagal Dominance';
    stressState: 'Elevated Stress' | 'Moderate Stress' | 'Restful / Recovered';
    physiologicalSummary: string;
    cardiacAutonomicAdvice: string;
  };

  // Actionable Lifestyle & Sleep Recommendations
  keyRecommendations: string[];

  // Formatted Text Messages for Dispatch
  formattedBriefDiagnosis: string;
  formattedWhatsAppText: string;
  formattedSmsText: string;
}

/**
 * Evaluates participant data against clinical criteria and returns a structured diagnosis
 */
export function generateClinicalInterpretation(
  participant: ParticipantRecord,
  portalBaseUrl: string = window.location.origin
): InterpretationResult {
  const hrv: Partial<KubiosHrvRecord> = participant.hrv_record || {
    resting_heart_rate: 74,
    rmssd: 35,
    sdnn: 32,
    lf_hf_ratio: 0.85,
    stress_index: 14.5,
    pns_index: 0.1,
    sns_index: 0.8,
    readiness_percentage: 65,
  };

  // 1. BMI Assessment (Asian-Indian Cutoffs: Normal 18.5 - 22.9 kg/m²)
  let bmiCategory: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese' = 'Normal weight';
  let bmiRisk: 'Low' | 'Normal' | 'Elevated' | 'High' = 'Normal';
  let bmiAdvice = 'Maintain balanced nutrient intake and habitual physical activity.';

  if (participant.bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiRisk = 'Elevated';
    bmiAdvice = 'Focus on nutrient-dense meals with adequate protein to build lean muscle mass.';
  } else if (participant.bmi <= 22.9) {
    bmiCategory = 'Normal weight';
    bmiRisk = 'Normal';
    bmiAdvice = 'Excellent anthropometric profile within Asian-Indian ideal parameters (18.5–22.9 kg/m²).';
  } else if (participant.bmi <= 24.9) {
    bmiCategory = 'Overweight';
    bmiRisk = 'Elevated';
    bmiAdvice = 'Incorporate daily 30-min aerobic activity and monitor refined carbohydrate intake.';
  } else {
    bmiCategory = 'Obese';
    bmiRisk = 'High';
    bmiAdvice = 'Prioritize early dinner timings, eliminate late-night snacking, and engage in regular structured cardio exercise.';
  }

  // 2. rMEQ Chronotype Assessment (rMEQ: 4-11 Evening, 12-17 Intermediate, 18-25 Morning)
  let chronoProfile = '';
  let chronoAdvice = '';
  if (participant.chronotype_category === 'Morning type') {
    chronoProfile = 'Early circadian phase (Lark). Peak cognitive alertness occurs in early-to-mid morning.';
    chronoAdvice = 'Schedule intensive medical studies and demanding clinical tasks during morning hours. Maintain consistent 10 PM–6 AM sleep cycle.';
  } else if (participant.chronotype_category === 'Evening type') {
    chronoProfile = 'Delayed circadian phase (Owl). Greater risk of social jetlag during early medical college rotations.';
    chronoAdvice = 'Protect against morning grogginess by seeking 15 mins of natural sunlight immediately upon waking. Avoid late screen time (>11 PM) and shift heavy dinners earlier.';
  } else {
    chronoProfile = 'Intermediate / Neutral circadian rhythm. Flexible adaptation to morning and afternoon duties.';
    chronoAdvice = 'Anchor your circadian rhythm with consistent breakfast and dinner timings, especially during exam phases.';
  }

  // 3. Chrononutrition Evaluation
  const dietaryRecs: string[] = [];
  let eatingEvaluation = 'Well-synchronized eating window.';
  let breakfastStatus = 'Adequate breakfast habit.';
  let nightRisk = 'Minimal late-night metabolic burden.';
  let metabolicRisk: 'Low' | 'Moderate' | 'High' = 'Low';

  if (participant.breakfast_skipped.includes('3') || participant.breakfast_skipped.includes('5') || participant.breakfast_skipped.toLowerCase().includes('daily')) {
    breakfastStatus = 'Frequent breakfast skipping identified.';
    dietaryRecs.push('Anchor your peripheral liver clocks by having a protein-rich breakfast within 90 minutes of waking.');
    metabolicRisk = 'Moderate';
  }

  if (participant.night_snack.toLowerCase().includes('frequent') || participant.night_snack.toLowerCase().includes('daily') || participant.night_snack.toLowerCase().includes('always')) {
    nightRisk = 'High post-10 PM caloric intake.';
    dietaryRecs.push('Cease caloric intake at least 2.5 hours before bedtime to prevent blunting nocturnal cardiac vagal reactivation.');
    metabolicRisk = 'High';
  } else {
    dietaryRecs.push('Maintain an overnight fasting duration of 11–13 hours to optimize autonomic recovery.');
  }

  // 4. HRV Autonomic Nervous System Assessment
  const rmssd = hrv.rmssd ?? 35;
  const lfHf = hrv.lf_hf_ratio ?? 1.0;
  const restingHr = hrv.resting_heart_rate ?? 75;

  let parasympatheticTone: 'Low / Suppressed' | 'Normal' | 'Enhanced' = 'Normal';
  let sympathovagalBalance: 'Sympathetic Dominance' | 'Balanced Sympathovagal' | 'Vagal Dominance' = 'Balanced Sympathovagal';
  let stressState: 'Elevated Stress' | 'Moderate Stress' | 'Restful / Recovered' = 'Restful / Recovered';
  let ansSummary = '';
  let ansAdvice = '';

  if (rmssd < 25) {
    parasympatheticTone = 'Low / Suppressed';
    ansAdvice = 'Low vagal modulation detected. Prioritize 7+ hours sleep and 5-min slow diaphragmatic breathing (6 breaths/min).';
  } else if (rmssd > 60) {
    parasympatheticTone = 'Enhanced';
    ansAdvice = 'Robust parasympathetic cardiac reserve, characteristic of good aerobic conditioning and recovery.';
  } else {
    parasympatheticTone = 'Normal';
    ansAdvice = 'Balanced resting vagal brake within healthy young adult reference range.';
  }

  if (lfHf > 1.8 || (hrv.sns_index && hrv.sns_index > 1.5)) {
    sympathovagalBalance = 'Sympathetic Dominance';
    stressState = 'Elevated Stress';
    ansSummary = 'Autonomic balance exhibits heightened sympathetic tone / stress reactivity at rest.';
  } else if (lfHf < 0.5) {
    sympathovagalBalance = 'Vagal Dominance';
    stressState = 'Restful / Recovered';
    ansSummary = 'Resting state indicates high parasympathetic predominance and low autonomic arousal.';
  } else {
    sympathovagalBalance = 'Balanced Sympathovagal';
    stressState = 'Restful / Recovered';
    ansSummary = 'Optimal equilibrium between sympathetic activation and parasympathetic recovery.';
  }

  // Combined Key Recommendations
  const keyRecommendations: string[] = [
    ...dietaryRecs,
    `Chronotype Advice: ${chronoAdvice}`,
    `Cardiovascular Recovery: ${ansAdvice}`
  ];

  let overallStatus: 'OPTIMAL' | 'MODERATE_RISK' | 'HIGH_RISK' = 'OPTIMAL';
  if (metabolicRisk === 'High' || stressState === 'Elevated Stress' || bmiRisk === 'High') {
    overallStatus = 'HIGH_RISK';
  } else if (metabolicRisk === 'Moderate' || parasympatheticTone === 'Low / Suppressed' || bmiRisk === 'Elevated') {
    overallStatus = 'MODERATE_RISK';
  }

  // Report Public URL
  const reportUrl = `${portalBaseUrl}/#report-${participant.participant_id}`;

  // Formatted Brief Diagnosis (Single Paragraph)
  const formattedBriefDiagnosis = 
    `ICMR STS 2026 Research Report [${participant.participant_id}]: ` +
    `Circadian Chronotype is ${participant.chronotype_category} (rMEQ: ${participant.rmeq_total_score}/25). ` +
    `Asian-Indian BMI: ${participant.bmi} kg/m² (${bmiCategory}). ` +
    `Resting HR: ${restingHr} bpm with RMSSD of ${rmssd} ms (${parasympatheticTone} vagal tone). ` +
    `Autonomic state reflects ${sympathovagalBalance}. ` +
    `Key Focus: ${keyRecommendations[0]}`;

  // Formatted WhatsApp Message (Markdown formatted for WhatsApp)
  const formattedWhatsAppText = 
`🩺 *ICMR STS 2026 — Research Health & HRV Report*
*Participant ID:* ${participant.participant_id}
*Study:* Meal Timing, Chronotype & HRV in Medical Students

📊 *Your Clinical & Autonomic Summary:*
• *Chronotype:* ${participant.chronotype_category} (${participant.rmeq_total_score}/25)
• *Asian-Indian BMI:* ${participant.bmi} kg/m² (${bmiCategory})
• *Resting Heart Rate:* ${restingHr} bpm
• *Vagal Tone (RMSSD):* ${rmssd} ms (${parasympatheticTone})
• *Autonomic Balance (LF/HF):* ${lfHf} (${sympathovagalBalance})
• *Recovery / Stress State:* ${stressState}

💡 *Personalized Recommendation:*
${keyRecommendations[0]}
${keyRecommendations[1] || ''}

📥 *View & Download Full 2-Page Clinical PDF Dossier:*
${reportUrl}

_Department of Physiology • ICMR STS Research Study_`;

  // Formatted SMS Message (Concise under 160-320 chars)
  const formattedSmsText = 
`ICMR STS 2026 Report [${participant.participant_id}]: Chronotype: ${participant.chronotype_category} | BMI: ${participant.bmi} (${bmiCategory}) | Resting HR: ${restingHr}bpm, RMSSD: ${rmssd}ms (${sympathovagalBalance}). View full PDF dossier: ${reportUrl}`;

  return {
    participantId: participant.participant_id,
    summaryTitle: `Clinical Autonomic & Chronobiology Profile (${overallStatus})`,
    overallStatus,
    bmiAnalysis: {
      category: bmiCategory,
      riskLevel: bmiRisk,
      explanation: `Asian-Indian specific BMI cutoff of ${participant.bmi} kg/m² categorized as ${bmiCategory}.`,
      clinicalAdvice: bmiAdvice
    },
    chronotypeAnalysis: {
      category: participant.chronotype_category,
      score: participant.rmeq_total_score,
      scoreRange: participant.chronotype_category === 'Morning type' ? '18–25 (Morning/Lark)' : participant.chronotype_category === 'Evening type' ? '4–11 (Evening/Owl)' : '12–17 (Intermediate)',
      circadianProfile: chronoProfile,
      academicWorkAdvice: chronoAdvice
    },
    nutritionAnalysis: {
      eatingWindowEvaluation: eatingEvaluation,
      breakfastStatus,
      nightSnackingRisk: nightRisk,
      metabolicRiskScore: metabolicRisk,
      dietaryRecommendations: dietaryRecs
    },
    hrvAnalysis: {
      parasympatheticTone,
      sympathovagalBalance,
      stressState,
      physiologicalSummary: ansSummary,
      cardiacAutonomicAdvice: ansAdvice
    },
    keyRecommendations,
    formattedBriefDiagnosis,
    formattedWhatsAppText,
    formattedSmsText
  };
}
