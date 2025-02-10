import { Trash, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Invite } from "@/lib/api/invite";

export interface InviteViewProps {
    invite: Invite;
}

export default function InviteView({ invite }: InviteViewProps) {
    const formattedCode = `${invite.code.slice(0, 4)}-${invite.code.slice(4)}`;

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="font-medium">{formattedCode}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{invite.uses} uses</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
