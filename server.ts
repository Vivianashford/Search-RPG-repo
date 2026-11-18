import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  if (cache.size > 400) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'RPG-Code-Atlas/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

interface GitHubRepoRaw {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  topics?: string[];
  license: { spdx_id: string | null; name: string } | null;
  default_branch: string;
  updated_at: string;
  pushed_at: string;
  created_at: string;
  size: number;
  archived: boolean;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  homepage?: string | null;
}

function normalizeRepo(repo: GitHubRepoRaw, packHighlight?: string) {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    homepage: repo.homepage || null,
    description: repo.description || 'No description provided.',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    language: repo.language || 'Assets / Multi',
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 8) : [],
    license: repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION'
      ? repo.license.spdx_id
      : repo.license?.name || null,
    defaultBranch: repo.default_branch || 'main',
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    sizeKb: repo.size,
    archived: repo.archived,
    packHighlight: packHighlight || null,
    owner: {
      login: repo.owner.login,
      avatarUrl: repo.owner.avatar_url,
      htmlUrl: repo.owner.html_url,
    },
  };
}

const CATEGORY_QUERY_MAP: Record<string, string> = {
  all: 'rpg OR roguelike',
  engines2d: '2d rpg',
  combat: 'tactical rpg OR turn-based rpg',
  loot: 'action rpg OR rpg inventory',
  narrative: 'dialogue system',
  roguelike: 'roguelike',
  ecs: 'ecs game',
  engines3d: '3d rpg',
  mmorpg: 'mmorpg',
  sprites: 'spritesheet OR lpc',
  buildings: 'tileset OR tilemap',
  icons: 'game icons OR pixel icons',
  assets3d: 'low poly game OR gltf rpg',
  fullkits: 'rpg starter OR godot rpg',
  jrpg: 'jrpg OR turn based rpg',
  retro_sdk: 'pvsneslib OR rpgmaker',
};

const CATEGORY_FILTER_HINT: Record<string, string> = {
  all: 'rpg',
  engines2d: '2d rpg',
  combat: 'rpg',
  loot: 'rpg',
  narrative: 'dialogue',
  roguelike: 'roguelike',
  ecs: 'ecs',
  engines3d: '3d rpg',
  mmorpg: 'mmorpg',
  sprites: 'sprites',
  buildings: 'tileset',
  icons: 'icons',
  assets3d: '3d',
  fullkits: 'rpg',
  jrpg: 'jrpg',
  retro_sdk: 'snes',
};

const GRAPHICS_CATEGORIES = new Set(['sprites', 'buildings', 'icons', 'assets3d', 'fullkits']);

const LANGUAGE_QUERY_MAP: Record<string, string> = {
  all: '',
  GDScript: 'language:GDScript',
  'C#': 'language:"C#"',
  Rust: 'language:Rust',
  TypeScript: 'language:TypeScript',
  JavaScript: 'language:JavaScript',
  Python: 'language:Python',
  'C++': 'language:"C++"',
  Lua: 'language:Lua',
  Java: 'language:Java',
};

interface CuratedPackDef {
  fullName: string;
  group: 'sprites' | 'buildings' | 'icons' | 'engines';
  highlight: string;
}

