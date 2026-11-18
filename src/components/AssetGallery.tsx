import {
  ArrowLeft,
  Bookmark,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileCode2,
  Map as MapIcon,
  Music,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ASSET_CATEGORY_LABELS } from '../data/categories';
import type {
  AssetCategoryKey,
  RepoAsset,
  RepoAssetsResponse,
  RepoSummary,
  SavedAssetItem,
} from '../types/github';
import { formatBytes } from '../utils/format';

interface AssetGalleryProps {
  repo: RepoSummary;
  initialSearch?: string;
  savedAssetIds: Set<string>;
  onToggleSaveAsset: (asset: SavedAssetItem) => void;
  onOpenFileInCode: (path: string) => void;
}

type BackdropMode = 'checker' | 'light' | 'dark';
type GridSize = 0 | 16 | 32 | 48 | 64;

const PAGE_SIZE = 48;

function AssetThumbnail({
  asset,
  backdrop,
  pixelated,
}: {
  asset: RepoAsset;
  backdrop: BackdropMode;
  pixelated: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const bgClass =
    backdrop === 'checker'
      ? 'bg-checkerboard'
      : backdrop === 'dark'
      ? 'bg-slate-900'
      : 'bg-white';

  if (asset.kind === 'image') {
    if (failed) {
      return (
        <div className={`h-28 w-full flex items-center justify-center ${bgClass} text-xs text-slate-400`}>
          Preview unavailable
        </div>
      );
    }

    return (
      <div className={`h-28 w-full flex items-center justify-center p-2 overflow-hidden ${bgClass}`}>
        <img
          src={asset.rawUrl}
          alt={asset.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={`max-h-full max-w-full object-contain ${pixelated ? 'pixelated' : ''}`}
        />
      </div>
    );
  }

  if (asset.kind === 'audio') {
    return (
      <div className="h-28 w-full flex flex-col items-center justify-center gap-2 bg-slate-100 px-3">
        <Music className="w-5 h-5 text-slate-500" aria-hidden="true" />
        <audio controls preload="none" src={asset.rawUrl} className="w-full h-8" />
      </div>
    );
  }

  if (asset.kind === 'tilemap') {
    return (
      <div className="h-28 w-full flex flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-600">
        <MapIcon className="w-6 h-6 text-slate-500" aria-hidden="true" />
        <span className="text-[11px] font-mono uppercase">{asset.ext} map</span>
      </div>
    );
  }

  if (asset.kind === 'model3d') {
    return (
      <div className="h-28 w-full flex flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-600">
        <Box className="w-6 h-6 text-slate-500" aria-hidden="true" />
        <span className="text-[11px] font-mono uppercase">{asset.ext} 3D</span>
      </div>
    );
  }

  return (
    <div className="h-28 w-full flex flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-600">
      <FileCode2 className="w-6 h-6 text-slate-500" aria-hidden="true" />
      <span className="text-[11px] font-mono uppercase">{asset.ext}</span>
    </div>
  );
}

export function AssetGallery({
  repo,
  initialSearch = '',
  savedAssetIds,
  onToggleSaveAsset,
  onOpenFileInCode,
}: AssetGalleryProps) {
  const [data, setData] = useState<RepoAssetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<AssetCategoryKey | 'all'>('all');
  const [search, setSearch] = useState('');
  const [backdrop, setBackdrop] = useState<BackdropMode>('checker');
  const [pixelated, setPixelated] = useState(true);
  const [page, setPage] = useState(1);

  const [inspectedAsset, setInspectedAsset] = useState<RepoAsset | null>(null);
  const [zoom, setZoom] = useState<1 | 2 | 4 | 6>(2);
  const [gridSize, setGridSize] = useState<GridSize>(0);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  const [owner, repoName] = repo.fullName.split('/');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setActiveCategory('all');
    setSearch('');
    setPage(1);
    setInspectedAsset(null);

    fetch(
      `/api/github/assets/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}?branch=${encodeURIComponent(repo.defaultBranch)}`
    )
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to scan repository assets.');
        return body as RepoAssetsResponse;
      })
      .then((resData) => {
        if (!cancelled) {
          setData(resData);
          const hint = initialSearch.trim().toLowerCase();
          if (hint && hint.length >= 2) {
            const firstWord = hint.split(/\s+/)[0];
            const hasMatch = resData.assets.some((a) => a.path.toLowerCase().includes(firstWord));
            if (hasMatch) {
              setSearch(firstWord);
            }
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [owner, repoName, repo.defaultBranch, initialSearch]);

  const categoryButtons = useMemo(() => {
    if (!data) return [];
    const order: AssetCategoryKey[] = [
      'buildings',
      'sprites',
      'tilesets',
      'items_ui',
      'effects',
      'models_3d',
      'audio',
      'other_art',
    ];
    return order
      .filter((key) => data.countsByCategory[key] > 0)
      .map((key) => ({
        key,
        label: ASSET_CATEGORY_LABELS[key],
        count: data.countsByCategory[key],
      }));
  }, [data]);

  const filteredAssets = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.assets.filter((asset) => {
      if (activeCategory !== 'all' && asset.category !== activeCategory) return false;
      if (term && !asset.path.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data, activeCategory, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE));
  const pagedAssets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAssets.slice(start, start + PAGE_SIZE);
  }, [filteredAssets, page]);

  const toSavedItem = (asset: RepoAsset): SavedAssetItem => ({
    ...asset,
    id: `${repo.fullName}:${asset.path}`,
    repoFullName: repo.fullName,
    repoHtmlUrl: repo.htmlUrl,
    license: repo.license,
  });

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="h-36 bg-slate-100 rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-rose-700">{error}</div>
    );
  }

  if (!data || data.totalAssets === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-medium text-slate-900">No graphic or audio files detected</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          This repository appears to contain pure code or procedural generation without bundled PNG, SVG, tilemap, 3D model, or audio assets.
        </p>
      </div>
    );
  }

  if (inspectedAsset) {
    const isSaved = savedAssetIds.has(`${repo.fullName}:${inspectedAsset.path}`);
    const bgClass =
      backdrop === 'checker'
        ? 'bg-checkerboard'
        : backdrop === 'dark'
        ? 'bg-slate-950'
        : 'bg-white';

    const gridClass =
      gridSize === 16
        ? 'sprite-grid-16'
        : gridSize === 32
        ? 'sprite-grid-32'
        : gridSize === 48
        ? 'sprite-grid-48'
        : gridSize === 64
        ? 'sprite-grid-64'
        : '';

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                setInspectedAsset(null);
                setDimensions(null);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Assets
            </button>
            <span className="text-xs font-mono text-slate-700 truncate">{inspectedAsset.path}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSaveAsset(toSavedItem(inspectedAsset))}
              className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-md border text-xs font-medium cursor-pointer whitespace-nowrap ${
                isSaved
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved in Game Kit' : 'Save Asset'}
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(inspectedAsset.rawUrl).catch(() => {});
                setUrlCopied(true);
                setTimeout(() => setUrlCopied(false), 1800);
              }}
              className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {urlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {urlCopied ? 'Copied URL' : 'Raw URL'}
            </button>

            <a
              href={inspectedAsset.rawUrl}
              download={inspectedAsset.name}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-600 tabular-nums">
            <span>{ASSET_CATEGORY_LABELS[inspectedAsset.category]}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{formatBytes(inspectedAsset.size)}</span>
            {dimensions && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-medium text-slate-900">
                  {dimensions.w} × {dimensions.h} px
                </span>
              </>
            )}
            {repo.license && (
              <>
                <span aria-hidden="true">·</span>
                <span>License: {repo.license}</span>
              </>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-md">
              {([1, 2, 4, 6] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`px-2 py-1 text-xs rounded font-mono cursor-pointer ${
                    zoom === z ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-md">
              {([0, 16, 32, 48, 64] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGridSize(g)}
                  className={`px-2 py-1 text-xs rounded font-mono cursor-pointer ${
                    gridSize === g ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  {g === 0 ? 'No Grid' : `${g}px`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-md">
              {(['checker', 'light', 'dark'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBackdrop(b)}
                  className={`px-2 py-1 text-xs rounded capitalize cursor-pointer ${
                    backdrop === b ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-auto p-6 flex items-center justify-center ${bgClass}`}>
          <div className="relative inline-block border border-slate-300/60">
            <img
              src={inspectedAsset.rawUrl}
              alt={inspectedAsset.name}
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                const img = e.currentTarget;
                setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
              }}
              width={dimensions ? dimensions.w * zoom : undefined}
              height={dimensions ? dimensions.h * zoom : undefined}
              className={`block max-w-none ${pixelated ? 'pixelated' : ''}`}
            />
            {gridClass && (
              <div className={`absolute inset-0 pointer-events-none ${gridClass}`} aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setPage(1);
            }}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer tabular-nums ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({data.totalAssets.toLocaleString('en-US')})
          </button>

          {categoryButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => {
                setActiveCategory(btn.key);
                setPage(1);
              }}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer tabular-nums ${
                activeCategory === btn.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {btn.label} ({btn.count.toLocaleString('en-US')})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Filter sprites, buildings, tilesets (e.g. house, knight, sword, castle)..."
              aria-label="Filter repository graphic assets"
              className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPixelated((p) => !p)}
              className={`h-9 px-2.5 text-xs font-medium rounded-md border cursor-pointer ${
                pixelated
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Pixel Crisp
            </button>

            <div className="flex items-center gap-0.5 p-1 bg-slate-100 rounded-md">
              {(['checker', 'light', 'dark'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBackdrop(b)}
                  className={`px-2 py-1 text-xs rounded capitalize cursor-pointer ${
                    backdrop === b ? 'bg-white text-slate-900 shadow-xs font-medium' : 'text-slate-600'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {pagedAssets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No assets match "{search}" in this category.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pagedAssets.map((asset) => {
              const isSaved = savedAssetIds.has(`${repo.fullName}:${asset.path}`);
              return (
                <div
                  key={asset.path}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col"
                >
                  {asset.kind === 'image' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedAsset(asset);
                        setDimensions(null);
                      }}
                      className="w-full text-left cursor-pointer hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <AssetThumbnail asset={asset} backdrop={backdrop} pixelated={pixelated} />
                    </button>
                  ) : asset.kind === 'tilemap' ? (
                    <button
                      type="button"
                      onClick={() => onOpenFileInCode(asset.path)}
                      className="w-full text-left cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <AssetThumbnail asset={asset} backdrop={backdrop} pixelated={pixelated} />
                    </button>
                  ) : (
                    <AssetThumbnail asset={asset} backdrop={backdrop} pixelated={pixelated} />
                  )}

                  <div className="p-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-medium text-slate-900 truncate" title={asset.path}>
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">
                        {ASSET_CATEGORY_LABELS[asset.category]} · {formatBytes(asset.size)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleSaveAsset(toSavedItem(asset))}
                        aria-label={isSaved ? `Remove ${asset.name} from Game Kit` : `Save ${asset.name} to Game Kit`}
                        className={`p-1.5 rounded border text-xs cursor-pointer ${
                          isSaved
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      <a
                        href={asset.rawUrl}
                        download={asset.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download ${asset.name}`}
                        className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs">
          <span className="text-slate-600 tabular-nums">
            Page {page} of {totalPages} ({filteredAssets.length.toLocaleString('en-US')} assets)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
