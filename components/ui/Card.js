import clsx from "clsx";

/**
 * Card Component - Shopify-inspired design
 * Reusable card container with enhanced styling
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {boolean} props.hoverable - Enable hover effects
 * @param {string} props.padding - Padding size ("sm", "md", "lg")
 * @param {string} props.className - Additional CSS classes
 */
export default function Card({
  children,
  hoverable = false,
  padding = "md",
  className,
  ...props
}) {
  const paddingStyles = {
    sm: "p-4 md:p-5",
    md: "p-6 md:p-8",
    lg: "p-8 md:p-10",
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-lg shadow-soft border border-gray-100",
        hoverable &&
          "hover:shadow-medium transition-all duration-200 cursor-pointer hover:-translate-y-1",
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header
 */
export function CardHeader({ children, className }) {
  return <div className={clsx("mb-4", className)}>{children}</div>;
}

/**
 * Card Title
 */
export function CardTitle({ children, className }) {
  return (
    <h3
      className={clsx(
        "text-xl font-bold text-trade-dark leading-snug",
        className,
      )}
    >
      {children}
    </h3>
  );
}

/**
 * Card Content
 */
export function CardContent({ children, className }) {
  return (
    <div className={clsx("text-trade-muted leading-relaxed", className)}>
      {children}
    </div>
  );
}
