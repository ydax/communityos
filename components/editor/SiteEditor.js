import { useState } from "react";
import SectionList from "./SectionList";
import SectionEditor from "./SectionEditor";
import SectionPreview from "./SectionPreview";
import ThemeSelector from "./ThemeSelector";
import DomainSettings from "./DomainSettings";

/**
 * SiteEditor Component
 * Main site editor container with sections, editor, and preview
 *
 * @param {Object} props - Component props
 * @param {Object} props.site - Site data
 * @param {Function} props.onSave - Save handler
 * @param {boolean} props.isLoading - Loading state
 */
export default function SiteEditor({ site, onSave, isLoading = false }) {
  const [localSite, setLocalSite] = useState(site);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("sections"); // 'sections' or 'theme'
  const [hasChanges, setHasChanges] = useState(false);

  const handleSectionUpdate = (updatedSection) => {
    const newSections = [...localSite.sections];
    newSections[selectedSectionIndex] = updatedSection;

    setLocalSite({ ...localSite, sections: newSections });
    setHasChanges(true);
    setSelectedSectionIndex(null);
  };

  const handleSectionReorder = (newSections) => {
    setLocalSite({ ...localSite, sections: newSections });
    setHasChanges(true);
  };

  const handleToggleVisibility = (index) => {
    const newSections = [...localSite.sections];
    newSections[index] = {
      ...newSections[index],
      visible: !newSections[index].visible,
    };

    setLocalSite({ ...localSite, sections: newSections });
    setHasChanges(true);
  };

  const handleThemeChange = (newTheme) => {
    setLocalSite({ ...localSite, theme: newTheme });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(localSite);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalSite(site);
    setSelectedSectionIndex(null);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trade-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Site Editor</h2>
          <p className="text-sm text-gray-600">
            {localSite.businessName || "Untitled Site"}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 font-semibold">
              • Unsaved changes
            </span>
          )}
          <button
            onClick={handleCancel}
            disabled={!hasChanges}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-6 py-2 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors disabled:opacity-50"
          >
            Save Site
          </button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("sections")}
              className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                activeTab === "sections"
                  ? "text-trade-primary border-b-2 border-trade-primary"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab("theme")}
              className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                activeTab === "theme"
                  ? "text-trade-primary border-b-2 border-trade-primary"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Theme
            </button>
            <button
              onClick={() => setActiveTab("domain")}
              className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                activeTab === "domain"
                  ? "text-trade-primary border-b-2 border-trade-primary"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Domain
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "sections" ? (
              <SectionList
                sections={localSite.sections || []}
                onSelectSection={setSelectedSectionIndex}
                onReorder={handleSectionReorder}
                onToggleVisibility={handleToggleVisibility}
                selectedSectionId={selectedSectionIndex}
              />
            ) : activeTab === "theme" ? (
              <div className="p-4">
                <ThemeSelector
                  currentTheme={localSite.theme || "the-trade"}
                  onThemeChange={handleThemeChange}
                />
              </div>
            ) : (
              <DomainSettings
                site={localSite}
                onUpdateSite={(newSite) => setLocalSite(newSite)}
              />
            )}
          </div>
        </div>

        {/* Middle Section - Editor or Preview */}
        {selectedSectionIndex !== null ? (
          <div className="flex-1 overflow-hidden">
            <SectionEditor
              section={localSite.sections[selectedSectionIndex]}
              onSave={handleSectionUpdate}
              onCancel={() => setSelectedSectionIndex(null)}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <SectionPreview
              site={localSite}
              theme={localSite.theme || "the-trade"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
