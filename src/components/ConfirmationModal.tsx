import { Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  type?: 'danger' | 'info';
  requireTextConfirm?: string;
}

export function ConfirmationModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  type,
  requireTextConfirm
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!show) {
      setInputValue('');
    }
  }, [show]);

  const isConfirmDisabled = requireTextConfirm 
    ? inputValue.trim().toLowerCase() !== requireTextConfirm.toLowerCase()
    : false;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 text-center"
          >
            <div className={`w-16 h-16 ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
              {type === 'danger' ? <Trash2 className="w-8 h-8" /> : <Info className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-black mb-2">{title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{message}</p>
            
            {requireTextConfirm && (
              <div className="mb-6 text-left">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Type "{requireTextConfirm}" to confirm
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={`Type "${requireTextConfirm}"...`}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                disabled={isConfirmDisabled}
                className={`flex-1 py-4 ${type === 'danger' ? 'bg-red-600' : 'bg-blue-600'} text-white rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer`}
              >
                {confirmText || 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
