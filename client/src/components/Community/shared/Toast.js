import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

/* ─── Context ─────────────────────────────────────────────────── */
const ToastContext = createContext(null);

let _id = 0;
const nextId = () => ++_id;

/* ─── Hook ────────────────────────────────────────────────────── */
export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

/* ─── Provider ────────────────────────────────────────────────── */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = nextId();
        setToasts((prev) => [...prev, { id, message, type }]);
        timers.current[id] = setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    const toast = Object.assign(
        (message, type = 'info', duration) => addToast(message, type, duration),
        {
            success: (msg, dur) => addToast(msg, 'success', dur),
            error: (msg, dur) => addToast(msg, 'error', dur ?? 5000),
            info: (msg, dur) => addToast(msg, 'info', dur),
            warning: (msg, dur) => addToast(msg, 'warning', dur),
        }
    );

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
};

/* ─── Icons ───────────────────────────────────────────────────── */
const ICONS = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

/* ─── Container ───────────────────────────────────────────────── */
const ToastContainer = ({ toasts, onDismiss }) => (
    <div
        className="toast-container"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
    >
        {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
    </div>
);

/* ─── Item ────────────────────────────────────────────────────── */
const ToastItem = ({ toast, onDismiss }) => (
    <div
        className={`toast toast--${toast.type}`}
        role="alert"
        aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
        <span className="toast__icon" aria-hidden="true">
            {ICONS[toast.type]}
        </span>
        <span className="toast__message">{toast.message}</span>
        <button
            className="toast__dismiss"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
        >
            <X size={14} />
        </button>
    </div>
);

export default ToastProvider;
