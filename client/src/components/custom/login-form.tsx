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
import { Turnstile } from "@marsidev/react-turnstile";
import RootError from "./root-error";
import { Auth } from "@/lib/api/auth";

const loginSchema = z.object({
    username: z
        .string()
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
        .min(4)
        .max(16),

    password: z.string().min(8),
    token: z.string(),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const navigate = useNavigate();

    const form = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            token: "",
            username: "",
            password: "",
        },
    });
    const {
        handleSubmit,
        control,
        setError,
        setValue,
        register,
        formState: { errors },
    } = form;

    const handleError = useErrorHandler({
        setError,
        formMappings: {
            [ErrorCode.InvalidCredentials]: {
                path: "root",
                message: "Invalid login or password",
            },
            [ErrorCode.CaptchaFailed]: {
                path: "root",
                message: "The CAPTCHA verification failed.",
            },
        },
    });

    const { mutateAsync, isPending } = useMutationWithErrorHandling({
        onError: handleError,
        mutationFn: Auth.login,

        onSuccess: async () => {
            await navigate({
                to: "/",
            });
        },
    });

    const onSumbit: SubmitHandler<LoginData> = async (data) => {
        await mutateAsync({
            username: data.username,
            password: data.password,
            token: data.token,
        });
    };

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

                <div className="flex w-full justify-center">
                    <Turnstile
                        options={{ theme: "dark" }}
                        siteKey={import.meta.env.VITE_SITE_KEY}
                        onSuccess={(token) => setValue("token", token)}
                    />
                    <input type="hidden" {...register("token")} />
                </div>

                <Button className="w-full" type="submit" disabled={isPending}>
                    {isPending ? "Logging in..." : "Log In"}
                </Button>
                <div className="space-x-1 text-center text-sm">
                    <span>Don&apos;t have an account?</span>
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
