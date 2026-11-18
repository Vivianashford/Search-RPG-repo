export interface RepoOwner {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface RepoSummary {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  homepage: string | null;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  topics: string[];
  license: string | null;
  defaultBranch: string;
  updatedAt: string;
  pushedAt: string;
  sizeKb: number;
  archived: boolean;
  packHighlight?: string | null;
  owner: RepoOwner;
}

export interface SearchResponse {
  totalCount: number;
  incompleteResults?: boolean;
  queryUsed?: string;
  rateLimitRemaining?: number | null;
  cached?: boolean;
  items: RepoSummary[];
}

export interface RepoDetailResponse {
  repo: RepoSummary;
  languages: Record<string, number>;
  readme: string | null;
  cached?: boolean;
}

export interface TreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size: number;
}

export interface TreeResponse {
  truncated: boolean;
  entries: TreeEntry[];
  cached?: boolean;
}

export interface FileResponse {
  content: string;
  truncated: boolean;
  binary: boolean;
  cached?: boolean;
}

export type AssetKind = 'image' | 'tilemap' | 'model3d' | 'audio' | 'source_art';

export type AssetCategoryKey =
  | 'sprites'
  | 'buildings'
  | 'tilesets'
  | 'items_ui'
  | 'effects'
  | 'models_3d'
  | 'audio'
  | 'other_art';

export interface RepoAsset {
  path: string;
  name: string;
  ext: string;
  size: number;
  kind: AssetKind;
  category: AssetCategoryKey;
  rawUrl: string;
}

export interface RepoAssetsResponse {
  totalAssets: number;
  truncated: boolean;
  countsByCategory: Record<AssetCategoryKey, number>;
  assets: RepoAsset[];
  cached?: boolean;
}

export interface SavedAssetItem extends RepoAsset {
  id: string;
  repoFullName: string;
  repoHtmlUrl: string;
  license: string | null;
}

export type SortOption = 'stars' | 'updated' | 'forks' | 'best-match';

export type BrowseMode = 'blueprint' | 'search' | 'curated';

export interface SearchFilters {
  mode: BrowseMode;
  curatedGroup: 'all' | 'sprites' | 'buildings' | 'icons' | 'engines';
  q: string;
  exact: boolean;
  category: string;
  language: string;
  license: string;
  minStars: number;
  sort: SortOption;
  page: number;
}

export interface CategoryPreset {
  id: string;
  group: 'code' | 'graphics';
  label: string;
  description: string;
  sampleQueries: string[];
}
