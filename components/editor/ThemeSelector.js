import clsx from "clsx";

/**
 * ThemeSelector Component
 * Allows selection between the 3 rigid themes
 *
 * @param {Object} props - Component props
 * @param {string} props.currentTheme - Currently selected theme
 * @param {Function} props.onThemeChange - Theme change handler
 */
export default function ThemeSelector({ currentTheme, onThemeChange }) {
  const themes = [
    {
      id: "the-maker",
      name: "The Maker",
      description: "Creative and artistic businesses",
      primaryColor: "#FF6B6B",
      secondaryColor: "#4ECDC4",
      preview: "bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4]",
    },
    {
      id: "the-trade",
      name: "The Trade",
      description: "Professional service providers",
      primaryColor: "#2C3E50",
      secondaryColor: "#E67E22",
      preview: "bg-gradient-to-br from-[#2C3E50] to-[#E67E22]",
    },
    {
      id: "the-venue",
      name: "The Venue",
      description: "Event spaces and hospitality",
      primaryColor: "#9B59B6",
      secondaryColor: "#F39C12",
      preview: "bg-gradient-to-br from-[#9B59B6] to-[#F39C12]",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Choose Theme</h3>

      <div className="grid grid-cols-1 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={clsx(
              "p-4 rounded-lg border-2 transition-all text-left",
              currentTheme === theme.id
                ? "border-trade-primary bg-blue-50"
                : "border-gray-300 hover:border-gray-400",
            )}
          >
            <div className="flex items-center space-x-4">
              {/* Theme Preview */}
              <div className={clsx("w-16 h-16 rounded-lg", theme.preview)} />

              {/* Theme Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-bold text-gray-800">{theme.name}</h4>
                  {currentTheme === theme.id && (
                    <span className="text-xs bg-trade-primary text-white px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{theme.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