const CURATED_PACK_DEFS: CuratedPackDef[] = [
  {
    fullName: 'gdquest-demos/godot-open-rpg',
    group: 'engines',
    highlight: 'FF-style Godot JRPG starter kit: party combat, overworld, dialogue & tilemaps',
  },
  {
    fullName: 'i-Jiro/Unity3D-Turn_Based_RPG',
    group: 'engines',
    highlight: 'Unity JRPG template with ATB battle gauge, side-view battlers & status effects',
  },
  {
    fullName: 'arianne/stendhal',
    group: 'buildings',
    highlight: '4,900+ town buildings, inns, houses, interiors, NPCs & tilesets',
  },
  {
    fullName: 'sanderfrenken/Universal-LPC-Spritesheet-Character-Generator',
    group: 'sprites',
    highlight: 'Modular 4-direction RPG hero, armor, weapon & animation sprite sheets',
  },
  {
    fullName: 'mozilla/BrowserQuest',
    group: 'buildings',
    highlight: 'Complete 2D pixel-art sprites, buildings, tilesets & JS/TS codebase',
  },
  {
    fullName: 'game-icons/icons',
    group: 'icons',
    highlight: '4,000+ SVG RPG weapons, spells, buildings, monsters & status icons',
  },
  {
    fullName: 'flareteam/flare-game',
    group: 'sprites',
    highlight: '1,300+ dungeon tiles, castles, monsters, portraits & equipment art',
  },
  {
    fullName: '00-Evan/shattered-pixel-dungeon',
    group: 'sprites',
    highlight: 'Pixel-art dungeon tilesets, items, UI sprites & Java/LibGDX source',
  },
  {
    fullName: 'crawl/crawl',
    group: 'sprites',
    highlight: 'Thousands of 32x32 fantasy monster, item, wall, altar & dungeon tiles',
  },
  {
    fullName: 'wesnoth/wesnoth',
    group: 'buildings',
    highlight: 'Fantasy castles, villages, terrain tilesets & character portraits',
  },
  {
    fullName: 'dialogic-godot/dialogic',
    group: 'engines',
    highlight: 'Godot dialogue, character portraits & branching event flag system',
  },
  {
    fullName: 'inkle/ink',
    group: 'engines',
    highlight: 'Branching narrative & keyword-memory state engine for RPG quests',
  },
  {
    fullName: 'EasyRPG/Player',
    group: 'engines',
    highlight: 'Open-source C++ RPG Maker 2000/2003 JRPG runtime',
  },
  {
    fullName: 'alekmaul/pvsneslib',
    group: 'engines',
    highlight: 'Open-source C SDK for authentic SNES 16-bit tilemaps, OAM sprites & SPC700 audio',
  },
  {
    fullName: 'Optiroc/SuperFamiconv',
    group: 'engines',
    highlight: 'SNES 4bpp/2bpp tile, palette & tilemap converter for retro pixel assets',
  },
  {
    fullName: 'increpare/bfxr',
    group: 'icons',
    highlight: 'Retro 8-bit/16-bit RPG sound effects generator for menus, hits & spells',
  },
];

async function fetchGitHubJson<T>(url: string): Promise<{ data: T; rateRemaining: string | null; rateReset: string | null }> {
  const response = await fetch(url, { headers: githubHeaders() });
  const rateRemaining = response.headers.get('x-ratelimit-remaining');
  const rateReset = response.headers.get('x-ratelimit-reset');

  if (!response.ok) {
    let message = `GitHub API returned status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // ignore json parse failure
    }
    const err = new Error(message) as Error & { status?: number; rateReset?: string | null };
    err.status = response.status;
    err.rateReset = rateReset;
    throw err;
  }

  const data = (await response.json()) as T;
  return { data, rateRemaining, rateReset };
}

app.get('/api/github/curated-packs', async (req: Request, res: Response) => {
  try {
    const group = String(req.query.group ?? 'all').trim();
    const filteredDefs = group === 'all'
      ? CURATED_PACK_DEFS
      : CURATED_PACK_DEFS.filter((d) => d.group === group);

    const cacheKey = `curated-packs:${group}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      res.json({ ...(cached as object), cached: true });
      return;
    }

    const results = await Promise.all(
      filteredDefs.map(async (def) => {
        const repoCacheKey = `curated-repo:${def.fullName}`;
        const cachedRepo = getCached<ReturnType<typeof normalizeRepo>>(repoCacheKey);
        if (cachedRepo) return cachedRepo;

        try {
          const url = `https://api.github.com/repos/${def.fullName}`;
          const { data } = await fetchGitHubJson<GitHubRepoRaw>(url);
          const normalized = normalizeRepo(data, def.highlight);
          setCached(repoCacheKey, normalized, 1000 * 60 * 60);
          return normalized;
        } catch {
          return null;
        }
      })
    );

    const items = results.filter((r): r is ReturnType<typeof normalizeRepo> => r !== null);
    if (items.length === 0) {
      res.status(429).json({
        error: 'Unable to load verified GitHub packs right now due to API rate limiting. Try again shortly.',
      });
      return;
    }

    const payload = {
      totalCount: items.length,
      items,
    };
    setCached(cacheKey, payload, 1000 * 60 * 60);
    res.json({ ...payload, cached: false });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message || 'Failed to load verified packs.' });
  }
});

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'build', 'building', 'by', 'code', 'create',
  'for', 'from', 'game', 'games', 'how', 'in', 'into', 'is', 'like', 'make', 'my',
  'need', 'of', 'on', 'or', 'some', 'style', 'system', 'systems', 'that', 'the',
  'to', 'use', 'using', 'videogame', 'want', 'with',
]);

