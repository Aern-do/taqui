import { User } from "@/lib/api/users";
import { Avatar, AvatarFallback } from "../ui/avatar";

const getColorFromId = (id: string) => {
    const colors = Object.freeze([
        "bg-red-700",
        "bg-blue-700",
        "bg-green-700",
        "bg-yellow-700",
        "bg-purple-700",
        "bg-pink-700",
        "bg-indigo-700",
        "bg-teal-700",
        "bg-cyan-700",
    ]);

    const hash = id
        .split("")
        .reduce((acc, char) => (acc * 33 + char.charCodeAt(0)) | 0, 5381);

    return colors[Math.abs(hash) % colors.length];
};

export default function AvatarView({ user }: { user: User }) {
    const fallback = user.username.slice(0, 1);

    return (
        <Avatar>
            <AvatarFallback className={getColorFromId(user.id)}>
                {fallback}
            </AvatarFallback>
        </Avatar>
    );
}
