import { useCallback, useState } from "react";

type ToastType = "success" | "error";

interface ToastState {
    show: boolean;
    message: string;
    type: ToastType;
}

export function useToast() {
    const [toast, setToast] = useState<ToastState>({
        show: false,
        message: "",
        type: "success",
    });

    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({
            show: true,
            message,
            type,
        });

        const timeout = setTimeout(() => {
            setToast((current) => ({
                ...current,
                show: false,
            }));
        }, 5000);

        return () => clearTimeout(timeout);
    }, []);

    const showSuccess = useCallback(
        (message: string) => showToast("success", message),
        [showToast]
    );

    const showError = useCallback(
        (message: string) => showToast("error", message),
        [showToast]
    );

    const hideToast = useCallback(() => {
        setToast((current) => ({
            ...current,
            show: false,
        }));
    }, []);

    return {
        toast,
        showSuccess,
        showError,
        hideToast,
    };
}