

export type ThemeMode = 'vintage' | 'dnd';

export interface Point {
  x: number;
  y: number;
}

export type ItemType = 'alpha' | 'beta' | 'gamma';
export type SpecialItemType = 'stasis_orb' | 'shield' | 'chronos_anchor' | 'omega_particle';

export interface Segment extends Point {
  id: string;
  isCharged: boolean; // True = Filled, False = Empty
  type: 'head' | 'body';
  variant?: ItemType; // The shape/color source of this segment
  isSequencePart?: boolean; // Visual flag for pink rendering
  createdAt?: number; // Timestamp of creation (for Rapid Decay)
}

export type EnemyType = 'static' | 'chaser' | 'patrol' | 'wanderer' | 'boss' | 'ghost' | 'replicator' | 'splitter';

export interface Enemy extends Point {
  id: string;
  type: EnemyType;
  color: string;
  moveSpeed: number; // Ticks per move (lower is faster, 0 is static)
  currentTick: number; // Accumulator for movement
  dir: Point; // Current movement direction
  frozen?: boolean; // For stasis
  trail: Point[]; // History of last positions for visual trails
  spawnedAt?: number; // For Replicator cooldown
  life?: number; // For Splitter generations or health
}

export type BossType = 'cipher' | 'timekeeper' | 'colossus' | 'rival';

export interface Boss extends Point {
  id: string;
  name: string;
  type: BossType;
  hp: number;
  maxHp: number;
  phase: number;
  width: number;
  height: number;
  lastMove: number; // Timestamp of last movement
  // Cipher Data
  requiredSequence?: ItemType[];
  // Rival Data
  rivalScore?: number;
  // Timekeeper Data
  nextSpawnTime?: number;
}

export interface Pickup extends Point {
  id: string;
  itemType: ItemType | SpecialItemType;
  expiresAt?: number; // For Timekeeper mechanics
}

export interface Coin extends Point {
  id: string;
  value: number;
}

