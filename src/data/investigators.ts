import { generateCanvasRasterSignature } from '../utils/signatureUtils';

// Authentic investigator profiles & signature storage for ICMR STS 2026

export interface InvestigatorProfile {
  id: string;
  name: string;
  role: string;
  designation: string;
  department: string;
  signatureDataUrl?: string;
  lastUpdated?: string;
}

// Initial clean standard baseline signatures for default investigator profiles
export const INITIAL_INVESTIGATOR_TEAM: InvestigatorProfile[] = [
  {
    id: 'PI-HARSH',
    name: 'Harsh Narware',
    role: 'Principal Investigator',
    designation: 'MBBS Student Researcher',
    department: 'Department of Physiology',
    signatureDataUrl: '',
    lastUpdated: 'Initial setup'
  },
  {
    id: 'INV-1',
    name: 'Investigator 1',
    role: 'Co-Investigator (MBBS Research Team)',
    designation: 'Student Co-Investigator 1',
    department: 'Department of Physiology',
    signatureDataUrl: '',
    lastUpdated: 'Initial setup'
  },
  {
    id: 'INV-2',
    name: 'Investigator 2',
    role: 'Co-Investigator (Data Collection Lead)',
    designation: 'Student Co-Investigator 2',
    department: 'Department of Physiology',
    signatureDataUrl: '',
    lastUpdated: 'Initial setup'
  },
  {
    id: 'INV-3',
    name: 'Investigator 3',
    role: 'Co-Investigator (Clinical Assessment)',
    designation: 'Student Co-Investigator 3',
    department: 'Department of Physiology',
    signatureDataUrl: '',
    lastUpdated: 'Initial setup'
  },
];

const LOCAL_STORAGE_SIGS_KEY = 'icmr_sts_2026_investigator_signatures';
const LOCAL_STORAGE_TEAM_KEY = 'icmr_sts_2026_investigator_team';

export function createStandardSignaturePlaceholder(name: string): string {
  return generateCanvasRasterSignature(name, '#1e3a8a');
}

/**
 * Retrieve current investigator signatures from localStorage with fallback
 */
export function getStoredInvestigatorSignatures(): Record<string, string> {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SIGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleansed: Record<string, string> = {};
      Object.entries(parsed).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim().length > 50) {
          cleansed[key] = val;
        }
      });
      if (Object.keys(cleansed).length > 0) {
        if (!cleansed['Harsh Narware']) {
          cleansed['Harsh Narware'] = generateCanvasRasterSignature('Harsh Narware', '#1e3a8a');
        }
        return cleansed;
      }
    }
  } catch (e) {
    console.error('Failed to load investigator signatures from localStorage:', e);
  }

  // Authentic defaults: Generate high-res raster stylus signature
  const defaults: Record<string, string> = {};
  INITIAL_INVESTIGATOR_TEAM.forEach(inv => {
    defaults[inv.name] = inv.signatureDataUrl || generateCanvasRasterSignature(inv.name, '#1e3a8a');
  });
  return defaults;
}

/**
 * Persist an investigator's signature to localStorage
 */
export function saveStoredInvestigatorSignature(name: string, signatureDataUrl: string): void {
  try {
    const current = getStoredInvestigatorSignatures();
    current[name] = signatureDataUrl;
    localStorage.setItem(LOCAL_STORAGE_SIGS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save investigator signature:', e);
  }
}

/**
 * Retrieve investigator team list
 */
export function getStoredInvestigatorTeam(): InvestigatorProfile[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_TEAM_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load investigator team from localStorage:', e);
  }
  return INITIAL_INVESTIGATOR_TEAM;
}

/**
 * Persist investigator team list
 */
export function saveStoredInvestigatorTeam(team: InvestigatorProfile[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TEAM_KEY, JSON.stringify(team));
  } catch (e) {
    console.error('Failed to save investigator team:', e);
  }
}

export const INVESTIGATOR_TEAM = INITIAL_INVESTIGATOR_TEAM;
export const DEFAULT_INVESTIGATOR_SIGNATURES = getStoredInvestigatorSignatures();
