import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, X, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useAppDispatch } from '../../store';
import { bulkCreateLeads } from '../../store/slices/leadSlice';
import { cn } from '../../utils/cn';

const BulkUploadLeads: React.FC = () => {
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ 
    success: boolean; 
    message: string;
    totalRecords?: number;
    imported?: number;
    duplicates?: number;
    duplicateRecords?: any[];
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    } else if (fileRejections.length > 0) {
      setResult({
        success: false,
        message: 'Invalid file format. Please upload a valid Excel (.xlsx, .xls) or CSV file.',
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/csv': ['.csv'],
      'application/octet-stream': ['.xlsx', '.xls', '.csv'],
      // Catch empty mime types
      '': ['.xlsx', '.xls', '.csv']
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const response = await dispatch(bulkCreateLeads(file)).unwrap();
      setResult({
        success: true,
        message: response.message || `Successfully imported leads.`,
        totalRecords: response.totalRecords,
        imported: response.imported,
        duplicates: response.duplicates,
        duplicateRecords: response.duplicateRecords
      });
      setFile(null);
    } catch (error: any) {
      setResult({
        success: false,
        message: error || 'Failed to upload leads. Please check the file format.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Define the template data
    const templateData = [
      {
        'Name': 'John Doe',
        'Email': 'john@example.com',
        'Phone': '+1 234 567 890',
        'Company': 'Example Corp',
        'Source': 'Marketing',
        'Status': 'New',
        'Notes': 'Interested in CRM services',
      },
      {
        'Name': 'Jane Smith',
        'Email': 'jane@test.com',
        'Phone': '+1 987 654 321',
        'Company': 'Test Inc',
        'Source': 'Software - Billing',
        'Status': 'Contacted',
        'Notes': 'Needs a demo next week',
      }
    ];

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Template');
    
    // Generate buffer and trigger download
    XLSX.writeFile(workbook, 'CRM_Leads_Template.xlsx');
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "relative border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4",
              isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50",
              file ? "border-emerald-500 bg-emerald-50/30" : ""
            )}
          >
            <input {...getInputProps()} />
            
            {!file ? (
              <>
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Click or drag Excel file here</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Support .xlsx and .xls files (Max 5MB)</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{file.name}</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mt-1">
                    {(file.size / 1024).toFixed(2)} KB • Ready to upload
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {result && (
            <div className={cn(
              "p-6 rounded-2xl flex flex-col gap-4 animate-slide-up",
              result.success ? "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" : "bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-800/50"
            )}>
              <div className="flex items-start gap-3">
                {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />}
                <div>
                  <p className={cn("text-sm font-bold", result.success ? "text-slate-900 dark:text-white" : "text-rose-900 dark:text-rose-200")}>{result.message}</p>
                  
                  {result.success && result.totalRecords !== undefined && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{result.totalRecords}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Total</p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                        <p className="text-2xl font-bold text-emerald-700">{result.imported}</p>
                        <p className="text-[10px] uppercase font-bold text-emerald-600 mt-1">Imported</p>
                      </div>
                      <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                        <p className="text-2xl font-bold text-rose-700">{result.duplicates}</p>
                        <p className="text-[10px] uppercase font-bold text-rose-600 mt-1">Duplicates</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {result.duplicateRecords && result.duplicateRecords.length > 0 && (
                <div className="mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Skipped Duplicates</h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-slate-500 dark:text-slate-400">Name</th>
                          <th className="px-4 py-2 font-semibold text-slate-500 dark:text-slate-400">Contact</th>
                          <th className="px-4 py-2 font-semibold text-slate-500 dark:text-slate-400">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {result.duplicateRecords.map((record, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{record.name}</td>
                            <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                              <div className="flex flex-col">
                                <span>{record.email}</span>
                                {record.phone && <span className="text-[10px]">{record.phone}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-rose-600 dark:text-rose-400 font-medium">{record.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              onClick={removeFile}
              disabled={!file || isUploading}
              className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50 transition-all"
            >
              Clear
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-10 py-3 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Start Import
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">How it works</h3>
          
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Download the <span className="font-bold text-slate-900 dark:text-white">sample template</span> or prepare your own Excel sheet.
              </p>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ensure the first row contains these exact column names:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Notes'].map(col => (
                    <span key={col} className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      col === 'Name' || col === 'Email' ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    )}>
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-amber-600 font-medium">* Name and Email are required</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload the file and we'll automatically create the leads for you.
              </p>
            </li>
          </ul>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadLeads;
