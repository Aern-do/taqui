import { useErrorHandler } from "@/hooks/use-error-handler";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";
import { ErrorCode } from "@/lib/api/error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
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
import { Turnstile } from "@marsidev/react-turnstile";
import { Auth } from "@/lib/api/auth";
import RootError from "./root-error";

const registerSchema = z
    .object({
        username: z
            .string()
            .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
            .min(4)
            .max(16),

        password: z
            .string()
            .min(8)
            .regex(
                /(?=.*\p{Lu})/gu,
                "Password must contain at least one uppercase letter",
            )
            .regex(
                /(?=.*[!@#$&*_])/g,
                "Password must contain at least one special character",
            ),
        confirmPassword: z.string().min(8),
        token: z.string(),
    })
    .refine((data) => data.password == data.confirmPassword, {
        message: "Passwords must match!",
        path: ["confirmPassword"],
    });

type RegisterData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const navigate = useNavigate();

    const form = useForm<RegisterData>({
        resolver: zodResolver(registerSchema),
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
        setError: setError,
        formMappings: {
            [ErrorCode.UserAlreadyExists]: {
                path: "username",
                message: "This username is already taken",
            },
            [ErrorCode.CaptchaFailed]: {
                path: "root",
                message: "The CAPTCHA verification failed.",
            },
        },
    });

    const { mutateAsync, isPending } = useMutationWithErrorHandling({
        mutationFn: Auth.register,
        onError: handleError,

        onSuccess: async () => {
            await navigate({
                to: "/login",
            });
        },
    });

    const onSubmit: SubmitHandler<RegisterData> = async (data) => {
        await mutateAsync({
            username: data.username,
            password: data.password,
            token: data.token,
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                    <FormField
                        control={control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
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
                    {isPending ? "Registering..." : "Register"}
                </Button>
            </form>
        </Form>
    );
}
