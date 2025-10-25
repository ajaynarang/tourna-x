// Age Group Validation Utilities
export const AGE_GROUP_PRESETS = {
  'U-12': { minAge: 1, maxAge: 12 },
  'U-15': { minAge: 1, maxAge: 15 },
  'U-18': { minAge: 1, maxAge: 18 },
  'U-21': { minAge: 1, maxAge: 21 },
  'U-25': { minAge: 1, maxAge: 25 },
  'U-30': { minAge: 1, maxAge: 30 },
  'U-35': { minAge: 1, maxAge: 35 },
  'U-40': { minAge: 1, maxAge: 40 },
  'U-45': { minAge: 1, maxAge: 45 },
  'U-50': { minAge: 1, maxAge: 50 },
  'Senior': { minAge: 50, maxAge: 100 },
  'Open': { minAge: 1, maxAge: 100 },
} as const;

export type AgeGroupPreset = keyof typeof AGE_GROUP_PRESETS;

// Age group validation functions
export const validateAgeGroupEligibility = (
  participantAge: number,
  ageGroup: { name: string; minAge?: number; maxAge?: number }
): boolean => {
  const { minAge, maxAge } = ageGroup;
  
  if (minAge !== undefined && participantAge < minAge) {
    return false;
  }
  
  if (maxAge !== undefined && participantAge > maxAge) {
    return false;
  }
  
  return true;
};

export const getEligibleAgeGroups = (
  participantAge: number,
  tournamentAgeGroups: Array<{ name: string; minAge?: number; maxAge?: number }>
): Array<{ name: string; minAge?: number; maxAge?: number }> => {
  return tournamentAgeGroups.filter(ageGroup => 
    validateAgeGroupEligibility(participantAge, ageGroup)
  );
};

export const validateMultipleAgeGroupRegistration = (
  selectedAgeGroups: string[],
  tournamentAllowMultiple: boolean,
  tournamentAgeGroups: Array<{ name: string }>
): { isValid: boolean; error?: string } => {
  // Check if tournament allows multiple age group registration
  if (!tournamentAllowMultiple && selectedAgeGroups.length > 1) {
    return {
      isValid: false,
      error: 'This tournament does not allow registration in multiple age groups'
    };
  }
  
  // Check if all selected age groups exist in tournament
  const tournamentAgeGroupNames = tournamentAgeGroups.map(group => group.name);
  const invalidGroups = selectedAgeGroups.filter(group => !tournamentAgeGroupNames.includes(group));
  
  if (invalidGroups.length > 0) {
    return {
      isValid: false,
      error: `Invalid age groups: ${invalidGroups.join(', ')}`
    };
  }
  
  return { isValid: true };
};

export const createAgeGroupFromPreset = (preset: AgeGroupPreset) => {
  const presetData = AGE_GROUP_PRESETS[preset];
  return {
    name: preset,
    minAge: presetData.minAge,
    maxAge: presetData.maxAge,
  };
};