// Municipality Waste Sorting Policy Engine
// Configurable locally and over Vercel Edge Config (Free Tier)

export type Municipality = "seattle" | "bellevue" | "uw_campus";

export interface MunicipalityRules {
  id: Municipality;
  name: string;
  tagline: string;
  badgeColor: string;
  keyPolicies: {
    plasticBags: string;
    styrofoam: string;
    foodSoiledPaper: string;
    coffeeCups: string;
  };
  overrideNotice?: string;
}

export const MUNICIPALITIES: Record<Municipality, MunicipalityRules> = {
  seattle: {
    id: "seattle",
    name: "Seattle (SPU)",
    tagline: "Seattle Public Utilities Curbside Rules",
    badgeColor: "emerald",
    keyPolicies: {
      plasticBags: "Trash only (tangles sorting machinery at Republic Services)",
      styrofoam: "Trash only (never curbside recycling)",
      foodSoiledPaper: "Compost (greasy pizza boxes, paper towels, napkins)",
      coffeeCups: "Compost paper cup, trash plastic lid (unless compostable lid)",
    },
  },
  bellevue: {
    id: "bellevue",
    name: "Bellevue (Waste Management)",
    tagline: "City of Bellevue Waste Management Guidelines",
    badgeColor: "blue",
    keyPolicies: {
      plasticBags: "Drop-off bins at grocery stores only, otherwise Trash",
      styrofoam: "Trash only (special drop-off events available)",
      foodSoiledPaper: "Compost in green organics bin",
      coffeeCups: "Paper cups to compost, plastic lids to trash",
    },
  },
  uw_campus: {
    id: "uw_campus",
    name: "UW Campus (Seattle)",
    tagline: "University of Washington Sustainability & Campus Dining",
    badgeColor: "purple",
    keyPolicies: {
      plasticBags: "Trash (unless returning clean grocery bags to campus hub)",
      styrofoam: "Trash (campus dining is 100% styrofoam-free)",
      foodSoiledPaper: "Compost (all Housing & Food Services napkins/clamshells)",
      coffeeCups: "Campus cafe hot cups are 100% compostable with BPI sleeve",
    },
  },
};

const STORAGE_KEY = "onebin_selected_municipality";

export function getSelectedMunicipality(): Municipality {
  if (typeof window === "undefined") return "seattle";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Municipality | null;
    if (saved && MUNICIPALITIES[saved]) return saved;
  } catch {
    // fallback
  }
  return "seattle";
}

export function setSelectedMunicipality(mun: Municipality): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, mun);
    } catch {
      // ignore
    }
  }
}
