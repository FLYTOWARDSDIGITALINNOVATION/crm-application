import React from 'react';
import { cn } from '../../utils/cn';

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  statusColors: Record<string, string>;
  statusOptions: string[];
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ currentStatus, onStatusChange, statusColors, statusOptions }) => {
  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <select
        value={currentStatus}
        onChange={(e) => {
          e.stopPropagation();
          onStatusChange(e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-bold border appearance-none outline-none cursor-pointer pr-6",
          statusColors[currentStatus] || statusColors['New']
        )}
      >
        {statusOptions.map((status) => (
          <option key={status} value={status} className="bg-white text-slate-800 font-medium">
            {status}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default StatusDropdown;