const INTENT_SYNONYMS: Record<string, string> = {
  house: 'tileset',
  houses: 'tileset',
  buildings: 'tileset',
  inn: 'tileset',
  tavern: 'tileset',
  town: 'tileset',
  towns: 'tileset',
  village: 'tileset',
  castle: 'tileset',
  overworld: 'tilemap',
  worldmap: 'tilemap',
  world: 'tilemap',
  ff2: 'jrpg',
  ff4: 'jrpg',
  fantasy: 'jrpg',
  sprite: 'sprites',
  character: 'sprites',
  characters: 'sprites',
  hero: 'sprites',
  heroes: 'sprites',
  monster: 'sprites',
  monsters: 'sprites',
  boss: 'sprites',
  bosses: 'sprites',
  menu: 'ui',
  menus: 'ui',
  window: 'ui',
  windows: 'ui',
  hud: 'ui',
  weapon: 'icons',
  weapons: 'icons',
  armor: 'icons',
  potion: 'icons',
  potions: 'icons',
  item: 'icons',
  items: 'icons',
  music: 'chiptune',
  bgm: 'chiptune',
  sound: 'sfx',
  sounds: 'sfx',
  audio: 'sfx',
  keyword: 'dialogue',
  keywords: 'dialogue',
  npc: 'dialogue',
  story: 'dialogue',
  quest: 'dialogue',
  quests: 'dialogue',
  atb: 'battle',
  fighting: 'combat',
  battle: 'combat',
};

function simplifyUserQuery(raw: string, category: string, exact: boolean): string {
  if (exact) {
    return raw;
  }

  // Preserve explicit GitHub qualifiers like language:, topic:, user:, or uppercase OR
  if (/(language:|topic:|user:|org:|stars:|license:)/i.test(raw) || /\bOR\b/.test(raw)) {
    return raw;
  }

  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z0-9_+#.-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const mapped: string[] = [];
  for (const token of tokens) {
    if (token === 'building' || token === 'buildings') {
      if (!mapped.includes('tileset')) mapped.push('tileset');
      continue;
    }
    if (STOP_WORDS.has(token)) continue;
    const synonym = INTENT_SYNONYMS[token] || token;
    if (!mapped.includes(synonym)) {
      mapped.push(synonym);
    }
  }

  if (mapped.length === 0) {
    return CATEGORY_QUERY_MAP[category] || 'rpg';
  }

  const concise = mapped.slice(0, 2);
  const joined = concise.join(' ');
  const hasDomainSignal = /\b(rpg|jrpg|roguelike|mmorpg|spritesheet|godot|unity|bevy|phaser|chiptune|pvsneslib|tiled)\b/i.test(joined);
  if (!hasDomainSignal) {
    const hint = (category !== 'all' && CATEGORY_FILTER_HINT[category]) ? CATEGORY_FILTER_HINT[category] : 'rpg';
    const firstHint = hint.split(' ')[0];
    if (!concise.includes(firstHint)) {
      concise.push(firstHint);
    }
  }

  return concise.join(' ');
}

