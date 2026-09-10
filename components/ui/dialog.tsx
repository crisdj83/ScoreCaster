"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void | Promise<void>
  destructive?: boolean
  className?: string
  titleClassName?: string
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = false,
  className,
  titleClassName,
}: DialogProps) {
  const [pending, setPending] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  async function handleConfirm() {
    if (!onConfirm) {
      onOpenChange(false)
      return
    }
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "glass-panel-strong relative z-10 w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-300 sm:p-6",
          className
        )}
      >
        <h2 id="dialog-title" className={cn("text-lg font-bold tracking-tight text-xactscore-text", titleClassName)}>
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-xactscore-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? "…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
