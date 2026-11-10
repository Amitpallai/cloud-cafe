import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      {...props}
      className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", props.className)}
    />
  );
}

export function CardHeader(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("flex items-start justify-between gap-4 p-5", props.className)}
    />
  );
}

export function CardContent(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("px-5 pb-5", props.className)} />;
}