app.get('/api/github/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? '').trim();
    const exact = req.query.exact === '1';
    const category = String(req.query.category ?? 'all').trim();
    const language = String(req.query.language ?? 'all').trim();
    const license = String(req.query.license ?? 'all').trim();
    const minStarsParam = req.query.minStars !== undefined ? Number(req.query.minStars) : 25;
    const minStars = Number.isFinite(minStarsParam) ? Math.max(0, minStarsParam) : 25;
    const effectiveMinStars = (q || GRAPHICS_CATEGORIES.has(category)) && minStars === 25 ? 5 : minStars;
    const sort = String(req.query.sort ?? 'stars').trim();
    const page = Math.max(1, Math.min(20, Number(req.query.page ?? 1) || 1));
    const perPage = Math.max(5, Math.min(30, Number(req.query.perPage ?? 20) || 20));

    const parts: string[] = [];
    if (q) {
      parts.push(simplifyUserQuery(q, category, exact));
    } else {
      parts.push(CATEGORY_QUERY_MAP[category] || CATEGORY_QUERY_MAP.all);
    }

    if (language !== 'all' && LANGUAGE_QUERY_MAP[language]) {
      parts.push(LANGUAGE_QUERY_MAP[language]);
    } else if (language !== 'all') {
      parts.push(`language:"${language}"`);
    }

    if (license !== 'all') {
      parts.push(`license:${license.toLowerCase()}`);
    }

    if (effectiveMinStars > 0) {
      parts.push(`stars:>=${effectiveMinStars}`);
    }

    parts.push('archived:false');

    const finalQuery = parts.join(' ');
    const validSort = sort === 'best-match' ? '' : ['stars', 'forks', 'updated'].includes(sort) ? sort : 'stars';

    const params = new URLSearchParams({
      q: finalQuery,
      per_page: String(perPage),
      page: String(page),
      order: 'desc',
    });
    if (validSort) {
      params.set('sort', validSort);
    }

    const cacheKey = `search:${params.toString()}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      res.json({ ...(cached as object), cached: true });
      return;
    }

    let pending = inflight.get(cacheKey);
    if (!pending) {
      const url = `https://api.github.com/search/repositories?${params.toString()}`;
      pending = fetchGitHubJson<{ total_count: number; incomplete_results: boolean; items: GitHubRepoRaw[] }>(url)
        .then(({ data, rateRemaining }) => {
          const payload = {
            totalCount: data.total_count,
            incompleteResults: data.incomplete_results,
            queryUsed: finalQuery,
            rateLimitRemaining: rateRemaining ? Number(rateRemaining) : null,
            items: data.items.map((item) => normalizeRepo(item)),
          };
          setCached(cacheKey, payload, 1000 * 60 * 15);
          return payload;
        })
        .finally(() => {
          inflight.delete(cacheKey);
        });
      inflight.set(cacheKey, pending);
    }

    const result = await pending;
    res.json({ ...(result as object), cached: false });
  } catch (err) {
    const error = err as Error & { status?: number; rateReset?: string | null };
    const status = error.status === 403 || error.status === 429 ? 429 : error.status || 500;
    const resetEpoch = error.rateReset ? Number(error.rateReset) * 1000 : null;
    const retryAfterSeconds = resetEpoch ? Math.max(5, Math.ceil((resetEpoch - Date.now()) / 1000)) : 60;
    res.status(status).json({
      error: status === 429
        ? 'GitHub search rate limit reached. Switch to Verified Art & Code Packs or retry shortly.'
        : error.message || 'Failed to query GitHub repositories.',
      retryAfterSeconds,
    });
  }
});

