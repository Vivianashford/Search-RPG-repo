import { Bookmark, ChevronLeft, ChevronRight, Code2, ExternalLink, GitFork, Image, RefreshCw, Star } from 'lucide-react';
import { useState } from 'react';
import type { RepoSummary } from '../types/github';
import { formatCompactNumber, formatRelativeDate } from '../utils/format';

interface RepoListProps {
  items: RepoSummary[];
  loading: boolean;
  error: string | null;
  selectedRepoFullName: string | null;
  shortlistIds: Set<number>;
  page: number;
  totalCount: number;
  perPage: number;
  showPagination: boolean;
  onSelectRepo: (repo: RepoSummary, initialTab?: 'overview' | 'code' | 'assets') => void;
  onToggleShortlist: (repo: RepoSummary) => void;
  onTopicClick: (topic: string) => void;
  onPageChange: (nextPage: number) => void;
  onRetry: () => void;
  onResetFilters: () => void;
}

function OwnerAvatar({ login, avatarUrl }: { login: string; avatarUrl: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !avatarUrl) {
    return (
      <div
        aria-hidden="true"
        className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0"
      >
        {login.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={`${login} avatar`}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-8 h-8 rounded-md border border-slate-200 object-cover shrink-0 bg-slate-100"
    />
  );
}

export function RepoList({
  items,
  loading,
  error,
  selectedRepoFullName,
  shortlistIds,
  page,
  totalCount,
  perPage,
  showPagination,
  onSelectRepo,
  onToggleShortlist,
  onTopicClick,
  onPageChange,
  onRetry,
  onResetFilters,
}: RepoListProps) {
  const maxAccessibleResults = Math.min(totalCount, 1000);
  const totalPages = Math.max(1, Math.ceil(maxAccessibleResults / perPage));

  if (loading && items.length === 0) {
    return (
      <div className="divide-y divide-slate-200 bg-white border-b border-slate-200" aria-busy="true">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="px-4 sm:px-6 py-4 animate-pulse">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-slate-200" />
                <div className="h-4 w-48 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-20 bg-slate-200 rounded" />
            </div>
            <div className="h-3.5 w-3/4 bg-slate-100 rounded mt-3" />
            <div className="h-3 w-1/2 bg-slate-100 rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Unable to load GitHub repositories</h2>
        <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">{error}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Retry Query
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          >
            View Verified Packs
          </button>
        </div>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">No matching RPG repositories found</h2>
        <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
          Try lowering the minimum star threshold, choosing Any License, or browsing the Verified Art &amp; Starter Packs.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
        >
          View Verified Packs
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="divide-y divide-slate-200 bg-white border-b border-slate-200">
        {items.map((repo) => {
          const isSelected = selectedRepoFullName === repo.fullName;
          const isSaved = shortlistIds.has(repo.id);

          return (
            <article
              key={repo.id}
              className={`px-4 sm:px-6 py-4 transition-colors ${
                isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <OwnerAvatar login={repo.owner.login} avatarUrl={repo.owner.avatarUrl} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                      <button
                        type="button"
                        onClick={() => onSelectRepo(repo)}
                        className="text-base font-semibold text-slate-900 hover:text-blue-600 text-left truncate max-w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                      >
                        {repo.fullName}
                      </button>
                    </div>

                    {repo.packHighlight && (
                      <p className="text-xs font-medium text-blue-700 mt-0.5">
                        {repo.packHighlight}
                      </p>
                    )}

                    <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{repo.language}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums text-slate-700 font-mono">
                        <Star className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                        {formatCompactNumber(repo.stars)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums font-mono">
                        <GitFork className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        {formatCompactNumber(repo.forks)}
                      </span>
                      {repo.license && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{repo.license}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">Updated {formatRelativeDate(repo.pushedAt)}</span>
                    </div>

                    {repo.topics.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {repo.topics.slice(0, 5).map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => onTopicClick(topic)}
                            className="text-slate-500 hover:text-blue-600 hover:underline font-mono cursor-pointer transition-colors"
                          >
                            #{topic}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleShortlist(repo)}
                    aria-label={isSaved ? `Remove ${repo.fullName} from Game Kit` : `Save ${repo.fullName} to Game Kit`}
                    aria-pressed={isSaved}
                    className={`h-9 px-2.5 inline-flex items-center justify-center rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      isSaved
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRepo(repo, 'assets')}
                    title="Inspect sprites, buildings & graphics inside this repo"
                    className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <Image className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Sprites</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRepo(repo, 'code')}
                    className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Code
                  </button>

                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${repo.fullName} on GitHub`}
                    className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="px-4 sm:px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-600 tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
