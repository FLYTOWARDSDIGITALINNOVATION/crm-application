import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, ShieldCheck, ArrowRight, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { convertLead } from '../../store/slices/leadSlice';
import { useNavigate } from 'react-router-dom';

const schema = yup.object().shape({
  dealValue: yup.number().typeError('Must be a number').required('Deal value is required').min(1, 'Value must be greater than 0'),
  closingDate: yup.string().required('Closing date is required'),
  contractType: yup.string().required('Contract type is required'),
  notes: yup.string().default(''),
});

type LeadConversionForm = yup.InferType<typeof schema>;

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
}

const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({ isOpen, onClose, leadId, leadName }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector(state => state.leads);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [convertedCustomerId, setConvertedCustomerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LeadConversionForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      dealValue: 0,
      closingDate: new Date().toISOString().split('T')[0],
      contractType: 'Annual',
      notes: '',
    }
  });

  const onSubmit = async (data: LeadConversionForm) => {
    try {
      const result = await dispatch(convertLead({ id: leadId, data })).unwrap();
      reset();
      if (result.credentials) {
        setCreatedCredentials(result.credentials);
        if (result.customer) {
          setConvertedCustomerId(result.customer._id);
        }
      } else {
        onClose();
        if (result.customer) {
          navigate(`/customers/${result.customer._id}`);
        }
      }
    } catch (err) {
      console.error('Conversion failed:', err);
    }
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    const text = `User ID / Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    setCreatedCredentials(null);
    onClose();
    if (convertedCustomerId) {
      navigate(`/customers/${convertedCustomerId}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up border border-indigo-100">
        {createdCredentials ? (
          <div className="animate-fade-in">
            {/* Success Header */}
            <div className="bg-hero-gradient p-8 text-white relative text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold font-inter tracking-tight">Converted Successfully!</h2>
              <p className="text-indigo-100/80 text-sm mt-1">Customer account created in CRM.</p>
            </div>

            {/* Success Content */}
            <div className="p-8 space-y-6 bg-white">
              <p className="text-slate-500 text-sm text-center leading-relaxed">
                Provide these unique login credentials to the customer to let them log in to the <strong>Customer Portal</strong>.
              </p>

              <div className="space-y-4">
                {/* Username */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">User ID / Email</span>
                  <span className="font-bold text-slate-800 text-sm">{createdCredentials.email}</span>
                </div>

                {/* Password */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Temporary Password</span>
                  <span className="font-mono font-bold text-indigo-600 text-base tracking-wide">{createdCredentials.password}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    "w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 border-2",
                    copied
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100/50"
                  )}
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied to Clipboard!" : "Copy Login Credentials"}
                </button>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-4 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
                >
                  Go to Customer Profile
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-hero-gradient p-8 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold font-inter tracking-tight">Convert to Customer</h2>
              <p className="text-indigo-100/80 text-sm mt-1">Finalizing the deal for <span className="font-bold text-white underline decoration-indigo-300/50 underline-offset-4">{leadName}</span>.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white">
              <div className="space-y-4">
                {/* Deal Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deal Value (₹)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      {...register('dealValue')}
                      type="number"
                      className={cn(
                        "w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-bold",
                        errors.dealValue ? "border-rose-300 ring-rose-100" : "border-slate-100"
                      )}
                      placeholder="e.g. 5000"
                    />
                  </div>
                  {errors.dealValue && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.dealValue.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Closing Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Closing Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        {...register('closingDate')}
                        type="date"
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Contract Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contract</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        {...register('contractType')}
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Annual">Annual</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Closing Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Key takeaways or future goals..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Complete Conversion
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancel and go back
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ConvertLeadModal;