async function fetchReadmeRaw(owner: string, repo: string, branch: string): Promise<string | null> {
  const candidates = ['README.md', 'readme.md', 'Readme.md', 'README.rst', 'README.txt', 'README'];
  for (const filename of candidates) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${filename}`;
      const resp = await fetch(rawUrl, { headers: { 'User-Agent': 'RPG-Code-Atlas/1.0' } });
      if (resp.ok) {
        const text = await resp.text();
        if (text && text.length > 0) {
          return text.slice(0, 180000);
        }
      }
    } catch {
      // try next candidate
    }
  }
  try {
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;
    const resp = await fetch(apiUrl, {
      headers: { ...githubHeaders(), Accept: 'application/vnd.github.raw+json' },
    });
    if (resp.ok) {
      return (await resp.text()).slice(0, 180000);
    }
  } catch {
    // ignore
  }
  return null;
}

app.get('/api/github/repo/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const owner = String(req.params.owner);
    const repo = String(req.params.repo);
    const branchHint = req.query.branch ? String(req.query.branch) : '';
    const cacheKey = `repo:${owner}/${repo}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      res.json({ ...(cached as object), cached: true });
      return;
    }

    const repoUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const langUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`;

    const [{ data: repoData }, langResp] = await Promise.all([
      fetchGitHubJson<GitHubRepoRaw>(repoUrl),
      fetchGitHubJson<Record<string, number>>(langUrl).catch(() => ({ data: {} as Record<string, number> })),
    ]);

    const branch = branchHint || repoData.default_branch || 'main';
    const readme = await fetchReadmeRaw(owner, repo, branch);

    const payload = {
      repo: normalizeRepo(repoData),
      languages: langResp.data,
      readme,
    };
    setCached(cacheKey, payload, 1000 * 60 * 30);
    res.json({ ...payload, cached: false });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status === 403 || error.status === 429 ? 429 : error.status || 500;
    res.status(status).json({
      error: status === 429
        ? 'GitHub API rate limit reached while loading repository details.'
        : error.message || 'Failed to load repository details.',
    });
  }
});

interface GitTreeNodeRaw {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

async function fetchFullRepoTree(owner: string, repo: string, branch: string) {
  const cacheKey = `raw-tree:${owner}/${repo}:${branch}`;
  const cached = getCached<{ truncated: boolean; tree: GitTreeNodeRaw[] }>(cacheKey);
  if (cached) return cached;

  const treeUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const { data } = await fetchGitHubJson<{ sha: string; truncated: boolean; tree: GitTreeNodeRaw[] }>(treeUrl);
  const result = {
    truncated: Boolean(data.truncated),
    tree: data.tree || [],
  };
  setCached(cacheKey, result, 1000 * 60 * 30);
  return result;
}

app.get('/api/github/tree/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const owner = String(req.params.owner);
    const repo = String(req.params.repo);
    const branch = String(req.query.branch || 'main');

    const data = await fetchFullRepoTree(owner, repo, branch);
    const entries = data.tree
      .slice(0, 2500)
      .map((item) => ({
        path: item.path,
        type: item.type,
        size: item.size ?? 0,
      }));

    res.json({
      truncated: data.truncated || data.tree.length > 2500,
      entries,
    });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status === 403 || error.status === 429 ? 429 : error.status || 500;
    res.status(status).json({
      error: status === 429
        ? 'GitHub API rate limit reached while loading repository file tree.'
        : error.message || 'Failed to load repository file tree.',
    });
  }
});

type AssetKind = 'image' | 'tilemap' | 'model3d' | 'audio' | 'source_art';
type AssetCategoryKey =
  | 'sprites'
  | 'buildings'
  | 'tilesets'
  | 'items_ui'
  | 'effects'
  | 'models_3d'
  | 'audio'
  | 'other_art';

function classifyAsset(filePath: string): { kind: AssetKind; category: AssetCategoryKey; ext: string } | null {
  const lower = filePath.toLowerCase();
  const lastDot = lower.lastIndexOf('.');
  if (lastDot === -1) return null;
  const ext = lower.slice(lastDot + 1);

  const isImage = ['png', 'gif', 'webp', 'svg', 'jpg', 'jpeg'].includes(ext);
  const isTilemap = ['tmx', 'tsx', 'tmj', 'tsj'].includes(ext);
  const isModel3d = ['glb', 'gltf', 'obj', 'fbx', 'blend', 'dae'].includes(ext);
  const isAudio = ['ogg', 'wav', 'mp3', 'flac', 'mid'].includes(ext);
  const isSourceArt = ['ase', 'aseprite', 'xcf', 'psd', 'kra'].includes(ext);

  if (!isImage && !isTilemap && !isModel3d && !isAudio && !isSourceArt) {
    return null;
  }

  if (isModel3d) {
    return { kind: 'model3d', category: 'models_3d', ext };
  }
  if (isAudio) {
    return { kind: 'audio', category: 'audio', ext };
  }
  if (isTilemap) {
    return { kind: 'tilemap', category: 'tilesets', ext };
  }

  const kind: AssetKind = isImage ? 'image' : 'source_art';

  if (/(windowskin|textbox|dialog_box|ui|hud|gui|menu|button|cursor|panel|font|inventory|skill|spell|ability|scroll|book|food|key|item|weapon|sword|axe|bow|staff|wand|shield|armor|helm|boots|ring|amulet|potion|loot|chest|coin|gem|icon)/.test(lower)) {
    return { kind, category: 'items_ui', ext };
  }
  if (/(building|house|castle|tower|tavern|inn|shop|church|temple|shrine|palace|forge|blacksmith|armory|town|village|city|interior|roof|wall|door|window|furniture|bridge|fence|gate|ruin|fort|barn|cabin|tent|airship)/.test(lower)) {
    return { kind, category: 'buildings', ext };
  }
  if (/(sprite|char|character|player|npc|enemy|monster|hero|boss|unit|battler|portrait|body|hair|face|walk|idle|attack|creature|goblin|skeleton|knight|mage|warrior|villager|orc|dragon|slime|zombie|human|elf|dwarf|paladin|dragoon|monk|cleric|thief|chocobo)/.test(lower)) {
    return { kind, category: 'sprites', ext };
  }
  if (/(tile|tileset|tilesheet|terrain|ground|floor|grass|water|forest|tree|rock|mountain|biome|world|overworld|worldmap|battleback|dungeon|cave|lava|snow|sand|road|path)/.test(lower)) {
    return { kind, category: 'tilesets', ext };
  }
  if (/(fx|vfx|effect|particle|magic|fire|ice|lightning|projectile|slash|explosion|beam|aura|smoke)/.test(lower)) {
    return { kind, category: 'effects', ext };
  }

  return { kind, category: 'other_art', ext };
}

app.get('/api/github/repos/batch', async (req: Request, res: Response) => {
  try {
    const rawNames = String(req.query.names ?? '');
    const names = rawNames
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(s))
      .slice(0, 24);

    if (names.length === 0) {
      res.json({ items: [] });
      return;
    }

    const items = await Promise.all(
      names.map(async (fullName) => {
        const cacheKey = `curated-repo:${fullName}`;
        const cached = getCached<ReturnType<typeof normalizeRepo>>(cacheKey);
        if (cached) return cached;

        try {
          const url = `https://api.github.com/repos/${fullName}`;
          const { data } = await fetchGitHubJson<GitHubRepoRaw>(url);
          const normalized = normalizeRepo(data);
          setCached(cacheKey, normalized, 1000 * 60 * 60);
          return normalized;
        } catch {
          return null;
        }
      })
    );

    res.json({ items: items.filter((item): item is ReturnType<typeof normalizeRepo> => item !== null) });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message || 'Failed to load batch repositories.' });
  }
});

