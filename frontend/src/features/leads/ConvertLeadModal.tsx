import React, { useState } from 'react';
import { X, CheckCircle2, IndianRupee, Calendar, ShieldCheck, ArrowRight, Copy, Phone, Briefcase, FileText, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { convertLead } from '../../store/slices/leadSlice';
import { useNavigate } from 'react-router-dom';

const schema = yup.object().shape({
  dealValue: yup.number().typeError('Must be a number').required('Deal value is required').min(1, 'Value must be greater than 0'),
  advanceAmount: yup.number().typeError('Must be a number').min(0, 'Cannot be negative').default(0),
  sector: yup.string().required('Service/Sector is required'),
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [convertedCustomerId, setConvertedCustomerId] = useState<string | null>(null);
  const [isCustomSector, setIsCustomSector] = useState(false);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<LeadConversionForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      dealValue: 0,
      advanceAmount: 0,
      sector: '',
      closingDate: new Date().toISOString().split('T')[0],
      contractType: 'Annual',
      notes: '',
    }
  });

  const selectedSector = watch('sector');

  const onSubmit = async (data: LeadConversionForm) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      if (pdfFile) {
        formData.append('pdf', pdfFile);
      }

      const result = await dispatch(convertLead({ id: leadId, data: formData })).unwrap();
      reset();
      setPdfFile(null);
      if (result.customer) {
        setConvertedCustomerId(result.customer._id);
      }
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Conversion failed:', err);
      alert('Conversion failed: ' + (typeof err === 'string' ? err : JSON.stringify(err)));
    }
  };

  const handleSuccessOk = () => {
    const custId = convertedCustomerId;
    setShowSuccessModal(false);
    setConvertedCustomerId(null);
    onClose();
    if (custId) {
      navigate(`/customers/${custId}`);
    } else {
      navigate('/customers');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" 
        onClick={() => {
          if (showSuccessModal) {
            handleSuccessOk();
          } else {
            onClose();
          }
        }}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-5xl bg-white sm:rounded-[2rem] shadow-2xl overflow-y-auto animate-slide-up border border-indigo-100 flex flex-col">
        {showSuccessModal ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 my-auto animate-fade-in min-h-[350px]">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Converted Successfully!
              </h2>
              <p className="text-slate-500 text-base max-w-md mx-auto">
                Lead <span className="font-bold text-slate-800">&ldquo;{leadName}&rdquo;</span> has been successfully converted into a Customer.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSuccessOk}
              className="w-full sm:w-64 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <span>OK</span>
              <CheckCircle2 className="w-5 h-5" />
            </button>
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

            <form onSubmit={handleSubmit(onSubmit, (errors) => alert("Validation Errors: " + Object.keys(errors).join(', ')))} className="p-8 bg-white flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Deal Value */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deal Value (₹)</label>
                      <div className="relative group">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          {...register('dealValue')}
                          type="number"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-bold",
                            errors.dealValue ? "border-rose-300 ring-rose-100" : "border-slate-100"
                          )}
                        />
                      </div>
                      {errors.dealValue && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.dealValue.message}</p>}
                    </div>

                    {/* Advance Amount */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Advance Amount (₹)</label>
                      <div className="relative group">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          {...register('advanceAmount')}
                          type="number"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-bold",
                            errors.advanceAmount ? "border-rose-300 ring-rose-100" : "border-slate-100"
                          )}
                        />
                      </div>
                      {errors.advanceAmount && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.advanceAmount.message}</p>}
                    </div>
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service / Sector</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                      {isCustomSector ? (
                        <div className="flex gap-2 relative z-10">
                          <input
                            {...register('sector')}
                            type="text"
                            className={cn(
                              "w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none font-bold",
                              errors.sector ? "border-rose-300 ring-rose-100" : "border-slate-100"
                            )}
                            placeholder="Type a custom service/sector..."
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomSector(false);
                              setValue('sector', '');
                            }}
                            className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                            className={cn(
                              "w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-2xl text-sm transition-all outline-none font-bold text-left flex items-center justify-between",
                              errors.sector ? "border-rose-300 ring-rose-100" : "border-slate-100",
                              selectedSector ? "text-slate-800" : "text-slate-400"
                            )}
                          >
                            <span className="truncate">{selectedSector || 'Select a Service'}</span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform text-slate-400 absolute right-3 top-1/2 -translate-y-1/2", isSectorDropdownOpen && "rotate-180")} />
                          </button>
                          
                          {/* Dropdown Menu (Forced downwards) */}
                          {isSectorDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsSectorDropdownOpen(false)}></div>
                              <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 max-h-60 overflow-y-auto animate-fade-in">
                                {[
                                  { label: 'Marketing', value: 'Marketing' },
                                  { label: 'Course', value: 'Course' },
                                  { label: 'Intern', value: 'Intern' },
                                  { label: 'SEO', value: 'SEO' },
                                  { label: 'Software', value: 'Software' },
                                  { label: 'Software - Billing', value: 'Software - Billing', indent: true },
                                  { label: 'Software - Website', value: 'Software - Website', indent: true },
                                  { label: 'Software - WebApp', value: 'Software - WebApp', indent: true },
                                  { label: 'Other', value: 'Other' },
                                ].map((option, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      if (option.value === 'Other') {
                                        setIsCustomSector(true);
                                        setValue('sector', '');
                                      } else {
                                        setValue('sector', option.value, { shouldValidate: true });
                                      }
                                      setIsSectorDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors font-medium text-slate-700",
                                      option.indent && "pl-8",
                                      selectedSector === option.value && "bg-indigo-50 text-indigo-700 font-bold"
                                    )}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.sector && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.sector.message}</p>}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
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

                  {/* PDF Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contract / Document (PDF) <span className="text-slate-300 font-medium normal-case">(Optional)</span></label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPdfFile(e.target.files[0]);
                          } else {
                            setPdfFile(null);
                          }
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Closing Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Closing Notes</label>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Key takeaways or future goals..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-8 mt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/3 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-2xl transition-all order-2 sm:order-1"
                >
                  Cancel and go back
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-2/3 py-4 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 order-1 sm:order-2"
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
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ConvertLeadModal;
