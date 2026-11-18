import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FileCode2,
  Folder,
  FolderOpen,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type {
  FileResponse,
  RepoDetailResponse,
  RepoSummary,
  SavedAssetItem,
  TreeEntry,
  TreeResponse,
} from '../types/github';
import { formatBytes, formatCompactNumber, formatRelativeDate } from '../utils/format';
import { AssetGallery } from './AssetGallery';
import { MarkdownRenderer } from './MarkdownRenderer';

interface RepoInspectorProps {
  repo: RepoSummary;
  initialTab?: 'overview' | 'code' | 'assets';
  assetSearchHint?: string;
  isSaved: boolean;
  savedAssetIds: Set<string>;
  onToggleShortlist: (repo: RepoSummary) => void;
  onToggleSaveAsset: (asset: SavedAssetItem) => void;
  onClose: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  size: number;
  children: TreeNode[];
}

function buildTree(entries: TreeEntry[]): TreeNode[] {
  const root: TreeNode[] = [];
  const dirMap = new Map<string, TreeNode>();

  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const entry of sorted) {
    const parts = entry.path.split('/');
    const name = parts[parts.length - 1];
    const node: TreeNode = {
      name,
      path: entry.path,
      type: entry.type,
      size: entry.size,
      children: [],
    };

    if (entry.type === 'tree') {
      dirMap.set(entry.path, node);
    }

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = dirMap.get(parentPath);
      if (parent) {
        parent.children.push(node);
      } else {
        root.push(node);
      }
    }
  }

  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.children.length > 0) sortChildren(n.children);
    }
  };
  sortChildren(root);
  return root;
}

