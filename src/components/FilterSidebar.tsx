import { RotateCcw, X } from 'lucide-react';
import {
  CURATED_GROUPS,
  LANGUAGE_OPTIONS,
  LICENSE_OPTIONS,
  MIN_STARS_OPTIONS,
  RPG_CATEGORIES,
} from '../data/categories';
import type { SearchFilters } from '../types/github';

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onReset: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function FilterSidebar({
  filters,
  onChange,
  onReset,
  mobileOpen,
  onCloseMobile,
}: FilterSidebarProps) {
  const codeCategories = RPG_CATEGORIES.filter((c) => c.group === 'code');
  const graphicsCategories = RPG_CATEGORIES.filter((c) => c.group === 'graphics');

  const hasCustomFilters =
    filters.category !== 'all' ||
    filters.language !== 'all' ||
    filters.license !== 'all' ||
    filters.minStars !== 25 ||
    filters.q.trim() !== '' ||
    filters.curatedGroup !== 'all';

  const content = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Workspace &amp; Index</h2>
        <div className="flex items-center gap-2">
          {hasCustomFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1.5 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => {
            onChange({ mode: 'blueprint' });
            onCloseMobile();
          }}
          className={`px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            filters.mode === 'blueprint'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Blueprint
        </button>
        <button
          type="button"
          onClick={() => {
            onChange({ mode: 'curated' });
            onCloseMobile();
          }}
          className={`px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            filters.mode === 'curated'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Packs
        </button>
        <button
          type="button"
          onClick={() => {
            onChange({ mode: 'search', page: 1 });
            onCloseMobile();
          }}
          className={`px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            filters.mode === 'search'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Search
        </button>
      </div>

      {filters.mode === 'curated' && (
        <section aria-label="Verified art and code collections" className="border-t border-slate-200 pt-4">
          <h3 className="text-xs font-semibold text-slate-500 mb-2.5">Verified Art &amp; Starter Packs</h3>
          <div className="flex flex-col gap-1">
            {CURATED_GROUPS.map((grp) => {
              const active = filters.curatedGroup === grp.id;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => {
                    onChange({ mode: 'curated', curatedGroup: grp.id });
                    onCloseMobile();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="block truncate">{grp.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section aria-label="Sprites, buildings and graphic assets" className="border-t border-slate-200 pt-4">
        <h3 className="text-xs font-semibold text-slate-500 mb-2.5">Sprites, Buildings &amp; Graphics</h3>
        <div className="flex flex-col gap-1">
          {graphicsCategories.map((cat) => {
            const active = filters.mode === 'search' && filters.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange({ mode: 'search', category: cat.id, page: 1 });
                  onCloseMobile();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="block truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="RPG code and engine categories" className="border-t border-slate-200 pt-4">
        <h3 className="text-xs font-semibold text-slate-500 mb-2.5">Code &amp; Game Systems</h3>
        <div className="flex flex-col gap-1">
          {codeCategories.map((cat) => {
            const active = filters.mode === 'search' && filters.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange({ mode: 'search', category: cat.id, page: 1 });
                  onCloseMobile();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="block truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {filters.mode === 'search' && (
        <>
          <section aria-label="Language or engine" className="border-t border-slate-200 pt-4">
            <label htmlFor="filter-language" className="block text-xs font-semibold text-slate-500 mb-2">
              Engine / Language
            </label>
            <select
              id="filter-language"
              value={filters.language}
              onChange={(e) => onChange({ language: e.target.value, page: 1 })}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          <section aria-label="Minimum stars" className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 mb-2.5">Minimum Stars</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {MIN_STARS_OPTIONS.map((opt) => {
                const active = filters.minStars === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ minStars: opt.value, page: 1 })}
                    className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-left transition-colors cursor-pointer tabular-nums whitespace-nowrap truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-label="Open source license" className="border-t border-slate-200 pt-4">
            <label htmlFor="filter-license" className="block text-xs font-semibold text-slate-500 mb-2">
              License
            </label>
            <select
              id="filter-license"
              value={filters.license}
              onChange={(e) => onChange({ license: e.target.value, page: 1 })}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
            >
              {LICENSE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>
        </>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 bg-white p-5">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-5 border-r border-slate-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
