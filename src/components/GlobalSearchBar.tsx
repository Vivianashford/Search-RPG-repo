import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FF2_BLUEPRINT_PILLARS } from '../data/ff2Blueprint';
import type { BrowseMode } from '../types/github';

interface GlobalSearchBarProps {
  mode: BrowseMode;
  query: string;
  exact: boolean;
  queryUsed: string | null;
  onDraftChange: (draft: string) => void;
  onSearchSubmit: (query: string, category?: string) => void;
  onToggleExact: (nextExact: boolean) => void;
  onJumpToPillar: (pillarId: string) => void;
  onOpenMobileFilters: () => void;
}

const QUICK_INTENTS: { label: string; category: string; query: string }[] = [
  { label: 'Towns & Houses', category: 'buildings', query: 'houses buildings tileset' },
  { label: 'Hero & Boss Sprites', category: 'sprites', query: 'lpc spritesheet' },
  { label: 'ATB / Turn Combat', category: 'combat', query: 'turn based combat' },
  { label: 'Keyword Dialogue', category: 'narrative', query: 'dialogue system' },
  { label: 'Menus & Item Icons', category: 'icons', query: 'game icons' },
  { label: 'World Map & Dungeons', category: 'roguelike', query: 'dungeon tilemap' },
  { label: 'Retro BGM & SFX', category: 'all', query: 'chiptune sfx' },
  { label: 'Godot / Unity JRPG', category: 'fullkits', query: 'godot jrpg' },
];

export function GlobalSearchBar({
  mode,
  query,
  exact,
  queryUsed,
  onDraftChange,
  onSearchSubmit,
  onToggleExact,
  onJumpToPillar,
  onOpenMobileFilters,
}: GlobalSearchBarProps) {
  const [draft, setDraft] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const matchingPillars = useMemo(() => {
    const term = draft.trim().toLowerCase();
    if (!term || term.length < 2) return [];
    return FF2_BLUEPRINT_PILLARS.filter((pillar) => {
      const hay = [
        pillar.title,
        pillar.summary,
        ...pillar.technicalNotes,
        ...pillar.checklist.map((c) => `${c.title} ${c.spec}`),
        ...pillar.recommendedRepos.map((r) => `${r.fullName} ${r.role}`),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    }).slice(0, 4);
  }, [draft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(draft.trim());
  };

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3.5">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden inline-flex items-center justify-center gap-1.5 px-3 h-10 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="search"
                value={draft}
                onChange={(e) => {
                  const val = e.target.value;
                  setDraft(val);
                  onDraftChange(val);
                }}
                placeholder="Describe what you need in plain English (e.g. town houses, boss sprites, atb battle, keyword dialogue)..."
                aria-label="Search FF2 blueprint, art packs, and GitHub repositories"
                className="w-full h-10 pl-10 pr-9 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
              {draft && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft('');
                    onDraftChange('');
                    if (mode === 'search') {
                      onSearchSubmit('');
                    }
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="h-10 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Search GitHub
            </button>
          </form>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1">Quick find:</span>
          {QUICK_INTENTS.map((intent) => (
            <button
              key={intent.label}
              type="button"
              onClick={() => {
                setDraft(intent.query);
                onDraftChange(intent.query);
                onSearchSubmit(intent.query, intent.category);
              }}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-blue-400 hover:text-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {intent.label}
            </button>
          ))}
        </div>

        {matchingPillars.length > 0 && mode !== 'search' && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-0.5">
            <span className="font-medium text-slate-700">Matching Blueprint pillars:</span>
            {matchingPillars.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onJumpToPillar(p.id)}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                {p.number}. {p.title}
              </button>
            ))}
          </div>
        )}

        {mode === 'search' && queryUsed && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-mono truncate">
              GitHub query: <span className="text-slate-700">{queryUsed}</span>
            </span>
            {query.trim() && (
              <button
                type="button"
                onClick={() => onToggleExact(!exact)}
                className="text-blue-600 hover:underline font-medium cursor-pointer whitespace-nowrap shrink-0"
              >
                {exact ? 'Use smart intent search' : 'Search exact words instead'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
