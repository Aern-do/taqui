import { useErrorHandler } from "@/hooks/use-error-handler";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";
import { register } from "@/lib/api/axios";
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
    const { handleSubmit, control, setError } = form;

    const handleError = useErrorHandler({
        setError: setError,
        formMappings: {
            [ErrorCode.UserAlreadyExists]: {
                path: "username",
                message: "This username is already taken",
            },
        },
    });

    const { mutateAsync } = useMutationWithErrorHandling({
        mutationFn: register,
        onError: handleError,

        onSuccess: async () => {
            await navigate({
                to: "/login",
            });
        },
    });

    const onSubmit: SubmitHandler<RegisterData> = async (data) => {
        await mutateAsync(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <Button className="w-full" type="submit">
                    Register
                </Button>
            </form>
        </Form>
    );
}
