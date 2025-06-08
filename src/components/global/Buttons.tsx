"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import { Github, Loader2 } from "lucide-react";
import { FaGoogle, FaLinkedin } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface iAppProps {
  text: string;
  variant?:
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | null
  | undefined;
  className?: string;
  onClick?: () => void
  isSubmitting?: boolean;
}

export function SubmitButton({ text, variant, className, onClick, isSubmitting }: iAppProps) {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled className={cn("w-fit", className)} variant={variant}>
          <Loader2 className="size-4 mr-2 animate-spin" /> Please wait...
        </Button>
      ) : (
        <Button type="submit" onClick={onClick} disabled={isSubmitting} className={cn("w-fit", className)} variant={variant}>
          {text}
        </Button>
      )}
    </>
  );
}

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  onClick: () => Promise<void> | void
  children: React.ReactNode
}

export const LoadingButton = ({ onClick, children, ...props }: LoadingButtonProps) => {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onClick()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
      {loading ? "Please wait..." : children}
    </Button>
  )
}

export function GitHubAuthButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button variant="outline" className="w-full" disabled>
          <Loader2 className="size-4 mr-2 animate-spin" /> Please wait
        </Button>
      ) : (
        <Button variant="outline" className="w-full">
          <Github />
          Sign in with GitHub
        </Button>
      )}
    </>
  );
}


export function GoogleAuthButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button variant="outline" className="w-full" disabled>
          <Loader2 className="size-4 mr-2 animate-spin" /> Please wait
        </Button>
      ) : (
        <Button variant="outline" className="w-full">
          <FaGoogle />
          Sign in with Google
        </Button>
      )}
    </>
  );
}