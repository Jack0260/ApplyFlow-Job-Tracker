import { Sparkles, Lightbulb, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import type { Application } from '@/lib/supabase';
import { daysSince, formatRelative } from '@/lib/utils';

interface NextBestActionProps {
  applications: Application[];
  onSelectApp: (app: Application) => void;
}

interface Suggestion {
  appId: string;
  companyName: string;
  position: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
  daysSinceActivity: number;
}

function generateSuggestions(applications: Application[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const app of applications) {
    const days = daysSince(app.last_activity_at);
    const lowerCompany = app.company;

    if (app.status === 'applied' && days >= 7) {
      suggestions.push({
        appId: app.id,
        companyName: lowerCompany,
        position: app.position,
        reason: days >= 14
          ? `No response for ${days} days — send a polite follow-up email.`
          : `It's been ${days} days since applying — consider a check-in.`,
        urgency: days >= 14 ? 'high' : 'medium',
        daysSinceActivity: days,
      });
    }

    if (app.status === 'interview' && days >= 5) {
      suggestions.push({
        appId: app.id,
        companyName: lowerCompany,
        position: app.position,
        reason: `Interview ${days} days ago — send a thank-you or ask for next steps.`,
        urgency: days >= 7 ? 'high' : 'medium',
        daysSinceActivity: days,
      });
    }

    if (app.status === 'wishlist' && days >= 14) {
      suggestions.push({
        appId: app.id,
        companyName: lowerCompany,
        position: app.position,
        reason: `On your wishlist for ${days} days — time to apply or remove.`,
        urgency: 'low',
        daysSinceActivity: days,
      });
    }

    if (app.status === 'offer' && days >= 3) {
      suggestions.push({
        appId: app.id,
        companyName: lowerCompany,
        position: app.position,
        reason: `Offer received ${days} days ago — respond before it expires.`,
        urgency: 'high',
        daysSinceActivity: days,
      });
    }
  }

  return suggestions.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return b.daysSinceActivity - a.daysSinceActivity;
  }).slice(0, 5);
}

export function NextBestAction({ applications, onSelectApp }: NextBestActionProps) {
  const suggestions = generateSuggestions(applications);

  const urgencyConfig = {
    high: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', icon: AlertCircle },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', icon: Clock },
    low: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500', icon: Lightbulb },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Next Best Action</h3>
          <p className="text-xs text-slate-400">Smart follow-up suggestions</p>
        </div>
      </div>

      <div className="p-3 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">You're all caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No follow-ups needed right now.</p>
          </div>
        ) : (
          suggestions.map(s => {
            const cfg = urgencyConfig[s.urgency];
            const Icon = cfg.icon;
            return (
              <button
                key={s.appId}
                onClick={() => {
                  const app = applications.find(a => a.id === s.appId);
                  if (app) onSelectApp(app);
                }}
                className={`w-full text-left p-3 rounded-xl border ${cfg.bg} ${cfg.border} hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {s.companyName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.reason}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Last activity: {formatRelative(applications.find(a => a.id === s.appId)?.last_activity_at ?? new Date().toISOString())}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
