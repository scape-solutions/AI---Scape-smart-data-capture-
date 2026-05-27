import { XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChangelogModalProps {
  show: boolean;
  onClose: () => void;
  changelog: any[];
}

export function ChangelogModal({ show, onClose, changelog }: ChangelogModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-xl">Project History</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {changelog.map((log, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      User: {log.userName || log.userId} • {log.timestamp?.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
