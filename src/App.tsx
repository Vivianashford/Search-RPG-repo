import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlueprintView } from './components/BlueprintView';
import { FilterSidebar } from './components/FilterSidebar';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { RepoInspector } from './components/RepoInspector';
import { RepoList } from './components/RepoList';
import { SearchToolbar } from './components/SearchToolbar';
import { ShortlistModal } from './components/ShortlistModal';
import { TopBar } from './components/TopBar';
import { RPG_CATEGORIES } from './data/categories';
import type {
  BrowseMode,
  RepoSummary,
  SavedAssetItem,
  SearchFilters,
  SearchResponse,
  SortOption,
} from './types/github';

const DEFAULT_FILTERS: SearchFilters = {
  mode: 'blueprint',
  curatedGroup: 'all',
  q: '',
  exact: false,
  category: 'all',
  language: 'all',
  license: 'all',
  minStars: 25,
  sort: 'stars',
  page: 1,
};

const SHORTLIST_STORAGE_KEY = 'rpg-code-atlas:shortlist:v1';
const SAVED_ASSETS_STORAGE_KEY = 'rpg-code-atlas:assets:v1';
const PER_PAGE = 20;

function loadSavedShortlist(): RepoSummary[] {
  try {
    const raw = localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSavedAssets(): SavedAssetItem[] {
  try {
    const raw = localStorage.getItem(SAVED_ASSETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [liveDraft, setLiveDraft] = useState('');
  const [items, setItems] = useState<RepoSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [queryUsed, setQueryUsed] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [selectedRepo, setSelectedRepo] = useState<RepoSummary | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'code' | 'assets'>('overview');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [kitModalOpen, setKitModalOpen] = useState(false);
  const [shortlist, setShortlist] = useState<RepoSummary[]>(loadSavedShortlist);
  const [savedAssets, setSavedAssets] = useState<SavedAssetItem[]>(loadSavedAssets);

  useEffect(() => {
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(shortlist));
    } catch {
      // ignore storage quota failures
    }
  }, [shortlist]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_ASSETS_STORAGE_KEY, JSON.stringify(savedAssets));
    } catch {
      // ignore storage quota failures
    }
  }, [savedAssets]);

  useEffect(() => {
    if (filters.mode === 'blueprint') {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const endpoint =
      filters.mode === 'curated'
        ? `/api/github/curated-packs?group=${encodeURIComponent(filters.curatedGroup)}`
        : `/api/github/search?${new URLSearchParams({
            q: filters.q,
            exact: filters.exact ? '1' : '0',
            category: filters.category,
            language: filters.language,
            license: filters.license,
            minStars: String(filters.minStars),
            sort: filters.sort,
            page: String(filters.page),
            perPage: String(PER_PAGE),
          }).toString()}`;

    fetch(endpoint, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error || `Request failed with status ${res.status}`);
        }
        return body as SearchResponse;
      })
      .then((data) => {
        setItems(data.items || []);
        setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : (data.items || []).length);
        setQueryUsed(data.queryUsed || null);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Unable to query GitHub.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [filters, refreshTick]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (kitModalOpen) {
          setKitModalOpen(false);
        } else if (mobileFiltersOpen) {
          setMobileFiltersOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [kitModalOpen, mobileFiltersOpen]);

  const activePreset = useMemo(
    () => RPG_CATEGORIES.find((c) => c.id === filters.category) || RPG_CATEGORIES[0],
    [filters.category]
  );

  const shortlistIds = useMemo(
    () => new Set(shortlist.map((r) => r.id)),
    [shortlist]
  );

  const savedAssetIds = useMemo(
    () => new Set(savedAssets.map((a) => a.id)),
    [savedAssets]
  );

  const visibleItems = useMemo(() => {
    if (filters.mode !== 'curated') return items;
    const term = liveDraft.trim().toLowerCase();
    if (!term) return items;
    return items.filter((repo) => {
      const hay = `${repo.fullName} ${repo.description} ${repo.packHighlight || ''} ${repo.language} ${repo.topics.join(' ')}`.toLowerCase();
      return hay.includes(term);
    });
  }, [filters.mode, items, liveDraft]);

  const updateFilters = useCallback((patch: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setLiveDraft('');
    setQueryUsed(null);
    setSelectedRepo(null);
  }, []);

  const toggleShortlist = useCallback((repo: RepoSummary) => {
    setShortlist((prev) => {
      const exists = prev.some((item) => item.id === repo.id);
      if (exists) {
        return prev.filter((item) => item.id !== repo.id);
      }
      return [repo, ...prev];
    });
  }, []);

  const toggleSaveAsset = useCallback((asset: SavedAssetItem) => {
    setSavedAssets((prev) => {
      const exists = prev.some((item) => item.id === asset.id);
      if (exists) {
        return prev.filter((item) => item.id !== asset.id);
      }
      return [asset, ...prev];
    });
  }, []);

  const handleSelectRepo = useCallback(
    (repo: RepoSummary, preferredTab?: 'overview' | 'code' | 'assets') => {
      const defaultTab =
        preferredTab ||
        (filters.mode === 'curated' || activePreset.group === 'graphics' ? 'assets' : 'overview');
      setInspectorTab(defaultTab);
      setSelectedRepo(repo);
    },
    [filters.mode, activePreset.group]
  );

  const handleJumpToPillar = useCallback((pillarId: string) => {
    updateFilters({ mode: 'blueprint' });
    setTimeout(() => {
      document.getElementById(`pillar-${pillarId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [updateFilters]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        mode={filters.mode}
        activeCategory={filters.category}
        onSelectMode={(mode: BrowseMode) => updateFilters({ mode, page: 1 })}
        onSelectCategory={(categoryId) => updateFilters({ mode: 'search', category: categoryId, page: 1 })}
        kitCount={shortlist.length + savedAssets.length}
        onOpenKit={() => setKitModalOpen(true)}
        onResetAll={resetAll}
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto flex border-x border-slate-200 bg-white">
        <FilterSidebar
          filters={filters}
          onChange={updateFilters}
          onReset={resetAll}
          mobileOpen={mobileFiltersOpen}
          onCloseMobile={() => setMobileFiltersOpen(false)}
        />

        <main className="flex-1 min-w-0 flex">
          <div
            className={`min-w-0 flex flex-col ${
              selectedRepo ? 'w-full xl:w-[46%] xl:border-r xl:border-slate-200' : 'w-full'
            }`}
          >
            <GlobalSearchBar
              mode={filters.mode}
              query={filters.q}
              exact={filters.exact}
              queryUsed={queryUsed}
              onDraftChange={setLiveDraft}
              onSearchSubmit={(nextQuery, categoryOverride) => {
                updateFilters({
                  mode: 'search',
                  q: nextQuery,
                  exact: false,
                  category: categoryOverride ?? filters.category,
                  page: 1,
                });
              }}
              onToggleExact={(nextExact) => updateFilters({ exact: nextExact, page: 1 })}
              onJumpToPillar={handleJumpToPillar}
              onOpenMobileFilters={() => setMobileFiltersOpen(true)}
            />

            {filters.mode === 'blueprint' ? (
              <BlueprintView
                searchFilter={liveDraft}
                shortlistIds={shortlistIds}
                selectedRepoFullName={selectedRepo?.fullName ?? null}
                onInspectRepo={handleSelectRepo}
                onToggleShortlist={toggleShortlist}
                onSearchPillar={(category, query) => {
                  setLiveDraft(query);
                  updateFilters({ mode: 'search', category, q: query, exact: false, page: 1 });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ) : (
              <>
                <SearchToolbar
                  mode={filters.mode}
                  curatedGroup={filters.curatedGroup}
                  sort={filters.sort}
                  totalCount={filters.mode === 'curated' ? visibleItems.length : totalCount}
                  loading={loading}
                  activePreset={activePreset}
                  onSortChange={(sort: SortOption) => updateFilters({ mode: 'search', sort, page: 1 })}
                  onCuratedGroupChange={(curatedGroup) => updateFilters({ mode: 'curated', curatedGroup })}
                />

                <RepoList
                  items={visibleItems}
                  loading={loading}
                  error={error}
                  selectedRepoFullName={selectedRepo?.fullName ?? null}
                  shortlistIds={shortlistIds}
                  page={filters.page}
                  totalCount={totalCount ?? 0}
                  perPage={PER_PAGE}
                  showPagination={filters.mode === 'search'}
                  onSelectRepo={handleSelectRepo}
                  onToggleShortlist={toggleShortlist}
                  onTopicClick={(topic) => {
                    setLiveDraft(topic);
                    updateFilters({ mode: 'search', q: topic, exact: false, page: 1 });
                  }}
                  onPageChange={(nextPage) => {
                    updateFilters({ page: nextPage });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onRetry={() => setRefreshTick((t) => t + 1)}
                  onResetFilters={() => {
                    setLiveDraft('');
                    updateFilters({ mode: 'curated', curatedGroup: 'all', q: '' });
                  }}
                />
              </>
            )}
          </div>

          {selectedRepo && (
            <>
              <div className="hidden xl:block xl:w-[54%] sticky top-16 h-[calc(100vh-4rem)] min-w-0">
                <RepoInspector
                  repo={selectedRepo}
                  initialTab={inspectorTab}
                  assetSearchHint={liveDraft || filters.q}
                  isSaved={shortlistIds.has(selectedRepo.id)}
                  savedAssetIds={savedAssetIds}
                  onToggleShortlist={toggleShortlist}
                  onToggleSaveAsset={toggleSaveAsset}
                  onClose={() => setSelectedRepo(null)}
                />
              </div>

              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Inspecting ${selectedRepo.fullName}`}
                className="fixed inset-0 z-40 xl:hidden flex justify-end"
              >
                <div
                  className="fixed inset-0 bg-slate-900/40"
                  onClick={() => setSelectedRepo(null)}
                  aria-hidden="true"
                />
                <div className="relative z-10 w-full max-w-3xl h-full bg-white shadow-2xl border-l border-slate-200">
                  <RepoInspector
                    repo={selectedRepo}
                    initialTab={inspectorTab}
                    assetSearchHint={liveDraft || filters.q}
                    isSaved={shortlistIds.has(selectedRepo.id)}
                    savedAssetIds={savedAssetIds}
                    onToggleShortlist={toggleShortlist}
                    onToggleSaveAsset={toggleSaveAsset}
                    onClose={() => setSelectedRepo(null)}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {kitModalOpen && (
        <ShortlistModal
          repos={shortlist}
          assets={savedAssets}
          onClose={() => setKitModalOpen(false)}
          onRemoveRepo={(repoId) => setShortlist((prev) => prev.filter((r) => r.id !== repoId))}
          onRemoveAsset={(assetId) => setSavedAssets((prev) => prev.filter((a) => a.id !== assetId))}
          onInspectRepo={(repo) => handleSelectRepo(repo, 'overview')}
          onClearRepos={() => setShortlist([])}
          onClearAssets={() => setSavedAssets([])}
        />
      )}
    </div>
  );
}
