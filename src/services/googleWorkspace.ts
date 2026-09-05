import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ParticipantRecord } from '../types';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

// In-memory token cache (strictly never stored in localStorage / sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not cached in memory yet, require user interaction to get OAuth access token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token from credential result.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => cachedAccessToken;

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// =========================================================================
// GOOGLE SHEETS API IMPLEMENTATION
// =========================================================================

export interface SheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  updatedRows: number;
}

export const createStudySpreadsheet = async (
  accessToken: string,
  title: string = 'ICMR STS 2026 — Research Study Master Data'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [
        {
          properties: {
            title: 'Participants_Master',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
};

export const exportParticipantsToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  participants: ParticipantRecord[],
  sheetTabName: string = 'Participants_Master'
): Promise<SheetExportResult> => {
  const headers = [
    'STS Participant ID',
    'Full Name',
    'Enrolled Date',
    'Status',
    'Age (yrs)',
    'Gender',
    'Academic Year',
    'Department',
    'Height (cm)',
    'Weight (kg)',
    'BMI (kg/m²)',
    'Breakfast Time',
    'Breakfast Skipped',
    'Dinner Time',
    'Eating Window Duration',
    'Late Night Snacking',
    'rMEQ Chronotype Score',
    'Chronotype Classification',
    'Sleep Duration',
    'Physical Activity',
    'Investigator Name',
    'Participant Signed Date',
    'Investigator Signed Date',
    'HRV Readiness (%)',
    'PNS Index',
    'SNS Index',
    'Resting Heart Rate (bpm)',
    'RMSSD (ms)',
    'SDNN (ms)',
    'LF/HF Ratio',
    'Stress Index',
    'Cryptographic SHA-256 Hash'
  ];

  const rows = participants.map(p => {
    return [
      p.participant_id,
      p.participant_name || 'Anonymous Participant',
      p.enrolled_at ? new Date(p.enrolled_at).toLocaleDateString('en-IN') : '',
      p.status,
      p.age,
      p.gender,
      p.year_of_study || '',
      p.department || '',
      p.height_cm,
      p.weight_kg,
      p.bmi.toFixed(1),
      p.breakfast_time,
      p.breakfast_skipped || 'No',
      p.dinner_time,
      p.eating_duration || '',
      p.night_snack || '',
      p.rmeq_total_score,
      p.chronotype_category,
      p.sleep_duration,
      p.physical_activity,
      p.investigator_name || '',
      p.participant_signed_at || '',
      p.investigator_signed_at || '',
      p.hrv_record ? p.hrv_record.readiness_percentage : '',
      p.hrv_record ? p.hrv_record.pns_index : '',
      p.hrv_record ? p.hrv_record.sns_index : '',
      p.hrv_record ? p.hrv_record.resting_heart_rate : '',
      p.hrv_record ? p.hrv_record.rmssd : '',
      p.hrv_record ? p.hrv_record.sdnn : '',
      p.hrv_record ? p.hrv_record.lf_hf_ratio : '',
      p.hrv_record ? p.hrv_record.stress_index : '',
      p.pdf_sha256 || ''
    ];
  });

  const allValues = [headers, ...rows];

  const range = `${sheetTabName}!A1:AF${allValues.length}`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: range,
        majorDimension: 'ROWS',
        values: allValues
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to update rows in Google Sheet');
  }

  const result = await response.json();
  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    updatedRows: result.updatedRows || allValues.length
  };
};

export const readGoogleSheetData = async (
  accessToken: string,
  spreadsheetId: string,
  range: string = 'Participants_Master!A1:AF100'
): Promise<{ title: string; values: any[][] }> => {
  // First fetch metadata to verify access and get sheet title
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const err = await metaRes.json();
    throw new Error(err.error?.message || 'Failed to access Google Spreadsheet');
  }

  const meta = await metaRes.json();
  const availableSheets = meta.sheets?.map((s: any) => s.properties?.title) || [];
  const targetRange = availableSheets.includes('Participants_Master') ? range : (availableSheets[0] ? `${availableSheets[0]}!A1:AF100` : 'A1:AF100');

  const valRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetRange)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!valRes.ok) {
    const err = await valRes.json();
    throw new Error(err.error?.message || 'Failed to read values from Google Sheet');
  }

  const valData = await valRes.json();
  return {
    title: meta.properties?.title || 'Google Sheet',
    values: valData.values || []
  };
};

