
import { TutorialStep } from '../types';

export const TUTORIAL_STEPS: Record<number, TutorialStep> = {
    0: { id: 0, title: "Basic Navigation", message: "Use ARROW KEYS to pilot the chassis.\nTest your maneuvering thrusters in 3 directions.", position: "top", highlight: 'snake' },
    1: { id: 1, title: "Acquire Matter", message: "Collect BLUE items (Alpha Matter) to expand your hull integrity.", position: "bottom", highlight: 'alpha' },
    2: { id: 2, title: "Unstable Growth", message: "Growth Detected.\n\nYou have added an EMPTY segment. Your hull is now UNSTABLE (Not Charged).\n\nWARNING: While unstable, colliding with incompatible matter is LETHAL.", position: "center", highlight: 'snake' },
    3: { id: 3, title: "Stabilization", message: "To stabilize, you must fill the empty segment with MATCHING matter.\n\nCollect the matching shape (Blue Circle) to restore integrity.", position: "bottom", highlight: 'alpha' },
    4: { id: 4, title: "Sequence Goal", message: "Target Stabilized.\n\nObserve the SEQUENCE goal (Top Center-Left). You must acquire matter in this specific order to decrypt the Slipgate.", position: "center", highlight: 'hud_sequence' },
    5: { id: 5, title: "Integrity Goal", message: "Observe the INTEGRITY goal (Top Center-Right). You need a minimum body length to power the Slipgate.", position: "center", highlight: 'hud_integrity' },
    6: { id: 6, title: "Slipgate Active", message: "Integrity Threshold met. Sequence Matched.\n\nNavigate to the GREEN PORTAL to exit sector.", position: "bottom", highlight: 'portal' },
    7: { id: 7, title: "Threat Detected", message: "Avoid RED TRAPS and WALLS. Collision is lethal.\n\nCollect COINS for upgrades.", position: "top", highlight: 'trap' }
};

export const HP_TUTORIAL_STEP: TutorialStep = {
    id: 99, title: "Hull Damage", message: "Charged segments act as HP. Taking damage destroys a segment. If you run out of segments, CRITICAL FAILURE occurs.", position: "center", highlight: 'snake'
};

export const WRONG_MATTER_STEP: TutorialStep = {
    id: 97, title: "CRITICAL ALERT", message: "Incompatible matter detected.\n\nOnly collect items that match the requested shape/color to fill an empty segment.", position: "center", highlight: 'snake'
};

export const HAZARD_DEATH_STEP: TutorialStep = {
    id: 98, title: "SYSTEM RESET", message: "Collision detected. Simulation reset.\n\nAVOID RED HAZARDS.", position: "center", highlight: 'snake'
};

export const SUMMARY_STEP: TutorialStep = {
    id: 100, title: "Tutorial Complete", message: "SYSTEM READY.\n\nREMEMBER:\n- Empty Segments are Vulnerable.\n- Fill them with MATCHING items.\n- Follow the SEQUENCE.\n- RED is DEADLY.", position: "center"
};
