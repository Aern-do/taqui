import { useMe } from "@/lib/hooks";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import AvatarView from "./avatar-view";
import { Auth } from "@/lib/api/auth";

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
    const { data: user, isLoading } = useMe();

    if (isLoading || !user) return <StatusSkeleton />;

    const onLogout = async () => {
        await Auth.logout();
        await navigate({
            to: "/login",
        });
    };

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <AvatarView user={user} />
                <h1 className="font-semibold">{user.username}</h1>
            </div>

            <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut />
            </Button>
        </div>
    );
}
