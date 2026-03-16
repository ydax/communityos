import clsx from "clsx";

/**
 * BookingButton Component
 * CTA button for booking services
 *
 * @param {Object} props - Component props
 * @param {Object} props.service - Service data
 * @param {string} props.theme - Site theme ('maker', 'trade', 'venue')
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 * @param {string} props.className - Additional CSS classes
 */
export default function BookingButton({
  service,
  theme = "trade",
  size = "md",
  className,
}) {
  const handleClick = () => {
    // TODO: Implement booking/quote request logic
    console.log("Booking service:", service.id);
    alert("Booking functionality coming soon!");
  };

  const buttonText =
    service.pricing?.model === "quote_required" ? "Request Quote" : "Book Now";

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const themeStyles = {
    maker: "bg-maker-primary hover:opacity-90",
    trade: "bg-trade-primary hover:bg-trade-dark",
    venue: "bg-venue-primary hover:opacity-90",
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        "font-semibold rounded-lg text-white transition-colors inline-flex items-center justify-center",
        sizeStyles[size],
        themeStyles[theme],
        className,
      )}
    >
      {buttonText}
    </button>
  );
}
