import { Briefcase, LogOut, LayoutGrid, BarChart3, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toCSV, downloadCSV, formatDate, formatRelative } from '@/lib/utils';
import type { Application } from '@/lib/supabase';

interface AppHeaderProps {
  activeTab: 'board' | 'analytics';
  onTabChange: (tab: 'board' | 'analytics') => void;
  applications: Application[];
}

export function AppHeader({ activeTab, onTabChange, applications }: AppHeaderProps) {
  const { user, signOut } = useAuth();

  const handleExport = () => {
    const rows = applications.map(app => ({
      Company: app.company,
      Position: app.position,
      Location: app.location,
      Salary: app.salary_range,
      Status: app.status,
      'Match Score': app.match_score,
      'Applied Date': app.application_date ? formatDate(app.application_date) : '',
      'Last Activity': formatRelative(app.last_activity_at),
      URL: app.job_url,
      Created: formatDate(app.created_at),
    }));
    downloadCSV(`applyflow-export-${new Date().toISOString().split('T')[0]}.csv`, toCSV(rows));
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">ApplyFlow</span>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => onTabChange('board')}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Board</span>
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExport}
            disabled={applications.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
          <div className="hidden sm:block text-sm text-slate-500 max-w-[160px] truncate">
            {user?.email}
          </div>
          <button
            onClick={signOut}
            className="flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