export interface Particle extends Point {
  id: string;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface Wall extends Point {
  width: number;
  height: number;
  type?: 'wall' | 'trap' | 'gate'; // trap = kills, gate = teleports
  gateClusterId?: number; // ID for linking grouped gates
  targetClusterId?: number; // ID of the destination gate group (for auto-pairs)
  gateChannel?: number; // -1 for Auto (G), 0-9 for Manual Channels
}

export type UpgradeType =
  | 'battery' | 'wireless' | 'chassis' | 'agility'
  | 'volatile' | 'phase' | 'weaver'
  | 'magnet' | 'greed' | 'stasis' | 'stabilizer' | 'focus'
  | 'harvester_alpha' | 'velocity_sync' | 'integrity_echo' | 'replicator';

export type ModifierType =
  | 'speed_boost' | 'extra_enemy' | 'extra_sequence' | 'extra_integrity' | 'enemy_speed' | 'portal_traps'
  | 'magnetic_wall' | 'sequence_corruption' | 'trap_migration' | 'flickering_matter'
  | 'rapid_decay' | 'enemy_replication' | 'head_trauma' | 'credit_scramble';

export interface DifficultyModifier {
  type: ModifierType;
  name?: string; // Display name for the anomaly
  description: string;
  data?: any; // Store specific details like 'chaser' or 'alpha'
}

export interface Upgrade {
  id: string;
  name: string;
  description: string; // Base description
  type: UpgradeType;
  level: number;
  maxLevel: number;
  value: number; // Base value (e.g., 1 shield, 20% slow)
  valuePerLevel: number; // Increment per level
  isBinary?: boolean; // If true, maxLevel is 1
  difficultyModifier?: DifficultyModifier; // The curse attached to this card
}

export interface GameStats {
  alphaChain: number;
  betaCount: number;
  gammaCount: number;
}

export interface GameBuffs {
  invulnerableUntil: number;
  stasisUntil: number;
  currentShields: number; // Decoupled from upgrade level
  velocitySyncActiveUntil: number;
  velocitySyncCooldownUntil: number;
  dashActiveUntil: number;
  dashCooldownUntil: number;
}

export interface ShopState {
  choices: Upgrade[];
  freePickAvailable: boolean;
}

export interface LevelData {
  id: number;
  name?: string;
  integrity: number;
  sequence: ItemType[];
  layout: string[]; // The ASCII Matrix
  enemyCountBonus: number; // Extra random enemies to spawn on top of map placements
  enemyTypes: EnemyType[]; // Pool for random spawns
  tickRate: number; // MS per tick (lower is faster)
}

export interface ParsedLevel {
  walls: Wall[];
  enemies: Enemy[];
  config: LevelData;
}

// VFX EVENT SYSTEM
export type VfxType = 'explosion' | 'pickup' | 'impact' | 'heal' | 'fill' | 'emp' | 'shield_break' | 'text_float';
export interface VfxEvent {
  type: VfxType;
  x: number;
  y: number;
  color?: string;
}

export interface GameTickResult {
  newState: GameState;
  shouldTriggerHpTutorial: boolean;
  nextTutorialStep: number;
  tutorialError?: number;
  resetInput?: boolean;
  forcedDirection?: Point;
  vfxEvents: VfxEvent[]; // New: Return events instead of processing particles in state
}

export type TutorialHighlightType = 'snake' | 'alpha' | 'beta' | 'gamma' | 'enemy' | 'portal' | 'hud_goals' | 'hud_hp' | 'trap' | 'coin' | 'hud_sequence' | 'hud_integrity';

export interface TutorialStep {
  id: number;
  title: string;
  message: string;
  position: 'center' | 'top' | 'bottom';
  highlight?: TutorialHighlightType;
}

export interface EvasionState {
  playerX: number; // Column 0-39
  obstacles: { x: number, y: number, width: number, height: number }[];
  coins: Point[];
  timer: number; // ms remaining (starts at 20000)
  spawnTimer: number; // ms until next row
  gridOffset: number; // visual scroll
  coinsCollected: number; // Track session winnings
}

export interface GameState {
  snake: Segment[];
  enemies: Enemy[];
  pickups: Pickup[];
  coins: Coin[];
  particles: Particle[]; // Deprecated, kept for compat, always empty
  walls: Wall[];
  portal?: Point & { createdAt: number }; // Added createdAt for VFX
  secretPortal?: Point & { createdAt: number }; // Evasion Protocol Entry
  boss?: Boss; // Active boss encounter
  score: number;
  highScore: number;
  currency: number;
  status: 'title' | 'levelselect' | 'collection' | 'credits' | 'settings' | 'menu' | 'playing' | 'gameover' | 'levelup' | 'countdown' | 'paused' | 'editor' | 'tutorial' | 'tutorial_summary' | 'evasion' | 'evasion_reward' | 'evasion_fail' | 'evasion_tutorial';
  level: number;
  targetIntegrity: number;
  activeUpgrades: Upgrade[];
  activeModifiers: DifficultyModifier[]; // Active curses
  gameOverReason?: string;
  gameOverTimestamp?: number; // Time when game over occurred for VFX sequencing
  pendingType: ItemType | null; // The type we are currently looking for to fill the segment
  stats: GameStats;
  buffs: GameBuffs;
  requiredSequence: ItemType[];
  shop: ShopState;
  tickRate: number; // Current level speed
  activeLevelConfig?: LevelData; // Stores the current level config for restarts (especially important for testing)
  isTesting?: boolean; // Flag if we are in editor test mode
  lastTrapMoveTime?: number; // Timestamp for Trap Migration anomaly
  evasionLevel: number; // Difficulty tracker for minigame
  evasionState?: EvasionState; // Active minigame state

  // Experimentation Properties
  comboMeter: number;
  adrenalineMult: number;
  shakeMagnitude: number;
}

export const GRID_SIZE = 30;
export const BOARD_WIDTH_CELLS = 40;
export const BOARD_HEIGHT_CELLS = 30;
