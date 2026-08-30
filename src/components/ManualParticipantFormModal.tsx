import React, { useState } from 'react';
import { X, CheckCircle, Calculator, UserPlus, Sparkles, FileText, Clock, Moon, Sun, AlertTriangle } from 'lucide-react';
import { ParticipantRecord } from '../types';
import { generateParticipantId } from '../phase1/crypto';

interface ManualParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParticipantCreated: (participant: ParticipantRecord) => void;
}

export const ManualParticipantFormModal: React.FC<ManualParticipantFormModalProps> = ({
  isOpen,
  onClose,
  onParticipantCreated,
}) => {
  // Form State
  const [yearOfStudy, setYearOfStudy] = useState('Second MBBS');
  const [department, setDepartment] = useState('Department of Physiology');
  const [age, setAge] = useState<number>(20);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(65);

  // Meal Timings
  const [breakfastTime, setBreakfastTime] = useState('8:00 AM – 9:00 AM');
  const [breakfastSkipped, setBreakfastSkipped] = useState('0–1 days / week');
  const [dinnerTime, setDinnerTime] = useState('8:30 PM – 9:30 PM');
  const [nightSnack, setNightSnack] = useState('Never / Rarely');
  const [eatingDuration, setEatingDuration] = useState('11.5 hours');
  const [regularTimings, setRegularTimings] = useState('Regular on most days');

  // rMEQ 5 Items
  const [rmeqQ1, setRmeqQ1] = useState<number>(4); // Wake up time (1-5)
  const [rmeqQ2, setRmeqQ2] = useState<number>(3); // Morning tiredness (1-4)
  const [rmeqQ3, setRmeqQ3] = useState<number>(3); // Evening tiredness (1-5)
  const [rmeqQ4, setRmeqQ4] = useState<number>(3); // Peak performance time (1-5)
  const [rmeqQ5, setRmeqQ5] = useState<number>(4); // Self-assessment (0, 2, 4, 6)

  // Sleep & Lifestyle
  const [sleepDuration, setSleepDuration] = useState('7.0 hours / night');
  const [caffeineFrequency, setCaffeineFrequency] = useState('1 cup / day (Morning)');
  const [physicalActivity, setPhysicalActivity] = useState('Moderate (150 min/wk)');

  if (!isOpen) return null;

  // Real-time BMI calculation (Asian-Indian Cutoffs)
  const heightMeters = heightCm > 0 ? heightCm / 100 : 1;
  const bmiCalculated = Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-600 bg-amber-50' };
    if (bmi <= 22.9) return { label: 'Normal (Asian-Indian)', color: 'text-emerald-700 bg-emerald-50' };
    if (bmi <= 24.9) return { label: 'Overweight', color: 'text-orange-700 bg-orange-50' };
    return { label: 'Obese (Asian-Indian)', color: 'text-red-700 bg-red-50' };
  };
  const bmiCat = getBmiCategory(bmiCalculated);

  // Real-time rMEQ Score calculation
  const rmeqTotal = rmeqQ1 + rmeqQ2 + rmeqQ3 + rmeqQ4 + rmeqQ5;
  const getChronotype = (score: number): 'Morning type' | 'Intermediate type' | 'Evening type' => {
    if (score >= 18) return 'Morning type';
    if (score >= 12) return 'Intermediate type';
    return 'Evening type';
  };
  const chronotype = getChronotype(rmeqTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = generateParticipantId('2026');
    const submissionId = `SUB-MANUAL-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const enrolledAt = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} IST`;

    const newRecord: ParticipantRecord = {
      participant_id: newId,
      submission_id: submissionId,
      enrolled_at: enrolledAt,
      status: 'PENDING_CONSENT',
      year_of_study: yearOfStudy,
      department: department,
      age: Number(age),
      gender: gender,
      height_cm: Number(heightCm),
      weight_kg: Number(weightKg),
      bmi: bmiCalculated,
      breakfast_time: breakfastTime,
      breakfast_skipped: breakfastSkipped,
      dinner_time: dinnerTime,
      night_snack: nightSnack,
      eating_duration: eatingDuration,
      regular_timings: regularTimings,
      rmeq_total_score: rmeqTotal,
      chronotype_category: chronotype,
      sleep_duration: sleepDuration,
      caffeine_frequency: caffeineFrequency,
      physical_activity: physicalActivity,
    };

    onParticipantCreated(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Direct Participant Questionnaire (Offline Backup Mode)</h3>
              <p className="text-xs text-slate-400">
                Direct Case Record Form entry when Google Form is inaccessible or for fast in-person intake.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
          
          {/* Notice Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 text-blue-900">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Dual Storage & Sync:</span> Submitting this questionnaire instantly mints an official <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">STS-2026-XXXXXX</code> cryptographic ID, queues it on the dashboard, and prepares it for 2-way Google Sheets write-back.
            </div>
          </div>

          {/* Section A: Socio-demographic & Anthropometry */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">A</span>
                Section A: Socio-demographics & Asian-Indian Anthropometry
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Year of Study</label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="First MBBS">First MBBS</option>
                  <option value="Second MBBS">Second MBBS</option>
                  <option value="Third MBBS (Part 1)">Third MBBS (Part 1)</option>
                  <option value="Third MBBS (Part 2)">Third MBBS (Part 2)</option>
                  <option value="Intern / House Surgeon">Intern / House Surgeon</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Age (Years)</label>
                <input
                  type="number"
                  min="17"
                  max="35"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Height, Weight & Live BMI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="100"
                  max="230"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                  required
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-slate-500 font-semibold mb-0.5 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" /> Auto Asian-Indian BMI:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">{bmiCalculated} kg/m²</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bmiCat.color}`}>
                    {bmiCat.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Chrononutrition & Meal Timing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">B</span>
                Section B: Chrononutrition & Meal Timings
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Usual Breakfast Time</label>
                <input
                  type="text"
                  value={breakfastTime}
                  onChange={(e) => setBreakfastTime(e.target.value)}
                  placeholder="e.g. 8:00 AM – 9:00 AM"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Breakfast Skipping Frequency</label>
                <select
                  value={breakfastSkipped}
                  onChange={(e) => setBreakfastSkipped(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                >
                  <option value="0 days / week (Never)">0 days / week (Never)</option>
                  <option value="0–1 days / week">0–1 days / week</option>
                  <option value="2–3 days / week">2–3 days / week</option>
                  <option value="4–5 days / week">4–5 days / week</option>
                  <option value="Daily (Skipper)">Daily (Skipper)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Usual Dinner Time</label>
                <input
                  type="text"
                  value={dinnerTime}
                  onChange={(e) => setDinnerTime(e.target.value)}
                  placeholder="e.g. 8:30 PM – 9:30 PM"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Late Night Snacking (post 10 PM)</label>
                <select
                  value={nightSnack}
                  onChange={(e) => setNightSnack(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                >
                  <option value="Never / Rarely">Never / Rarely</option>
                  <option value="1–2 days / week">1–2 days / week</option>
                  <option value="Frequently (3+ days/wk)">Frequently (3+ days/wk)</option>
                  <option value="Every night">Every night</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Daily Eating Window Duration</label>
                <input
                  type="text"
                  value={eatingDuration}
                  onChange={(e) => setEatingDuration(e.target.value)}
                  placeholder="e.g. 11.5 hours"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Meal Timing Regularity</label>
                <select
                  value={regularTimings}
                  onChange={(e) => setRegularTimings(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                >
                  <option value="Always regular">Always regular</option>
                  <option value="Regular on most days">Regular on most days</option>
                  <option value="Irregular on weekends">Irregular on weekends</option>
                  <option value="Highly Irregular">Highly Irregular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section C: Reduced Morningness-Eveningness Questionnaire (rMEQ) */}
          <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div>
                <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">C</span>
                  Section C: Reduced Morningness-Eveningness Questionnaire (rMEQ)
                </h4>
                <p className="text-[11px] text-amber-800">5-item standardized circadian scoring (Sum: 4–25 pts).</p>
              </div>

              {/* Real-time rMEQ Score & Chronotype Badge */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm">
                <span className="font-bold text-slate-700">rMEQ Score: <b className="text-amber-800 text-sm">{rmeqTotal}</b>/25</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  chronotype === 'Morning type' ? 'bg-amber-100 text-amber-900' :
                  chronotype === 'Evening type' ? 'bg-indigo-100 text-indigo-900' :
                  'bg-blue-100 text-blue-900'
                }`}>
                  {chronotype}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Q1 */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  1. Considering only your own "feeling best" rhythm, at what time would you get up if you were entirely free to plan your day?
                </label>
                <select
                  value={rmeqQ1}
                  onChange={(e) => setRmeqQ1(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value={5}>5:00 AM – 6:30 AM (Score 5)</option>
                  <option value={4}>6:30 AM – 7:45 AM (Score 4)</option>
                  <option value={3}>7:45 AM – 9:45 AM (Score 3)</option>
                  <option value={2}>9:45 AM – 11:00 AM (Score 2)</option>
                  <option value={1}>11:00 AM – 12:00 PM (Score 1)</option>
                </select>
              </div>

              {/* Q2 */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  2. During the first half hour after having woken in the morning, how tired do you feel?
                </label>
                <select
                  value={rmeqQ2}
                  onChange={(e) => setRmeqQ2(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value={1}>Very tired (Score 1)</option>
                  <option value={2}>Fairly tired (Score 2)</option>
                  <option value={3}>Fairly refreshed (Score 3)</option>
                  <option value={4}>Very refreshed (Score 4)</option>
                </select>
              </div>

              {/* Q3 */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  3. At what time in the evening do you feel tired and, as a result, in need of sleep?
                </label>
                <select
                  value={rmeqQ3}
                  onChange={(e) => setRmeqQ3(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value={5}>8:00 PM – 9:00 PM (Score 5)</option>
                  <option value={4}>9:00 PM – 10:15 PM (Score 4)</option>
                  <option value={3}>10:15 PM – 12:30 AM (Score 3)</option>
                  <option value={2}>12:30 AM – 1:45 AM (Score 2)</option>
                  <option value={1}>1:45 AM – 3:00 AM (Score 1)</option>
                </select>
              </div>

              {/* Q4 */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  4. At what time of the day do you think you reach your "feeling best" peak?
                </label>
                <select
                  value={rmeqQ4}
                  onChange={(e) => setRmeqQ4(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value={5}>5:00 AM – 8:00 AM (Score 5)</option>
                  <option value={4}>8:00 AM – 10:00 AM (Score 4)</option>
                  <option value={3}>10:00 AM – 5:00 PM (Score 3)</option>
                  <option value={2}>5:00 PM – 10:00 PM (Score 2)</option>
                  <option value={1}>10:00 PM – 5:00 AM (Score 1)</option>
                </select>
              </div>

              {/* Q5 */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  5. One hears about "morning" and "evening" types of people. Which one of these types do you consider yourself to be?
                </label>
                <select
                  value={rmeqQ5}
                  onChange={(e) => setRmeqQ5(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value={6}>Definitely a "morning" type (Score 6)</option>
                  <option value={4}>Rather more a "morning" than an "evening" type (Score 4)</option>
                  <option value={2}>Rather more an "evening" than a "morning" type (Score 2)</option>
                  <option value={0}>Definitely an "evening" type (Score 0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section D & E: Sleep & Confounders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">D/E</span>
                Section D & E: Sleep & Lifestyle Confounders
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sleep Duration</label>
                <input
                  type="text"
                  value={sleepDuration}
                  onChange={(e) => setSleepDuration(e.target.value)}
                  placeholder="e.g. 7.0 hours / night"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Caffeine Frequency</label>
                <input
                  type="text"
                  value={caffeineFrequency}
                  onChange={(e) => setCaffeineFrequency(e.target.value)}
                  placeholder="e.g. 1 cup / day (Morning)"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Physical Activity</label>
                <input
                  type="text"
                  value={physicalActivity}
                  onChange={(e) => setPhysicalActivity(e.target.value)}
                  placeholder="e.g. Moderate (150 min/wk)"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Create Participant & Enqueue CRF</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
