import { Bookmark, CheckSquare, Code2, Image, Search, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FF2_BLUEPRINT_PILLARS } from '../data/ff2Blueprint';
import type { RepoSummary } from '../types/github';
import { formatCompactNumber } from '../utils/format';

interface BlueprintViewProps {
  searchFilter: string;
  shortlistIds: Set<number>;
  selectedRepoFullName: string | null;
  onInspectRepo: (repo: RepoSummary, tab: 'overview' | 'code' | 'assets') => void;
  onToggleShortlist: (repo: RepoSummary) => void;
  onSearchPillar: (category: string, query: string) => void;
}

const CHECKLIST_STORAGE_KEY = 'rpg-code-atlas:ff2-checklist:v1';

function loadCheckedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export function BlueprintView({
  searchFilter,
  shortlistIds,
  selectedRepoFullName,
  onInspectRepo,
  onToggleShortlist,
  onSearchPillar,
}: BlueprintViewProps) {
  const [domainFilter, setDomainFilter] = useState<'all' | 'code' | 'graphics' | 'audio'>('all');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(loadCheckedIds);
  const [repoMap, setRepoMap] = useState<Record<string, RepoSummary>>({});
  const [loadingRepos, setLoadingRepos] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify([...checkedIds]));
    } catch {
      // ignore storage failure
    }
  }, [checkedIds]);

  useEffect(() => {
    const allNames = Array.from(
      new Set(
        FF2_BLUEPRINT_PILLARS.flatMap((pillar) =>
          pillar.recommendedRepos.map((r) => r.fullName)
        )
      )
    );

    let cancelled = false;
    setLoadingRepos(true);

    fetch(`/api/github/repos/batch?names=${encodeURIComponent(allNames.join(','))}`)
      .then((res) => res.json())
      .then((data: { items?: RepoSummary[] }) => {
        if (cancelled) return;
        const map: Record<string, RepoSummary> = {};
        for (const item of data.items || []) {
          map[item.fullName.toLowerCase()] = item;
        }
        setRepoMap(map);
      })
      .catch(() => {
        // leave repoMap empty on transient failure
      })
      .finally(() => {
        if (!cancelled) setLoadingRepos(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalChecklistCount = useMemo(
    () => FF2_BLUEPRINT_PILLARS.reduce((sum, p) => sum + p.checklist.length, 0),
    []
  );

  const completedCount = useMemo(() => {
    let count = 0;
    for (const p of FF2_BLUEPRINT_PILLARS) {
      for (const item of p.checklist) {
        if (checkedIds.has(item.id)) count += 1;
      }
    }
    return count;
  }, [checkedIds]);

  const toggleChecklistItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visiblePillars = useMemo(() => {
    const term = searchFilter.trim().toLowerCase();
    return FF2_BLUEPRINT_PILLARS.filter((p) => {
      if (domainFilter !== 'all' && p.domain !== domainFilter) return false;
      if (!term) return true;
      const hay = [
        p.title,
        p.summary,
        ...p.technicalNotes,
        ...p.checklist.map((c) => `${c.title} ${c.spec}`),
        ...p.recommendedRepos.map((r) => `${r.fullName} ${r.role}`),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [domainFilter, searchFilter]);

  return (
    <div className="flex flex-col bg-white">
      <div className="px-4 sm:px-6 py-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              FF2-Style JRPG Architecture &amp; Asset Blueprint
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Every engine system, combat formula, sprite sheet, building tileset, UI window, and audio asset required to build a classic 8-bit/16-bit Final Fantasy II style RPG—mapped directly to live GitHub repositories.
            </p>
          </div>

          <div className="text-xs text-slate-600 tabular-nums whitespace-nowrap shrink-0">
            <span className="font-semibold text-slate-900">{completedCount}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalChecklistCount}</span> components checked
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter blueprint domains"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            {(
              [
                { id: 'all', label: 'All 8 Pillars' },
                { id: 'code', label: 'Code & Systems' },
                { id: 'graphics', label: 'Sprites, Buildings & UI' },
                { id: 'audio', label: 'Audio & SFX' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDomainFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  domainFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => setCheckedIds(new Set())}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Reset Checklist
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {visiblePillars.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-base font-semibold text-slate-900">
              No Blueprint pillar matches &ldquo;{searchFilter}&rdquo;
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Search all public GitHub repositories directly for this keyword instead.
            </p>
            <button
              type="button"
              onClick={() => onSearchPillar('all', searchFilter)}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Search GitHub for &ldquo;{searchFilter}&rdquo;
            </button>
          </div>
        ) : (
          visiblePillars.map((pillar) => {
          const pillarDone = pillar.checklist.filter((c) => checkedIds.has(c.id)).length;
          const domainLabel =
            pillar.domain === 'code'
              ? 'Code & Engine'
              : pillar.domain === 'graphics'
              ? 'Sprites & Art'
              : 'Audio & SFX';

          return (
            <section id={`pillar-${pillar.id}`} key={pillar.id} className="px-4 sm:px-6 py-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 tabular-nums">
                    <span className="font-semibold text-blue-700">{domainLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {pillarDone}/{pillar.checklist.length} ready
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {pillar.number}. {pillar.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                    {pillar.summary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSearchPillar(pillar.searchCategory, pillar.searchQuery)}
                  className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0 self-start"
                >
                  <Search className="w-3.5 h-3.5" aria-hidden="true" />
                  Search More on GitHub
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 mb-2">
                      Implementation Checklist
                    </h3>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                      {pillar.checklist.map((item) => {
                        const checked = checkedIds.has(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleChecklistItem(item.id)}
                            className="w-full px-3.5 py-2.5 flex items-start gap-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            {checked ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                            )}
                            <div className="min-w-0">
                              <div
                                className={`text-sm font-medium ${
                                  checked ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {item.title}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                {item.spec}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 mb-1.5">
                      FF2 Technical &amp; Art Specifications
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed list-disc pl-4">
                      {pillar.technicalNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 mb-2">
                    Verified GitHub Repositories for This Pillar
                  </h3>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-slate-50/50">
                    {pillar.recommendedRepos.map((rec) => {
                      const liveRepo = repoMap[rec.fullName.toLowerCase()];
                      const isSelected = selectedRepoFullName === rec.fullName;
                      const isSaved = liveRepo ? shortlistIds.has(liveRepo.id) : false;

                      return (
                        <div
                          key={rec.fullName}
                          className={`p-3.5 flex items-start justify-between gap-3 ${
                            isSelected ? 'bg-blue-50/80' : 'bg-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {rec.fullName}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {rec.role}
                            </p>
                            {liveRepo ? (
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 tabular-nums font-mono">
                                <span>{liveRepo.language}</span>
                                <span aria-hidden="true">·</span>
                                <span>{formatCompactNumber(liveRepo.stars)} stars</span>
                                {liveRepo.license && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{liveRepo.license}</span>
                                  </>
                                )}
                              </div>
                            ) : loadingRepos ? (
                              <div className="mt-1.5 text-[11px] text-slate-400">
                                Loading GitHub stats...
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {liveRepo && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onToggleShortlist(liveRepo)}
                                  aria-label={isSaved ? `Remove ${rec.fullName} from Game Kit` : `Save ${rec.fullName} to Game Kit`}
                                  className={`h-8 w-8 inline-flex items-center justify-center rounded-md border cursor-pointer ${
                                    isSaved
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onInspectRepo(liveRepo, rec.openTab)}
                                  className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border text-xs font-medium cursor-pointer whitespace-nowrap ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {rec.openTab === 'assets' ? (
                                    <Image className="w-3.5 h-3.5" aria-hidden="true" />
                                  ) : (
                                    <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  )}
                                  {rec.openTab === 'assets' ? 'Sprites' : 'Inspect'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          );
        })
        )}
      </div>
    </div>
  );
}
