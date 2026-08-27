import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  FolderKanban, Plus, Users, Trash2, X, ChevronRight,
  Loader2, CheckCircle2, Clock, PauseCircle, Edit2, UserPlus,
  ArrowLeft, CheckSquare, Search, Globe, Smartphone, Layers,
  Calendar, User as UserIcon, Eye, Download, FileText
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
import { fetchLeads } from '../../store/slices/leadSlice';
import { fetchCustomers } from '../../store/slices/customerSlice';
import { createTask, fetchTasks } from '../../store/slices/taskSlice';

const STATUS_OPTIONS = ['Active', 'In Progress', 'Planning', 'Completed', 'On Hold'] as const;

const statusStyle = (status: string) => {
  switch (status) {
    case 'Active': return 'text-emerald-700 bg-emerald-100/70 border-emerald-200';
    case 'In Progress': return 'text-amber-700 bg-amber-100/70 border-amber-200';
    case 'Planning': return 'text-indigo-700 bg-indigo-100/70 border-indigo-200';
    case 'Completed': return 'text-teal-700 bg-teal-100/70 border-teal-200';
    case 'On Hold': return 'text-slate-600 bg-slate-100 border-slate-200';
    default: return 'text-slate-600 bg-slate-100 border-slate-200';
  }
};

const projectIcon = (name: string, index: number) => {
  const lower = name.toLowerCase();
  if (lower.includes('marketing') || lower.includes('web')) {
    return <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Globe className="w-5 h-5" /></div>;
  }
  if (lower.includes('mobile') || lower.includes('app')) {
    return <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Smartphone className="w-5 h-5" /></div>;
  }
  if (lower.includes('hr') || lower.includes('portal')) {
    return <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><Layers className="w-5 h-5" /></div>;
  }
  const colors = [
    'bg-indigo-100 text-indigo-600',
    'bg-purple-100 text-purple-600',
    'bg-cyan-100 text-cyan-600',
    'bg-amber-100 text-amber-600'
  ];
  return <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", colors[index % colors.length])}><FolderKanban className="w-5 h-5" /></div>;
};

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ProjectManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  if (user?.role === 'employee') {
    return <Navigate to="/" replace />;
  }
  const { items: projects, isLoading } = useAppSelector((s) => s.projects);
  const { employees } = useAppSelector((s) => s.users);
  const { items: allTasks } = useAppSelector((s) => s.tasks);
  const availableEmployees = employees.filter(e => e.role !== 'superadmin');
  const { items: leads } = useAppSelector((s) => s.leads);
  const { items: customers } = useAppSelector((s) => s.customers);

  const convertedLeads = leads.filter(l => l.status === 'Converted');
  const uniqueConvertedNames = Array.from(
    new Set([
      ...convertedLeads.map(l => (l.company || l.name || '').trim()),
      ...customers.map(c => (c.company || c.name || '').trim())
    ].filter(Boolean))
  );
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [assignProject, setAssignProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);
  const viewFile = (file: { name: string; url: string }) => {
    if (!file.url) return;

    let targetUrl = file.url;

    if (file.url.startsWith('data:')) {
      try {
        const parts = file.url.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const base64Data = parts[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        targetUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.error('Error creating Blob URL:', err);
      }
    } else if (file.url.startsWith('/') && !file.url.startsWith('//')) {
      const backendHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : window.location.origin;
      targetUrl = `${backendHost}${file.url}`;
    }

    // Open PDF directly in a new browser tab
    const win = window.open(targetUrl, '_blank');
    if (win) {
      win.focus();
    }
  };

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'Active' as typeof STATUS_OPTIONS[number],
    requirements: '',
    projectUrl: '',
    startDate: '',
    dueDate: '',
    files: [] as Array<{ name: string; url: string }>,
    assignedEmployees: [] as string[]
  });
  const [formError, setFormError] = useState('');

  const [projectTasks, setProjectTasks] = useState<Array<{
    title: string;
    assignedTo: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    description?: string;
  }>>([]);

  const [taskInput, setTaskInput] = useState<{
    title: string;
    assignedTo: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    description?: string;
  }>({
    title: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Medium',
    description: ''
  });

  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasks());
    if (isAdmin) {
      dispatch(fetchEmployees());
      dispatch(fetchLeads());
      dispatch(fetchCustomers());
    }
  }, [dispatch, isAdmin]);

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormError('');

    const valLower = newName.trim().toLowerCase();

    const matchingCustomer = customers.find(c => {
      const cCompany = (c.company || '').trim().toLowerCase();
      const cName = (c.name || '').trim().toLowerCase();
      return (cCompany && cCompany === valLower) || (cName && cName === valLower);
    });

    const matchingLead = leads.find(l => {
      const lCompany = (l.company || '').trim().toLowerCase();
      const lName = (l.name || '').trim().toLowerCase();
      return (lCompany && lCompany === valLower) || (lName && lName === valLower);
    });

    let newFiles = [...form.files];
    let newReq = form.requirements;
    let newDesc = form.description;

    if (matchingCustomer) {
      // Auto attach customer files (PDFs, docs, images) if valid URL exists
      if (matchingCustomer.files && matchingCustomer.files.length > 0) {
        matchingCustomer.files.forEach(cf => {
          if (cf.url && !newFiles.some(f => f.name === cf.name || f.url === cf.url)) {
            newFiles.push({ name: cf.name || 'Customer_File.pdf', url: cf.url });
          }
        });
      }
      // Auto attach single PDF URL if valid non-empty URL exists (including /uploads/)
      if (matchingCustomer.pdfUrl && typeof matchingCustomer.pdfUrl === 'string' && matchingCustomer.pdfUrl.trim().length > 0) {
        const fileName = `${(matchingCustomer.company || matchingCustomer.name).replace(/\s+/g, '_')}_Document.pdf`;
        if (!newFiles.some(f => f.name === fileName || f.url === matchingCustomer.pdfUrl)) {
          newFiles.push({ name: fileName, url: matchingCustomer.pdfUrl });
        }
      }
      if (matchingCustomer.requirements && !newReq) {
        newReq = matchingCustomer.requirements;
      }
      if (matchingCustomer.notes && !newDesc) {
        newDesc = matchingCustomer.notes;
      }
    } else if (matchingLead) {
      if ((matchingLead as any).files && (matchingLead as any).files.length > 0) {
        (matchingLead as any).files.forEach((lf: any) => {
          if (lf.url && !newFiles.some(f => f.name === lf.name || f.url === lf.url)) {
            newFiles.push({ name: lf.name || 'Lead_File.pdf', url: lf.url });
          }
        });
      }
      if ((matchingLead as any).pdfUrl && typeof (matchingLead as any).pdfUrl === 'string' && (matchingLead as any).pdfUrl.trim().length > 0) {
        const fileName = `${(matchingLead.company || matchingLead.name).replace(/\s+/g, '_')}_Document.pdf`;
        const leadPdfUrl = (matchingLead as any).pdfUrl;
        if (!newFiles.some(f => f.name === fileName || f.url === leadPdfUrl)) {
          newFiles.push({ name: fileName, url: leadPdfUrl });
        }
      }
      if (matchingLead.notes && !newDesc) {
        newDesc = matchingLead.notes;
      }
    }

    setForm(prev => ({
      ...prev,
      name: newName,
      files: newFiles,
      requirements: newReq,
      description: newDesc
    }));
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setProjectTasks([]);
    setTaskInput({ title: '', assignedTo: '', dueDate: '', priority: 'Medium', description: '' });
    setForm({
      name: p.name,
      description: p.description || '',
      status: (p.status as any) || 'Active',
      requirements: p.requirements || '',
      projectUrl: p.projectUrl || '',
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '',
      files: p.files ? p.files.map(f => ({ name: f.name, url: f.url })) : [],
      assignedEmployees: p.assignedEmployees ? p.assignedEmployees.map(e => e._id) : []
    });
    setFormError('');
  };

  const openAssign = (p: Project) => {
    setAssignProject(p);
    setSelectedEmpIds(p.assignedEmployees.map(e => e._id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Project name is required'); return; }
    
    const resultAction = await dispatch(createProject({
      name: form.name.trim(),
      description: form.description,
      status: form.status,
      requirements: form.requirements,
      projectUrl: form.projectUrl,
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
      files: form.files,
      assignedEmployees: form.assignedEmployees
    }));

    if (createProject.fulfilled.match(resultAction)) {
      const createdProj = resultAction.payload;
      for (const t of projectTasks) {
        await dispatch(createTask({
          title: t.title,
          dueDate: t.dueDate || new Date().toISOString().split('T')[0],
          priority: t.priority,
          status: 'Pending',
          assignedTo: t.assignedTo || 'Unassigned',
          relatedTo: form.name.trim(),
          projectId: createdProj._id,
          description: t.description,
        }));
      }
    }

    setShowCreate(false);
    setProjectTasks([]);
    setTaskInput({ title: '', assignedTo: '', dueDate: '', priority: 'Medium', description: '' });
    setForm({
      name: '',
      description: '',
      status: 'Active',
      requirements: '',
      projectUrl: '',
      startDate: '',
      dueDate: '',
      files: [],
      assignedEmployees: []
    });
    setFormError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject) return;
    if (!form.name.trim()) { setFormError('Project name is required'); return; }
    
    await dispatch(updateProject({
      id: editProject._id,
      name: form.name.trim(),
      description: form.description,
      status: form.status,
      requirements: form.requirements,
      projectUrl: form.projectUrl,
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
      files: form.files,
      assignedEmployees: form.assignedEmployees
    }));

    for (const t of projectTasks) {
      await dispatch(createTask({
        title: t.title,
        dueDate: t.dueDate || new Date().toISOString().split('T')[0],
        priority: t.priority,
        status: 'Pending',
        assignedTo: t.assignedTo || 'Unassigned',
        relatedTo: form.name.trim(),
        projectId: editProject._id,
        description: t.description,
      }));
    }

    setEditProject(null);
    setProjectTasks([]);
    setTaskInput({ title: '', assignedTo: '', dueDate: '', priority: 'Medium', description: '' });
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

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper for progress percentage calculation
  const getProjectProgress = (p: Project) => {
    const pTasks = allTasks.filter(t => t.projectId === p._id || (t.relatedTo && t.relatedTo.toLowerCase() === p.name.toLowerCase()));
    if (pTasks.length === 0) {
      if (p.status === 'Completed') return 100;
      if (p.status === 'In Progress') return 40;
      if (p.status === 'Active') return 62;
      if (p.status === 'Planning') return 15;
      return 0;
    }
    const completed = pTasks.filter(t => t.status === 'Completed').length;
    return Math.round((completed / pTasks.length) * 100);
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
                    list="converted-leads-list"
                    placeholder="e.g. Q3 Marketing Campaign"
                    value={form.name}
                    onChange={handleProjectNameChange}
                    className={cn('input-field', formError ? 'border-rose-400 bg-rose-50' : '')}
                  />
                  <datalist id="converted-leads-list">
                    {uniqueConvertedNames.map((name, idx) => (
                      <option key={idx} value={name} />
                    ))}
                  </datalist>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Start Date">
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="input-field"
                    />
                  </FormField>
                  <FormField label="Due Date">
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm({ ...form, dueDate: e.target.value })}
                      className="input-field"
                    />
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea
                    rows={3}
                    placeholder="Brief description of the project..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field resize-none"
                  />
                </FormField>

                <FormField label="Requirements">
                  <textarea
                    rows={3}
                    placeholder="Project specific requirements..."
                    value={form.requirements}
                    onChange={e => setForm({ ...form, requirements: e.target.value })}
                    className="input-field resize-none"
                  />
                </FormField>

                <FormField label="Project URL / Website Link">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="e.g. https://example.com"
                      value={form.projectUrl}
                      onChange={e => setForm({ ...form, projectUrl: e.target.value })}
                      className="input-field pl-9"
                    />
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </FormField>
              </div>

              {/* Right Column: Files & Members */}
              <div className="space-y-4 flex flex-col h-full">
                <FormField label="Project Files (PDF, Images, Docs)">
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,image/*,.doc,.docx"
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
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs transition-all">
                          <button
                            type="button"
                            onClick={() => viewFile(file)}
                            className="font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-2 truncate max-w-[210px] text-left cursor-pointer"
                            title="Click to view file"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </button>
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => viewFile(file)}
                              className="text-indigo-600 font-bold hover:underline text-xs cursor-pointer flex items-center gap-1"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))}
                              className="text-rose-500 font-bold hover:underline text-xs cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </FormField>

                <FormField label="Assign Employees (Team Members)">
                  <div className="max-h-64 overflow-y-auto space-y-1.5 p-3 border border-slate-100 bg-slate-50/50 rounded-2xl custom-scrollbar flex-1 min-h-[180px]">
                    {availableEmployees.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">No employees found.</p>
                    ) : (
                      availableEmployees.map(emp => {
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
                              checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
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
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-semibold transition-colors"
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
              <div className="space-y-4">
                <FormField label="Project Name" required error={formError}>
                  <input
                    autoFocus
                    type="text"
                    value={form.name}
                    onChange={handleProjectNameChange}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Start Date">
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="input-field"
                    />
                  </FormField>
                  <FormField label="Due Date">
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm({ ...form, dueDate: e.target.value })}
                      className="input-field"
                    />
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea
                    rows={3}
                    placeholder="Brief description of the project..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field resize-none"
                  />
                </FormField>

                <FormField label="Project URL / Website Link">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="e.g. https://example.com"
                      value={form.projectUrl}
                      onChange={e => setForm({ ...form, projectUrl: e.target.value })}
                      className="input-field pl-9"
                    />
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </FormField>
              </div>

              <div className="space-y-4">
                <FormField label="Assign Employees">
                  <div className="max-h-64 overflow-y-auto space-y-1.5 p-3 border border-slate-100 bg-slate-50/50 rounded-2xl custom-scrollbar">
                    {availableEmployees.map(emp => {
                      const checked = form.assignedEmployees.includes(emp._id);
                      return (
                        <button
                          key={emp._id}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              assignedEmployees: checked
                                ? prev.assignedEmployees.filter(id => id !== emp._id)
                                : [...prev.assignedEmployees, emp._id]
                            }));
                          }}
                          className={cn(
                            'w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left text-xs',
                            checked ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                          )}
                        >
                          <span className="truncate">{emp.name} ({emp.designation || emp.role})</span>
                          <div className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0',
                            checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                          )}>
                            {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </FormField>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditProject(null)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Create and manage organization projects
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
            />
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
                  projectUrl: '',
                  startDate: '',
                  dueDate: '',
                  files: [],
                  assignedEmployees: []
                });
                setFormError('');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-slate-500 font-medium">Loading projects...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredProjects.length === 0 && (
        <div className="glass p-16 rounded-3xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No projects found</h3>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Create your first project or clear search filter.' : 'No assigned projects found.'}
          </p>
        </div>
      )}

      {/* Project Cards Grid - Exact Design from Reference Image */}
      {!isLoading && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project, idx) => {
            let managerName = 'Super Admin';
            if (typeof project.createdBy === 'object' && project.createdBy?.name) {
              managerName = project.createdBy.name;
            } else if (typeof project.createdBy === 'string') {
              const matchedEmp = employees.find(e => e._id === project.createdBy);
              if (matchedEmp) {
                managerName = matchedEmp.name;
              } else if (user && (user._id === project.createdBy || (user as any).id === project.createdBy)) {
                managerName = user.name;
              }
            }
            
            const progress = getProjectProgress(project);
            
            return (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100/90 cursor-pointer flex flex-col justify-between gap-5 group relative overflow-hidden"
              >
                <div>
                  {/* Icon + Title + Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {projectIcon(project.name, idx)}
                      <h3 className="text-base font-extrabold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {project.name}
                      </h3>
                    </div>
                    <span className={cn('px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap border shrink-0', statusStyle(project.status))}>
                      {project.status}
                    </span>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mt-2">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Manager Section */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Manager
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shrink-0">
                      {managerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {managerName}
                    </span>
                  </div>
                </div>

                {/* Team Section */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Team
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {project.assignedEmployees && project.assignedEmployees.length > 0 ? (
                      project.assignedEmployees.map((emp) => (
                        <span
                          key={emp._id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 text-slate-800 rounded-full text-xs font-bold border border-slate-200/80 shadow-2xs"
                        >
                          <div className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          {emp.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No members assigned</span>
                    )}
                  </div>
                </div>



                {/* Footer Dates */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  <span>Start: {formatDate(project.startDate || project.createdAt) || 'N/A'}</span>
                  <span>Due: {formatDate(project.dueDate) || 'N/A'}</span>
                </div>

                {/* Floating Edit/Delete buttons for Admin */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                      title="Edit project"
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project); }}
                      title="Delete project"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
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
      {/* End Delete Confirmation */}
    </div>
  );
};

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
