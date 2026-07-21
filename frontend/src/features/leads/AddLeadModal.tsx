import React from 'react';
import { X, User, Mail, Phone, Building2, Globe, Tag, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cn } from '../../utils/cn';

const schema = yup.object({
  name: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  company: yup.string().required('Company name is required'),
  source: yup.string().required('Lead source is required'),
  softwareType: yup.string(),
  status: yup.string().required('Status is required'),
  notes: yup.string().default(''),
}).required();

type FormData = yup.InferType<typeof schema>;

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'New',
      source: 'Software',
      softwareType: 'Billing',
      notes: '',
    }
  });

  const onSubmit = (data: FormData) => {
    const finalData = { ...data };
    if (finalData.source === 'Software' && finalData.softwareType) {
      finalData.source = `Software - ${finalData.softwareType}`;
    }
    delete finalData.softwareType;
    console.log('Lead Data:', finalData);
    // In a real app, dispatch to Redux/API
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-inter">Add New Lead</h2>
            <p className="text-slate-500 text-sm mt-0.5">Enter details to create a potential customer.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('name')}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none",
                    errors.name ? "border-rose-300 ring-rose-100" : "border-slate-200"
                  )}
                  placeholder="e.g. John Doe"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('email')}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none",
                    errors.email ? "border-rose-300 ring-rose-100" : "border-slate-200"
                  )}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('phone')}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none",
                    errors.phone ? "border-rose-300 ring-rose-100" : "border-slate-200"
                  )}
                  placeholder="+1 234 567 890"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phone.message}</p>}
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
              <div className="relative group">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('company')}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none",
                    errors.company ? "border-rose-300 ring-rose-100" : "border-slate-200"
                  )}
                  placeholder="TechCorp Solutions"
                />
              </div>
              {errors.company && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.company.message}</p>}
            </div>

            {/* Lead Source */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Lead Source</label>
              <div className="relative group">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  {...register('source')}
                  disabled={watch('status') === 'Not Interested'}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all",
                    watch('status') === 'Not Interested' ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <option value="Software">Software</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Course">Course</option>
                  <option value="Intern">Intern</option>
                  <option value="SEO">SEO</option>
                </select>
              </div>
            </div>

            {/* Software Type (Conditional) */}
            {watch('source') === 'Software' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Software Type</label>
                <div className="relative group">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    {...register('softwareType')}
                    disabled={watch('status') === 'Not Interested'}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all",
                      watch('status') === 'Not Interested' ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )}
                  >
                    <option value="Billing">Billing</option>
                    <option value="Website">Website</option>
                    <option value="WebApp">WebApp</option>
                  </select>
                </div>
              </div>
            )}

            {/* Initial Status */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Initial Status</label>
              <div className="relative group">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  {...register('status')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Converted">Converted</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Direct Visit">Direct Visit</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Additional Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Enter any initial information or requirements..."
            />
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit(onSubmit)}
            className="px-8 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
          >
            Create Lead
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLeadModal;
