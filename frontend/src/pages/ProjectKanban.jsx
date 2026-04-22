import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import useAppStore from '../store/useAppStore';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

const KanbanBoard = () => {
  const { activeWorkspace } = useAppStore();
  const { simulatedRole } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState({ 'Todo': [], 'In Progress': [], 'Done': [] });
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Fetch projects generic
  const fetchProjects = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await api.get(`/projects/${activeWorkspace._id}`);
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProject) setSelectedProject(res.data[0]);
    } catch {
      toast.error('Failed to load projects');
    }
  };

  const fetchTasks = async () => {
    if (!selectedProject) return;
    try {
      const res = await api.get(`/tasks/${selectedProject._id}`);
      const grouped = { 'Todo': [], 'In Progress': [], 'Done': [] };
      res.data.forEach(task => grouped[task.status].push(task));
      setTasks(grouped);
    } catch {
      toast.error('Failed to load tasks');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeWorkspace]);

  useEffect(() => {
    fetchTasks();
  }, [selectedProject]);

  const onDragEnd = async (result) => {
    if (simulatedRole === 'Member') return toast.error('Members cannot shift project states!');
    const { source, destination } = result;
    if (!destination) return;
    
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    
    if (sourceCol === destCol && source.index === destination.index) return;
    
    const sourceTasks = Array.from(tasks[sourceCol]);
    const destTasks = sourceCol === destCol ? sourceTasks : Array.from(tasks[destCol]);
    
    const [movedTask] = sourceTasks.splice(source.index, 1);
    
    if (sourceCol === destCol) {
      sourceTasks.splice(destination.index, 0, movedTask);
      setTasks(prev => ({ ...prev, [sourceCol]: sourceTasks }));
    } else {
      movedTask.status = destCol; // Optimistic
      destTasks.splice(destination.index, 0, movedTask);
      setTasks(prev => ({ ...prev, [sourceCol]: sourceTasks, [destCol]: destTasks }));
      // API call to permanently shift state
      api.put(`/tasks/${movedTask._id}`, { status: destCol }).catch(() => toast.error('Desync! Refresh needed.'));
    }
  };

  const checkPrivilegesAndCreateProject = async () => {
    if (simulatedRole === 'Member') return toast.error('Action Restricted: Admins/Managers only.');
    let title = prompt('Project Name:');
    if (!title) return;
    try {
      const res = await api.post('/projects', { workspaceId: activeWorkspace._id, title });
      setProjects([...projects, res.data]);
      setSelectedProject(res.data);
    } catch {
      toast.error('Failed creation');
    }
  };

  const handleCreateTask = async (e, column) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProject) return;
    try {
      const res = await api.post('/tasks', { projectId: selectedProject._id, title: newTaskTitle, status: column, assignee: 'Unassigned' });
      setTasks(prev => ({ ...prev, [column]: [...prev[column], res.data] }));
      setNewTaskTitle('');
    } catch {
      toast.error('Failed to create task');
    }
  };

  if (!activeWorkspace) return <div className="flex-1 text-white p-8">Select Workspace First</div>;

  return (
    <div className="flex-1 bg-[#0d1117] flex flex-col overflow-hidden relative font-sans">
      <div className="h-14 border-b border-gray-800 flex items-center px-6 justify-between shrink-0 bg-[#161b22]/90 backdrop-blur-sm z-10 w-full shadow-sm">
        <h2 className="text-xl font-bold text-white tracking-tight">Kanban Board</h2>
        <div className="flex items-center gap-4">
           {projects.length > 0 && (
             <select 
               value={selectedProject?._id || ''} 
               onChange={e => setSelectedProject(projects.find(p => p._id === e.target.value))}
               className="bg-[#0d1117] border border-gray-700 rounded-md text-sm text-gray-200 px-3 py-1.5 outline-none font-medium"
             >
               {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
             </select>
           )}
           <button onClick={checkPrivilegesAndCreateProject} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
             <Plus size={16} /> New Project
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto p-6 gap-6 items-start h-full pb-24">
        {!selectedProject ? (
          <div className="text-gray-500 text-center w-full mt-24 text-lg">No Projects Found. Create one above!</div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            {['Todo', 'In Progress', 'Done'].map(column => (
              <div key={column} className="w-80 shrink-0 bg-[#161b22] border border-gray-800 rounded-lg flex flex-col max-h-full">
                <div className="p-3 border-b border-gray-800 flex items-center justify-between shadow-sm">
                  <h3 className="font-semibold text-gray-300 text-sm">{column}</h3>
                  <span className="bg-[#0d1117] text-gray-500 text-xs py-0.5 px-2 rounded-full font-medium">{tasks[column]?.length || 0}</span>
                </div>
                
                <Droppable droppableId={column}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto p-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`}
                    >
                      {tasks[column]?.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={simulatedRole === 'Member'}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-[#0d1117] border border-gray-700 p-3 rounded-md mb-2 shadow-sm group ${snapshot.isDragging ? 'shadow-indigo-500/20 ring-1 ring-indigo-500/50' : 'hover:border-gray-600'}`}
                            >
                              <div className="text-sm font-medium text-gray-200 mb-2 leading-snug">{task.title}</div>
                              <div className="flex items-center justify-between">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                                  {task.assignee ? task.assignee.charAt(0) : 'U'}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {column === 'Todo' && simulatedRole !== 'Member' && (
                        <form onSubmit={(e) => handleCreateTask(e, column)} className="mt-2 text-sm">
                          <input 
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            placeholder="Add new task..."
                            className="w-full bg-[#1c212b] border border-gray-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
                          />
                        </form>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;
