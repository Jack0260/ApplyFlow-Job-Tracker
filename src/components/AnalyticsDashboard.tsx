import { useMemo } from 'react';
import {
  TrendingUp, Clock, Target, CheckCircle2, XCircle, BarChart3,
  Building2, Star, Calendar,
} from 'lucide-react';
import type { Application } from '@/lib/supabase';
import { STATUS_COLUMNS } from '@/lib/supabase';
import { daysSince } from '@/lib/utils';

interface AnalyticsDashboardProps {
  applications: Application[];
}

function StatCard({
  label, value, sublabel, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: typeof TrendingUp;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

export function AnalyticsDashboard({ applications }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter(a => a.status !== 'wishlist');
    const interviews = applications.filter(a =>
      a.status === 'interview' || a.status === 'offer' ||
      applications.some(b => b.id === a.id && b.status === 'rejected' && a.status !== 'wishlist')
    ).length;
    const offers = applications.filter(a => a.status === 'offer').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;

    // Response rate: applications that moved beyond "applied" / total applied
    const responded = applications.filter(a =>
      a.status === 'interview' || a.status === 'offer' || a.status === 'rejected'
    ).length;
    const responseRate = applied.length > 0 ? Math.round((responded / applied.length) * 100) : 0;

    // Avg days per stage
    const stageDays: Record<string, number[]> = {
      applied: [],
      interview: [],
      offer: [],
    };

    // For simplicity, compute avg days from application_date to last_activity_at for each stage
    for (const app of applications) {
      if (app.application_date) {
        const totalDays = daysSince(app.application_date);
        if (app.status === 'applied') stageDays.applied.push(totalDays);
        else if (app.status === 'interview') stageDays.interview.push(totalDays);
        else if (app.status === 'offer') stageDays.offer.push(totalDays);
      }
    }

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    // Status distribution
    const distribution = STATUS_COLUMNS.map(col => ({
      ...col,
      count: applications.filter(a => a.status === col.id).length,
      percentage: total > 0 ? Math.round((applications.filter(a => a.status === col.id).length / total) * 100) : 0,
    }));

    // Avg match score
    const matchScores = applications.filter(a => a.match_score > 0).map(a => a.match_score);
    const avgMatchScore = matchScores.length > 0 ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length) : 0;

    // Top companies by applications
    const companyMap = new Map<string, number>();
    for (const app of applications) {
      companyMap.set(app.company, (companyMap.get(app.company) ?? 0) + 1);
    }
    const topCompanies = Array.from(companyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      appliedCount: applied.length,
      responseRate,
      interviews,
      offers,
      rejected,
      avgAppliedDays: avg(stageDays.applied),
      avgInterviewDays: avg(stageDays.interview),
      avgOfferDays: avg(stageDays.offer),
      distribution,
      avgMatchScore,
      topCompanies,
    };
  }, [applications]);

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-lg font-semibold text-slate-700">No data yet</h3>
        <p className="text-sm text-slate-400 mt-1">Add applications to see your analytics.</p>
      </div>
    );
  }

  const statusBarColors: Record<string, string> = {
    wishlist: 'bg-slate-400',
    applied: 'bg-sky-500',
    interview: 'bg-amber-500',
    offer: 'bg-emerald-500',
    rejected: 'bg-rose-500',
  };

  return (
    <div className="max-w-[1400px] mx-auto px-1 sm:px-4 py-6 space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={stats.total}
          sublabel={`${stats.appliedCount} actively submitted`}
          icon={Building2}
          color="bg-slate-900"
        />
        <StatCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          sublabel={`${stats.interviews + stats.offers + stats.rejected} responses`}
          icon={TrendingUp}
          color="bg-sky-600"
        />
        <StatCard
          label="Interviews"
          value={stats.interviews}
          sublabel={`${stats.offers} offers received`}
          icon={Target}
          color="bg-amber-500"
        />
        <StatCard
          label="Avg Match Score"
          value={`${stats.avgMatchScore}%`}
          sublabel="Resume vs job description"
          icon={Star}
          color="bg-emerald-600"
        />
      </div>

      {/* Stage timing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-semibold text-slate-900">Avg Days in "Applied"</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.avgAppliedDays}<span className="text-base font-normal text-slate-400 ml-1">days</span></p>
          <p className="text-xs text-slate-400 mt-1">Time from application to last update</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900">Avg Days in "Interview"</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.avgInterviewDays}<span className="text-base font-normal text-slate-400 ml-1">days</span></p>
          <p className="text-xs text-slate-400 mt-1">Time from application to interview stage</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">Avg Days to Offer</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.avgOfferDays}<span className="text-base font-normal text-slate-400 ml-1">days</span></p>
          <p className="text-xs text-slate-400 mt-1">Time from application to offer</p>
        </div>
      </div>

      {/* Distribution + outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Application Distribution</h3>
          <div className="space-y-3">
            {stats.distribution.map(col => (
              <div key={col.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{col.label}</span>
                  <span className="text-sm font-medium text-slate-900">{col.count} <span className="text-slate-400">({col.percentage}%)</span></span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${statusBarColors[col.id]}`}
                    style={{ width: `${col.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Outcomes</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.offers}</p>
              <p className="text-xs text-slate-500">Offers</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
              <Target className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.interviews}</p>
              <p className="text-xs text-slate-500">Interviews</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-rose-50 border border-rose-100">
              <XCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
              <p className="text-xs text-slate-500">Rejections</p>
            </div>
          </div>

          {stats.topCompanies.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Top Companies</h4>
              <div className="space-y-1.5">
                {stats.topCompanies.map(([company, count]) => (
                  <div key={company} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate">{company}</span>
                    <span className="text-slate-400 font-medium ml-2">{count} app{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
