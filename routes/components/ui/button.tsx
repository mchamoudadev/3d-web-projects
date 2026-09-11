import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "button inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8c79a]",
  {
    variants: {
      variant: {
        default: "bg-[#e8c79a] text-[#20241f] hover:bg-[#f3d5ad]",
        outline:
          "border border-[#e8c79a33] text-[#e8c79a] hover:bg-[#e8c79a0c]",
        ghost: "text-[#c7c0ae] hover:text-[#fff3de]",
      },
      size: { default: "px-4 py-3", sm: "px-3 py-2", icon: "size-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
