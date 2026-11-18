export interface BlueprintChecklistItem {
  id: string;
  title: string;
  spec: string;
}

export interface BlueprintPillar {
  id: string;
  number: string;
  title: string;
  domain: 'code' | 'graphics' | 'audio';
  summary: string;
  technicalNotes: string[];
  checklist: BlueprintChecklistItem[];
  recommendedRepos: {
    fullName: string;
    role: string;
    openTab: 'overview' | 'code' | 'assets';
  }[];
  searchCategory: string;
  searchQuery: string;
}

export const FF2_BLUEPRINT_PILLARS: BlueprintPillar[] = [
  {
    id: 'overworld-loop',
    number: '01',
    title: 'Core JRPG Engine, Overworld & Scene Transitions',
    domain: 'code',
    summary:
      'State machine managing seamless transitions between World Map, Towns, Building Interiors, Dungeons, and the Battle Screen—paired with grid-locked tile movement and transport modes.',
    technicalNotes: [
      'Grid-locked 16×16 or 32×32 px tile movement with collision layers, warp triggers, and fade-out scene banks.',
      'Step-counter random encounter accumulator modulated by terrain type (grass, forest, dungeon, ocean) and suppressed while riding Chocobos or airships.',
      'Multi-tier vehicle state machine: On-Foot → Canoe/Ship (shallow/deep water) → Chocobo (encounter immunity) → Airship (world-map flight over mountains).',
    ],
    checklist: [
      {
        id: 'scene-router',
        title: 'Scene Stack & Warp Portal Manager',
        spec: 'Push/pop battle scenes while preserving overworld coordinates and NPC patrol states.',
      },
      {
        id: 'tile-movement',
        title: 'Grid-Aligned 4-Way Movement & Encounter Counter',
        spec: 'Smooth pixel interpolation between tile coordinates plus terrain-weighted encounter rolls.',
      },
      {
        id: 'party-train',
        title: 'Party Leader + Revolving 4th Guest Slot',
        spec: 'Support 3 core heroes plus temporary story guest companions (e.g. Minwu, Josef, Cid) with distinct gear.',
      },
    ],
    recommendedRepos: [
      {
        fullName: 'gdquest-demos/godot-open-rpg',
        role: 'Complete JRPG overworld, party, and combat loop in GDScript',
        openTab: 'code',
      },
      {
        fullName: 'mozilla/BrowserQuest',
        role: '2D tilemap movement, zone warps, and entity loop in JS/TS',
        openTab: 'code',
      },
      {
        fullName: 'EasyRPG/Player',
        role: 'Classic 2D JRPG event, map, and party runtime architecture in C++',
        openTab: 'overview',
      },
    ],
    searchCategory: 'engines2d',
    searchQuery: '2d jrpg engine',
  },
  {
    id: 'combat-progression',
    number: '02',
    title: 'Side-View Combat, Front/Back Rows & Usage Progression',
    domain: 'code',
    summary:
      'Turn-based or Active Time Battle (ATB) side-view encounter loop featuring Front/Back row targeting rules, weapon/spell proficiency levels (1–16), and usage-based attribute growth.',
    technicalNotes: [
      'FF2 (1988) Usage Growth: Track per-battle HP loss %, MP spent, physical swing counts, Black/White magic casts, and evasion checks instead of global EXP.',
      'FF2 (US / SNES FFIV) ATB Loop: Fixed-tick initiative gauge filled by Agility/Speed, pausing or queuing commands at 100% with Front/Back row physical damage mitigation.',
      'Known Classic Pitfalls to Avoid: Ensure off-hand dual-wield weapons contribute to damage calculation and Ultima/master spells sum all known spell levels properly.',
    ],
    checklist: [
      {
        id: 'row-formation',
        title: 'Front Row / Back Row Formation Rules',
        spec: 'Back-row units deal and take halved melee damage unless using bows, spears, or magic.',
      },
      {
        id: 'proficiency-tables',
        title: 'Weapon & Spell Skill Level Curves (1–16)',
        spec: 'Separate skill XP counters per weapon class and per spell, scaling hit count and MP cost.',
      },
      {
        id: 'atb-turn-queue',
        title: 'Turn Queue / ATB Gauge & Status Effects',
        spec: 'Poison, Blind, Sleep, Confusion, Stone, and multi-target spell splitting formulas.',
      },
    ],
    recommendedRepos: [
      {
        fullName: 'i-Jiro/Unity3D-Turn_Based_RPG',
        role: 'Side-view ATB gauge battle system, status effects, and damage popups (C#)',
        openTab: 'code',
      },
      {
        fullName: 'gdquest-demos/godot-open-rpg',
        role: 'Turn-based party vs enemy battler state machine (GDScript)',
        openTab: 'code',
      },
    ],
    searchCategory: 'combat',
    searchQuery: 'turn based rpg battle',
  },
  {
    id: 'keyword-dialogue',
    number: '03',
    title: 'Keyword Memory ("Ask / Memorize"), Quests & Event Flags',
    domain: 'code',
    summary:
      'FF2’s signature Word-Recall dialogue database where players learn story keywords ("Wild Rose", "Mythril", "Dreadnought") and prompt NPCs to unlock progression flags.',
    technicalNotes: [
      'Store learned keywords in a global unlocked-terms set; render an Ask submenu alongside Talk and Item during NPC interactions.',
      'Evaluate dialogue triggers using pointer tables: (Current_Map_ID, NPC_ID, Keyword_ID) -> Dialogue_String + Set_Story_Flag.',
      'Combine with standard quest state machines for Inns (rest/HP-MP restore), Weapon/Armor/Magic Shops, and boss cutscene scripts.',
    ],
    checklist: [
      {
        id: 'keyword-db',
        title: 'Keyword Memory Registry (Learn & Ask)',
        spec: 'Dynamic array of discovered story terms selectable inside NPC dialogue prompts.',
      },
      {
        id: 'event-flags',
        title: 'Global Story Flag & Cutscene Interpreter',
        spec: 'Track airship unlocks, town invasions, shop inventories, and temporary party departures.',
      },
      {
        fullName: undefined as never,
        id: 'inn-shop-flows',
        title: 'Inn, Item Shop & Spell Tome Vendor Logic',
        spec: 'Gold/Gil transactions, inventory stacking, and consumable spell-book learning.',
      } as never,
    ].map(({ id, title, spec }) => ({ id, title, spec })),
    recommendedRepos: [
      {
        fullName: 'inkle/ink',
        role: 'Variable-driven narrative & keyword state scripting language',
        openTab: 'overview',
      },
      {
        fullName: 'dialogic-godot/dialogic',
        role: 'Branching JRPG dialogue, portrait boxes, and event timelines (GDScript)',
        openTab: 'code',
      },
      {
        fullName: 'nathanhoad/godot_dialogue_manager',
        role: 'Lightweight conditional dialogue parser with state flags',
        openTab: 'code',
      },
    ],
    searchCategory: 'narrative',
    searchQuery: 'dialogue system rpg',
  },
  {
    id: 'character-boss-sprites',
    number: '04',
    title: 'Character Walk Cycles, Side-View Battlers & Boss Sprites',
    domain: 'graphics',
    summary:
      'All animated sprite sheets needed for field exploration and classic side-view JRPG battles—heroes, town NPCs, monsters, and multi-tile enlarged boss sprites.',
    technicalNotes: [
      'Overworld / Town Sprites: 16×16 or 16×24 (classic NES/SNES) or 32×32/48×48 modern pixel sheets with 4 directions (Down, Up, Left, Right) × 2–3 walk frames.',
      'Side-View Battle Sprites: Idle, Step-Forward Attack, Weapon Swing, Cast Magic (hands raised), Low-HP Kneel, Hit Recoil, and KO poses.',
      'Boss & Monster Art: Larger static or 2-frame breathing battle sprites (32×32 up to 96×96) positioned on the left half of the battle backdrop.',
    ],
    checklist: [
      {
        id: 'hero-walk-sheets',
        title: '4-Direction Hero & NPC Walk Sheets',
        spec: 'Base heroes, kings, shopkeepers, soldiers, guards, and Chocobo/ship world sprites.',
      },
      {
        id: 'sideview-battlers',
        title: 'Side-View Combat Poses & Weapon Overlays',
        spec: 'Sword, spear, axe, bow, and magic cast frames aligned on consistent sprite grid cells.',
      },
      {
        id: 'monster-boss-roster',
        title: 'Enemy & Multi-Tile Boss Sprite Roster',
        spec: 'Goblins, skeletons, magicians, imperial knights, dragons, and final-dungeon bosses.',
      },
    ],
    recommendedRepos: [
      {
        fullName: 'sanderfrenken/Universal-LPC-Spritesheet-Character-Generator',
        role: 'Thousands of modular 4-direction RPG character, armor, and weapon sheets',
        openTab: 'assets',
      },
      {
        fullName: 'crawl/crawl',
        role: 'Thousands of 32×32 fantasy monster, hero, and boss tiles',
        openTab: 'assets',
      },
      {
        fullName: 'flareteam/flare-game',
        role: 'Animated monsters, armored warriors, and character portraits',
        openTab: 'assets',
      },
    ],
    searchCategory: 'sprites',
    searchQuery: 'lpc spritesheet',
  },
  {
    id: 'towns-buildings-tilesets',
    number: '05',
    title: 'World Map, Towns, Castles, Buildings & Dungeon Tilesets',
    domain: 'graphics',
    summary:
      'Complete architectural tilesets for medieval towns, inns, weapon/magic shops, castles, bridges, interiors, caverns, and towering dungeons—plus Tiled (.tmx) maps.',
    technicalNotes: [
      'World Overworld Bank: Autotiled ocean coastlines, rivers, grass, forests, deserts, snowfields, mountain ranges, towns, castles, and cave entrances.',
      'Town & Building Exteriors: Timber/stone house walls, pitched roofs, Inn/Armor/Magic shop signs, doors, windows, cobblestone paths, wells, and castle gates.',
      'Interiors & Dungeons: Wooden floors, beds, bookshelves, thrones, dungeon stone walls, stairs up/down, lava rivers, treasure chests, and airship metal decks.',
    ],
    checklist: [
      {
        id: 'overworld-tileset',
        title: 'Overworld Terrain & Landmarks Tileset',
        spec: 'Ocean, shorelines, mountains, forests, swamps, and miniature town/castle icons.',
      },
      {
        id: 'town-buildings',
        title: 'Town Houses, Inns, Shops & Castle Exteriors',
        spec: 'Modular walls, roofs, doors, signage, bridges, and castle battlements.',
      },
      {
        id: 'dungeon-interiors',
        title: 'Cave, Tower, Airship & Interior Tilesets',
        spec: 'Multi-layer wall/floor autotiles, staircases, pillars, traps, and battle backdrops.',
      },
    ],
    recommendedRepos: [
      {
        fullName: 'arianne/stendhal',
        role: '800+ town buildings, inns, houses, interiors & 1,900+ terrain tilesets',
        openTab: 'assets',
      },
      {
        fullName: 'mozilla/BrowserQuest',
        role: 'Clean pixel-art world tilesheet, castles, caves, and building interiors',
        openTab: 'assets',
      },
      {
        fullName: 'wesnoth/wesnoth',
        role: 'Castles, villages, fortresses, and high-fantasy terrain tile banks',
        openTab: 'assets',
      },
      {
        fullName: '00-Evan/shattered-pixel-dungeon',
        role: 'Pixel dungeon walls, doors, traps, water, and chasm tilesets',
        openTab: 'assets',
      },
    ],
    searchCategory: 'buildings',
    searchQuery: 'rpg tileset',
  },
  {
    id: 'menus-ui-icons',
    number: '06',
    title: 'Classic JRPG Blue Windows, Cursors, Fonts & Item Icons',
    domain: 'graphics',
    summary:
      '9-slice bordered dialogue and battle command boxes, gloved pointer cursors, pixel bitmap fonts, and icon sheets for swords, spells, potions, and status ailments.',
    technicalNotes: [
      '9-Slice Windowskins: Gradient blue-to-navy fill with crisp 2px white/silver pixel border so boxes scale cleanly to any dialogue or status layout.',
      'Battle & Menu HUD: Gloved finger cursor sprite, HP/MP bars, ATB readiness gauge, and floating damage/heal number sprites.',
      'Inventory & Spell Icons: Small 16×16 or 24×24 icons distinguishing weapon classes (Sword, Spear, Axe, Bow, Staff), White/Black magic, and key items.',
    ],
    checklist: [
      {
        id: 'nine-slice-window',
        title: '9-Slice Dialogue & Status Windowskins',
        spec: 'Corner, edge, and center-fill patches plus cursor arrow and "next page" indicator.',
      },
      {
        id: 'weapon-item-icons',
        title: 'Weapons, Armor, Potions & Key Item Icons',
        spec: 'Distinct icons for equipment slots, rings, scrolls, and quest artifacts.',
      },
      {
        id: 'pixel-bitmap-font',
        title: 'Crisp 8×8 / 8×16 Pixel Font & Damage Numerals',
        spec: 'Readable monospace dialogue typeface plus bold green/white combat hit numbers.',
      },
    ],
    recommendedRepos: [
      {
        fullName: 'game-icons/icons',
        role: '4,000+ RPG weapon, spell, potion, armor, and status effect SVG icons',
        openTab: 'assets',
      },
      {
        fullName: '00-Evan/shattered-pixel-dungeon',
        role: 'Pixel UI frames, inventory slots, potions, rings, wands & weapons',
        openTab: 'assets',
      },
      {
        fullName: 'mozilla/BrowserQuest',
        role: 'Pixel weapons, armor icons, HUD frames, and bitmap pixel fonts',
        openTab: 'assets',
      },
    ],
    searchCategory: 'icons',
    searchQuery: 'game icons',
  },
  {
    id: 'retro-audio-sfx',
    number: '07',
    title: 'Chiptune BGM, Town/Boss Themes & Retro Battle SFX',
    domain: 'audio',
    summary:
      'Looping 8-bit/16-bit background tracks for overworld, towns, castles, dungeons, and boss battles—plus crisp synthesized UI blips, sword slashes, and spell chimes.',
    technicalNotes: [
      'Seamless Loop Points: Store BGM tracks with intro + loop-start timestamps (or loop-friendly `.ogg`) for Title, Overworld, Town, Castle, Dungeon, Battle, Boss, Victory Fanfare, and Chocobo themes.',
      'Retro SFX Synthesis: Square/triangle/noise wave SFX for menu cursor move, confirm, error buzz, sword hit, spell cast, cure chime, door open, and treasure chest.',
    ],
    checklist: [
      {
        id: 'bgm-loop-suite',
        title: 'Looping BGM Suite (World, Town, Dungeon, Battle, Victory)',
        spec: 'Seamless OGG/WAV loops or tracker/SPC modules matching scene transitions.',
      },
      {
        id: 'ui-combat-sfx',
        title: 'Menu Blips, Sword Hits & Spell SFX Pack',
        spec: 'Low-latency WAV/OGG sound effects triggered by menu inputs and battle animations.',
      },
    ],
    recommendedRepos: [
      {
        fullName: 'increpare/bfxr',
        role: 'Classic 8-bit/16-bit retro game SFX generator for menus, hits & magic',
        openTab: 'overview',
      },
      {
        fullName: 'arianne/stendhal',
        role: '560+ open-source RPG ambient, town, combat & creature audio files',
        openTab: 'assets',
      },
      {
        fullName: 'mozilla/BrowserQuest',
        role: 'Open-source retro RPG music & sound effects pack (.ogg/.mp3)',
        openTab: 'assets',
      },
    ],
    searchCategory: 'all',
    searchQuery: 'chiptune rpg music',
  },
  {
    id: 'retro-toolchains',
    number: '08',
    title: 'Maps, Pixel Editors & Optional True 16-Bit SNES Toolchains',
    domain: 'code',
    summary:
      'Production tooling to author tilemaps, animate sprite sheets, or target literal SNES hardware constraints with C SDKs and 4bpp tile/palette converters.',
    technicalNotes: [
      'Tiled Map Editor (.tmx/.tmj): Industry-standard open-source editor for multi-layer town/dungeon maps with object layers for NPCs, warps, and treasure chests.',
      'LibreSprite: Open-source frame-by-frame pixel art and sprite-sheet exporter.',
      'True SNES Path (Optional): Use pvsneslib (C SDK) + SuperFamiconv (Rust PNG-to-4bpp tile/palette converter) to build an authentic SNES ROM.',
    ],
    checklist: [
      {
        id: 'tiled-pipeline',
        title: 'Tiled (.tmx/.tmj) Map & Warp Layer Pipeline',
        spec: 'Define collision tiles, animated water, NPC spawn points, and building door warps.',
      },
      {
        id: 'sprite-pipeline',
        title: 'Sprite Sheet Packing & Palette Indexing',
        spec: 'Export uniform sprite grids (or 4bpp SNES tiles via SuperFamiconv) with clean metadata.',
      },
    ],
    recommendedRepos: [
      {
        fullName: 'mapeditor/tiled',
        role: 'Standard open-source 2D RPG tilemap & world editor (.tmx/.tsx)',
        openTab: 'overview',
      },
      {
        fullName: 'libresprite/LibreSprite',
        role: 'Open-source pixel sprite & animation editor',
        openTab: 'overview',
      },
      {
        fullName: 'alekmaul/pvsneslib',
        role: 'Open-source C SDK for SNES hardware tilemaps, OAM sprites & SPC700 audio',
        openTab: 'code',
      },
      {
        fullName: 'Optiroc/SuperFamiconv',
        role: 'Rust CLI tool converting PNG tilesets & sprites into SNES 4bpp/2bpp formats',
        openTab: 'overview',
      },
    ],
    searchCategory: 'retro_sdk',
    searchQuery: 'pvsneslib OR tiled',
  },
];
