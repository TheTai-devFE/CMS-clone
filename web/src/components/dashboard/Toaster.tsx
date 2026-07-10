'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDashboard } from '@/app/dashboard/context/DashboardContext';

interface ToastItem {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function Toaster() {
  const { error, successMsg, setError, setSuccessMsg } = useDashboard();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (error) {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type: 'error', message: error }]);
      setError(''); // Clear global state immediately so next errors can be captured
    }
  }, [error, setError]);

  useEffect(() => {
    if (successMsg) {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type: 'success', message: successMsg }]);
      setSuccessMsg(''); // Clear global state immediately
    }
  }, [successMsg, setSuccessMsg]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 120, scale: 0.85, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="pointer-events-auto flex items-start gap-3 p-3.5 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-lg w-full"
          >
            {/* Type Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1 text-xs font-semibold leading-normal text-foreground pr-2">
              {toast.message}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Auto dismiss timer */}
            <ToastTimer duration={4000} onDismiss={() => removeToast(toast.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Small helper component to handle auto-dismiss timer per toast
function ToastTimer({ duration, onDismiss }: { duration: number; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return null;
}
