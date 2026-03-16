"use client";

import { useState, useEffect } from "react";
import ServiceCard from "../ServiceCard";

/**
 * ServicesSection Component
 * Displays all active services for a site in a grid
 *
 * @param {Object} props - Component props
 * @param {string} props.siteId - Site ID
 * @param {string} props.theme - Site theme ('maker', 'trade', 'venue')
 * @param {Array} props.services - Pre-fetched services (optional)
 * @param {Object} props.sectionData - Section configuration data
 */
export default function ServicesSection({
  siteId,
  theme = "trade",
  services: propServices = null,
  sectionData = {},
}) {
  const [services, setServices] = useState(propServices || []);
  const [isLoading, setIsLoading] = useState(!propServices);
  const [error, setError] = useState(null);

  // Fetch services if not provided
  useEffect(() => {
    if (propServices) {
      setServices(propServices);
      return;
    }

    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sites/${siteId}/services`);

        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }

        const data = await response.json();
        setServices(data.services || []);
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load services");
      } finally {
        setIsLoading(false);
      }
    };

    if (siteId) {
      fetchServices();
    }
  }, [siteId, propServices]);

  // Section title and description from sectionData
  const title = sectionData.title || "Our Services";
  const description = sectionData.description || "";

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
              >
                <div className="h-56 bg-gray-300" />
                <div className="p-6">
                  <div className="h-6 bg-gray-300 rounded mb-2" />
                  <div className="h-4 bg-gray-300 rounded mb-2" />
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-4" />
                  <div className="h-10 bg-gray-300 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{title}</h2>
          <p className="text-gray-600">No services available at this time.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              theme={theme}
              showDetails={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
