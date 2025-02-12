import { login } from "@/lib/api/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorCode } from "@/lib/api/error";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";
import RootError from "./root-error";

const loginSchema = z.object({
    username: z
        .string()
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
        .min(4)
        .max(16),

    password: z.string().min(8),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const navigate = useNavigate();

    const form = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
    });
    const {
        handleSubmit,
        control,
        setError,
        formState: { errors },
    } = form;

    const handleError = useErrorHandler({
        setError,
        formMappings: {
            [ErrorCode.InvalidCredentials]: {
                path: "root",
                message: "Invalid login or password",
            },
        },
    });

    const { mutateAsync, isPending } = useMutationWithErrorHandling({
        onError: handleError,
        mutationFn: login,

        onSuccess: async () => {
            await navigate({
                to: "/",
            });
        },
    });

    const onSumbit: SubmitHandler<LoginData> = async (data) =>
        await mutateAsync(data);

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSumbit)} className="space-y-4">
                <RootError errors={errors} />

                <div className="space-y-2">
                    <FormField
                        control={control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="your_username_here"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button className="w-full" type="submit" disabled={isPending}>
                    {isPending ? "Logging in..." : "Log In"}
                </Button>
                <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link
                        to="/register"
                        className="underline underline-offset-4"
                    >
                        Sign up
                    </Link>
                </div>
            </form>
        </Form>
    );
}
