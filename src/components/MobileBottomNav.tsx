import { BarChart3, BookOpen, CalendarDays, Grid3X3 } from 'lucide-react';
import type { ViewMode } from '../types/tracker';

interface MobileBottomNavProps {
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
}

const MOBILE_TABS: { id: ViewMode; label: string; icon: typeof CalendarDays }[] = [
  { id: 'today', label: 'Daily', icon: CalendarDays },
  { id: 'habits', label: 'Habits', icon: Grid3X3 },
  { id: 'analytics', label: 'Trends', icon: BarChart3 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
];

export function MobileBottomNav({ activeView, onSelectView }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid h-14 grid-cols-4 items-center">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectView(tab.id)}
              className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
