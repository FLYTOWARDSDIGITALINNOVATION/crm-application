import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm rounded-[2rem] bg-white shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <LogOut className="w-8 h-8 ml-1" />
        </div>
        
        <h3 className="mb-2 text-xl font-bold text-slate-900">Sign Out</h3>
        <p className="mb-8 text-sm text-slate-500">
          Are you sure you want to log out of your account? You will need to sign in again to access the dashboard.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-rose-200 transition-all hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200"
          >
            Yes, Log out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LogoutConfirmModal;
