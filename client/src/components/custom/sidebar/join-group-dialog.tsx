import { SubmitHandler, useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { DialogProps } from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Invites } from "@/lib/api/invite";

interface JoinGroupData {
    left: string;
    right: string;
}

function JoinGroupForm({ onOpenChange }: DialogProps) {
    const queryClient = useQueryClient();
    const { mutateAsync } = useMutation({
        mutationFn: Invites.accept,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["groups"],
            });
        },
    });

    const form = useForm<JoinGroupData>({
        defaultValues: {
            left: "",
            right: "",
        },
    });

    const { handleSubmit, reset } = form;

    const onSubmit: SubmitHandler<JoinGroupData> = async (data) => {
        const code = `${data.left}${data.right}`;
        reset();
        onOpenChange?.(false);

        await mutateAsync(code);
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <FormLabel className="text-sm">Invite Code</FormLabel>

                    <div className="mt-1 flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name="left"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            maxLength={4}
                                            className="text-center lowercase tracking-wider"
                                            placeholder="abcd"
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value.toLowerCase(),
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <span>-</span>
                        <FormField
                            control={form.control}
                            name="right"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            maxLength={4}
                                            className="text-center lowercase tracking-wider"
                                            placeholder="efgh"
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value.toLowerCase(),
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full">
                    Join Group
                </Button>
            </form>
        </Form>
    );
}

export default function JoinGroupDialog(props: DialogProps) {
    return (
        <Dialog {...props}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="pb-2">
                    <DialogTitle>Enter Invite Code</DialogTitle>

                    <DialogDescription className="text-sm">
                        Enter the invite code to join the group
                    </DialogDescription>
                </DialogHeader>

                <JoinGroupForm {...props} />
            </DialogContent>
        </Dialog>
    );
}