// =========================================================================
// GOOGLE FORMS API IMPLEMENTATION
// =========================================================================

export interface CreatedFormResult {
  formId: string;
  formTitle: string;
  responderUri: string;
  editUri: string;
}

export const createIcmrResearchGoogleForm = async (
  accessToken: string,
  title: string = 'ICMR STS 2026: Meal Timing, Chronotype & HRV Questionnaire'
): Promise<CreatedFormResult> => {
  // 1. Create the initial empty form container
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: title,
        documentTitle: 'ICMR STS 2026 Research Questionnaire'
      }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Failed to create Google Form');
  }

  const created = await createRes.json();
  const formId = created.formId;

  // 2. Batch update to inject the standardized ICMR STS research items
  const batchRequests = [
    {
      updateFormInfo: {
        info: {
          description: 'Indian Council of Medical Research (ICMR) STS Project: Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students. Sri Aurobindo Medical College & Postgraduate Institute (SAMC & PGI), Indore.'
        },
        updateMask: 'description'
      }
    },
    {
      createItem: {
        item: {
          title: 'Full Name of Participant',
          description: 'Official name as registered with the institution.',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 0 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Academic Year of Study',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'First MBBS' },
                  { value: 'Second MBBS' },
                  { value: 'Third MBBS (Part 1)' },
                  { value: 'Third MBBS (Part 2)' },
                  { value: 'Intern / CRMI' }
                ]
              }
            }
          }
        },
        location: { index: 1 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Age (in completed years)',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 2 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Gender',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Male' },
                  { value: 'Female' },
                  { value: 'Prefer not to say' }
                ]
              }
            }
          }
        },
        location: { index: 3 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Height (in cm)',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 4 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Weight (in kg)',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 5 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Typical Breakfast Time (e.g., 08:30 AM)',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 6 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Typical Lunch Time (e.g., 01:30 PM)',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 7 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Typical Dinner Time (e.g., 09:00 PM)',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 8 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Gap Between Last Meal / Dinner and Bedtime (Hours)',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Less than 1 hour' },
                  { value: '1 to 2 hours' },
                  { value: '2 to 3 hours' },
                  { value: 'More than 3 hours' }
                ]
              }
            }
          }
        },
        location: { index: 9 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Do you engage in late-night snacking after dinner (>11:00 PM)?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Yes, frequently (3+ nights/week)' },
                  { value: 'Occasionally (1-2 nights/week)' },
                  { value: 'No, rarely or never' }
                ]
              }
            }
          }
        },
        location: { index: 10 }
      }
    },
    {
      createItem: {
        item: {
          title: 'rMEQ Item 1: Considering your own "feeling best" rhythm, what time would you get up if you were entirely free to plan your day?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: '05:00 - 06:30 AM (Score 5)' },
                  { value: '06:30 - 07:45 AM (Score 4)' },
                  { value: '07:45 - 09:45 AM (Score 3)' },
                  { value: '09:45 - 11:00 AM (Score 2)' },
                  { value: '11:00 AM - 12:00 PM (Score 1)' }
                ]
              }
            }
          }
        },
        location: { index: 11 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Average Sleep Duration on College Days',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Under 5 hours' },
                  { value: '5 to 6 hours' },
                  { value: '6 to 7 hours' },
                  { value: '7 to 8 hours' },
                  { value: 'Over 8 hours' }
                ]
              }
            }
          }
        },
        location: { index: 12 }
      }
    }
  ];

  try {
    const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests: batchRequests })
    });

    if (!updateRes.ok) {
      console.warn('Batch update warned:', await updateRes.text());
    }
  } catch (e) {
    console.error('Batch update question insertion failed:', e);
  }

  return {
    formId: formId,
    formTitle: title,
    responderUri: created.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`,
    editUri: `https://docs.google.com/forms/d/${formId}/edit`
  };
};

export const fetchGoogleFormDetails = async (
  accessToken: string,
  formId: string
): Promise<any> => {
  const cleanId = formId.replace(/^.*\/d\/e?\/?/, '').replace(/\/viewform.*|\/edit.*$/, '').trim();
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch Google Form details');
  }

  return await res.json();
};

