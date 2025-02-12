import { createLazyFileRoute } from "@tanstack/react-router";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import RegisterForm from "@/components/custom/register-form";

export const Route = createLazyFileRoute("/register")({
    component: Register,
});

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
