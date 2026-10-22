import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ALL_WORLD_HUBS } from '../../utils/worldHubs';
import { MAP_TILE_PRESETS } from '../../utils/constants';
import { useApp } from '../../contexts/AppContext';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function GlobalAllianceMap({
  hubCounts,
  selectedHubId,
  onSelectHub,
  membersByHub,
  focusedCoords,
}) {
  const { notify } = useApp();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [interactiveMode, setInteractiveMode] = useState(false);

  // Sync mobile touch interaction to prevent scroll trap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isSmallScreen && !isFullscreen && !interactiveMode) {
      if (map.dragging?.disable) map.dragging.disable();
      if (map.touchZoom?.disable) map.touchZoom.disable();
    } else {
      if (map.dragging?.enable) map.dragging.enable();
      if (map.touchZoom?.enable) map.touchZoom.enable();
    }
  }, [interactiveMode, isFullscreen]);

  // 1. Initialize Global Leaflet Map on Mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [30.0, 31.0], // Centered around Mediterranean/EMEA
        zoom: 4,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      // Custom Zoom Control at top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Attribution Control
      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      // Esri World Street Map layer
      const esriPreset = MAP_TILE_PRESETS[0];
      const esriLayer = L.tileLayer(esriPreset.url, {
        maxZoom: 19,
        maxNativeZoom: 18,
        keepBuffer: 8,
        updateWhenIdle: false,
        updateInterval: 100,
        crossOrigin: true,
        attribution: esriPreset.attribution,
      });

      esriLayer.addTo(map);
      tileLayerRef.current = esriLayer;

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate sizes after render
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 700);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render Markers for all Global & Regional Hubs
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const activeBounds = [];

    ALL_WORLD_HUBS.forEach((hub) => {
      const count = hubCounts[hub.id] || 0;
      const isSelected = selectedHubId === hub.id;
      const members = membersByHub[hub.id] || [];

      if (count > 0) {
        activeBounds.push([hub.lat, hub.lng]);

        // Region-based styling palette:
        let strokeColor = '#0d9488';
        let fillColor = '#0d9488';
        let badgeBg = 'linear-gradient(135deg, #0d9488, #059669)';

        if (hub.regionId === 'europe') {
          strokeColor = '#2563eb';
          fillColor = '#3b82f6';
          badgeBg = 'linear-gradient(135deg, #1d4ed8, #3b82f6)';
        } else if (hub.regionId === 'middle_east') {
          strokeColor = '#d97706';
          fillColor = '#f59e0b';
          badgeBg = 'linear-gradient(135deg, #d97706, #f59e0b)';
        } else if (hub.regionId === 'americas') {
          strokeColor = '#7c3aed';
          fillColor = '#8b5cf6';
          badgeBg = 'linear-gradient(135deg, #6d28d9, #8b5cf6)';
        } else if (hub.regionId === 'asia') {
          strokeColor = '#e11d48';
          fillColor = '#f43f5e';
          badgeBg = 'linear-gradient(135deg, #be123c, #f43f5e)';
        } else if (count >= 10) {
          strokeColor = '#ea580c';
          fillColor = '#f97316';
          badgeBg = 'linear-gradient(135deg, #ea580c, #f97316)';
        }

        const radiusMeters = Math.min(65000, 15000 + Math.sqrt(count) * 12000);

        // 1. Semi-transparent outer heat bubble
        const outerCircle = L.circle([hub.lat, hub.lng], {
          color: strokeColor,
          fillColor: fillColor,
          fillOpacity: isSelected ? 0.5 : 0.25,
          weight: isSelected ? 3.5 : 1.5,
          radius: radiusMeters,
        });

        // 2. Center badge marker with count & country flag
        const bubbleHtml = `
          <div style="
            min-width: 34px;
            height: 34px;
            padding: 0 6px;
            border-radius: 17px;
            background: ${isSelected ? '#1c1917' : badgeBg};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            font-family: 'Outfit', system-ui, sans-serif;
            font-weight: 900;
            font-size: 12px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            border: 2px solid #ffffff;
            cursor: pointer;
            transform: translate(-50%, -50%);
            transition: transform 0.2s;
          ">
            <span style="font-size: 11px;">${hub.flag}</span>
            <span>${count}</span>
          </div>
        `;

        const centerMarker = L.marker([hub.lat, hub.lng], {
          icon: L.divIcon({
            className: 'custom-bubble-pin',
            html: bubbleHtml,
            iconSize: [34, 34],
          }),
        });

        // 3. Rich interactive Leaflet popup
        const memberListHtml = members
          .slice(0, 4)
          .map(
            (m) => `
            <div style="padding: 6px 0; border-bottom: 1px solid #f5f5f4;">
              <div style="font-weight: 800; font-size: 12px; color: #1c1917;">${m.name}</div>
              <div style="font-size: 11px; color: #ea580c; font-weight: 600;">${m.role || 'Member'}</div>
              <div style="font-size: 10.5px; color: #78716c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">
                ${m.business || ''}
              </div>
            </div>
          `
          )
          .join('');

        const moreText =
          members.length > 4
            ? `<div style="font-size: 10px; color: #ea580c; font-weight: 700; text-align: center; padding-top: 4px;">+ ${members.length - 4} more founders</div>`
            : '';

        const popupContent = `
          <div style="font-family: 'Outfit', system-ui, sans-serif; min-width: 230px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 6px; margin-bottom: 6px;">
              <div>
                <div style="font-size: 14px; font-weight: 900; color: #1c1917;">${hub.flag} ${hub.name}</div>
                <div style="font-size: 10.5px; color: #78716c; font-weight: 600;">${hub.country} · ${hub.regionName}</div>
              </div>
              <span style="background: #ea580c; color: #ffffff; padding: 2px 7px; border-radius: 8px; font-weight: 900; font-size: 11px;">
                ${count} ${count === 1 ? 'Founder' : 'Founders'}
              </span>
            </div>
            <div style="max-height: 180px; overflow-y: auto;">
              ${memberListHtml}
              ${moreText}
            </div>
          </div>
        `;

        centerMarker.bindPopup(popupContent, { maxWidth: 280, className: 'custom-hub-popup' });

        const handleHubClick = () => {
          onSelectHub?.(hub.id);
          map.flyTo([hub.lat, hub.lng], 9, { animate: true, duration: 1 });
        };

        outerCircle.on('click', handleHubClick);
        centerMarker.on('click', handleHubClick);

        markersGroup.addLayer(outerCircle);
        markersGroup.addLayer(centerMarker);
      }
    });

    // Auto-fit initial view if no specific coords focused
    if (!focusedCoords && activeBounds.length > 1 && !selectedHubId) {
      try {
        const bounds = L.latLngBounds(activeBounds);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      } catch {
        // ignore
      }
    }
  }, [hubCounts, selectedHubId, membersByHub]);

  // 3. Smooth Pan & Zoom when a founder is clicked anywhere in the world
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusedCoords) return;

    map.flyTo([focusedCoords.lat, focusedCoords.lng], 10, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [focusedCoords]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  };

  return (
    <div
      className={`relative w-full transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-stone-950 p-4' : 'h-[320px] sm:h-[440px] lg:h-[520px] rounded-2xl'
      }`}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner bg-stone-100 dark:bg-stone-900"
      />

      {/* Floating Controls Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md text-stone-700 dark:text-stone-300 hover:text-orange-600 border border-stone-200/80 dark:border-stone-700 font-bold transition-all cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* Mobile Scroll-Trap Prevention Badge */}
      {!isFullscreen && (
        <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]">
          {interactiveMode ? (
            <button
              onClick={() => setInteractiveMode(false)}
              className="px-3 py-1.5 rounded-full bg-emerald-700/90 text-white backdrop-blur-md shadow-lg text-[11px] font-bold border border-white/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <span>🔒</span>
              <span>Lock map to scroll page</span>
            </button>
          ) : (
            <button
              onClick={() => setInteractiveMode(true)}
              className="px-3 py-1.5 rounded-full bg-stone-900/85 text-white backdrop-blur-md shadow-lg text-[11px] font-bold border border-white/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <span>🖐️</span>
              <span>Tap to explore map</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