export const fetchGoogleFormResponses = async (
  accessToken: string,
  formId: string
): Promise<{ responses: any[]; totalResponses: number }> => {
  const cleanId = formId.replace(/^.*\/d\/e?\/?/, '').replace(/\/viewform.*|\/edit.*$/, '').trim();
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch Google Form responses');
  }

  const data = await res.json();
  return {
    responses: data.responses || [],
    totalResponses: (data.responses || []).length
  };
};

export const parseParticipantsFromSheetRows = (values: any[][]): ParticipantRecord[] => {
  if (!values || values.length <= 1) return [];

  const headers = values[0].map(h => String(h || '').trim().toLowerCase());
  const rows = values.slice(1);

  const getColIdx = (aliases: string[]): number => {
    return headers.findIndex(h => aliases.some(alias => h.includes(alias.toLowerCase())));
  };

  const idIdx = getColIdx(['participant id', 'sts participant id', 'id']);
  const nameIdx = getColIdx(['full name', 'name', 'student name']);
  const ageIdx = getColIdx(['age']);
  const genderIdx = getColIdx(['gender', 'sex']);
  const yearIdx = getColIdx(['academic year', 'year of study', 'year']);
  const deptIdx = getColIdx(['department']);
  const heightIdx = getColIdx(['height']);
  const weightIdx = getColIdx(['weight']);
  const bmiIdx = getColIdx(['bmi']);
  const bfIdx = getColIdx(['breakfast time', 'breakfast']);
  const dinnerIdx = getColIdx(['dinner time', 'dinner']);
  const snackIdx = getColIdx(['snack', 'late night']);
  const rmeqIdx = getColIdx(['rmeq', 'chronotype score']);
  const chronoIdx = getColIdx(['chronotype', 'classification']);
  const sleepIdx = getColIdx(['sleep duration', 'sleep']);
  const activityIdx = getColIdx(['physical activity', 'exercise']);
  const statusIdx = getColIdx(['status']);

  return rows.map((row, index) => {
    const rawId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
    const participantId = rawId || `STS-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Participant ${index + 1}`;
    const age = ageIdx !== -1 && Number(row[ageIdx]) ? Number(row[ageIdx]) : 20;
    const gender = genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]) : 'Female';
    const height = heightIdx !== -1 && Number(row[heightIdx]) ? Number(row[heightIdx]) : 165;
    const weight = weightIdx !== -1 && Number(row[weightIdx]) ? Number(row[weightIdx]) : 58;
    const bmiVal = bmiIdx !== -1 && Number(row[bmiIdx]) ? Number(row[bmiIdx]) : (weight / ((height / 100) * (height / 100)));
    const rmeqScore = rmeqIdx !== -1 && Number(row[rmeqIdx]) ? Number(row[rmeqIdx]) : 16;
    
    let chrono: 'Morning type' | 'Intermediate type' | 'Evening type' = 'Intermediate type';
    if (rmeqScore >= 18) chrono = 'Morning type';
    else if (rmeqScore <= 11) chrono = 'Evening type';
    if (chronoIdx !== -1 && row[chronoIdx]) {
      const rawChrono = String(row[chronoIdx]).toLowerCase();
      if (rawChrono.includes('morning')) chrono = 'Morning type';
      else if (rawChrono.includes('evening')) chrono = 'Evening type';
      else if (rawChrono.includes('intermediate')) chrono = 'Intermediate type';
    }

    const record: ParticipantRecord = {
      participant_id: participantId,
      participant_name: name,
      submission_id: `SUB-SHEET-${index + 1}`,
      enrolled_at: new Date().toISOString(),
      status: (statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim() as any : 'PENDING_CONSENT'),
      year_of_study: yearIdx !== -1 && row[yearIdx] ? String(row[yearIdx]) : 'Second MBBS',
      department: deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]) : 'Department of Physiology',
      age: age,
      gender: gender,
      height_cm: height,
      weight_kg: weight,
      bmi: Number(bmiVal.toFixed(1)),
      breakfast_time: bfIdx !== -1 && row[bfIdx] ? String(row[bfIdx]) : '08:30 AM',
      breakfast_skipped: 'No',
      dinner_time: dinnerIdx !== -1 && row[dinnerIdx] ? String(row[dinnerIdx]) : '09:00 PM',
      night_snack: snackIdx !== -1 && row[snackIdx] ? String(row[snackIdx]) : 'No',
      eating_duration: '12 hours',
      regular_timings: 'Regular',
      rmeq_total_score: rmeqScore,
      chronotype_category: chrono,
      sleep_duration: sleepIdx !== -1 && row[sleepIdx] ? String(row[sleepIdx]) : '7 hours',
      caffeine_frequency: '1-2 cups/day',
      physical_activity: activityIdx !== -1 && row[activityIdx] ? String(row[activityIdx]) : 'Moderate',
      investigator_name: 'Harsh Narware',
      investigator_role: 'ICMR-STS Student Researcher'
    };
    return record;
  });
};

