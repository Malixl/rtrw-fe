import { useEffect, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/**
 * CoordinateControl - Custom Leaflet control that shows mouse cursor coordinates and scale
 * Displays Lat/Lon values and scale bar horizontally at bottom center
 */
const CoordinateControl = () => {
  const map = useMap();
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [controlContainer, setControlContainer] = useState(null);

  // Listen for mouse move events on the map
  useMapEvents({
    mousemove: (e) => {
      setCoordinates({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    }
  });

  useEffect(() => {
    // Create custom control at bottom center
    const CoordinateControlClass = L.Control.extend({
      options: {
        position: 'bottomleft'
      },

      onAdd: function () {
        // Main wrapper - positioned at bottom center
        const wrapper = L.DomUtil.create('div', 'coordinate-scale-wrapper');
        wrapper.style.cssText = `
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 1000;
        `;

        // Coordinate container
        const coordContainer = L.DomUtil.create('div', 'coordinate-control', wrapper);
        coordContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 13px;
          font-family: monospace;
          border-radius: 4px;
          backdrop-filter: blur(4px);
        `;

        // Green dot
        const dot = L.DomUtil.create('span', '', coordContainer);
        dot.style.cssText = `
          width: 8px;
          height: 8px;
          background-color: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 6px #4ade80;
        `;

        const latSpan = L.DomUtil.create('span', 'lat-value', coordContainer);
        latSpan.innerHTML = 'Lat: 0.00000';

        const lngSpan = L.DomUtil.create('span', 'lng-value', coordContainer);
        lngSpan.innerHTML = 'Lon: 0.00000';

        // Scale container
        const scaleContainer = L.DomUtil.create('div', 'scale-control', wrapper);
        scaleContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background-color: rgba(255, 255, 255, 0.9);
          color: #333;
          font-size: 12px;
          font-family: sans-serif;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        `;

        const scaleBar = L.DomUtil.create('div', 'scale-bar', scaleContainer);
        scaleBar.style.cssText = `
          width: 60px;
          height: 6px;
          background: linear-gradient(to right, #333 50%, #fff 50%);
          border: 1px solid #333;
        `;

        const scaleText = L.DomUtil.create('span', 'scale-text', scaleContainer);
        scaleText.innerHTML = '0 km';

        // Prevent map interactions
        L.DomEvent.disableClickPropagation(wrapper);
        L.DomEvent.disableScrollPropagation(wrapper);

        return wrapper;
      }
    });

    const control = new CoordinateControlClass();
    map.addControl(control);

    // Store reference
    setControlContainer(control.getContainer());

    // Update scale on zoom
    const updateScale = () => {
      const container = control.getContainer();
      if (!container) return;

      const scaleText = container.querySelector('.scale-text');
      if (!scaleText) return;

      // Calculate scale based on zoom level and latitude
      const zoom = map.getZoom();
      const lat = map.getCenter().lat;
      const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
      const scaleWidthMeters = metersPerPixel * 60; // 60px width

      let scaleLabel;
      if (scaleWidthMeters >= 1000) {
        scaleLabel = `${(scaleWidthMeters / 1000).toFixed(1)} km`;
      } else {
        scaleLabel = `${Math.round(scaleWidthMeters)} m`;
      }
      scaleText.textContent = scaleLabel;
    };

    map.on('zoomend', updateScale);
    map.on('moveend', updateScale);
    updateScale();

    // Cleanup
    return () => {
      map.off('zoomend', updateScale);
      map.off('moveend', updateScale);
      map.removeControl(control);
    };
  }, [map]);

  // Update coordinate display
  useEffect(() => {
    if (controlContainer) {
      const latSpan = controlContainer.querySelector('.lat-value');
      const lngSpan = controlContainer.querySelector('.lng-value');

      if (latSpan && lngSpan) {
        latSpan.textContent = `Lat: ${coordinates.lat.toFixed(5)}`;
        lngSpan.textContent = `Lon: ${coordinates.lng.toFixed(5)}`;
      }
    }
  }, [coordinates, controlContainer]);

  return null;
};

export default CoordinateControl;
