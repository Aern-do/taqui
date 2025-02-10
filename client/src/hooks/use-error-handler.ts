import { ApiError, ErrorCode } from "@/lib/api/error";
import { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { toast } from "./use-toast";

type Mapping<T extends FieldValues> =
    | FieldPath<T>
    | {
          path: FieldPath<T>;
          message: string;
      };

type Mappings<T extends FieldValues> = {
    [key in ErrorCode]?: Mapping<T>;
};

export function useErrorHandler<T extends FieldValues>({
    mappings = {},
    setError,
}: {
    mappings?: Mappings<T>;
    setError?: UseFormSetError<T>;
}) {
    return (error: ApiError) => {
        if (error.code == ErrorCode.Internal) {
            toast({
                variant: "destructive",
                title: "Internal Server Error",
                description:
                    "Something went wrong on our end. Please try again later.",
            });
        } else if (error.code == ErrorCode.Validation) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description:
                    "Validation on the client and server is different, please report this to the developers.",
            });
        } else if (error.code == ErrorCode.RateLimited) {
            toast({
                variant: "destructive",
                title: "Rate Limit",
                description: "You are being rate limited.",
            });
        }

        const mapping = mappings[error.code];
        if (!mapping) return;

        if (typeof mapping == "string") {
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
