import { Avatar, AvatarFallback } from "../ui/avatar";
import { useMe } from "@/lib/hooks";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/api/axios";
import { useNavigate } from "@tanstack/react-router";

function StatusSkeleton() {
    return (
        <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-2 w-12" />
        </div>
    );
}

export default function UserStatus() {
    const navigate = useNavigate();
    const { data, isLoading } = useMe();

    if (isLoading) return <StatusSkeleton />;
    const fallback = data?.username.slice(0, 1);

    const onLogout = async () => {
        await logout();
        await navigate({
            to: "/login",
        });
    };

    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <Avatar>
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <h1 className="font-semibold">{data?.username}</h1>
            </div>

            <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut />
            </Button>
        </div>
    );
}
