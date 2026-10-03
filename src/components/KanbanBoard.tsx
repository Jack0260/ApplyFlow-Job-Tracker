import { useState, type DragEvent } from 'react';
import { Plus, GripVertical, MapPin, DollarSign, ExternalLink, Star } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/lib/supabase';
import { STATUS_COLUMNS } from '@/lib/supabase';
import { formatRelative, daysSince } from '@/lib/utils';

interface KanbanBoardProps {
  applications: Application[];
  onMoveApp: (id: string, newStatus: ApplicationStatus, oldStatus: ApplicationStatus) => void;
  onSelectApp: (app: Application) => void;
  onAddApp: (status: ApplicationStatus) => void;
}

const columnStyles: Record<string, { headerBg: string; headerText: string; badgeBg: string; badgeText: string; border: string; dragOver: string }> = {
  wishlist: { headerBg: 'bg-slate-50', headerText: 'text-slate-600', badgeBg: 'bg-slate-200', badgeText: 'text-slate-700', border: 'border-slate-200', dragOver: 'bg-slate-50/80' },
  applied: { headerBg: 'bg-sky-50', headerText: 'text-sky-700', badgeBg: 'bg-sky-200', badgeText: 'text-sky-800', border: 'border-sky-200', dragOver: 'bg-sky-50/80' },
  interview: { headerBg: 'bg-amber-50', headerText: 'text-amber-700', badgeBg: 'bg-amber-200', badgeText: 'text-amber-800', border: 'border-amber-200', dragOver: 'bg-amber-50/80' },
  offer: { headerBg: 'bg-emerald-50', headerText: 'text-emerald-700', badgeBg: 'bg-emerald-200', badgeText: 'text-emerald-800', border: 'border-emerald-200', dragOver: 'bg-emerald-50/80' },
  rejected: { headerBg: 'bg-rose-50', headerText: 'text-rose-700', badgeBg: 'bg-rose-200', badgeText: 'text-rose-800', border: 'border-rose-200', dragOver: 'bg-rose-50/80' },
};

export function KanbanBoard({ applications, onMoveApp, onSelectApp, onAddApp }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null);

  const handleDragStart = (e: DragEvent, app: Application) => {
    setDraggedId(app.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  const handleDrop = (e: DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    if (draggedId) {
      const app = applications.find(a => a.id === draggedId);
      if (app && app.status !== status) {
        onMoveApp(draggedId, status, app.status);
      }
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {STATUS_COLUMNS.map(col => {
        const colApps = applications.filter(a => a.status === col.id);
        const style = columnStyles[col.id];
        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-80 flex flex-col rounded-2xl border ${style.border} bg-slate-50/30 transition-colors ${
              dragOverCol === col.id ? style.dragOver : ''
            }`}
            onDragOver={e => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => handleDrop(e, col.id)}
          >
            <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${style.headerBg}`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${style.headerText}`}>{col.label}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText}`}>
                  {colApps.length}
                </span>
              </div>
              <button
                onClick={() => onAddApp(col.id)}
                className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/60 transition-colors ${style.headerText}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
              {colApps.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  Drag cards here or click +
                </div>
              )}
              {colApps.map(app => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={e => handleDragStart(e, app)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectApp(app)}
                  className={`group bg-white rounded-xl border border-slate-200/80 p-3.5 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all ${
                    draggedId === app.id ? 'opacity-40 rotate-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{app.company}</h4>
                      <p className="text-xs text-slate-500 truncate">{app.position}</p>
                    </div>
                    <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 flex-shrink-0 mt-0.5" />
                  </div>

                  {(app.location || app.salary_range) && (
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                      {app.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {app.location}
                        </span>
                      )}
                      {app.salary_range && (
                        <span className="flex items-center gap-1 truncate">
                          <DollarSign className="w-3 h-3 flex-shrink-0" />
                          {app.salary_range}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {app.match_score > 0 && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${
                          app.match_score >= 70 ? 'text-emerald-600' :
                          app.match_score >= 40 ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          <Star className="w-3 h-3 fill-current" />
                          {app.match_score}%
                        </span>
                      )}
                      {app.job_url && (
                        <ExternalLink className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                      )}
                    </div>
                    <span className={`text-xs ${
                      daysSince(app.last_activity_at) >= 7 ? 'text-rose-500 font-medium' : 'text-slate-400'
                    }`}>
                      {formatRelative(app.last_activity_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
