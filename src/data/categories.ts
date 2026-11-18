import type { AssetCategoryKey, CategoryPreset } from '../types/github';

export const RPG_CATEGORIES: CategoryPreset[] = [
  {
    id: 'all',
    group: 'code',
    label: 'All RPG Building Code',
    description: 'Engines, starter templates, and modular gameplay toolkits for RPG development.',
    sampleQueries: ['godot rpg', 'bevy ecs rpg', 'phaser rpg', 'turn-based combat'],
  },
  {
    id: 'engines2d',
    group: 'code',
    label: '2D & Pixel RPG Engines',
    description: 'Top-down tilemap engines, JRPG frameworks, and open-source RPG makers.',
    sampleQueries: ['2d rpg engine', 'pixel rpg godot', 'rpg maker', 'tilemap rpg'],
  },
  {
    id: 'combat',
    group: 'code',
    label: 'Turn-Based & Tactical Combat',
    description: 'Grid tactics, active-time battle loops, initiative queues, and status effects.',
    sampleQueries: ['tactical rpg grid', 'turn based battle', 'jrpg combat', 'fire emblem'],
  },
  {
    id: 'loot',
    group: 'code',
    label: 'Action RPG, Loot & Stats',
    description: 'Equipment slots, stat modifiers, inventory grids, and skill tree architectures.',
    sampleQueries: ['inventory system rpg', 'action rpg unity', 'skill tree', 'loot table'],
  },
  {
    id: 'narrative',
    group: 'code',
    label: 'Dialogue, Quests & Narrative',
    description: 'Branching conversation graphs, Ink/Yarn interpreters, and quest state machines.',
    sampleQueries: ['dialogue system', 'quest system rpg', 'ink narrative', 'yarn spinner'],
  },
  {
    id: 'roguelike',
    group: 'code',
    label: 'Roguelike & Procedural Maps',
    description: 'BSP dungeon generation, cellular automata caves, field-of-view, and pathfinding.',
    sampleQueries: ['roguelike engine', 'dungeon generator', 'rot.js', 'libtcod'],
  },
  {
    id: 'ecs',
    group: 'code',
    label: 'ECS & Architecture',
    description: 'Entity-Component-System patterns, data-oriented world state, and save serialization.',
    sampleQueries: ['bevy rpg', 'ecs rpg', 'entt game', 'flecs rpg'],
  },
  {
    id: 'engines3d',
    group: 'code',
    label: '3D & Open-World RPGs',
    description: 'Third-person controllers, terrain streaming, questing, and 3D RPG starter kits.',
    sampleQueries: ['3d rpg godot', 'unity rpg', 'threejs rpg', 'unreal rpg'],
  },
  {
    id: 'mmorpg',
    group: 'code',
    label: 'Multiplayer & MMORPG Servers',
    description: 'Authoritative tick servers, zone sharding, spatial hashing, and real-time sync.',
    sampleQueries: ['mmorpg server', 'multiplayer rpg', 'colyseus rpg', 'browserquest'],
  },
  {
    id: 'retro_sdk',
    group: 'code',
    label: 'SNES SDKs, Tiled & Retro Tools',
    description: '16-bit SNES C libraries, tile/palette converters, pixel editors, and classic JRPG runtimes.',
    sampleQueries: ['pvsneslib', 'superfamiconv', 'easyrpg', 'tiled map'],
  },
  {
    id: 'sprites',
    group: 'graphics',
    label: 'Character Sprites & Sheets',
    description: 'Heroes, NPCs, monsters, layered armor, and animated walk-cycle sprite sheets.',
    sampleQueries: ['lpc spritesheet', 'pixel character sprite', 'monster sprites', 'sprite sheet'],
  },
  {
    id: 'buildings',
    group: 'graphics',
    label: 'Buildings, Towns & Tilesets',
    description: 'Houses, castles, taverns, interiors, dungeon walls, terrain tilesets, and Tiled maps.',
    sampleQueries: ['rpg tileset', 'isometric buildings', 'tiled map rpg', 'dungeon tileset'],
  },
  {
    id: 'icons',
    group: 'graphics',
    label: 'Items, Weapons & UI Icons',
    description: 'Swords, potions, armor icons, HUD frames, inventory slots, and pixel fonts.',
    sampleQueries: ['game icons', 'rpg icons', 'pixel ui', 'inventory icons'],
  },
  {
    id: 'assets3d',
    group: 'graphics',
    label: '3D Models & Low-Poly Art',
    description: 'Rigged characters, GLTF/GLB medieval buildings, props, and environment kits.',
    sampleQueries: ['low poly rpg', 'gltf game assets', 'voxel rpg', '3d dungeon'],
  },
  {
    id: 'fullkits',
    group: 'graphics',
    label: 'Full RPG Kits (Code + Art)',
    description: 'Complete open-source RPG templates bundling both game source code and sprite/map assets.',
    sampleQueries: ['godot open rpg', 'browserquest', 'pixel dungeon', 'flare rpg'],
  },
];

export const ASSET_CATEGORY_LABELS: Record<AssetCategoryKey | 'all', string> = {
  all: 'All Assets',
  sprites: 'Characters & Sprites',
  buildings: 'Buildings & Interiors',
  tilesets: 'Tilesets & Maps',
  items_ui: 'Items, Weapons & UI',
  effects: 'VFX & Spells',
  models_3d: '3D Models',
  audio: 'Audio & SFX',
  other_art: 'Other Graphics',
};

export const CURATED_GROUPS: { id: 'all' | 'buildings' | 'sprites' | 'icons' | 'engines'; label: string }[] = [
  { id: 'all', label: 'All Verified Packs' },
  { id: 'buildings', label: 'Buildings & Towns' },
  { id: 'sprites', label: 'Sprites & Monsters' },
  { id: 'icons', label: 'Icons & UI' },
  { id: 'engines', label: 'Full RPG Starter Kits' },
];

export const LANGUAGE_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Languages' },
  { id: 'GDScript', label: 'GDScript (Godot)' },
  { id: 'C#', label: 'C# (Unity / Godot)' },
  { id: 'Rust', label: 'Rust (Bevy / Macroquad)' },
  { id: 'TypeScript', label: 'TypeScript (Web / Phaser)' },
  { id: 'JavaScript', label: 'JavaScript (HTML5 / Canvas)' },
  { id: 'Python', label: 'Python (Pygame / TCOD)' },
  { id: 'C++', label: 'C++ (SDL / Unreal)' },
  { id: 'Lua', label: 'Lua (LÖVE2D / Solar2D)' },
  { id: 'Java', label: 'Java (LibGDX)' },
];

export const LICENSE_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'Any License' },
  { id: 'mit', label: 'MIT' },
  { id: 'apache-2.0', label: 'Apache 2.0' },
  { id: 'gpl-3.0', label: 'GPL 3.0' },
  { id: 'bsd-3-clause', label: 'BSD 3-Clause' },
  { id: 'zlib', label: 'zlib' },
];

export const MIN_STARS_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any stars' },
  { value: 5, label: '5+ stars' },
  { value: 25, label: '25+ stars' },
  { value: 100, label: '100+ stars' },
  { value: 500, label: '500+ stars' },
  { value: 1000, label: '1,000+ stars' },
];