export function RepoInspector({
  repo,
  initialTab = 'overview',
  assetSearchHint = '',
  isSaved,
  savedAssetIds,
  onToggleShortlist,
  onToggleSaveAsset,
  onClose,
}: RepoInspectorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'code'>(initialTab);
  const [detail, setDetail] = useState<RepoDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [treeEntries, setTreeEntries] = useState<TreeEntry[]>([]);
  const [treeTruncated, setTreeTruncated] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [treeLoadedFor, setTreeLoadedFor] = useState<string | null>(null);

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [fileFilter, setFileFilter] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FileResponse | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [cloneCopied, setCloneCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [owner, repoName] = repo.fullName.split('/');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, repo.fullName]);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    setTreeEntries([]);
    setTreeLoadedFor(null);
    setTreeError(null);
    setSelectedFilePath(null);
    setFileData(null);
    setFileError(null);
    setFileFilter('');
    setExpandedDirs(new Set());

    fetch(
      `/api/github/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}?branch=${encodeURIComponent(repo.defaultBranch)}`
    )
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load repository details.');
        return body as RepoDetailResponse;
      })
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setDetailError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [owner, repoName, repo.defaultBranch]);

  useEffect(() => {
    if (activeTab !== 'code') return;
    if (treeLoadedFor === repo.fullName) return;

    let cancelled = false;
    setTreeLoading(true);
    setTreeError(null);

    const branch = detail?.repo.defaultBranch || repo.defaultBranch;
    fetch(
      `/api/github/tree/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}?branch=${encodeURIComponent(branch)}`
    )
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load repository file tree.');
        return body as TreeResponse;
      })
      .then((data) => {
        if (!cancelled) {
          setTreeEntries(data.entries || []);
          setTreeTruncated(Boolean(data.truncated));
          setTreeLoadedFor(repo.fullName);
          const firstDir = (data.entries || []).find(
            (e) => e.type === 'tree' && !e.path.includes('/') && /^(src|source|scripts|game|core|assets|client|lib)$/i.test(e.path)
          );
          if (firstDir) {
            setExpandedDirs(new Set([firstDir.path]));
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setTreeError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTreeLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, treeLoadedFor, repo.fullName, repo.defaultBranch, detail?.repo.defaultBranch, owner, repoName]);

  const activeRepo = detail?.repo || repo;

  const isPreviewableImagePath = (path: string) =>
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path);

  const isPreviewableAudioPath = (path: string) =>
    /\.(ogg|wav|mp3)$/i.test(path);

  const getRawFileUrl = (path: string) => {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/${encodeURIComponent(activeRepo.defaultBranch)}/${encodedPath}`;
  };

  const handleSelectFile = (path: string) => {
    setSelectedFilePath(path);
    setFileError(null);
    setFileData(null);

    if (isPreviewableImagePath(path) || isPreviewableAudioPath(path)) {
      setFileLoading(false);
      return;
    }

    setFileLoading(true);
    const branch = activeRepo.defaultBranch;
    fetch(
      `/api/github/file/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}?branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}`
    )
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to read file.');
        return body as FileResponse;
      })
      .then((data) => {
        setFileData(data);
      })
      .catch((err: Error) => {
        setFileError(err.message);
      })
      .finally(() => {
        setFileLoading(false);
      });
  };

  const handleOpenFileFromAssets = (path: string) => {
    setActiveTab('code');
    handleSelectFile(path);
  };

  const treeNodes = useMemo(() => buildTree(treeEntries), [treeEntries]);

  const filteredFiles = useMemo(() => {
    const term = fileFilter.trim().toLowerCase();
    if (!term) return [];
    return treeEntries
      .filter((e) => e.type === 'blob' && e.path.toLowerCase().includes(term))
      .slice(0, 80);
  }, [treeEntries, fileFilter]);

  const languagePercentages = useMemo(() => {
    const langs = detail?.languages || {};
    const total = Object.values(langs).reduce((sum, val) => sum + val, 0);
    if (total === 0) return [];
    return Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, bytes]) => ({
        name,
        percent: ((bytes / total) * 100).toFixed(1),
      }));
  }, [detail?.languages]);

  const cloneCmd = `git clone ${activeRepo.cloneUrl}`;

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneCmd).catch(() => {});
    setCloneCopied(true);
    setTimeout(() => setCloneCopied(false), 1800);
  };

  const handleCopyCode = () => {
    if (!fileData?.content) return;
    navigator.clipboard.writeText(fileData.content).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1800);
  };

  const toggleDir = (dirPath: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  };

  const renderTreeNodes = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.type === 'tree') {
        const isOpen = expandedDirs.has(node.path);
        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => toggleDir(node.path)}
              style={{ paddingLeft: `${depth * 14 + 10}px` }}
              className="w-full flex items-center gap-1.5 pr-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="truncate font-medium">{node.name}</span>
            </button>
            {isOpen && node.children.length > 0 && renderTreeNodes(node.children, depth + 1)}
          </div>
        );
      }

      const isSelectedFile = selectedFilePath === node.path;
      return (
        <button
          key={node.path}
          type="button"
          onClick={() => handleSelectFile(node.path)}
          style={{ paddingLeft: `${depth * 14 + 28}px` }}
          className={`w-full flex items-center justify-between gap-2 pr-3 py-1.5 text-left text-xs rounded cursor-pointer ${
            isSelectedFile
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <FileCode2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate font-mono">{node.name}</span>
          </span>
          <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
            {formatBytes(node.size)}
          </span>
        </button>
      );
    });
  };

  return (
    <section
      aria-label={`Inspecting ${activeRepo.fullName}`}
      className="flex flex-col h-full bg-white"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 truncate">{activeRepo.fullName}</h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">{activeRepo.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onToggleShortlist(activeRepo)}
            aria-label={isSaved ? 'Remove from Game Kit' : 'Save repo to Game Kit'}
            className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isSaved
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Save Repo'}
          </button>

          <a
            href={activeRepo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            GitHub
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 flex-wrap">
        <div role="tablist" aria-label="Inspector views" className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview &amp; README
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'assets'}
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sprites &amp; Graphics
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'code'}
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'code'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Source Code
          </button>
        </div>

        <div className="flex items-center gap-2 min-w-0 max-w-full">
          <code className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-mono truncate max-w-[220px] sm:max-w-[300px]">
            {cloneCmd}
          </code>
          <button
            type="button"
            onClick={handleCopyClone}
            className="h-8 px-2.5 inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            {cloneCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {cloneCopied ? 'Copied' : 'Clone'}
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-white p-3">
              <div className="text-xs text-slate-500">Stars</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums font-mono">
                {activeRepo.stars.toLocaleString('en-US')}
              </div>
            </div>
            <div className="bg-white p-3">
              <div className="text-xs text-slate-500">Forks</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums font-mono">
                {activeRepo.forks.toLocaleString('en-US')}
              </div>
            </div>
            <div className="bg-white p-3">
              <div className="text-xs text-slate-500">Open Issues</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums font-mono">
                {formatCompactNumber(activeRepo.openIssues)}
              </div>
            </div>
            <div className="bg-white p-3">
              <div className="text-xs text-slate-500">Primary Language</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                {activeRepo.language}
              </div>
            </div>
            <div className="bg-white p-3">
              <div className="text-xs text-slate-500">License</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                {activeRepo.license || 'Unspecified'}
              </div>
            </div>
            <div className="bg-white p-3">
              <div className="text-xs text-slate-500">Last Push</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">
                {formatRelativeDate(activeRepo.pushedAt)}
              </div>
            </div>
          </div>

          {languagePercentages.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-xs font-semibold text-slate-500 mb-2">Language Breakdown</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 font-mono tabular-nums">
                {languagePercentages.map((lang, idx) => (
                  <span key={lang.name}>
                    {idx > 0 && <span className="mr-3 text-slate-300" aria-hidden="true">·</span>}
                    <span className="font-semibold text-slate-900">{lang.name}</span>{' '}
                    <span className="text-slate-500">{lang.percent}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeRepo.homepage && /^https?:\/\//i.test(activeRepo.homepage) && (
            <div className="text-xs text-slate-600">
              Project site:{' '}
              <a
                href={activeRepo.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                {activeRepo.homepage}
              </a>
            </div>
          )}

          <div className="border-t border-slate-200 pt-5">
            {detailLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-3.5 w-full bg-slate-100 rounded" />
                <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
                <div className="h-3.5 w-4/6 bg-slate-100 rounded" />
              </div>
            ) : detailError ? (
              <p className="text-sm text-rose-700">{detailError}</p>
            ) : detail?.readme ? (
              <MarkdownRenderer content={detail.readme} />
            ) : (
              <p className="text-sm text-slate-500">
                No README file was found at the root of this repository. Switch to Sprites &amp; Graphics or Source Code to inspect files directly.
              </p>
            )}
          </div>
        </div>
      ) : activeTab === 'assets' ? (
        <AssetGallery
          repo={activeRepo}
          initialSearch={assetSearchHint}
          savedAssetIds={savedAssetIds}
          onToggleSaveAsset={onToggleSaveAsset}
          onOpenFileInCode={handleOpenFileFromAssets}
        />
      ) : (
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col max-h-72 md:max-h-none">
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={fileFilter}
                  onChange={(e) => setFileFilter(e.target.value)}
                  placeholder="Filter files (e.g. combat, .gd, .cs)..."
                  aria-label="Filter repository files"
                  className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {treeTruncated && (
                <p className="text-[11px] text-amber-700 mt-1.5">
                  Large repository: showing first 2,500 entries. Use Sprites &amp; Graphics for full asset scans.
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {treeLoading ? (
                <div className="p-3 text-xs text-slate-500">Loading repository files...</div>
              ) : treeError ? (
                <div className="p-3 text-xs text-rose-700">{treeError}</div>
              ) : fileFilter.trim() ? (
                filteredFiles.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500">No files match "{fileFilter}".</div>
                ) : (
                  filteredFiles.map((entry) => (
                    <button
                      key={entry.path}
                      type="button"
                      onClick={() => handleSelectFile(entry.path)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs rounded cursor-pointer ${
                        selectedFilePath === entry.path
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate font-mono">{entry.path}</span>
                      <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                        {formatBytes(entry.size)}
                      </span>
                    </button>
                  ))
                )
              ) : (
                renderTreeNodes(treeNodes)
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-950 text-slate-100">
            {!selectedFilePath ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileCode2 className="w-8 h-8 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-200">Select a file to inspect source code</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Browse folders on the left or filter for combat, inventory, dialogue, or engine files.
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-200 truncate">{selectedFilePath}</span>
                  {fileData && !fileData.binary && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {codeCopied ? 'Copied' : 'Copy File'}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed">
                  {isPreviewableImagePath(selectedFilePath) ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 bg-checkerboard rounded-lg">
                      <img
                        src={getRawFileUrl(selectedFilePath)}
                        alt={selectedFilePath}
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-[60vh] object-contain pixelated"
                      />
                    </div>
                  ) : isPreviewableAudioPath(selectedFilePath) ? (
                    <div className="h-full flex flex-col items-center justify-center p-6">
                      <audio controls src={getRawFileUrl(selectedFilePath)} className="w-full max-w-md" />
                    </div>
                  ) : fileLoading ? (
                    <div className="text-slate-400">Loading source file...</div>
                  ) : fileError ? (
                    <div className="text-rose-400">{fileError}</div>
                  ) : fileData?.binary ? (
                    <div className="text-slate-400">
                      Binary asset ({selectedFilePath}) cannot be previewed as text.
                    </div>
                  ) : fileData ? (
                    <div>
                      {fileData.truncated && (
                        <div className="mb-3 px-3 py-2 rounded bg-amber-950/60 border border-amber-800 text-amber-200 text-xs">
                          File truncated at 250 KB for browser preview.
                        </div>
                      )}
                      <table className="w-full border-collapse">
                        <tbody>
                          {fileData.content.split(/\r?\n/).map((line, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/60">
                              <td className="select-none pr-4 text-right text-slate-600 tabular-nums align-top w-10">
                                {idx + 1}
                              </td>
                              <td className="whitespace-pre text-slate-100">{line || ' '}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
