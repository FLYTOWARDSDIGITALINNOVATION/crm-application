import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, Plus, Users, Trash2, X, ChevronRight,
  Loader2, CheckCircle2, Clock, PauseCircle, Edit2, UserPlus,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  assignEmployeesToProject,
  type Project,
} from '../../store/slices/projectSlice';
import { fetchEmployees } from '../../store/slices/userSlice';

const STATUS_OPTIONS = ['Active', 'On Hold', 'Completed'] as const;

const statusStyle = (status: string) => {
  switch (status) {
    case 'Active': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'Completed': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'On Hold': return 'text-amber-700 bg-amber-50 border-amber-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'Active': return <Clock className="w-3.5 h-3.5" />;
    case 'Completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'On Hold': return <PauseCircle className="w-3.5 h-3.5" />;
    default: return null;
  }
};

const ProjectManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { items: projects, isLoading } = useAppSelector((s) => s.projects);
  const { employees } = useAppSelector((s) => s.users);

  const isAdmin = user?.role === 'admin';

  // ── Modals state ──────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [assignProject, setAssignProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);

  // ── Form state ────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'Active' as typeof STATUS_OPTIONS[number],
    requirements: '',
    files: [] as Array<{ name: string; url: string }>,
    assignedEmployees: [] as string[]
  });
  const [formError, setFormError] = useState('');

  // ── Employee assignment state ─────────────────────────────
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
    if (isAdmin) dispatch(fetchEmployees());
  }, [dispatch, isAdmin]);

  // Open edit modal with prefilled data
  const openEdit = (p: Project) => {
    setEditProject(p);
    setForm({
      name: p.name,
      description: p.description || '',
      status: p.status,
      requirements: p.requirements || '',
      files: p.files ? p.files.map(f => ({ name: f.name, url: f.url })) : [],
      assignedEmployees: p.assignedEmployees ? p.assignedEmployees.map(e => e._id) : []
    });
    setFormError('');
  };

  // Open assign modal
  const openAssign = (p: Project) => {
    setAssignProject(p);
    setSelectedEmpIds(p.assignedEmployees.map(e => e._id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Project name is required'); return; }
    await dispatch(createProject({
      name: form.name.trim(),
      description: form.description,
      status: form.status,
      requirements: form.requirements,
      files: form.files,
      assignedEmployees: form.assignedEmployees
    }));
    setShowCreate(false);
    setForm({
      name: '',
      description: '',
      status: 'Active',
      requirements: '',
      files: [],
      assignedEmployees: []
    });
    setFormError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !editProject) { setFormError('Project name is required'); return; }
    await dispatch(updateProject({
      id: editProject._id,
      name: form.name.trim(),
      description: form.description,
      status: form.status,
      requirements: form.requirements,
      files: form.files,
      assignedEmployees: form.assignedEmployees
    }));
    setEditProject(null);
    setFormError('');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await dispatch(deleteProject(deleteConfirm._id));
    setDeleteConfirm(null);
  };

  const handleAssign = async () => {
    if (!assignProject) return;
    setAssigning(true);
    await dispatch(assignEmployeesToProject({ id: assignProject._id, employeeIds: selectedEmpIds }));
    setAssigning(false);
    setAssignProject(null);
  };

  const toggleEmp = (id: string) => {
    setSelectedEmpIds(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  if (showCreate) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setShowCreate(false)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Create New Project</h1>
          <p className="text-slate-500 text-sm">Define project details, add files and assign team members.</p>
        </div>

        <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: General Info */}
              <div className="space-y-4">
                <FormField label="Project Name" required error={formError}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Q3 Marketing Campaign"
                    value={form.name}
                    onChange={e => { setForm({ ...form, name: e.target.value }); setFormError(''); }}
                    className={cn('input-field', formError ? 'border-rose-400 bg-rose-50' : '')}
                  />
                </FormField>
                
                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as typeof STATUS_OPTIONS[number] })}
                    className="input-field"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                <FormField label="Description">
                  <textarea
                    rows={4}
                    placeholder="Brief description of the project..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field resize-none"
                  />
                </FormField>

                <FormField label="Requirements">
                  <textarea
                    rows={4}
                    placeholder="Project specific requirements..."
                    value={form.requirements}
                    onChange={e => setForm({ ...form, requirements: e.target.value })}
                    className="input-field resize-none"
                  />
                </FormField>
              </div>

              {/* Right Column: Files & Members */}
              <div className="space-y-4 flex flex-col h-full">
                <FormField label="Project Files">
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={e => {
                        const selectedFiles = Array.from(e.target.files || []);
                        selectedFiles.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm(prev => ({
                              ...prev,
                              files: [
                                ...prev.files,
                                { name: file.name, url: reader.result as string }
                              ]
                            }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                    />
                    <div className="grid grid-cols-1 gap-1.5 mt-2 max-h-36 overflow-y-auto custom-scrollbar">
                      {form.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))}
                            className="text-rose-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </FormField>

                <FormField label="Assign Employees">
                  <div className="max-h-72 overflow-y-auto space-y-1.5 p-3 border border-slate-100 bg-slate-50/50 rounded-2xl custom-scrollbar flex-1 min-h-[220px]">
                    {employees.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">No employees found.</p>
                    ) : (
                      employees.map(emp => {
                        const checked = form.assignedEmployees.includes(emp._id);
                        return (
                          <button
                            key={emp._id}
                            type="button"
                            onClick={() => {
                              setForm(prev => {
                                const isAssigned = prev.assignedEmployees.includes(emp._id);
                                return {
                                  ...prev,
                                  assignedEmployees: isAssigned
                                    ? prev.assignedEmployees.filter(id => id !== emp._id)
                                    : [...prev.assignedEmployees, emp._id]
                                };
                              });
                            }}
                            className={cn(
                              'w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left text-xs',
                              checked ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                            )}
                          >
                            <span className="truncate">{emp.name} ({emp.designation || emp.role})</span>
                            <div className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0',
                              checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-350'
                            )}>
                              {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </FormField>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (editProject) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setEditProject(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-605 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Project</h1>
          <p className="text-slate-500 text-sm">Update project details, files and assigned team members.</p>
        </div>

        <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
          <form onSubmit={handleEdit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: General Info */}
              <div className="space-y-4">
                <FormField label="Project Name" required error={formError}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Q3 Marketing Campaign"
                    value={form.name}
                    onChange={e => { setForm({ ...form, name: e.target.value }); setFormError(''); }}
                    className={cn('input-field', formError ? 'border-rose-400 bg-rose-50' : '')}
                  />
                </FormField>
                
                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as typeof STATUS_OPTIONS[number] })}
                    className="input-field"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                <FormField label="Description">
                  <textarea
                    rows={4}
                    placeholder="Brief description of the project..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field resize-none"
                  />
                </FormField>

                <FormField label="Requirements">
                  <textarea
                    rows={4}
                    placeholder="Project specific requirements..."
                    value={form.requirements}
                    onChange={e => setForm({ ...form, requirements: e.target.value })}
                    className="input-field resize-none"
                  />
                </FormField>
              </div>

              {/* Right Column: Files & Members */}
              <div className="space-y-4 flex flex-col h-full">
                <FormField label="Project Files">
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={e => {
                        const selectedFiles = Array.from(e.target.files || []);
                        selectedFiles.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm(prev => ({
                              ...prev,
                              files: [
                                ...prev.files,
                                { name: file.name, url: reader.result as string }
                              ]
                            }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-650 hover:file:bg-indigo-100"
                    />
                    <div className="grid grid-cols-1 gap-1.5 mt-2 max-h-36 overflow-y-auto custom-scrollbar">
                      {form.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))}
                            className="text-rose-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </FormField>

                <FormField label="Assign Employees">
                  <div className="max-h-72 overflow-y-auto space-y-1.5 p-3 border border-slate-100 bg-slate-50/50 rounded-2xl custom-scrollbar flex-1 min-h-[220px]">
                    {employees.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">No employees found.</p>
                    ) : (
                      employees.map(emp => {
                        const checked = form.assignedEmployees.includes(emp._id);
                        return (
                          <button
                            key={emp._id}
                            type="button"
                            onClick={() => {
                              setForm(prev => {
                                const isAssigned = prev.assignedEmployees.includes(emp._id);
                                return {
                                  ...prev,
                                  assignedEmployees: isAssigned
                                    ? prev.assignedEmployees.filter(id => id !== emp._id)
                                    : [...prev.assignedEmployees, emp._id]
                                };
                              });
                            }}
                            className={cn(
                              'w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left text-xs',
                              checked ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                            )}
                          >
                            <span className="truncate">{emp.name} ({emp.designation || emp.role})</span>
                            <div className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0',
                              checked ? 'bg-indigo-650 border-indigo-600' : 'border-slate-350'
                            )}>
                              {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </FormField>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditProject(null)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-655 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (assignProject) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setAssignProject(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-605 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Assign Employees</h1>
          <p className="text-slate-500 text-sm">Assign team members to project: <span className="font-bold text-indigo-650">{assignProject.name}</span></p>
        </div>

        <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
              {employees.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8 col-span-2">No employees found.</p>
              ) : (
                employees.map(emp => {
                  const checked = selectedEmpIds.includes(emp._id);
                  return (
                    <button
                      key={emp._id}
                      type="button"
                      onClick={() => toggleEmp(emp._id)}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left',
                        checked
                          ? 'border-indigo-300 bg-indigo-50/70 shadow-sm shadow-indigo-50'
                          : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                        checked ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-650'
                      )}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{emp.name}</div>
                        <div className="text-xs text-slate-500 truncate">{emp.designation || emp.role}</div>
                      </div>
                      <div className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                        checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-350'
                      )}>
                        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">{selectedEmpIds.length} selected</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssignProject(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={assigning}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  <Users className="w-4 h-4" />
                  Save Members
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? 'Manage projects, assign employees and track tasks.' : 'Your assigned projects.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setShowCreate(true);
              setForm({
                name: '',
                description: '',
                status: 'Active',
                requirements: '',
                files: [],
                assignedEmployees: []
              });
              setFormError('');
            }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-slate-500 font-medium">Loading projects...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && projects.length === 0 && (
        <div className="glass p-16 rounded-3xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No projects yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Create your first project to get started.' : 'You have not been assigned to any project yet.'}
          </p>
        </div>
      )}

      {/* Project Grid */}
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="glass rounded-3xl p-6 hover:shadow-xl transition-all border border-slate-100 hover:border-indigo-200 group flex flex-col gap-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', statusStyle(project.status))}>
                      {statusIcon(project.status)}
                      {project.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(project)}
                      title="Edit project"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(project)}
                      title="Delete project"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Member Avatars */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {project.assignedEmployees.slice(0, 4).map((emp) => (
                    <div
                      key={emp._id}
                      title={emp.name}
                      className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center border-2 border-white"
                    >
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project.assignedEmployees.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center border-2 border-white">
                      +{project.assignedEmployees.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium ml-1">
                  {project.assignedEmployees.length === 0
                    ? 'No members assigned'
                    : `${project.assignedEmployees.length} member${project.assignedEmployees.length > 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                {isAdmin && (
                  <button
                    onClick={() => openAssign(project)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign Members
                  </button>
                )}
                <button
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  View Tasks
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <Modal title="Delete Project?" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-600 text-sm mb-6">
            Are you sure you want to delete <span className="font-bold text-slate-900">{deleteConfirm.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Reusable Modal Shell ─────────────────────────────────────────────────────
const Modal: React.FC<{ title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }> = ({
  title, subtitle, onClose, children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── Form helpers ─────────────────────────────────────────────────────────────
const FormField: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({
  label, required, error, children,
}) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
  </div>
);


export default ProjectManagement;
