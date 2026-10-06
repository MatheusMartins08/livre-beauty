"use client";

import { useState } from "react";
import { MapPin } from "@phosphor-icons/react";
import { ActionContent } from "@/components/ui";

export function LocationMap() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="location-map">
      {loaded ? (
        <iframe
          title="Mapa da região dos Jardins, São Paulo"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-46.678%2C-23.578%2C-46.655%2C-23.555&layer=mapnik"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="map-preview">
          <MapPin size={36} weight="light" aria-hidden="true" />
          <p className="map-place">Jardins, São Paulo</p>
          <p>O cuidado tem seu lugar.</p>
          <button type="button" className="button button-secondary button-compact" onClick={() => setLoaded(true)}>
            <ActionContent>Explorar a região</ActionContent>
          </button>
        </div>
      )}
      {loaded && (
        <a className="action-link map-directions" href="https://www.openstreetmap.org/#map=15/-23.5665/-46.6665" target="_blank" rel="noopener noreferrer">
          <ActionContent>Como chegar à região</ActionContent>
        </a>
      )}
    </div>
  );
}
