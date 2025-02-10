import { ApiError } from "@/lib/api/error";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

type MutationConfig<TData, TVariables> = Omit<
    UseMutationOptions<TData, AxiosError<ApiError>, TVariables>,
    "onError"
> & {
    onError?: (error: ApiError) => void;
};

export const useMutationWithErrorHandling = <TData, TVariables>(
    config?: MutationConfig<TData, TVariables>,
) => {
    return useMutation({
        ...config,
        onError: (rawError) => {
            if (!axios.isAxiosError(rawError)) return;

            const axiosError = rawError as AxiosError<ApiError>;
            const error = axiosError.response?.data;

            if (error && config?.onError) {
                config.onError(error);
            }
        },
    });
};

