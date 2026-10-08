import { useOutletContext } from 'react-router';
import type { AllergenId, DietaryTag, Severity } from '@/api/schemas';

/** In-progress profile while the student moves through the three steps. */
export interface ProfileDraft {
  /** Selected allergens in the order they were picked, with severity. */
  avoid: { allergen: AllergenId; severity: Severity }[];
  preferences: DietaryTag[];
  otherPreference: string;
  acknowledgedSafetyNotice: boolean;
}

export const EMPTY_DRAFT: ProfileDraft = {
  avoid: [],
  preferences: [],
  otherPreference: '',
  acknowledgedSafetyNotice: false,
};

export interface OnboardingContext {
  draft: ProfileDraft;
  updateDraft: (update: (draft: ProfileDraft) => ProfileDraft) => void;
  /** Where to go when the student finishes or skips. */
  exitTo: string;
}

export function useOnboarding() {
  return useOutletContext<OnboardingContext>();
}
