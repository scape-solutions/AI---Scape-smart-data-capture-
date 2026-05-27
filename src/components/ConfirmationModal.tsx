import { Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  type?: 'danger' | 'info';
}

export function ConfirmationModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  type
}: ConfirmationModalProps) {
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
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{message}</p>
            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                className={`flex-1 py-4 ${type === 'danger' ? 'bg-red-600' : 'bg-blue-600'} text-white rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]`}
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
