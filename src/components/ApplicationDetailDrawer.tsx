import { useState, useEffect } from 'react';
import {
  X, MapPin, DollarSign, ExternalLink, Star, Calendar, Trash2,
  Clock, Bell, Plus, Check, MessageSquare, ArrowRightCircle, Briefcase,
} from 'lucide-react';
import type { Application, TimelineEvent, TimelineEventType } from '@/lib/supabase';
import { STATUS_COLUMNS } from '@/lib/supabase';
import { useTimeline, useReminders } from '@/hooks/useApplications';
import { formatDate, formatRelative, daysSince } from '@/lib/utils';

interface ApplicationDetailDrawerProps {
  app: Application | null;
  onClose: () => void;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
}

const eventTypeConfig: Record<TimelineEventType, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  status_change: { icon: ArrowRightCircle, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Status Change' },
  note: { icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-100', label: 'Note' },
  interview: { icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Interview' },
  offer: { icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Offer' },
  rejection: { icon: X, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Rejection' },
  application: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Application' },
  follow_up: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Follow-up' },
};

export function ApplicationDetailDrawer({ app, onClose, onEdit, onDelete }: ApplicationDetailDrawerProps) {
  const { events, loading: eventsLoading, addEvent, deleteEvent } = useTimeline(app?.id ?? null);
  const { reminders, addReminder, toggleReminder, deleteReminder } = useReminders(app?.id ?? null);

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventType, setNewEventType] = useState<TimelineEventType>('note');

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTitle, setNewReminderTitle] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setShowAddEvent(false);
    setShowAddReminder(false);
    setConfirmDelete(false);
  }, [app?.id]);

  if (!app) return null;

  const statusInfo = STATUS_COLUMNS.find(s => s.id === app.status);

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) return;
    try {
      await addEvent(newEventType, newEventTitle.trim(), newEventDesc.trim());
      setNewEventTitle('');
      setNewEventDesc('');
      setShowAddEvent(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderDate || !newReminderTitle.trim()) return;
    try {
      await addReminder(newReminderDate, newReminderTitle.trim());
      setNewReminderDate('');
      setNewReminderTitle('');
      setShowAddReminder(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(app.id);
    onClose();
  };

  const daysSinceActivity = daysSince(app.last_activity_at);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 truncate">{app.company}</h2>
              <p className="text-sm text-slate-500 truncate">{app.position}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              statusInfo?.id === 'wishlist' ? 'bg-slate-100 text-slate-700' :
              statusInfo?.id === 'applied' ? 'bg-sky-100 text-sky-700' :
              statusInfo?.id === 'interview' ? 'bg-amber-100 text-amber-700' :
              statusInfo?.id === 'offer' ? 'bg-emerald-100 text-emerald-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {statusInfo?.label}
            </span>
            <span className={`text-xs font-medium ${
              daysSinceActivity >= 7 ? 'text-rose-500' : 'text-slate-400'
            }`}>
              Last activity {formatRelative(app.last_activity_at)}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3">
            {app.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="truncate">{app.location}</span>
              </div>
            )}
            {app.salary_range && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="truncate">{app.salary_range}</span>
              </div>
            )}
            {app.application_date && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Applied {formatDate(app.application_date)}</span>
              </div>
            )}
            {app.job_url && (
              <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 truncate">
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Job posting</span>
              </a>
            )}
          </div>

          {/* Match score */}
          {app.match_score > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                app.match_score >= 70 ? 'bg-emerald-100' :
                app.match_score >= 40 ? 'bg-amber-100' : 'bg-slate-100'
              }`}>
                <Star className={`w-5 h-5 ${
                  app.match_score >= 70 ? 'text-emerald-600 fill-emerald-500' :
                  app.match_score >= 40 ? 'text-amber-600 fill-amber-500' : 'text-slate-400 fill-slate-300'
                }`} />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900">{app.match_score}%</span>
                <span className="text-sm text-slate-500 ml-1">keyword match</span>
              </div>
            </div>
          )}

          {/* Reminders */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" />
                Follow-up Reminders
              </h3>
              <button
                onClick={() => setShowAddReminder(!showAddReminder)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showAddReminder && (
              <div className="mb-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <input
                  type="text"
                  placeholder="Reminder title"
                  value={newReminderTitle}
                  onChange={e => setNewReminderTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <input
                  type="date"
                  value={newReminderDate}
                  onChange={e => setNewReminderDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <button
                  onClick={handleAddReminder}
                  disabled={!newReminderDate || !newReminderTitle.trim()}
                  className="w-full py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-40 transition-all"
                >
                  Add Reminder
                </button>
              </div>
            )}

            {reminders.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No reminders set.</p>
            ) : (
              <div className="space-y-1.5">
                {reminders.map(r => {
                  const isOverdue = !r.completed && new Date(r.reminder_date) < new Date(new Date().toDateString());
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
                        isOverdue ? 'border-rose-200 bg-rose-50' :
                        r.completed ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => toggleReminder(r.id, !r.completed)}
                        className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          r.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {r.completed && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${r.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {r.title}
                        </p>
                        <p className={`text-xs ${isOverdue ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                          {formatDate(r.reminder_date)}{isOverdue ? ' · Overdue' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteReminder(r.id)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Timeline
              </h3>
              <button
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showAddEvent && (
              <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <select
                  value={newEventType}
                  onChange={e => setNewEventType(e.target.value as TimelineEventType)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {Object.entries(eventTypeConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Event title"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newEventDesc}
                  onChange={e => setNewEventDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
                />
                <button
                  onClick={handleAddEvent}
                  disabled={!newEventTitle.trim()}
                  className="w-full py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-40 transition-all"
                >
                  Add Event
                </button>
              </div>
            )}

            {eventsLoading ? (
              <p className="text-xs text-slate-400 py-2">Loading timeline...</p>
            ) : events.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No events yet.</p>
            ) : (
              <div className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {events.map(ev => {
                  const cfg = eventTypeConfig[ev.event_type];
                  const Icon = cfg.icon;
                  return (
                    <div key={ev.id} className="relative flex gap-3 pl-0 group">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                            {ev.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-0.5">{formatRelative(ev.event_date)}</p>
                          </div>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => onEdit(app)}
              className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all border ${
                confirmDelete
                  ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
