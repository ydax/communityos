import clsx from "clsx";

/**
 * Button Component - Shopify-inspired design
 * Reusable button with enhanced styling and variants
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant ("primary", "secondary", "outline", "ghost")
 * @param {string} props.size - Button size ("sm", "md", "lg")
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional CSS classes
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className,
  ...props
}) {
  const baseStyles =
    "font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "bg-trade-primary text-white hover:bg-trade-dark shadow-md hover:shadow-strong focus:ring-trade-accent",
    secondary:
      "bg-trade-secondary text-white hover:opacity-90 shadow-md hover:shadow-medium focus:ring-trade-secondary",
    outline:
      "border-2 border-trade-primary text-trade-primary hover:bg-trade-primary hover:text-white focus:ring-trade-primary",
    ghost: "text-trade-primary hover:bg-trade-light focus:ring-trade-accent",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
