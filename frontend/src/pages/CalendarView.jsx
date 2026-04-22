import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const CalendarView = () => {
  const { activeWorkspace } = useAppStore();
  const { simulatedRole } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const fetchEvents = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await api.get(`/events/${activeWorkspace._id}`);
      setEvents(res.data);
    } catch {
      toast.error('Failed to load events');
    }
  };

  useEffect(() => { fetchEvents(); }, [activeWorkspace]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (simulatedRole === 'Member') return toast.error('Only Admins/Managers can create events.');
    if (!title || !date) return;
    try {
      const res = await api.post('/events', { workspaceId: activeWorkspace._id, title, date });
      setEvents([...events, res.data]);
      setTitle('');
      setDate('');
      toast.success('Event Added!');
    } catch {
      toast.error('Failed to add event');
    }
  };

  if (!activeWorkspace) return <div className="p-8 text-white">Select a workspace</div>;

  return (
    <div className="flex-1 bg-[#0d1117] flex flex-col font-sans relative overflow-y-auto">
      <div className="h-14 border-b border-gray-800 flex items-center px-6 shrink-0 bg-[#161b22]/90 backdrop-blur-sm z-10 w-full shadow-sm sticky top-0">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <CalendarIcon size={20} className="text-emerald-400" /> Corporate Calendar
        </h2>
      </div>

      <div className="p-8 max-w-4xl w-full mx-auto flex flex-col gap-8 pb-24">
        
        {simulatedRole !== 'Member' && (
          <form onSubmit={handleCreate} className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Event Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} type="text" className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="e.g. Q4 Planning Node" required/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date / Time</label>
              <input value={date} onChange={e=>setDate(e.target.value)} type="datetime-local" className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer" required/>
            </div>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 h-[42px]"><Plus size={18}/> Schedule</button>
          </form>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-800 pb-2">Upcoming Schedule</h3>
          {events.length === 0 ? (
            <div className="text-gray-600 text-center py-12 border border-dashed border-gray-800 rounded-xl">No events scheduled.</div>
          ) : (
            events.sort((a,b) => new Date(a.date) - new Date(b.date)).map(ev => {
              const d = new Date(ev.date);
              return (
                <div key={ev._id} className="flex bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors shadow-sm">
                  <div className="bg-emerald-500/10 border-r border-emerald-500/20 w-24 flex flex-col items-center justify-center py-4 shrink-0">
                    <span className="text-emerald-400 font-bold text-2xl">{d.getDate()}</span>
                    <span className="text-emerald-600 text-xs font-bold uppercase">{d.toLocaleDateString('default', { month: 'short' })}</span>
                  </div>
                  <div className="p-4 flex flex-col justify-center">
                    <h4 className="text-white font-semibold text-lg">{ev.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Clock size={14} /> {d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default CalendarView;
