import { Check, Copy, Download, ExternalLink, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { ASSET_CATEGORY_LABELS } from '../data/categories';
import type { RepoSummary, SavedAssetItem } from '../types/github';
import { formatBytes, formatCompactNumber } from '../utils/format';

interface ShortlistModalProps {
  repos: RepoSummary[];
  assets: SavedAssetItem[];
  onClose: () => void;
  onRemoveRepo: (repoId: number) => void;
  onRemoveAsset: (assetId: string) => void;
  onInspectRepo: (repo: RepoSummary) => void;
  onClearRepos: () => void;
  onClearAssets: () => void;
}

export function ShortlistModal({
  repos,
  assets,
  onClose,
  onRemoveRepo,
  onRemoveAsset,
  onInspectRepo,
  onClearRepos,
  onClearAssets,
}: ShortlistModalProps) {
  const [tab, setTab] = useState<'repos' | 'assets'>(repos.length > 0 ? 'repos' : assets.length > 0 ? 'assets' : 'repos');
  const [copiedType, setCopiedType] = useState<'bash' | 'markdown' | 'assets_bash' | 'credits' | null>(null);

  const bashScript = [
    '#!/usr/bin/env bash',
    'set -e',
    'mkdir -p rpg-codebases && cd rpg-codebases',
    ...repos.map((r) => `git clone ${r.cloneUrl}`),
  ].join('\n');

  const markdownSummary = [
    '| Repository | Language | Stars | License | Link |',
    '| --- | --- | ---: | --- | --- |',
    ...repos.map(
      (r) =>
        `| ${r.fullName} | ${r.language} | ${r.stars.toLocaleString('en-US')} | ${r.license || 'Unspecified'} | ${r.htmlUrl} |`
    ),
  ].join('\n');

  const assetsDownloadScript = [
    '#!/usr/bin/env bash',
    'set -e',
    ...assets.map((a) => {
      const folder = `game-assets/${a.category}`;
      return `mkdir -p "${folder}" && curl -fsSL "${a.rawUrl}" -o "${folder}/${a.name}"`;
    }),
  ].join('\n');

  const assetsCreditsMd = [
    '# Game Asset Attribution & Credits',
    '',
    '| Asset | Category | Source Repo | License | Direct URL |',
    '| --- | --- | --- | --- | --- |',
    ...assets.map(
      (a) =>
        `| ${a.name} | ${ASSET_CATEGORY_LABELS[a.category]} | ${a.repoFullName} | ${a.license || 'Check repo'} | ${a.rawUrl} |`
    ),
  ].join('\n');

  const handleCopy = (type: 'bash' | 'markdown' | 'assets_bash' | 'credits') => {
    const text =
      type === 'bash'
        ? bashScript
        : type === 'markdown'
        ? markdownSummary
        : type === 'assets_bash'
        ? assetsDownloadScript
        : assetsCreditsMd;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortlist-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="shortlist-dialog-title" className="text-lg font-bold text-slate-900">
              Game Builder Kit
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Export git clone scripts for saved engines and batch curl download scripts for picked sprites, buildings, and tilesets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Game Kit"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50">
          <div role="tablist" className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'repos'}
              onClick={() => setTab('repos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer tabular-nums ${
                tab === 'repos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Repositories ({repos.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'assets'}
              onClick={() => setTab('assets')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer tabular-nums ${
                tab === 'assets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Picked Sprites &amp; Graphics ({assets.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
          {tab === 'repos' ? (
            repos.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-slate-900">No repositories saved yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Bookmark any RPG engine, art pack, or starter kit while browsing to generate a batch clone script.
                </p>
              </div>
            ) : (
              repos.map((repo) => (
                <div key={repo.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        onInspectRepo(repo);
                        onClose();
                      }}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate block text-left cursor-pointer"
                    >
                      {repo.fullName}
                    </button>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{repo.language}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-mono">{formatCompactNumber(repo.stars)} stars</span>
                      {repo.license && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{repo.license}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${repo.fullName} on GitHub`}
                      className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveRepo(repo.id)}
                      aria-label={`Remove ${repo.fullName}`}
                      className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : assets.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900">No individual sprites or graphics saved yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Open any repository&apos;s Sprites &amp; Graphics tab and bookmark individual character sheets, buildings, tilesets, or icons.
              </p>
            </div>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-md border border-slate-200 bg-checkerboard flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    {asset.kind === 'image' ? (
                      <img
                        src={asset.rawUrl}
                        alt={asset.name}
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain pixelated"
                      />
                    ) : (
                      <span className="text-[10px] font-mono uppercase text-slate-600">{asset.ext}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-mono font-semibold text-slate-900 truncate">
                      {asset.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate tabular-nums">
                      {ASSET_CATEGORY_LABELS[asset.category]} · {asset.repoFullName} · {formatBytes(asset.size)}
                      {asset.license ? ` · ${asset.license}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={asset.rawUrl}
                    download={asset.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Download ${asset.name}`}
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveAsset(asset.id)}
                    aria-label={`Remove ${asset.name}`}
                    className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {tab === 'repos' && repos.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClearRepos}
              className="text-xs font-medium text-slate-600 hover:text-rose-600 cursor-pointer"
            >
              Clear Repositories
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy('markdown')}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedType === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'markdown' ? 'Copied Markdown' : 'Copy Markdown Table'}
              </button>
              <button
                type="button"
                onClick={() => handleCopy('bash')}
                className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedType === 'bash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'bash' ? 'Copied Clone Script' : 'Copy Clone Script'}
              </button>
            </div>
          </div>
        )}

        {tab === 'assets' && assets.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClearAssets}
              className="text-xs font-medium text-slate-600 hover:text-rose-600 cursor-pointer"
            >
              Clear Picked Assets
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy('credits')}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedType === 'credits' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'credits' ? 'Copied Credits' : 'Copy Credits & Licenses'}
              </button>
              <button
                type="button"
                onClick={() => handleCopy('assets_bash')}
                className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedType === 'assets_bash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'assets_bash' ? 'Copied Download Script' : 'Copy Asset Download Script'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
