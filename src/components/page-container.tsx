import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}

export function PageContainer({ children, wide, className }: PageContainerProps) {
  return (
    <div className={cn(wide ? "max-w-6xl" : "max-w-4xl", "mx-auto", className)}>
      {children}
    </div>
  );
}
