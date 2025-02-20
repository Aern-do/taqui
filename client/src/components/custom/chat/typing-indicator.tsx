import { User } from "@/lib/api/users";

export default function TypingIndicator({ users }: { users: User[] }) {
    if (users.length === 0) {
        return <div className="px-5 py-1.5 h-6" />;
    }

    const formatTypingText = () => {
        if (users.length === 1) {
            return `${users[0].username} is typing...`;
        } else if (users.length === 2) {
            return `${users[0].username} and ${users[1].username} are typing...`;
        } else {
            return `${users[0].username} and ${users.length - 1} others are typing...`;
        }
    };

    return (
        <div className="flex h-6 items-center gap-2 px-5 py-1.5 text-sm text-muted-foreground">
            <span className="flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-100">•</span>
                <span className="animate-bounce delay-200">•</span>
            </span>
            {formatTypingText()}
        </div>
    );
}
