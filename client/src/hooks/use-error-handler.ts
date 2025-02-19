import { ApiError, ErrorCode } from "@/lib/api/error";
import { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { Toast, toast } from "./use-toast";

type Path<T extends FieldValues> = FieldPath<T> | `root.${string}` | "root";

type FormMapping<T extends FieldValues> =
    | Path<T>
    | {
          path: Path<T>;
          message: string;
      };

type FormMappings<T extends FieldValues> = {
    [key in ErrorCode]?: FormMapping<T>;
};

type ToastMappings = {
    [key in ErrorCode]?: Toast;
};

type CallbackMappings = {
    [key in ErrorCode]?: (error: ApiError) => void
}

const DEFAULT_TOAST_MAPPINGS: ToastMappings = {
    [ErrorCode.Internal]: {
        variant: "destructive",
        title: "Internal Server Error",
        description: "Something went wrong on our end. Please try again later.",
    },
    [ErrorCode.Validation]: {
        variant: "destructive",
        title: "Validation Error",
        description:
            "Validation on the client and server is different, please report this to the developers.",
    },
    [ErrorCode.RateLimited]: {
        variant: "destructive",
        title: "Rate Limit",
        description: "You are being rate limited.",
    },
};

export function useErrorHandler<T extends FieldValues>({
    formMappings = {},
    callbackMappings = {},
    toastMappings = DEFAULT_TOAST_MAPPINGS,
    setError,
}: {
    formMappings?: FormMappings<T>;
    toastMappings?: ToastMappings;
    callbackMappings?: CallbackMappings,
    setError?: UseFormSetError<T>;
} = {}) {
    return (error: ApiError) => {
        const callback = callbackMappings[error.code];
        if (callback) {
            callback(error);
            return;
        }

        const toastConfig = toastMappings[error.code];
        if (toastConfig) {
            toast(toastConfig);
            return;
        }

        const mapping = formMappings[error.code];
        if (!mapping) return;

        if (typeof mapping === "string") {
            setError?.(mapping, {
                type: "custom",
                message: error.details.toString(),
            });
        } else {
            setError?.(mapping.path, {
                type: "custom",
                message: mapping.message,
            });
        }
    };
}

