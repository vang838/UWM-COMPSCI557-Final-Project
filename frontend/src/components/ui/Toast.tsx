type ToastType = "success" | "error";

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
    offset?: "top" | "lower";
}

export default function Toast({
    type,
    message,
    onClose,
    offset = "top",
}: ToastProps) {
    const isSuccess = type === "success";

    return (
        <div
            className={`fixed ${
                offset === "top" ? "top-5" : "top-20"
            } right-5 z-50 flex items-center gap-3 text-sm px-4 py-3 rounded-lg shadow-xl max-w-sm ${
                isSuccess
                    ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                    : "bg-red-950 border border-red-800 text-red-300"
            }`}
        >
            <span className="flex-1">{message}</span>

            <button
                onClick={onClose}
                className={`text-lg leading-none cursor-pointer bg-transparent border-none ${
                    isSuccess
                        ? "text-emerald-400 hover:text-emerald-200"
                        : "text-red-400 hover:text-red-200"
                }`}
            >
                ✕
            </button>
        </div>
    );
}