import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, Users, CheckSquare, MessageSquare, TrendingUp, FolderKanban, Calendar, ArrowUp } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import useThemeStore from '../store/useThemeStore';
import api from '../services/api';

const card = 'bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm transition-colors duration-200';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`${card} flex items-start gap-4`}>
    <div className={`p-2.5 rounded-xl ${color}`}><Icon size={20} /></div>
    <div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><ArrowUp size={10} />{sub}</p>}
    </div>
  </div>
);

const ChartTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1c212b] border border-slate-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-600 dark:text-gray-400 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const { activeWorkspace } = useAppStore();
  const { theme } = useThemeStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    api.get(`/analytics/workspace/${activeWorkspace._id}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const shell = 'flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] transition-colors duration-200';

  if (!activeWorkspace) return <div className={`${shell} flex items-center justify-center text-slate-500 dark:text-gray-500`}>Select a workspace</div>;
  if (loading) return <div className={`${shell} flex items-center justify-center text-slate-500 dark:text-gray-500`}>Loading analytics...</div>;
  if (!data) return <div className={`${shell} flex items-center justify-center text-slate-500 dark:text-gray-500`}>No data available</div>;

  const { overview, taskStatusDist, priorityDist, tasksPerUser, dailyActivity, timeline } = data;
  const axisColor = theme === 'dark' ? '#6b7280' : '#94a3b8';
  const labelColor = theme === 'dark' ? '#d1d5db' : '#334155';
  const gridColor = theme === 'dark' ? '#1f2937' : '#e5e7eb';
  const legendColor = theme === 'dark' ? 'text-gray-400' : 'text-slate-600';

  const now = new Date();
  const timelineProjects = (timeline || []).filter(p => p.startDate);
  const minDate = timelineProjects.length > 0 ? new Date(Math.min(...timelineProjects.map(p => new Date(p.startDate)))) : now;
  const maxDate = timelineProjects.length > 0 ? new Date(Math.max(...timelineProjects.map(p => new Date(p.endDate || now)))) : now;
  const totalSpan = Math.max(maxDate - minDate, 1);

  const getBarStyle = (p) => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate || now);
    const left = ((start - minDate) / totalSpan) * 100;
    const width = Math.max(((end - start) / totalSpan) * 100, 2);
    const isOverdue = p.status !== 'completed' && p.endDate && new Date(p.endDate) < now;
    const color = p.status === 'completed' ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-blue-500';
    return { left: `${left}%`, width: `${width}%`, color, isOverdue };
  };

  return (
    <div className={`${shell} flex flex-col overflow-y-auto font-sans`}>
      <div className="h-14 border-b border-slate-200 dark:border-gray-800 flex items-center px-6 shrink-0 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-sm z-10 shadow-sm sticky top-0 transition-colors duration-200">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" /> Analytics
        </h2>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard icon={FolderKanban} label="Projects" value={overview.totalProjects} color="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400" />
          <StatCard icon={CheckSquare} label="Total Tasks" value={overview.totalTasks} color="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" />
          <StatCard icon={TrendingUp} label="Completed" value={overview.completedTasks} sub={`${overview.completionRate}% rate`} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
          <StatCard icon={MessageSquare} label="Messages" value={overview.totalMessages} color="bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400" />
          <StatCard icon={Users} label="Members" value={overview.totalMembers} color="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
          <StatCard icon={Calendar} label="Completion" value={`${overview.completionRate}%`} color="bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${card}`}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4">Daily Activity (14 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Tasks" />
                <Line type="monotone" dataKey="messages" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Messages" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={card}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4">Task Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={taskStatusDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {taskStatusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className={legendColor}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${card}`}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4">Tasks Per User</h3>
            {tasksPerUser.length === 0 ? (
              <p className="text-slate-400 dark:text-gray-600 text-sm text-center py-12">No assigned tasks yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tasksPerUser} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: labelColor, fontSize: 11 }} width={100} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" fill="#6366f1" name="Total" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="done" fill="#10b981" name="Done" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={card}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={priorityDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {priorityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className={legendColor}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Timeline (Gantt) */}
        <div className={card}>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" /> Project Timeline
          </h3>
          {timelineProjects.length === 0 ? (
            <p className="text-slate-400 dark:text-gray-600 text-sm text-center py-12">No projects with dates yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center h-6 text-[10px] text-slate-500 dark:text-gray-600 relative ml-[180px]">
                <span className="absolute left-0">{minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="absolute left-1/2 -translate-x-1/2">
                  {new Date((minDate.getTime() + maxDate.getTime()) / 2).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="absolute right-0">{maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>

              {timelineProjects.map(p => {
                const bar = getBarStyle(p);
                const days = Math.ceil((new Date(p.endDate || now) - new Date(p.startDate)) / 86400000);
                return (
                  <div key={p._id} className="flex items-center gap-4 group">
                    <div className="w-[180px] shrink-0 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${bar.color}`}></span>
                      <span className="text-sm text-slate-700 dark:text-gray-300 truncate font-medium">{p.title}</span>
                    </div>
                    <div className="flex-1 h-8 bg-slate-50 dark:bg-[#0d1117] rounded-lg relative overflow-hidden border border-slate-200 dark:border-gray-800">
                      <div className={`absolute top-1 bottom-1 rounded-md ${bar.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-2`}
                        style={{ left: bar.left, width: bar.width }}>
                        <span className="text-[10px] text-white font-medium whitespace-nowrap">{days}d</span>
                      </div>
                      {(() => {
                        const todayPos = ((now - minDate) / totalSpan) * 100;
                        if (todayPos >= 0 && todayPos <= 100) {
                          return <div className="absolute top-0 bottom-0 w-px bg-emerald-500/60" style={{ left: `${todayPos}%` }}></div>;
                        }
                        return null;
                      })()}
                    </div>
                    <div className="w-20 shrink-0 text-right">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        p.status === 'completed' ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' :
                        bar.isOverdue ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10' :
                        'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'
                      }`}>
                        {p.status === 'completed' ? 'Done' : bar.isOverdue ? 'Overdue' : 'Active'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