app.get('/api/github/assets/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const owner = String(req.params.owner);
    const repo = String(req.params.repo);
    const branch = String(req.query.branch || 'main');
    const cacheKey = `assets:${owner}/${repo}:${branch}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      res.json({ ...(cached as object), cached: true });
      return;
    }

    const data = await fetchFullRepoTree(owner, repo, branch);
    const countsByCategory: Record<AssetCategoryKey, number> = {
      sprites: 0,
      buildings: 0,
      tilesets: 0,
      items_ui: 0,
      effects: 0,
      models_3d: 0,
      audio: 0,
      other_art: 0,
    };

    const assets: Array<{
      path: string;
      name: string;
      ext: string;
      size: number;
      kind: AssetKind;
      category: AssetCategoryKey;
      rawUrl: string;
    }> = [];

    for (const entry of data.tree) {
      if (entry.type !== 'blob') continue;
      const classified = classifyAsset(entry.path);
      if (!classified) continue;
      countsByCategory[classified.category] += 1;

      if (assets.length < 4000) {
        const encodedPath = entry.path.split('/').map(encodeURIComponent).join('/');
        const name = entry.path.split('/').pop() || entry.path;
        assets.push({
          path: entry.path,
          name,
          ext: classified.ext,
          size: entry.size ?? 0,
          kind: classified.kind,
          category: classified.category,
          rawUrl: `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${encodedPath}`,
        });
      }
    }

    const totalAssets = Object.values(countsByCategory).reduce((sum, val) => sum + val, 0);
    const payload = {
      totalAssets,
      truncated: data.truncated || totalAssets > 4000,
      countsByCategory,
      assets,
    };
    setCached(cacheKey, payload, 1000 * 60 * 30);
    res.json({ ...payload, cached: false });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status === 403 || error.status === 429 ? 429 : error.status || 500;
    res.status(status).json({
      error: status === 429
        ? 'GitHub API rate limit reached while scanning repository assets.'
        : error.message || 'Failed to scan repository graphic assets.',
    });
  }
});

app.get('/api/github/file/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const owner = String(req.params.owner);
    const repo = String(req.params.repo);
    const branch = String(req.query.branch || 'main');
    const filePath = String(req.query.path || '');

    if (!filePath || filePath.includes('..')) {
      res.status(400).json({ error: 'Invalid file path.' });
      return;
    }

    const cacheKey = `file:${owner}/${repo}:${branch}:${filePath}`;
    const cached = getCached<{ content: string; truncated: boolean; binary: boolean }>(cacheKey);
    if (cached) {
      res.json({ ...cached, cached: true });
      return;
    }

    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${encodedPath}`;
    const resp = await fetch(rawUrl, { headers: { 'User-Agent': 'RPG-Code-Atlas/1.0' } });

    if (!resp.ok) {
      res.status(resp.status).json({ error: `Unable to fetch file (${resp.status}).` });
      return;
    }

    const contentType = resp.headers.get('content-type') || '';
    const isLikelyBinary = /\.(png|jpg|jpeg|gif|webp|ico|bmp|ogg|mp3|wav|ttf|otf|woff2?|zip|tar|gz|exe|dll|so|bin|pdf|blend|fbx|glb|gltf|ase|aseprite)$/i.test(filePath)
      || (contentType.startsWith('image/') && !filePath.toLowerCase().endsWith('.svg'))
      || contentType.startsWith('audio/')
      || contentType.startsWith('application/octet-stream');

    if (isLikelyBinary) {
      const payload = { content: '', truncated: false, binary: true };
      setCached(cacheKey, payload, 1000 * 60 * 30);
      res.json({ ...payload, cached: false });
      return;
    }

    const text = await resp.text();
    const maxChars = 250000;
    const payload = {
      content: text.slice(0, maxChars),
      truncated: text.length > maxChars,
      binary: false,
    };
    setCached(cacheKey, payload, 1000 * 60 * 30);
    res.json({ ...payload, cached: false });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message || 'Failed to read file from GitHub.' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RPG Code Atlas listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
