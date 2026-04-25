import { useState, useEffect, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Link2, Flag, Trash2, Edit2, Video, CheckSquare, AlertTriangle, Star } from 'lucide-react';
import useCurrentTeamStore from '../store/useCurrentTeamStore';
import Modal from '../components/common/Modal';

const TYPE_CONFIG = {
  meeting:  { label: 'Meeting',  color: 'bg-blue-500',   chip: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30',       icon: Video },
  task:     { label: 'Task',     color: 'bg-amber-500',  chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30', icon: CheckSquare },
  deadline: { label: 'Deadline', color: 'bg-red-500',    chip: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',             icon: AlertTriangle },
  event:    { label: 'Event',    color: 'bg-purple-500', chip: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30', icon: Star },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = () => {
  const { activeWorkspace } = useAppStore();
  const myRole = useCurrentTeamStore((s) => s.currentTeam?.role) || 'member';
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [filters, setFilters] = useState({ meeting: true, task: true, deadline: true, event: true });

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'event', startDate: '', endDate: '', allDay: false, location: '', meetingLink: '', priority: 'medium', assignedTo: [] });

  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await api.get(`/events/${activeWorkspace._id}`);
      setEvents(res.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchEvents(); }, [activeWorkspace]);

  const filteredEvents = useMemo(() =>
    events.filter(e => filters[e.type] !== false),
    [events, filters]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    const prevLast = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) days.push({ day: prevLast - i, month: month - 1, isOther: true });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, month, isOther: false });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ day: i, month: month + 1, isOther: true });
    return days;
  }, [year, month, daysInMonth, startOffset]);

  const getEventsForDay = (day, m) => {
    const targetDate = new Date(year, m, day);
    return filteredEvents.filter(e => {
      const start = new Date(e.startDate);
      const end = e.endDate ? new Date(e.endDate) : start;
      return targetDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
             targetDate <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
    });
  };

  const getWeekDays = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      return day;
    });
  };

  const weekDays = useMemo(() => getWeekDays(), [currentDate]);

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const isToday = (day, m) => {
    const today = new Date();
    return day === today.getDate() && m === today.getMonth() && year === today.getFullYear();
  };

  const openCreateModal = (prefillDate) => {
    if (myRole === 'member') return toast.error('Restricted to Admins/Managers');
    const dateStr = prefillDate ? new Date(prefillDate.getTime() - prefillDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    setForm({ title: '', description: '', type: 'event', startDate: dateStr, endDate: '', allDay: false, location: '', meetingLink: '', priority: 'medium', assignedTo: [] });
    setEditingEvent(null);
    setShowModal(true);
  };

  const openEditModal = (event) => {
    const toLocal = (d) => d ? new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    setForm({
      title: event.title, description: event.description || '', type: event.type,
      startDate: toLocal(event.startDate), endDate: toLocal(event.endDate),
      allDay: event.allDay, location: event.location || '', meetingLink: event.meetingLink || '',
      priority: event.priority || 'medium', assignedTo: (event.assignedTo || []).map(u => u._id || u),
    });
    setEditingEvent(event);
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate) return;
    try {
      if (editingEvent) {
        const res = await api.put(`/events/${editingEvent._id}`, { ...form, workspaceId: activeWorkspace._id });
        setEvents(prev => prev.map(ev => ev._id === editingEvent._id ? res.data : ev));
        toast.success('Event updated');
      } else {
        const res = await api.post('/events', { ...form, workspaceId: activeWorkspace._id });
        setEvents(prev => [...prev, res.data]);
        toast.success('Event created');
      }
      setShowModal(false);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/events/${id}`);
      setEvents(prev => prev.filter(e => e._id !== id));
      setSelectedEvent(null);
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const toggleFilter = (type) => setFilters(prev => ({ ...prev, [type]: !prev[type] }));

  const inputCls = 'w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors [color-scheme:light] dark:[color-scheme:dark]';
  const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-gray-500 mb-1';

  if (!activeWorkspace) {
    return (
      <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center text-slate-500 dark:text-gray-500 transition-colors duration-200">
        Select a workspace
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex flex-col overflow-hidden font-sans transition-colors duration-200">
      {/* Header */}
      <div className="h-14 border-b border-slate-200 dark:border-gray-800 flex items-center px-6 justify-between shrink-0 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-sm z-10 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalIcon size={20} className="text-emerald-600 dark:text-emerald-400" /> Calendar
          </h2>
          <div className="flex items-center gap-1 ml-4">
            <button onClick={() => navigate(-1)} className="p-1 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors active:scale-90"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 text-xs text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors active:scale-95">Today</button>
            <button onClick={() => navigate(1)} className="p-1 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded transition-colors active:scale-90"><ChevronRight size={18} /></button>
          </div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-gray-300">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => toggleFilter(key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                  filters[key] ? cfg.chip : 'text-slate-400 dark:text-gray-600 border-slate-200 dark:border-gray-800 opacity-60'
                }`}>
                <span className={`w-2 h-2 rounded-full ${cfg.color}`}></span>
                {cfg.label}
              </button>
            ))}
          </div>
          <div className="flex bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => setView('month')} className={`px-3 py-1 text-xs font-medium transition-colors ${view === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>Month</button>
            <button onClick={() => setView('week')} className={`px-3 py-1 text-xs font-medium transition-colors ${view === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>Week</button>
          </div>
          <button onClick={() => openCreateModal(new Date())} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors active:scale-95">
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto bg-white dark:bg-transparent">
        {view === 'month' ? (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-gray-800 shrink-0 bg-slate-50 dark:bg-transparent">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
              {calendarDays.map((cell, i) => {
                const dayEvents = getEventsForDay(cell.day, cell.month);
                const today = isToday(cell.day, cell.month);
                return (
                  <div key={i}
                    onClick={() => openCreateModal(new Date(year, cell.month, cell.day, 9))}
                    className={`border-b border-r border-slate-200/70 dark:border-gray-800/50 p-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#161b22]/50 transition-colors min-h-[80px] ${cell.isOther ? 'opacity-40' : ''}`}>
                    <div className={`text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${
                      today ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-gray-400'
                    }`}>{cell.day}</div>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map(ev => {
                        const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.event;
                        return (
                          <button key={ev._id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${cfg.color} text-white/90`}>
                            {ev.title}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && <span className="text-[10px] text-slate-500 dark:text-gray-500 pl-1">+{dayEvents.length - 3} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week View */
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-gray-800 shrink-0">
              {weekDays.map((d, i) => {
                const today = d.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className="py-2 text-center border-r border-slate-200/70 dark:border-gray-800/50">
                    <div className="text-[10px] text-slate-500 dark:text-gray-500 uppercase">{DAYS[d.getDay()]}</div>
                    <div className={`text-lg font-bold mt-0.5 ${today ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-gray-300'}`}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 flex-1">
              {weekDays.map((d, i) => {
                const dayEvents = filteredEvents.filter(e => {
                  const start = new Date(e.startDate);
                  return start.toDateString() === d.toDateString();
                });
                return (
                  <div key={i} onClick={() => openCreateModal(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9))}
                    className="border-r border-slate-200/70 dark:border-gray-800/50 p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#161b22]/50 min-h-[200px] flex flex-col gap-1.5 transition-colors">
                    {dayEvents.map(ev => {
                      const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.event;
                      const Icon = cfg.icon;
                      return (
                        <button key={ev._id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                          className={`w-full text-left p-2 rounded-lg border ${cfg.chip} hover:opacity-80 transition-opacity`}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Icon size={12} />
                            <span className="text-xs font-semibold truncate">{ev.title}</span>
                          </div>
                          {!ev.allDay && <div className="text-[10px] opacity-70">{formatTime(ev.startDate)}</div>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div className="relative bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-90"><X size={18} /></button>
            {(() => {
              const cfg = TYPE_CONFIG[selectedEvent.type] || TYPE_CONFIG.event;
              const Icon = cfg.icon;
              return (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`p-2 rounded-lg ${cfg.chip} border`}><Icon size={18} /></span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedEvent.title}</h3>
                      <span className="text-xs text-slate-500 dark:text-gray-500 capitalize">{selectedEvent.type}</span>
                    </div>
                  </div>
                  {selectedEvent.description && <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">{selectedEvent.description}</p>}
                  <div className="flex flex-col gap-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400"><Clock size={14} /> {new Date(selectedEvent.startDate).toLocaleString()}</div>
                    {selectedEvent.location && <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400"><MapPin size={14} /> {selectedEvent.location}</div>}
                    {selectedEvent.meetingLink && <a href={selectedEvent.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"><Link2 size={14} /> Join Meeting</a>}
                    {selectedEvent.priority && selectedEvent.type === 'task' && <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400"><Flag size={14} /> Priority: <span className="capitalize">{selectedEvent.priority}</span></div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(selectedEvent)} className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition-colors active:scale-95"><Edit2 size={14} /> Edit</button>
                    <button onClick={() => handleDelete(selectedEvent._id)} className="flex items-center justify-center gap-1 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95"><Trash2 size={14} /></button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEvent ? 'Edit Event' : 'New Event'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className={inputCls} placeholder="Event name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls}>
                <option value="event">Event</option><option value="meeting">Meeting</option>
                <option value="task">Task</option><option value="deadline">Deadline</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>All Day</label>
              <button type="button" onClick={() => setForm({ ...form, allDay: !form.allDay })}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.allDay ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400'}`}>
                {form.allDay ? 'Yes' : 'No'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start</label>
              <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End</label>
              <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls + ' resize-none'} placeholder="Details..." />
          </div>

          {form.type === 'meeting' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} placeholder="Room / Address" />
              </div>
              <div>
                <label className={labelCls}>Meeting Link</label>
                <input value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} className={inputCls} placeholder="https://meet.google.com/..." />
              </div>
            </div>
          )}

          {(form.type === 'task' || form.type === 'deadline') && (
            <div>
              <label className={labelCls}>Priority</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(p => {
                  const active = form.priority === p;
                  const activeStyle = p === 'high'
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30'
                    : p === 'medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-700';
                  return (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                        active ? activeStyle : 'border-slate-200 dark:border-gray-700 text-slate-400 dark:text-gray-600'
                      }`}>{p}</button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95">Cancel</button>
            <button type="submit" disabled={!form.title.trim() || !form.startDate}
              className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50 transition-colors active:scale-95">
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarView;
