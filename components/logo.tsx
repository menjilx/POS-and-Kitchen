import { cn } from "@/lib/utils";
import { ChefHat } from "lucide-react";

export const Logo = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ChefHat className="h-5 w-5" />
      </div>
      <span className="font-semibold text-lg">Kitchen System</span>
    </div>
  );
};
