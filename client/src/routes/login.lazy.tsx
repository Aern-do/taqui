import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { login, LoginBody } from "@/lib/api/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

export const Route = createLazyFileRoute("/login")({
    component: Login,
});

const schema = z.object({
    username: z
        .string()
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
        .min(2),

    password: z.string().min(4),
});

type Data = z.infer<typeof schema>;

function LoginForm() {
    const form = useForm<Data>({
        resolver: zodResolver(schema),
    });
    const { handleSubmit, control } = form;

    const navigate = useNavigate();

    const onSubmit: SubmitHandler<Data> = async (data) => {
        await login(data as LoginBody);
        await navigate({
            to: "/",
        });
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
                </div>

                <Button className="w-full" type="submit">Log In</Button>
                <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link to="/register" className="underline underline-offset-4">
                        Sign up
                    </Link>
                </div>
            </form>
        </Form>
    );
}

function Login() {
    return (
        <div className="flex h-screen w-screen items-center justify-center p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Log In</CardTitle>
                    <CardDescription>
                        Enter your username and password to login to your
                        account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    );
}
