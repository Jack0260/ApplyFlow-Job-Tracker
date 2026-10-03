import { useState } from 'react';
import { Plus, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/AuthScreen';
import { AppHeader } from '@/components/AppHeader';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ApplicationModal } from '@/components/ApplicationModal';
import { ApplicationDetailDrawer } from '@/components/ApplicationDetailDrawer';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { NextBestAction } from '@/components/NextBestAction';
import { useApplications } from '@/hooks/useApplications';
import type { Application, ApplicationStatus } from '@/lib/supabase';

function App() {
  const { user, loading } = useAuth();
  const { applications, loading: appsLoading, createApplication, updateApplication, moveApplication, deleteApplication } = useApplications();

  const [activeTab, setActiveTab] = useState<'board' | 'analytics'>('board');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<ApplicationStatus>('wishlist');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleAddClick = (status: ApplicationStatus) => {
    setEditingApp(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const handleEditApp = (app: Application) => {
    setSelectedApp(null);
    setEditingApp(app);
    setDefaultStatus(app.status);
    setModalOpen(true);
  };

  const handleSave = async (data: {
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
  }) => {
    if (editingApp) {
      await updateApplication(editingApp.id, data);
    } else {
      await createApplication(data);
    }
  };

  const handleMoveApp = async (id: string, newStatus: ApplicationStatus, oldStatus: ApplicationStatus) => {
    try {
      await moveApplication(id, newStatus, oldStatus);
    } catch (err) {
      console.error('Failed to move application:', err);
    }
  };

  const handleDeleteApp = async (id: string) => {
    try {
      await deleteApplication(id);
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} applications={applications} />

      {activeTab === 'board' ? (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Board</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {appsLoading ? 'Loading...' : `${applications.length} application${applications.length !== 1 ? 's' : ''} tracked`}
              </p>
            </div>
            <button
              onClick={() => handleAddClick('wishlist')}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Application
            </button>
          </div>

          <div className="flex gap-5">
            <div className="flex-1 min-w-0">
              {appsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mb-4">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">No applications yet</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-4">Start tracking your job search by adding your first application.</p>
                  <button
                    onClick={() => handleAddClick('wishlist')}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Application
                  </button>
                </div>
              ) : (
                <KanbanBoard
                  applications={applications}
                  onMoveApp={handleMoveApp}
                  onSelectApp={setSelectedApp}
                  onAddApp={handleAddClick}
                />
              )}
            </div>

            {!appsLoading && applications.length > 0 && (
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24">
                  <NextBestAction applications={applications} onSelectApp={setSelectedApp} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <AnalyticsDashboard applications={applications} />
      )}

      <ApplicationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingApp={editingApp}
        defaultStatus={defaultStatus}
      />

      <ApplicationDetailDrawer
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onEdit={handleEditApp}
        onDelete={handleDeleteApp}
      />
    </div>
  );
}

export default App;
