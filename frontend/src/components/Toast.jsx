import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let iconColor = 'var(--accent-emerald)';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'var(--accent-rose)';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = 'var(--accent-cyan)';
        }

        return (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, color: '#fff' }}>{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
