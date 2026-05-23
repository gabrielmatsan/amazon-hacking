import { cn } from "@/lib/utils";

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "tight" | "default" | "wide";
};

const widthBySize: Record<NonNullable<ContainerProps["size"]>, string> = {
  tight: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

export function Container({
  size = "default",
  className,
  ...rest
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-6 md:px-8", widthBySize[size], className)}
      {...rest}
    />
  );
}
