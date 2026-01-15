# NEON OUROBOROS // GAME DESIGN DOCUMENT

## 1. GAME OVERVIEW
**Title:** Neon Ouroboros  
**Genre:** Tactical Snake / Puzzle Action / Roguelite  
**Visual Style:** Retro-Futuristic, Cyberpunk, CRT Terminal aesthetic.  
**Core Concept:** A snake game where growing is dangerous. You build your chassis (snake body) to solve a sequence puzzle while avoiding enemies. An empty chassis segment is vulnerable; a charged one is armor.

---

## 2. CORE GAMEPLAY LOOP

### Phase 1: Infiltration (The Level)
1.  **Spawn:** Player spawns in a safe location.
2.  **Acquire Matter:** Collect **Alpha**, **Beta**, or **Gamma** pickups.
    *   *Effect:* Adds an **Empty Segment** to the tail.
    *   *Risk:* Empty segments are fragile. Collecting the *wrong* type while having an empty segment causes damage or death.
3.  **Stabilize (Charge):** Collect the specific item type that matches your Empty Segment to **Charge** it.
    *   *Effect:* Segment becomes solid/charged. It now acts as HP (Hull Integrity).
4.  **Sequence Matching:** Observe the **Sequence Goal** (e.g., Circle -> Square).
    *   You must build your body segments in that specific order.
5.  **Integrity Threshold:** You must reach a minimum body length (e.g., 5 segments).
6.  **Escape:** Once **Integrity** is met AND **Sequence** matches, the **Slipgate (Portal)** opens. Enter it to win.

### Phase 2: System Upgrade (The Shop)
*   Between levels, spend **Credits** (collected Coins) to buy Modules (Upgrades).
*   Choose between 3 random cards.
*   Cards may contain **Anomalies** (Difficulty Modifiers) attached to them (e.g., "Get this upgrade, but enemies move 5% faster").

---

## 3. MECHANICS & SYSTEMS

### The Snake (Chassis)
*   **Movement:** Grid-based, continuous movement.
*   **Health:** Your charged body segments are your HP. Taking damage destroys the last charged segment.
*   **Death Conditions:**
    1.  Head hits a Wall (unless Shielded/Stabilized).
    2.  Head hits a Trap (Lethal).
    3.  Head hits Self.
    4.  Head hits Enemy while unshielded and 0 segments remaining.
    5.  Collecting "Incompatible Matter" (Wrong item for empty segment).

### Matter Types
*   **Alpha (Circle):** Blue Circle.
*   **Beta (Square):** Blue Square.
*   **Gamma (Diamond):** Blue Diamond.

### Special Combos (Passive Upgrades)
If specific upgrades are acquired, collecting 3 of a kind triggers an effect:
*   **3x Alpha (Phase Shift):** Grants temporary Invulnerability.
*   **3x Beta (Volatile Core):** Triggers an EMP, destroying all enemies.
*   **3x Gamma (Matter Weaver):** Repairs/Fills an empty segment instantly.

### Enemies
1.  **Static Node (S):** Stationary. Acts as a hazard.
2.  **Patrol Drone (P):** Moves in a straight line or loop. Predictable.
3.  **Drifter (W):** Moves randomly. Harder to predict.
4.  **Hunter-Killer (C):** Actively chases the player using pathfinding.

### Items & Pickups
*   **Coins:** Currency for the shop.
*   **Stasis Orb (Gold):** Freezes all enemies for a duration.
*   **Shield (Green):** Adds a temporary shield layer (blocks 1 hit).

---

## 4. UPGRADES (MODULES)

### Scalable Modules (Levels 1-5)
| Name | Effect |
| :--- | :--- |
| **Reserve Power (Battery)** | Start every level with +1 pre-charged segment. |
| **Harmonic Resonance (Wireless)** | Matching an item fills +1 extra empty segment at once. |
| **Shield Generator (Chassis)** | Increases Max Shield capacity. |
| **Nano Thrusters (Agility)** | Increases duration of Invulnerability frames. |
| **Attractor Beam (Magnet)** | Pulls nearby Coins towards the player. |
| **Data Miner (Greed)** | Increases Score multiplier. |
| **Stasis Field (Stasis)** | Spawns Stasis Orbs. Increases freeze duration. |

### Binary Modules (One-time Install)
| Name | Effect |
| :--- | :--- |
| **Volatile Core** | Collect 3 Beta to EMP enemies. |
| **Phase Shift** | Collect 3 Alpha for Invulnerability. |
| **Matter Weaver** | Collect 3 Gamma to Repair Hull. |
| **Hull Stabilizer** | Wall impacts are non-lethal (destroy charge instead). |
| **Targeting System (Focus)** | visual guide arrow pointing to the next required item. |

---

## 5. DIFFICULTY PROGRESSION
*   **Natural Speed:** Game speed increases by **3% compounded** every level.
*   **Endless Mode:**
    *   Generates procedural maps.
    *   Increases **Target Integrity** (Snake length required).
    *   Increases **Enemy Count**.
    *   Introduces smarter enemies (Chasers) at higher sectors.

### Anomalies (Curses)
Upgrades in the shop may come with attached downsides:
*   **Speed Boost:** Game runs 10% faster.
*   **Extra Enemy:** Spawns an additional enemy type.
*   **Portal Trap:** The exit portal is guarded by trap walls.
*   **Extra Integrity:** Requires longer snake to exit.

---

## 6. CONTROLS
*   **Arrow Keys:** Move Chassis.
*   **Escape / Enter:** Pause Game.
*   **UI:** Mouse interaction for Menus and Shop.

---

## 7. VISUALS & AUDIO
*   **CRT Shader:** Scanlines, chromatic aberration, and vignette to simulate a retro terminal.
*   **Dynamic Audio:**
    *   Step-sequencer music system that layers tracks based on game state.
    *   Synthesized SFX for actions (pickups, crashes, UI).
*   **VFX:**
    *   Particle explosions on death/enemy kill.
    *   Glitch effects on damage.
    *   Neon glow styling.
