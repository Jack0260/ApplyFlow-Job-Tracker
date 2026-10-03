import { useState, useEffect, useMemo } from 'react';
import { X, Star, Link2, FileText, Briefcase, MapPin, DollarSign, Calendar } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/lib/supabase';
import { STATUS_COLUMNS } from '@/lib/supabase';
import { calculateMatchScore, formatDate } from '@/lib/utils';

interface ApplicationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    company: string;
    position: string;
    location: string;
    salary_range: string;
    status: ApplicationStatus;
    job_description: string;
    resume_text: string;
    match_score: number;
    job_url: string;
    application_date: string | null;
  }) => Promise<void>;
  editingApp: Application | null;
  defaultStatus: ApplicationStatus;
}

export function ApplicationModal({ open, onClose, onSave, editingApp, defaultStatus }: ApplicationModalProps) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>(defaultStatus);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingApp;

  useEffect(() => {
    if (open) {
      if (editingApp) {
        setCompany(editingApp.company);
        setPosition(editingApp.position);
        setLocation(editingApp.location);
        setSalaryRange(editingApp.salary_range);
        setStatus(editingApp.status);
        setJobDescription(editingApp.job_description);
        setResumeText(editingApp.resume_text);
        setJobUrl(editingApp.job_url);
        setApplicationDate(editingApp.application_date ?? '');
      } else {
        setCompany('');
        setPosition('');
        setLocation('');
        setSalaryRange('');
        setStatus(defaultStatus);
        setJobDescription('');
        setResumeText('');
        setJobUrl('');
        setApplicationDate('');
      }
      setError(null);
    }
  }, [open, editingApp, defaultStatus]);

  const liveMatchScore = useMemo(
    () => calculateMatchScore(resumeText, jobDescription),
    [resumeText, jobDescription]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) {
      setError('Company and position are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        company: company.trim(),
        position: position.trim(),
        location: location.trim(),
        salary_range: salaryRange.trim(),
        status,
        job_description: jobDescription,
        resume_text: resumeText,
        match_score: liveMatchScore,
        job_url: jobUrl.trim(),
        application_date: applicationDate || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? 'Edit Application' : 'New Application'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 inline mr-1" />
                Company *
              </label>
              <input
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Google"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Position *</label>
              <input
                required
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="Senior Frontend Engineer"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Location
              </label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Remote"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                Salary Range
              </label>
              <input
                value={salaryRange}
                onChange={e => setSalaryRange(e.target.value)}
                placeholder="$120k–$150k"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Applied Date
              </label>
              <input
                type="date"
                value={applicationDate}
                onChange={e => setApplicationDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_COLUMNS.map(col => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setStatus(col.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                    status === col.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Link2 className="w-3.5 h-3.5 inline mr-1" />
              Job URL
            </label>
            <input
              value={jobUrl}
              onChange={e => setJobUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={6}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                Your Resume Text
              </label>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={6}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm resize-none"
              />
            </div>
          </div>

          {(jobDescription.trim() && resumeText.trim()) ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/60">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                liveMatchScore >= 70 ? 'bg-emerald-100' :
                liveMatchScore >= 40 ? 'bg-amber-100' : 'bg-slate-100'
              }`}>
                <Star className={`w-6 h-6 ${
                  liveMatchScore >= 70 ? 'text-emerald-600 fill-emerald-500' :
                  liveMatchScore >= 40 ? 'text-amber-600 fill-amber-500' : 'text-slate-400 fill-slate-300'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{liveMatchScore}%</span>
                  <span className="text-sm text-slate-500">keyword match</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      liveMatchScore >= 70 ? 'bg-emerald-500' :
                      liveMatchScore >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${liveMatchScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {liveMatchScore >= 70 ? 'Strong match — your resume aligns well with this role.' :
                   liveMatchScore >= 40 ? 'Decent match — consider adding missing keywords to your resume.' :
                   'Low match — tailor your resume to highlight relevant skills.'}
                </p>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {isEditing && editingApp && (
            <p className="text-xs text-slate-400">
              Created {formatDate(editingApp.created_at)} · Last updated {formatDate(editingApp.updated_at)}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
