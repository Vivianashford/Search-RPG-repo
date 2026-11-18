import type { BrowseMode } from '../types/github';

interface TopBarProps {
  mode: BrowseMode;
  activeCategory: string;
  onSelectMode: (mode: BrowseMode) => void;
  onSelectCategory: (categoryId: string) => void;
  kitCount: number;
  onOpenKit: () => void;
  onResetAll: () => void;
}

export function TopBar({
  mode,
  activeCategory,
  onSelectMode,
  onSelectCategory,
  kitCount,
  onOpenKit,
  onResetAll,
}: TopBarProps) {
  const navItems = [
    {
      id: 'blueprint',
      label: 'FF2 Blueprint',
      active: mode === 'blueprint',
      onClick: () => onSelectMode('blueprint'),
    },
    {
      id: 'curated',
      label: 'Art & Code Packs',
      active: mode === 'curated',
      onClick: () => onSelectMode('curated'),
    },
    {
      id: 'all',
      label: 'Code Search',
      active: mode === 'search' && activeCategory === 'all',
      onClick: () => onSelectCategory('all'),
    },
    {
      id: 'sprites',
      label: 'Character Sprites',
      active: mode === 'search' && activeCategory === 'sprites',
      onClick: () => onSelectCategory('sprites'),
    },
    {
      id: 'buildings',
      label: 'Buildings & Tiles',
      active: mode === 'search' && activeCategory === 'buildings',
      onClick: () => onSelectCategory('buildings'),
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={onResetAll}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          RPG Code Atlas
        </button>

        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                item.active
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenKit}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 tabular-nums"
          >
            Game Kit ({kitCount})
          </button>
        </div>
      </div>
    </header>
  );
}
