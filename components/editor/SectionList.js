import clsx from "clsx";

/**
 * SectionList Component
 * List of sections with reordering and visibility controls
 *
 * @param {Object} props - Component props
 * @param {Array} props.sections - Array of section objects
 * @param {Function} props.onSelectSection - Section selection handler
 * @param {Function} props.onReorder - Reorder handler
 * @param {Function} props.onToggleVisibility - Visibility toggle handler
 * @param {string} props.selectedSectionId - Currently selected section ID
 */
export default function SectionList({
  sections,
  onSelectSection,
  onReorder,
  onToggleVisibility,
  selectedSectionId,
}) {
  const sectionIcons = {
    hero: "🏠",
    services: "⚙️",
    about: "👤",
    contact: "📧",
    gallery: "🖼️",
  };

  const sectionLabels = {
    hero: "Hero",
    services: "Services",
    about: "About",
    contact: "Contact",
    gallery: "Gallery",
  };

  const moveSection = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[newIndex];
    newSections[newIndex] = temp;

    onReorder(newSections);
  };

  return (
    <div className="bg-white border-r border-gray-200 w-full h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Site Sections</h3>

        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={index}
              className={clsx(
                "p-4 rounded-lg border-2 transition-all cursor-pointer",
                selectedSectionId === index
                  ? "border-trade-primary bg-blue-50"
                  : section.visible
                    ? "border-gray-300 hover:border-gray-400"
                    : "border-gray-200 bg-gray-50 opacity-60",
              )}
              onClick={() => onSelectSection(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {sectionIcons[section.type] || "📄"}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {sectionLabels[section.type] || section.type}
                  </span>
                </div>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(index);
                  }}
                  className={clsx(
                    "text-sm font-semibold px-2 py-1 rounded transition-colors",
                    section.visible
                      ? "text-green-600 hover:bg-green-50"
                      : "text-gray-400 hover:bg-gray-100",
                  )}
                >
                  {section.visible ? "👁️ Visible" : "🚫 Hidden"}
                </button>
              </div>

              {/* Reorder controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSection(index, "up");
                  }}
                  disabled={index === 0}
                  className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↑ Up
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSection(index, "down");
                  }}
                  disabled={index === sections.length - 1}
                  className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↓ Down
                </button>
                <span className="text-xs text-gray-400">
                  Position: {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Section Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 Tip: Click a section to edit its content. Use the arrows to
            reorder sections.
          </p>
        </div>
      </div>
    </div>
  );
}
