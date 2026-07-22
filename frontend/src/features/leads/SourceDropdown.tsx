import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface SourceDropdownProps {
  currentSource: string;
  onSourceChange: (newSource: string) => void;
  disabled?: boolean;
}

const SourceDropdown: React.FC<SourceDropdownProps> = ({ currentSource, onSourceChange, disabled = false }) => {
  const [otherSource, setOtherSource] = useState("");
  return (
    <div className="relative inline-block" onClick={(e) => disabled && e.stopPropagation()}>
      <select
        value={currentSource || ''}
        disabled={disabled}
        onChange={(e) => {
          e.stopPropagation();
          onSourceChange(e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-bold border appearance-none outline-none pr-6",
          disabled ? "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed opacity-70" : "bg-slate-50 text-slate-700 border-slate-200 cursor-pointer"
        )}
      >
        <option value="" disabled className="bg-white text-slate-900 font-bold">Select Source</option>
        <option value="Marketing" className="bg-white text-slate-900 font-bold">Marketing</option>
        <option value="Course" className="bg-white text-slate-900 font-bold">Course</option>
        <option value="Intern" className="bg-white text-slate-900 font-bold">Intern</option>
        <option value="SEO" className="bg-white text-slate-900 font-bold">SEO</option>
        <optgroup label="Software" className="bg-white text-slate-900 font-bold">
          <option value="Software - Billing" className="bg-white text-slate-900 font-bold">Software - Billing</option>
          <option value="Software - Website" className="bg-white text-slate-900 font-bold">Software - Website</option>
          <option value="Software - WebApp" className="bg-white text-slate-900 font-bold">Software - WebApp</option>
        </optgroup>
        <option value="Other" className="bg-white text-slate-900 font-bold">Other</option>
        {/* Legacy options that might exist in DB but aren't in the new list */}
        {!['Marketing', 'Course', 'Intern', 'SEO', 'Software - Billing', 'Software - Website', 'Software - WebApp'].includes(currentSource) && currentSource && (
           <option value={currentSource} className="hidden">{currentSource}</option>
        )}
      </select>
      {currentSource === "Other" && (
  <input
    type="text"
    placeholder="Enter Source"
    value={otherSource}
    onChange={(e) => {
      setOtherSource(e.target.value);
      onSourceChange(e.target.value);
    }}
    onClick={(e) => e.stopPropagation()}
    className="mt-2 w-full px-3 py-2 border rounded-md text-sm outline-none"
  />
)}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
    </div>
  );
};

export default SourceDropdown;
