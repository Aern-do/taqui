import * as React from "react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { login, register } from "@/lib/api/axios";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorCode } from "@/lib/api/error";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";

export const Route = createLazyFileRoute("/register")({
    component: Register,
});

const schema = z
    .object({
        username: z
            .string()
            .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
            .min(2),

        password: z.string().min(4),
        confirmPassword: z.string().min(4),
    })
    .refine((data) => data.password == data.confirmPassword, {
        message: "Passwords must match!",
        path: ["confirmPassword"],
    });

type Data = z.infer<typeof schema>;

function RegisterForm() {
    const navigate = useNavigate();

    const form = useForm<Data>({
        resolver: zodResolver(schema),
    });
    const { handleSubmit, control, setError } = form;

    const handleError = useErrorHandler({
        setError: setError,
        mappings: {
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

    const onSubmit: SubmitHandler<Data> = async (data) => {
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

function Register() {
    return (
        <div className="flex h-screen w-screen items-center justify-center p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Register</CardTitle>
                    <CardDescription>
                        Enter username and password to create new account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <RegisterForm />
                </CardContent>
            </Card>
        </div>
    );
}
