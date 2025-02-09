import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";
import { toast } from "@/hooks/use-toast";
import { Groups } from "@/lib/api/group";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogProps } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createGroupSchema = z.object({
    name: z
        .string()
        .min(4, "Group name must be at least 4 characters")
        .max(50, "Group name cannot exceed 50 characters")
        .trim()
        .refine((name) => /^[a-zA-Z0-9\s-_]+$/.test(name), {
            message:
                "Group name can only contain letters, numbers, spaces, hyphens and underscores",
        }),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

export const CreateGroupForm = ({ onOpenChange }: DialogProps) => {
    const form = useForm<CreateGroupFormData>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: {
            name: "",
        },
    });
    const handleError = useErrorHandler({
        setError: form.setError,
    });

    const queryClient = useQueryClient();
    const { mutateAsync, isPending } = useMutationWithErrorHandling({
        mutationFn: Groups.create,
        onError: handleError,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            form.reset();

            toast({
                title: "Success",
                description: `Group "${form.getValues().name}" has been created`,
            });
            onOpenChange?.(false);
        },
    });

    const onSubmit = async (data: CreateGroupFormData) => {
        await mutateAsync({
            name: data.name.trim(),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Group Name</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Enter group name"
                                    disabled={isPending}
                                    autoComplete="off"
                                    autoFocus
                                    className="w-full"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>

                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating..." : "Create Group"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

export default function CreateGroupDialog(props: DialogProps) {
    return (
        <Dialog {...props}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>

                <CreateGroupForm {...props} />
            </DialogContent>
        </Dialog>
    );
}
