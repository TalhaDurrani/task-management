"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  hoursSpent: z.number().min(0.1, "Hours must be at least 0.1").max(24, "Hours cannot exceed 24"),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface LogTimeDialogProps {
  children: React.ReactNode
  taskId: string
  taskTitle: string
}

export function LogTimeDialog({ children, taskId, taskTitle }: LogTimeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hoursSpent: 1,
      description: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/time-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to log time")
      }

      toast({
        title: "Success",
        description: `Logged ${data.hoursSpent} hour(s) for "${taskTitle}"`,
      })

      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log time. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>Log time spent working on "{taskTitle}"</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hoursSpent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Spent</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.1"
                      max="24"
                      step="0.1"
                      placeholder="1.0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number.parseFloat(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What did you work on?" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Logging..." : "Log Time"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
