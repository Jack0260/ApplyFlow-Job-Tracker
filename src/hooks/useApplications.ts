import { useCallback, useEffect, useState } from 'react';
import { supabase, type Application, type ApplicationStatus, type TimelineEvent, type Reminder } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('applications')
      .select('*')
      .order('updated_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setApplications(data as Application[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const createApplication = async (
    app: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_activity_at' | 'match_score'> & { match_score?: number }
  ) => {
    const { data, error: err } = await supabase
      .from('applications')
      .insert({
        ...app,
        match_score: app.match_score ?? 0,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (err) throw err;

    if (app.status !== 'wishlist') {
      await supabase.from('timeline_events').insert({
        application_id: data.id,
        event_type: 'application',
        title: `Applied to ${app.company}`,
        description: `Position: ${app.position}`,
        event_date: new Date().toISOString(),
      });
    }

    await fetchApplications();
    return data as Application;
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    const { data, error: err } = await supabase
      .from('applications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (err) throw err;
    await fetchApplications();
    return data as Application;
  };

  const moveApplication = async (id: string, newStatus: ApplicationStatus, oldStatus: ApplicationStatus) => {
    const updates: Partial<Application> = {
      status: newStatus,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'applied' && !oldStatus || oldStatus === 'wishlist') {
      updates.application_date = new Date().toISOString().split('T')[0];
    }

    const { error: err } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id);

    if (err) throw err;

    if (newStatus !== oldStatus) {
      await supabase.from('timeline_events').insert({
        application_id: id,
        event_type: 'status_change',
        title: `Moved from ${oldStatus} to ${newStatus}`,
        description: '',
        event_date: new Date().toISOString(),
      });
    }

    await fetchApplications();
  };

  const deleteApplication = async (id: string) => {
    const { error: err } = await supabase.from('applications').delete().eq('id', id);
    if (err) throw err;
    await fetchApplications();
  };

  return {
    applications,
    loading,
    error,
    fetchApplications,
    createApplication,
    updateApplication,
    moveApplication,
    deleteApplication,
  };
}

export function useTimeline(applicationId: string | null) {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!applicationId || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('application_id', applicationId)
      .order('event_date', { ascending: false });

    if (!error && data) {
      setEvents(data as TimelineEvent[]);
    }
    setLoading(false);
  }, [applicationId, user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (eventType: TimelineEvent['event_type'], title: string, description: string) => {
    if (!applicationId) return;
    const { data, error } = await supabase
      .from('timeline_events')
      .insert({
        application_id: applicationId,
        event_type: eventType,
        title,
        description,
        event_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('applications')
      .update({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    setEvents(prev => [data as TimelineEvent, ...prev]);
    return data as TimelineEvent;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('timeline_events').delete().eq('id', id);
    if (error) throw error;
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return { events, loading, fetchEvents, addEvent, deleteEvent };
}

export function useReminders(applicationId: string | null) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    if (!applicationId || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('application_id', applicationId)
      .order('reminder_date', { ascending: true });

    if (!error && data) {
      setReminders(data as Reminder[]);
    }
    setLoading(false);
  }, [applicationId, user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = async (reminderDate: string, title: string) => {
    if (!applicationId) return;
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        application_id: applicationId,
        reminder_date: reminderDate,
        title,
      })
      .select()
      .single();

    if (error) throw error;
    setReminders(prev => [...prev, data as Reminder].sort((a, b) => a.reminder_date.localeCompare(b.reminder_date)));
    return data as Reminder;
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    const { error } = await supabase.from('reminders').update({ completed }).eq('id', id);
    if (error) throw error;
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed } : r));
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return { reminders, loading, fetchReminders, addReminder, toggleReminder, deleteReminder };
}
