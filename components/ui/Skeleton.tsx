export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-muted rounded-lg ${className}`}
      {...props}
    />
  );
}