export const convertGoogleFormResponsesToParticipants = (
  formDetails: any,
  responses: any[]
): ParticipantRecord[] => {
  if (!responses || responses.length === 0) return [];

  // Build question title lookup from formDetails.items
  const questionMap: { [questionId: string]: string } = {};
  if (formDetails?.items) {
    formDetails.items.forEach((item: any) => {
      const qId = item.questionItem?.question?.questionId;
      if (qId && item.title) {
        questionMap[qId] = item.title.toLowerCase();
      }
    });
  }

  return responses.map((res: any, idx: number) => {
    const answers = res.answers || {};
    let name = '';
    let age = 20;
    let gender = 'Female';
    let year = 'Second MBBS';
    let height = 165;
    let weight = 58;
    let breakfast = '08:30 AM';
    let dinner = '09:00 PM';
    let snack = 'No';
    let sleepDur = '7 hours';
    let rmeqScore = 16;

    // Scan answers
    Object.keys(answers).forEach(qId => {
      const title = questionMap[qId] || '';
      const textVal = answers[qId]?.textAnswers?.answers?.[0]?.value || '';

      if (title.includes('name') || !name) {
        if (title.includes('name')) name = textVal;
      }
      if (title.includes('age')) {
        const parsed = parseInt(textVal);
        if (!isNaN(parsed)) age = parsed;
      }
      if (title.includes('gender')) gender = textVal;
      if (title.includes('year') || title.includes('academic')) year = textVal;
      if (title.includes('height')) {
        const parsed = parseFloat(textVal);
        if (!isNaN(parsed)) height = parsed;
      }
      if (title.includes('weight')) {
        const parsed = parseFloat(textVal);
        if (!isNaN(parsed)) weight = parsed;
      }
      if (title.includes('breakfast')) breakfast = textVal;
      if (title.includes('dinner')) dinner = textVal;
      if (title.includes('snack') || title.includes('late-night')) snack = textVal;
      if (title.includes('sleep')) sleepDur = textVal;
      if (title.includes('rmeq') || title.includes('get up')) {
        if (textVal.includes('Score 5') || textVal.includes('05:00')) rmeqScore = 20;
        else if (textVal.includes('Score 4') || textVal.includes('06:30')) rmeqScore = 17;
        else if (textVal.includes('Score 3') || textVal.includes('07:45')) rmeqScore = 15;
        else if (textVal.includes('Score 2') || textVal.includes('09:45')) rmeqScore = 10;
        else if (textVal.includes('Score 1') || textVal.includes('11:00')) rmeqScore = 8;
      }
    });

    const participantId = `STS-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const bmiVal = Number((weight / ((height / 100) * (height / 100))).toFixed(1));

    let chrono: 'Morning type' | 'Intermediate type' | 'Evening type' = 'Intermediate type';
    if (rmeqScore >= 18) chrono = 'Morning type';
    else if (rmeqScore <= 11) chrono = 'Evening type';

    return {
      participant_id: participantId,
      participant_name: name || res.respondentEmail?.split('@')[0] || `Student Respondent ${idx + 1}`,
      submission_id: `FORM-${(res.responseId || idx).toString().substring(0, 10)}`,
      enrolled_at: res.createTime || new Date().toISOString(),
      status: 'PENDING_CONSENT',
      year_of_study: year,
      department: 'Department of Physiology',
      age,
      gender,
      height_cm: height,
      weight_kg: weight,
      bmi: bmiVal,
      breakfast_time: breakfast,
      breakfast_skipped: 'No',
      dinner_time: dinner,
      night_snack: snack,
      eating_duration: '12 hours',
      regular_timings: 'Regular',
      rmeq_total_score: rmeqScore,
      chronotype_category: chrono,
      sleep_duration: sleepDur,
      caffeine_frequency: '1 cup/day',
      physical_activity: 'Moderate',
      investigator_name: 'Harsh Narware',
      investigator_role: 'ICMR-STS Student Researcher'
    };
  });
};

