import { AlertCircle } from "lucide-react";
import { FieldErrors } from "react-hook-form";
import { ManualFormMessage } from "../ui/form";

export default function RootError({ errors }: { errors: FieldErrors }) {
    if (!errors.root) return null;

    return (
        <div className="flex items-center space-x-2 rounded-lg border border-destructive/50 bg-destructive/15 px-4 py-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <ManualFormMessage message={errors.root.message} />
        </div>
    );
}
