import { CURATED_GROUPS } from '../data/categories';
import type { BrowseMode, CategoryPreset, SortOption } from '../types/github';

interface SearchToolbarProps {
  mode: BrowseMode;
  curatedGroup: 'all' | 'sprites' | 'buildings' | 'icons' | 'engines';
  sort: SortOption;
  totalCount: number | null;
  loading: boolean;
  activePreset: CategoryPreset;
  onSortChange: (sort: SortOption) => void;
  onCuratedGroupChange: (group: 'all' | 'sprites' | 'buildings' | 'icons' | 'engines') => void;
}

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'stars', label: 'Stars' },
  { id: 'updated', label: 'Updated' },
  { id: 'forks', label: 'Forks' },
  { id: 'best-match', label: 'Relevance' },
];

export function SearchToolbar({
  mode,
  curatedGroup,
  sort,
  totalCount,
  loading,
  activePreset,
  onSortChange,
  onCuratedGroupChange,
}: SearchToolbarProps) {
  const heading = mode === 'curated'
    ? 'Verified RPG Art, Buildings & Starter Packs'
    : activePreset.label;

  const subtitle = mode === 'curated'
    ? 'Open-source GitHub repositories containing thousands of live-previewable character sprites, town buildings, tilesets, UI icons, and full RPG codebases.'
    : activePreset.description;

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            {heading}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3 shrink-0">
          <div className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
            {loading ? (
              <span>Loading from GitHub...</span>
            ) : totalCount !== null ? (
              <span>{totalCount.toLocaleString('en-US')} repositories</span>
            ) : null}
          </div>

          {mode === 'search' ? (
            <div
              role="group"
              aria-label="Sort repositories"
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              {SORT_OPTIONS.map((opt) => {
                const active = sort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSortChange(opt.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              role="group"
              aria-label="Filter verified packs"
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto"
            >
              {CURATED_GROUPS.map((grp) => {
                const active = curatedGroup === grp.id;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => onCuratedGroupChange(grp.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {grp.label.replace('Verified ', '')}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
