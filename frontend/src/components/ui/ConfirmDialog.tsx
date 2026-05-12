'use client';

import React, { useEffect } from "react";

type ConfirmDialogVariant = "default" | "danger";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    variant?: ConfirmDialogVariant;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    loading = false,
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !loading) {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, loading, onCancel]);

    if (!open) {
        return null;
    }

    const confirmButtonClass =
        variant === "danger"
            ? "border-red-800 bg-red-900/40 text-red-300 hover:bg-red-800/60"
            : "border-emerald-800 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/60";

    const panelBorderClass =
        variant === "danger" ? "border-red-900/50" : "border-white/10";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    onCancel();
                }
            }}
        >
            <div
                className={`w-full max-w-md bg-[#1a1a1a] border ${panelBorderClass} rounded-lg shadow-xl`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="px-4 py-3 border-b border-white/8">
                    <p
                        id="confirm-dialog-title"
                        className="text-sm font-medium text-white"
                    >
                        {title}
                    </p>

                    <div
                        id="confirm-dialog-description"
                        className="text-[12px] text-gray-400 mt-1"
                    >
                        {description}
                    </div>
                </div>

                <div className="px-4 py-3 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-3 py-1.5 rounded border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
                    >
                        {loading ? "Working..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}