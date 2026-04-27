import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import useAppStore from '../store/useAppStore';
import {
  Plus, FolderKanban, Trash2, Calendar, X, Upload, FileText, FileImage,
  FileArchive, File as FileIcon, ChevronDown, CheckCircle2, Circle,
  Clock, Flag, ListTodo, FileStack, Users, GitBranch, Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useCurrentTeamStore from '../store/useCurrentTeamStore';

/* ============================================================ */
/*                         CONSTANTS                            */
/* ============================================================ */

const TABS = [
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'documents', label: 'Documents', icon: FileStack },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'timeline', label: 'Timeline', icon: GitBranch },
];

const COLUMNS = [
  { key: 'Todo',        label: 'To Do',       dot: 'bg-slate-400 dark:bg-gray-500' },
  { key: 'In Progress', label: 'In Progress', dot: 'bg-blue-500 dark:bg-blue-400' },
  { key: 'In Review',   label: 'In Review',   dot: 'bg-amber-500 dark:bg-amber-400' },
  { key: 'Done',        label: 'Completed',   dot: 'bg-emerald-500 dark:bg-emerald-400' },
];

const PRIORITY = {
  high: {
    label: 'High',
    cls: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    dot: 'bg-red-500 dark:bg-red-400',
  },
  medium: {
    label: 'Medium',
    cls: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  low: {
    label: 'Low',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
};

const PROJECT_STATUS = {
  planning:  { label: 'Planning',  cls: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30' },
  active:    { label: 'Active',    cls: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30' },
  archived:  { label: 'Archived',  cls: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-gray-700/40 dark:text-gray-400 dark:ring-gray-700' },
};

/* ============================================================ */
/*                          HELPERS                             */
/* ============================================================ */

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const formatFullDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';

const avatarBg = (seed = '') => {
  const palette = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

const fileIconFor = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext))
    return { icon: FileImage, color: 'text-pink-500 bg-pink-50 dark:text-pink-400 dark:bg-pink-500/10' };
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
    return { icon: FileArchive, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10' };
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext))
    return { icon: FileText, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10' };
  return { icon: FileIcon, color: 'text-slate-500 bg-slate-100 dark:text-gray-400 dark:bg-gray-800' };
};

const formatBytes = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

/* ============================================================ */
/*                        SHARED STYLES                         */
/* ============================================================ */

const SURFACE = 'bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800';
const SURFACE_HOVER = 'hover:border-slate-300 dark:hover:border-gray-700';
const TEXT_PRIMARY = 'text-slate-900 dark:text-white';
const TEXT_BODY = 'text-slate-700 dark:text-gray-200';
const TEXT_MUTED = 'text-slate-500 dark:text-gray-400';
const TEXT_SUBTLE = 'text-slate-400 dark:text-gray-500';
const BTN_PRIMARY = 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all duration-150 active:scale-95';
const SKELETON = 'ls-skeleton bg-slate-200/80 dark:bg-gray-700/50 rounded-lg';

/* ============================================================ */
/*                        MAIN COMPONENT                        */
/* ============================================================ */

const ProjectWorkspace = () => {
  const { activeWorkspace, activeTeam, getTeamMembers } = useAppStore();
  const myRole = useCurrentTeamStore((s) => s.currentTeam?.role) || 'member';

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');

  const [tasks, setTasks] = useState({ 'Todo': [], 'In Progress': [], 'In Review': [], 'Done': [] });
  const [tasksLoading, setTasksLoading] = useState(false);

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskColumn, setTaskColumn] = useState('Todo');
  // null when creating, the task object when editing — drives the same modal.
  const [editingTask, setEditingTask] = useState(null);
  // null when creating a new project, the project object when editing.
  const [editingProject, setEditingProject] = useState(null);

  const [npTitle, setNpTitle] = useState('');
  const [npDesc, setNpDesc] = useState('');
  const [npStart, setNpStart] = useState('');
  const [npEnd, setNpEnd] = useState('');
  const [npTeamIds, setNpTeamIds] = useState([]);
  const [creatingProject, setCreatingProject] = useState(false);

  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tPriority, setTPriority] = useState('medium');
  // Multi-assignee — array of userIds. Replaces the previous single-id state.
  const [tAssignees, setTAssignees] = useState([]);
  const [tDue, setTDue] = useState('');

  const isMember = myRole === 'member';
  const { teams: workspaceTeams } = useAppStore();

  // Members assignable on the active project: union of members across the
  // teams attached to the project. Falls back to the active team's members
  // (legacy single-team projects). De-duplicated by user id so the same
  // person doesn't appear twice when they're in multiple selected teams.
  const projectAssignableMembers = useMemo(() => {
    const teamIds = (selectedProject?.teamIds && selectedProject.teamIds.length)
      ? selectedProject.teamIds.map((t) => (t?._id || t))
      : (selectedProject?.teamId ? [selectedProject.teamId._id || selectedProject.teamId] : (activeTeam ? [activeTeam._id] : []));
    const seen = new Map();
    teamIds.forEach((tid) => {
      getTeamMembers(tid).forEach((m) => { if (m?.id && !seen.has(m.id)) seen.set(m.id, m); });
    });
    return [...seen.values()];
  }, [selectedProject, activeTeam, getTeamMembers]);

  const teamMembers = projectAssignableMembers; // alias used by older modal callers

  useEffect(() => {
    if (!activeWorkspace) return;
    setProjectsLoading(true);
    (async () => {
      try {
        const res = await api.get(`/projects/${activeWorkspace._id}`);
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProject(prev =>
            prev && res.data.find(p => p._id === prev._id) ? prev : res.data[0]
          );
        } else {
          setSelectedProject(null);
        }
      } catch { /* silent */ }
      finally { setProjectsLoading(false); }
    })();
  }, [activeWorkspace]);

  useEffect(() => {
    if (!selectedProject) return;
    setTasksLoading(true);
    (async () => {
      try {
        const res = await api.get(`/tasks/${selectedProject._id}`);
        const grouped = { 'Todo': [], 'In Progress': [], 'In Review': [], 'Done': [] };
        res.data.forEach(t => {
          if (grouped[t.status]) grouped[t.status].push(t);
          else grouped['Todo'].push({ ...t, status: 'Todo' });
        });
        setTasks(grouped);
      } catch { /* silent */ }
      finally { setTasksLoading(false); }
    })();
  }, [selectedProject]);

  const resetProjectForm = () => {
    setNpTitle(''); setNpDesc(''); setNpStart(''); setNpEnd(''); setNpTeamIds([]);
  };

  const openEditProject = (project) => {
    if (isMember) return toast.error('Restricted');
    setEditingProject(project);
    setNpTitle(project.title || '');
    setNpDesc(project.description || '');
    setNpStart(project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '');
    setNpEnd(project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '');
    const ids = (project.teamIds && project.teamIds.length)
      ? project.teamIds.map((t) => (t?._id || t))
      : (project.teamId ? [project.teamId._id || project.teamId] : []);
    setNpTeamIds(ids.map(String));
    setShowCreateProject(true);
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!npTitle.trim() || !activeWorkspace) return;
    setCreatingProject(true);
    try {
      if (editingProject) {
        const res = await api.put(`/projects/${editingProject._id}`, {
          title: npTitle,
          description: npDesc,
          startDate: npStart || null,
          endDate: npEnd || null,
          teamIds: npTeamIds,
        });
        setProjects(prev => prev.map(p => p._id === res.data._id ? res.data : p));
        if (selectedProject?._id === res.data._id) setSelectedProject(res.data);
        toast.success(`"${res.data.title}" updated`);
      } else {
        const res = await api.post('/projects', {
          workspaceId: activeWorkspace._id,
          title: npTitle,
          description: npDesc,
          startDate: npStart || new Date().toISOString(),
          endDate: npEnd || null,
          teamIds: npTeamIds,
        });
        setProjects(prev => [res.data, ...prev]);
        setSelectedProject(res.data);
        toast.success(`"${res.data.title}" created`);
      }
      setShowCreateProject(false);
      setEditingProject(null);
      resetProjectForm();
    } catch { toast.error('Failed'); }
    finally { setCreatingProject(false); }
  };

  const handleDeleteProject = async (project) => {
    if (!project) return;
    if (isMember) return toast.error('Restricted');
    if (!confirm(`Delete "${project.title}"? All its tasks will also be removed.`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      setProjects(prev => prev.filter(p => p._id !== project._id));
      if (selectedProject?._id === project._id) {
        const next = projects.find(p => p._id !== project._id) || null;
        setSelectedProject(next);
      }
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const updateProjectStatus = async (status) => {
    if (!selectedProject) return;
    if (isMember) return toast.error('Members cannot change status');
    try {
      const res = await api.put(`/projects/${selectedProject._id}`, { status });
      setSelectedProject(res.data);
      setProjects(prev => prev.map(p => p._id === res.data._id ? res.data : p));
    } catch { toast.error('Failed to update'); }
  };

  const onDragEnd = async (r) => {
    if (isMember) return toast.error('Members cannot move tasks');
    const { source, destination } = r;
    if (!destination) return;
    const src = source.droppableId, dst = destination.droppableId;
    if (src === dst && source.index === destination.index) return;

    const srcArr = [...tasks[src]];
    const dstArr = src === dst ? srcArr : [...tasks[dst]];
    const [moved] = srcArr.splice(source.index, 1);

    if (src === dst) {
      srcArr.splice(destination.index, 0, moved);
      setTasks(prev => ({ ...prev, [src]: srcArr }));
    } else {
      moved.status = dst;
      dstArr.splice(destination.index, 0, moved);
      setTasks(prev => ({ ...prev, [src]: srcArr, [dst]: dstArr }));
      api.put(`/tasks/${moved._id}`, { status: dst }).catch(() => toast.error('Sync failed'));
    }
  };

  const resetTaskForm = () => {
    setTTitle(''); setTDesc(''); setTPriority('medium'); setTAssignees([]); setTDue('');
  };

  const openCreateTask = (column) => {
    if (isMember) return toast.error('Restricted');
    setEditingTask(null);
    resetTaskForm();
    setTaskColumn(column);
    setShowCreateTask(true);
  };

  // Open the same modal in edit mode — populates fields from the existing task.
  const openEditTask = (task) => {
    if (isMember) return toast.error('Restricted');
    setEditingTask(task);
    setTaskColumn(task.status);
    setTTitle(task.title || '');
    setTDesc(task.description || '');
    setTPriority(task.priority || 'medium');
    // Hydrate the multi-assignee selection from `assignees[]` (new field)
    // with a fall-back to the legacy single `assignedTo` reference.
    const ids = Array.isArray(task.assignees) && task.assignees.length
      ? task.assignees.map((a) => String(a?._id || a))
      : (task.assignedTo ? [String(task.assignedTo?._id || task.assignedTo)] : []);
    setTAssignees(ids);
    setTDue(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
    setShowCreateTask(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!tTitle.trim() || !selectedProject) return;
    try {
      if (editingTask) {
        // Edit path — PUT /tasks/:id, then patch the right column in state.
        const res = await api.put(`/tasks/${editingTask._id}`, {
          title: tTitle,
          description: tDesc,
          priority: tPriority,
          assignees: tAssignees,
          dueDate: tDue || null,
        });
        const updated = res.data;
        setTasks(prev => ({
          ...prev,
          [editingTask.status]: prev[editingTask.status].map(t => t._id === updated._id ? updated : t),
        }));
        toast.success('Task updated');
      } else {
        const res = await api.post('/tasks', {
          projectId: selectedProject._id,
          title: tTitle,
          description: tDesc,
          status: taskColumn,
          priority: tPriority,
          assignees: tAssignees,
          dueDate: tDue || null,
        });
        setTasks(prev => ({ ...prev, [taskColumn]: [...prev[taskColumn], res.data] }));
        toast.success('Task created');
      }
      setShowCreateTask(false);
      setEditingTask(null);
      resetTaskForm();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteTask = async (id, status) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => ({ ...prev, [status]: prev[status].filter(t => t._id !== id) }));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  /* ----- early returns ----- */
  if (!activeWorkspace) {
    return (
      <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center transition-colors duration-200">
        <p className={`text-sm ${TEXT_MUTED}`}>Select a workspace first</p>
      </div>
    );
  }

  if (!selectedProject && !projectsLoading) {
    return (
      <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex flex-col transition-colors duration-200">
        <TopBar
          projects={projects}
          selectedProject={null}
          onSelect={setSelectedProject}
          onNewProject={() => !isMember ? setShowCreateProject(true) : toast.error('Restricted')}
        />
        <EmptyProjects onCreate={() => !isMember && setShowCreateProject(true)} />

        <CreateProjectModal
          open={showCreateProject}
          onClose={() => { setShowCreateProject(false); setEditingProject(null); resetProjectForm(); }}
          editing={!!editingProject}
          teams={workspaceTeams}
          {...{ npTitle, setNpTitle, npDesc, setNpDesc, npStart, setNpStart, npEnd, setNpEnd, npTeamIds, setNpTeamIds, creatingProject, onSubmit: handleSubmitProject }}
        />
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex flex-col overflow-hidden font-sans ${TEXT_BODY} transition-colors duration-200`}>
      <TopBar
        projects={projects}
        selectedProject={selectedProject}
        onSelect={setSelectedProject}
        onNewProject={() => !isMember ? setShowCreateProject(true) : toast.error('Restricted')}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {projectsLoading || !selectedProject ? (
            <ProjectHeaderSkeleton />
          ) : (
            <div className="animate-fade-in">
              <ProjectHeader
                project={selectedProject}
                onStatusChange={updateProjectStatus}
                onEdit={() => openEditProject(selectedProject)}
                onDelete={() => handleDeleteProject(selectedProject)}
                disabled={isMember}
              />
            </div>
          )}

          <Tabs active={activeTab} onChange={setActiveTab} />

          <div key={activeTab} className="mt-6 pb-10 animate-fade-in">
            {activeTab === 'tasks' && (
              <TasksTab
                tasks={tasks}
                loading={tasksLoading}
                onDragEnd={onDragEnd}
                onAdd={openCreateTask}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                disabled={isMember}
              />
            )}

            {activeTab === 'documents' && selectedProject && (
              <DocumentsTab key={selectedProject._id} projectId={selectedProject._id} />
            )}

            {activeTab === 'team' && (
              <TeamTab members={teamMembers} />
            )}

            {activeTab === 'timeline' && selectedProject && (
              <TimelineTab project={selectedProject} tasks={tasks} loading={tasksLoading} />
            )}
          </div>
        </div>
      </div>

      <CreateProjectModal
        open={showCreateProject}
        onClose={() => { setShowCreateProject(false); setEditingProject(null); resetProjectForm(); }}
        editing={!!editingProject}
        teams={workspaceTeams}
        {...{ npTitle, setNpTitle, npDesc, setNpDesc, npStart, setNpStart, npEnd, setNpEnd, npTeamIds, setNpTeamIds, creatingProject, onSubmit: handleSubmitProject }}
      />

      <CreateTaskModal
        open={showCreateTask}
        onClose={() => { setShowCreateTask(false); setEditingTask(null); }}
        column={taskColumn}
        members={projectAssignableMembers}
        editing={!!editingTask}
        {...{ tTitle, setTTitle, tDesc, setTDesc, tPriority, setTPriority, tAssignees, setTAssignees, tDue, setTDue, onSubmit: handleSubmitTask }}
      />
    </div>
  );
};

/* ============================================================ */
/*                          TOP BAR                             */
/* ============================================================ */

const TopBar = ({ projects, selectedProject, onSelect, onNewProject }) => (
  <div className="h-14 bg-white dark:bg-[#0d1117] border-b border-slate-200 dark:border-gray-800 flex items-center px-6 justify-between shrink-0 transition-colors duration-200">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
        <FolderKanban size={16} className="text-blue-600 dark:text-blue-400" />
      </div>
      <h1 className={`text-sm font-semibold ${TEXT_PRIMARY}`}>Projects</h1>
      {projects.length > 0 && (
        <>
          <span className="text-slate-300 dark:text-gray-700">/</span>
          <div className="relative">
            <select
              value={selectedProject?._id || ''}
              onChange={e => onSelect(projects.find(p => p._id === e.target.value))}
              className="appearance-none bg-transparent pr-7 pl-2 py-1 text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white outline-none cursor-pointer"
            >
              {projects.map(p => <option key={p._id} value={p._id} className="bg-white dark:bg-[#161b22]">{p.title}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
          </div>
        </>
      )}
    </div>
    <button
      onClick={onNewProject}
      className={`inline-flex items-center gap-1.5 ${BTN_PRIMARY} px-3.5 py-1.5 rounded-lg text-sm font-medium`}
    >
      <Plus size={15} /> New project
    </button>
  </div>
);

/* ============================================================ */
/*                       PROJECT HEADER                         */
/* ============================================================ */

const ProjectHeader = ({ project, onStatusChange, onEdit, onDelete, disabled }) => {
  const status = PROJECT_STATUS[project.status] || PROJECT_STATUS.active;
  // Render the team chips inline so it's clear which teams own the project.
  const teamChips = (project.teamIds && project.teamIds.length)
    ? project.teamIds
    : (project.teamId ? [project.teamId] : []);
  return (
    <div className={`${SURFACE} rounded-2xl p-6 shadow-sm transition-colors duration-200`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <h2 className={`text-2xl font-semibold ${TEXT_PRIMARY} tracking-tight truncate`}>{project.title}</h2>
          <p className={`text-sm ${TEXT_MUTED} mt-1 line-clamp-2`}>
            {project.description || 'No description added yet.'}
          </p>
          {teamChips.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 mt-3">
              {teamChips.map((t) => {
                const tid = t?._id || t;
                const tname = t?.name || 'Team';
                return (
                  <span key={tid} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30">
                    <Users size={10} /> {tname}
                  </span>
                );
              })}
            </div>
          )}
          {(project.startDate || project.endDate) && (
            <div className={`flex items-center gap-4 mt-3 text-xs ${TEXT_SUBTLE}`}>
              {project.startDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} /> Start: {formatFullDate(project.startDate)}
                </span>
              )}
              {project.endDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} /> Due: {formatFullDate(project.endDate)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={project.status}
              disabled={disabled}
              onChange={e => onStatusChange(e.target.value)}
              className="appearance-none bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 dark:text-gray-200 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ring-1 ${status.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {status.label}
          </span>

          {!disabled && onEdit && (
            <button
              onClick={onEdit}
              title="Edit project"
              className="p-2 rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
            >
              <Edit2 size={15} />
            </button>
          )}
          {!disabled && onDelete && (
            <button
              onClick={onDelete}
              title="Delete project"
              className="p-2 rounded-lg text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors active:scale-95"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectHeaderSkeleton = () => (
  <div className={`${SURFACE} rounded-2xl p-6 shadow-sm`}>
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0 flex-1 flex flex-col gap-3">
        <div className={`${SKELETON} h-7 w-56`} />
        <div className={`${SKELETON} h-4 w-80 max-w-full`} />
        <div className="flex gap-3 mt-1">
          <div className={`${SKELETON} h-3 w-28`} />
          <div className={`${SKELETON} h-3 w-28`} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`${SKELETON} h-9 w-28`} />
        <div className={`${SKELETON} h-7 w-20 rounded-full`} />
      </div>
    </div>
  </div>
);

/* ============================================================ */
/*                            TABS                              */
/* ============================================================ */

const Tabs = ({ active, onChange }) => (
  <div className="mt-5 border-b border-slate-200 dark:border-gray-800 transition-colors duration-200">
    <div className="flex items-center gap-1">
      {TABS.map(t => {
        const isActive = active === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
            }`}
          >
            <Icon size={15} />
            {t.label}
            <span
              className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full transition-all duration-200 ${
                isActive ? 'bg-blue-600 dark:bg-blue-500' : 'bg-transparent'
              }`}
            />
          </button>
        );
      })}
    </div>
  </div>
);

/* ============================================================ */
/*                          TASKS TAB                           */
/* ============================================================ */

const TasksTab = ({ tasks, loading, onDragEnd, onAdd, onEdit, onDelete, disabled }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className={`text-lg font-semibold ${TEXT_PRIMARY}`}>Task Board</h3>
        <p className={`text-sm ${TEXT_MUTED} mt-0.5`}>Drag cards between columns to update status</p>
      </div>
      <button
        onClick={() => onAdd('Todo')}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 ${BTN_PRIMARY} disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium`}
      >
        <Plus size={15} /> Add task
      </button>
    </div>

    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.key}
            column={col}
            tasks={tasks[col.key] || []}
            loading={loading}
            onAdd={() => onAdd(col.key)}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </div>
    </DragDropContext>
  </div>
);

const KanbanColumn = ({ column, tasks, loading, onAdd, onEdit, onDelete, disabled }) => (
  <div className={`${SURFACE} rounded-2xl flex flex-col min-h-[340px] transition-colors duration-200`}>
    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${column.dot}`} />
        <span className={`text-sm font-semibold ${TEXT_BODY}`}>{column.label}</span>
        <span className={`text-xs ${TEXT_MUTED} bg-slate-100 dark:bg-[#0d1117] rounded-full px-2 py-0.5 font-medium`}>
          {loading ? '—' : tasks.length}
        </span>
      </div>
      <button
        onClick={onAdd}
        disabled={disabled}
        className="p-1 text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors disabled:opacity-40 active:scale-90"
      >
        <Plus size={15} />
      </button>
    </div>

    <Droppable droppableId={column.key}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex-1 p-3 transition-colors duration-150 ${snapshot.isDraggingOver ? 'bg-blue-50/60 dark:bg-blue-500/5' : ''}`}
        >
          {loading ? (
            <TaskCardSkeletons count={3} />
          ) : tasks.length === 0 ? (
            <EmptyColumn onAdd={onAdd} disabled={disabled} />
          ) : (
            tasks.map((task, i) => (
              <Draggable key={task._id} draggableId={task._id} index={i} isDragDisabled={disabled}>
                {(p, s) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    className={`relative group bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 rounded-xl p-3.5 mb-2.5 transition-all duration-150 ${
                      s.isDragging
                        ? 'shadow-lg ring-2 ring-blue-400/50 dark:ring-blue-500/50 rotate-1 scale-[1.02]'
                        : 'hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <TaskCard task={task} />
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                        className="p-1 rounded text-slate-300 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 active:scale-90"
                        title="Edit task"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(task._id, column.key); }}
                        className="p-1 rounded text-slate-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90"
                        title="Delete task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

const TaskCardSkeletons = ({ count = 3 }) =>
  Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 rounded-xl p-3.5 mb-2.5"
    >
      <div className={`${SKELETON} h-4 w-4/5 mb-3`} />
      <div className={`${SKELETON} h-3 w-full mb-2`} />
      <div className={`${SKELETON} h-3 w-2/3 mb-4`} />
      <div className="flex items-center justify-between">
        <div className={`${SKELETON} h-5 w-16 rounded-full`} />
        <div className={`${SKELETON} h-6 w-6 rounded-full`} />
      </div>
    </div>
  ));

const EmptyColumn = ({ onAdd, disabled }) => (
  <button
    onClick={onAdd}
    disabled={disabled}
    className="w-full py-10 border border-dashed border-slate-200 dark:border-gray-800 rounded-xl text-xs text-slate-400 dark:text-gray-600 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-600 dark:hover:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-900/40 transition-all disabled:opacity-50 active:scale-[0.98]"
  >
    <Plus size={14} className="mx-auto mb-1 opacity-60" />
    Drop or add a task
  </button>
);

const TaskCard = ({ task }) => {
  const pr = PRIORITY[task.priority] || PRIORITY.medium;
  const overdue = task.dueDate && task.status !== 'Done' && new Date(task.dueDate) < new Date();
  // Prefer the new multi-assignee field; fall back to the legacy single ref
  // so older tasks still render correctly.
  const assignees = (Array.isArray(task.assignees) && task.assignees.length)
    ? task.assignees.filter(Boolean)
    : (task.assignedTo ? [task.assignedTo] : []);

  return (
    <>
      <div className="flex items-start gap-2 mb-2 pr-5">
        <p className={`text-sm font-medium ${TEXT_PRIMARY} leading-snug flex-1`}>{task.title}</p>
      </div>
      {task.description && (
        <p className={`text-xs ${TEXT_MUTED} leading-relaxed mb-3 line-clamp-2`}>{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pr.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pr.dot}`} />
            {pr.label}
          </span>
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-[10px] ${overdue ? 'text-red-600 dark:text-red-400 font-semibold' : TEXT_SUBTLE}`}>
              <Calendar size={10} />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
        {assignees.length > 0 ? (
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((a) => (
              <div
                key={a._id || a}
                className={`w-6 h-6 rounded-full ${avatarBg(a.name || '')} text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white dark:ring-[#0d1117]`}
                title={a.name || ''}
              >
                {initials(a.name)}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-300 text-[9px] font-semibold flex items-center justify-center ring-2 ring-white dark:ring-[#0d1117]">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 text-[10px] flex items-center justify-center">—</div>
        )}
      </div>
    </>
  );
};

/* ============================================================ */
/*                        DOCUMENTS TAB                         */
/* ============================================================ */

// Hard cap so we don't blow past localStorage's ~5MB quota with a single
// file. Anything larger needs a real backend upload — out of scope here.
const MAX_DOC_BYTES = 4 * 1024 * 1024;

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

/**
 * Server-backed Documents tab. Files live on the project document so every
 * team member fetches the same list — no more "I uploaded it but my
 * teammate can't see it". Local-only persistence is gone; uploads POST to
 * /api/projects/:id/documents and re-fetch.
 */
const DocumentsTab = ({ projectId }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Initial fetch + refetch on project switch.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/projects/${projectId}/documents`)
      .then((res) => { if (!cancelled) setDocs(res.data || []); })
      .catch(() => { if (!cancelled) setDocs([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const added = [];
      for (const f of files) {
        if (f.size > MAX_DOC_BYTES) {
          toast.error(`"${f.name}" is too large (max 4 MB)`);
          continue;
        }
        const dataUrl = await readFileAsDataURL(f);
        try {
          const res = await api.post(`/projects/${projectId}/documents`, {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: f.name,
            size: f.size,
            mime: f.type || '',
            dataUrl,
          });
          added.push(res.data);
        } catch {
          toast.error(`Failed to upload "${f.name}"`);
        }
      }
      if (added.length) {
        setDocs((prev) => [...added, ...prev]);
        toast.success(`${added.length} file${added.length > 1 ? 's' : ''} uploaded`);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const openDoc = (d) => {
    if (!d?.dataUrl) {
      toast.error('This file has no content. Please re-upload.');
      return;
    }
    const a = document.createElement('a');
    a.href = d.dataUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = d.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const remove = async (id) => {
    try {
      await api.delete(`/projects/${projectId}/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${TEXT_PRIMARY}`}>Documents</h3>
          <p className={`text-sm ${TEXT_MUTED} mt-0.5`}>Manage project files</p>
        </div>
        <label className={`inline-flex items-center gap-1.5 ${BTN_PRIMARY} px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
          <Upload size={15} /> {uploading ? 'Uploading…' : 'Upload document'}
          <input type="file" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${SURFACE} rounded-2xl p-4 flex items-start gap-3`}>
              <div className={`${SKELETON} w-11 h-11`} />
              <div className="flex-1 flex flex-col gap-2 py-1">
                <div className={`${SKELETON} h-3 w-3/5`} />
                <div className={`${SKELETON} h-2.5 w-2/5`} />
                <div className={`${SKELETON} h-2.5 w-1/3`} />
              </div>
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <EmptyDocuments onUpload={() => document.querySelector('input[type="file"]')?.click()} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {docs.map(d => {
            const { icon: Icon, color } = fileIconFor(d.name);
            // The new server payload puts the uploader's name in
            // `uploadedByName`. Older entries used `uploadedBy` as a string;
            // accept either.
            const uploader = d.uploadedByName || d.uploadedBy?.name || (typeof d.uploadedBy === 'string' ? d.uploadedBy : 'Someone');
            return (
              <div key={d.id} className={`group relative ${SURFACE} ${SURFACE_HOVER} rounded-2xl flex items-start gap-3 transition-all duration-150 animate-fade-in`}>
                <button
                  onClick={() => openDoc(d)}
                  className="flex-1 flex items-start gap-3 p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 rounded-2xl min-w-0"
                  title="Open file"
                >
                  <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${TEXT_PRIMARY} truncate`}>{d.name}</p>
                    <p className={`text-xs ${TEXT_MUTED} mt-0.5 truncate`}>
                      Uploaded by {uploader}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-gray-600 mt-1">
                      {formatFullDate(d.uploadedAt)}{d.size ? ` · ${formatBytes(d.size)}` : ''}
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(d.id); }}
                  className="absolute top-3 right-3 p-1.5 text-slate-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EmptyDocuments = ({ onUpload }) => (
  <div className={`${SURFACE} border-dashed rounded-2xl py-16 text-center animate-fade-in`}>
    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 flex items-center justify-center mb-3">
      <FileStack size={22} className={TEXT_SUBTLE} />
    </div>
    <p className={`text-sm font-medium ${TEXT_BODY}`}>Upload your first document</p>
    <p className={`text-xs ${TEXT_MUTED} mt-1 mb-5`}>Share files with your team in one click</p>
    <button onClick={onUpload} className={`inline-flex items-center gap-1.5 ${BTN_PRIMARY} px-4 py-2 rounded-lg text-sm font-medium`}>
      <Upload size={14} /> Upload document
    </button>
  </div>
);

/* ============================================================ */
/*                          TEAM TAB                            */
/* ============================================================ */

const TeamTab = ({ members }) => {
  if (!members || members.length === 0) {
    return (
      <div className={`${SURFACE} border-dashed rounded-2xl py-16 text-center animate-fade-in`}>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 flex items-center justify-center mb-3">
          <Users size={22} className={TEXT_SUBTLE} />
        </div>
        <p className={`text-sm font-medium ${TEXT_BODY}`}>No team members</p>
        <p className={`text-xs ${TEXT_MUTED} mt-1`}>Assign a team to this workspace to see members here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${TEXT_PRIMARY}`}>Team Members</h3>
          <p className={`text-sm ${TEXT_MUTED} mt-0.5`}>
            {members.length} {members.length === 1 ? 'member' : 'members'} on this project
          </p>
        </div>
      </div>

      <div className={`${SURFACE} rounded-2xl divide-y divide-slate-100 dark:divide-gray-800 overflow-hidden transition-colors duration-200`}>
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{ animationDelay: `${i * 40}ms` }}
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#0d1117]/50 transition-colors animate-fade-in"
          >
            <div className="relative shrink-0">
              {m.avatar && m.avatar.startsWith('http') ? (
                <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className={`w-10 h-10 rounded-full ${avatarBg(m.name)} text-white font-semibold flex items-center justify-center`}>
                  {initials(m.name)}
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#161b22] ${m.status === 'offline' ? 'bg-slate-300 dark:bg-gray-600' : 'bg-emerald-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${TEXT_PRIMARY} truncate`}>{m.name}</p>
                {m.role && (
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-blue-700 bg-blue-50 border border-blue-100 dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20 px-1.5 py-0.5 rounded">
                    {m.role}
                  </span>
                )}
              </div>
              <p className={`text-xs ${TEXT_MUTED} truncate`}>
                {m.designation || m.email}
              </p>
            </div>
            <span className={`text-xs capitalize ${m.status === 'offline' ? TEXT_SUBTLE : 'text-emerald-600 dark:text-emerald-400 font-medium'}`}>
              {m.status || 'online'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================ */
/*                        TIMELINE TAB                          */
/* ============================================================ */

const TimelineTab = ({ project, tasks, loading }) => {
  const items = useMemo(() => {
    const all = [];
    all.push({
      type: 'phase',
      icon: Circle,
      title: 'Project Start',
      date: project.startDate,
      ring: 'ring-blue-100 dark:ring-blue-500/30',
      bg: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-300',
    });
    const flat = COLUMNS.flatMap(c => (tasks[c.key] || []).map(t => ({ ...t, _colLabel: c.label })));
    const withDates = flat
      .filter(t => t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    withDates.forEach(t => {
      all.push({
        type: 'task',
        icon: t.status === 'Done' ? CheckCircle2 : Circle,
        title: t.title,
        date: t.dueDate,
        ring: t.status === 'Done' ? 'ring-emerald-100 dark:ring-emerald-500/30' : 'ring-slate-100 dark:ring-gray-700',
        bg: t.status === 'Done' ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-gray-600',
        textColor: 'text-slate-700 dark:text-gray-300',
        badge: t._colLabel,
      });
    });
    all.push({
      type: 'phase',
      icon: Flag,
      title: 'Project End',
      date: project.endDate,
      ring: 'ring-violet-100 dark:ring-violet-500/30',
      bg: 'bg-violet-500',
      textColor: 'text-violet-700 dark:text-violet-300',
    });
    return all;
  }, [project, tasks]);

  return (
    <div>
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${TEXT_PRIMARY}`}>Project Timeline</h3>
        <p className={`text-sm ${TEXT_MUTED} mt-0.5`}>Milestones and tasks in chronological order</p>
      </div>

      <div className={`${SURFACE} rounded-2xl p-6 transition-colors duration-200`}>
        {loading ? (
          <TimelineSkeleton />
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 dark:bg-gray-800" />
            <div className="flex flex-col gap-5">
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className="relative flex items-start gap-4 animate-fade-in"
                  >
                    <div className={`relative z-10 w-8 h-8 rounded-full ring-4 ${item.ring} ${item.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={14} className="text-white" />
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-[#0d1117] border border-slate-100 dark:border-gray-800 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${item.type === 'phase' ? item.textColor : TEXT_PRIMARY}`}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className={`text-[10px] font-semibold bg-white dark:bg-[#161b22] ${TEXT_MUTED} border border-slate-200 dark:border-gray-700 px-2 py-0.5 rounded-full`}>
                              {item.badge}
                            </span>
                          )}
                          <span className={`text-xs ${TEXT_MUTED}`}>
                            {item.date ? formatFullDate(item.date) : 'No date'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineSkeleton = () => (
  <div className="relative">
    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 dark:bg-gray-800" />
    <div className="flex flex-col gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="relative flex items-start gap-4">
          <div className={`${SKELETON} w-8 h-8 rounded-full`} />
          <div className="flex-1 flex flex-col gap-2">
            <div className={`${SKELETON} h-4 w-1/3`} />
            <div className={`${SKELETON} h-3 w-1/4`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ============================================================ */
/*                    EMPTY: NO PROJECTS                        */
/* ============================================================ */

const EmptyProjects = ({ onCreate }) => (
  <div className="flex-1 flex items-center justify-center px-6">
    <div className="text-center max-w-sm animate-fade-in">
      <div className={`w-16 h-16 rounded-2xl ${SURFACE} shadow-sm flex items-center justify-center mx-auto mb-5`}>
        <FolderKanban size={28} className="text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className={`text-xl font-semibold ${TEXT_PRIMARY} mb-1.5`}>No projects yet</h3>
      <p className={`text-sm ${TEXT_MUTED} mb-6`}>
        Create your first project to start organizing tasks, documents, and timelines.
      </p>
      <button
        onClick={onCreate}
        className={`inline-flex items-center gap-2 ${BTN_PRIMARY} px-5 py-2.5 rounded-xl text-sm font-medium`}
      >
        <Plus size={16} /> Create project
      </button>
    </div>
  </div>
);

/* ============================================================ */
/*                         MODALS                               */
/* ============================================================ */

const inputCls =
  'w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all';
const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1.5';

const ModalShell = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-800">
          <h2 className={`text-base font-semibold ${TEXT_PRIMARY}`}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg active:scale-90 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const CreateProjectModal = ({ open, onClose, editing = false, teams = [], npTitle, setNpTitle, npDesc, setNpDesc, npStart, setNpStart, npEnd, setNpEnd, npTeamIds = [], setNpTeamIds, creatingProject, onSubmit }) => {
  const toggleTeam = (id) => {
    if (!setNpTeamIds) return;
    const sid = String(id);
    setNpTeamIds(npTeamIds.includes(sid)
      ? npTeamIds.filter((x) => x !== sid)
      : [...npTeamIds, sid]);
  };
  return (
    <ModalShell open={open} onClose={onClose} title={editing ? 'Edit project' : 'Create project'}>
      <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
        <div>
          <label className={labelCls}>Project name</label>
          <input autoFocus value={npTitle} onChange={e => setNpTitle(e.target.value)} className={inputCls} placeholder="e.g. Q4 Product Launch" />
        </div>
        <div>
          <label className={labelCls}>Description <span className="text-slate-400 dark:text-gray-600 font-normal">(optional)</span></label>
          <textarea value={npDesc} onChange={e => setNpDesc(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="What's this project about?" />
        </div>

        {/* Team multi-select. Members of selected teams become the
            assignable pool when creating tasks under this project. */}
        <div>
          <label className={labelCls}>
            Teams <span className="text-slate-400 dark:text-gray-600 font-normal">({npTeamIds.length} selected)</span>
          </label>
          {teams.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-gray-500">No teams available in this workspace.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-gray-700 rounded-lg divide-y divide-slate-100 dark:divide-gray-800">
              {teams.map((t) => {
                const sid = String(t._id);
                const checked = npTeamIds.includes(sid);
                return (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => toggleTeam(sid)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      checked ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-[#0d1117]/60'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-gray-600 text-transparent'
                    }`}>
                      <CheckCircle2 size={12} />
                    </span>
                    <span className="text-sm text-slate-800 dark:text-gray-100 truncate flex-1">{t.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-gray-500">
            Only members of the selected teams will be assignable on tasks.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start date</label>
            <input type="date" value={npStart} onChange={e => setNpStart(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End date</label>
            <input type="date" value={npEnd} onChange={e => setNpEnd(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-all active:scale-95">Cancel</button>
          <button
            type="submit"
            disabled={!npTitle.trim() || creatingProject}
            className={`px-4 py-2 text-sm font-medium ${BTN_PRIMARY} rounded-lg disabled:opacity-50`}
          >
            {creatingProject ? (editing ? 'Saving…' : 'Creating…') : (editing ? 'Save changes' : 'Create project')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const CreateTaskModal = ({ open, onClose, column, members, editing = false, tTitle, setTTitle, tDesc, setTDesc, tPriority, setTPriority, tAssignees = [], setTAssignees, tDue, setTDue, onSubmit }) => {
  const colLabel = COLUMNS.find(c => c.key === column)?.label || column;
  const titleNode = editing
    ? <>Edit task <span className="text-slate-400 dark:text-gray-500 font-normal">in {colLabel}</span></>
    : <>New task <span className="text-slate-400 dark:text-gray-500 font-normal">→ {colLabel}</span></>;

  const toggleAssignee = (id) => {
    if (!setTAssignees) return;
    const sid = String(id);
    setTAssignees(tAssignees.includes(sid)
      ? tAssignees.filter((x) => x !== sid)
      : [...tAssignees, sid]);
  };

  return (
    <ModalShell open={open} onClose={onClose} title={titleNode}>
      <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
        <div>
          <label className={labelCls}>Title</label>
          <input autoFocus value={tTitle} onChange={e => setTTitle(e.target.value)} className={inputCls} placeholder="What needs to be done?" />
        </div>
        <div>
          <label className={labelCls}>Description <span className="text-slate-400 dark:text-gray-600 font-normal">(optional)</span></label>
          <textarea value={tDesc} onChange={e => setTDesc(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Details..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Priority</label>
            <select value={tPriority} onChange={e => setTPriority(e.target.value)} className={inputCls}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Due date</label>
            <input type="date" value={tDue} onChange={e => setTDue(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Multi-assignee picker — pool comes from the project's selected
            teams. If the project has no teams selected, members[] will be
            empty and we explain why instead of silently showing nothing. */}
        <div>
          <label className={labelCls}>
            Assignees <span className="text-slate-400 dark:text-gray-600 font-normal">({tAssignees.length} selected)</span>
          </label>
          {members.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-gray-500">
              No assignable members. Add a team to this project first.
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-gray-700 rounded-lg divide-y divide-slate-100 dark:divide-gray-800">
              {members.map((m) => {
                const sid = String(m.id);
                const checked = tAssignees.includes(sid);
                return (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => toggleAssignee(sid)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      checked ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-[#0d1117]/60'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-gray-600 text-transparent'
                    }`}>
                      <CheckCircle2 size={12} />
                    </span>
                    {m.avatar && m.avatar.startsWith('http') ? (
                      <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className={`w-6 h-6 rounded-full ${avatarBg(m.name || '')} text-white text-[10px] font-semibold flex items-center justify-center`}>
                        {initials(m.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 dark:text-gray-100 truncate">{m.name}</p>
                      {m.email && <p className="text-[11px] text-slate-500 dark:text-gray-500 truncate">{m.email}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-all active:scale-95">Cancel</button>
          <button
            type="submit"
            disabled={!tTitle.trim()}
            className={`px-4 py-2 text-sm font-medium ${BTN_PRIMARY} rounded-lg disabled:opacity-50`}
          >
            {editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default ProjectWorkspace;
