import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { message } from 'antd';

/**
 * MapToolsControl - Custom Leaflet control with various map tools
 * Positioned at topleft, below zoom and other controls
 */
const MapToolsControl = () => {
  const map = useMap();
  const drawnItemsRef = useRef(null);
  const currentDrawRef = useRef(null);
  const controlRef = useRef(null);
  const containerRef = useRef(null); // reference to the control container DOM
  const [isReady, setIsReady] = useState(false);

  // Wait for map to be ready
  useEffect(() => {
    if (map && map.getContainer()) {
      setIsReady(true);
    }
  }, [map]);

  useEffect(() => {
    if (!isReady || !map) return;
    // Initialize drawn items layer
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup();
      map.addLayer(drawnItemsRef.current);
    }

    // Create custom control
    const MapToolsClass = L.Control.extend({
      options: {
        position: 'topright'
      },

      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control map-tools-control');
        // store container ref so we can toggle position when fullscreen changes
        containerRef.current = container;
        container.style.cssText = `
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
        `;

        // Tool definitions
        const tools = [
          { id: 'fullscreen', icon: 'fullscreen', title: 'Layar Penuh' },
          { id: 'screenshot', icon: 'screenshot', title: 'Screenshot Peta' },
          { id: 'location', icon: 'location', title: 'Lokasi Saya' },
          { id: 'target', icon: 'target', title: 'Cari di Peta' },
          { id: 'search', icon: 'search', title: 'Zoom ke Pencarian' },
          { id: 'fitbounds', icon: 'fitbounds', title: 'Zoom ke Semua Layer' },
          { id: 'divider1', type: 'divider' },
          { id: 'polyline', icon: 'polyline', title: 'Gambar Garis' },
          { id: 'polygon', icon: 'polygon', title: 'Gambar Polygon' },
          { id: 'rectangle', icon: 'rectangle', title: 'Gambar Kotak' },
          { id: 'marker', icon: 'marker', title: 'Tambah Marker' },
          { id: 'divider2', type: 'divider' },
          { id: 'edit', icon: 'edit', title: 'Edit Gambar' },
          { id: 'delete', icon: 'delete', title: 'Hapus Gambar' }
        ];

        // SVG Icons
        const icons = {
          fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
          screenshot: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
          location: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/></svg>`,
          target: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
          search: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6m-3-3h6"/></svg>`,
          fitbounds: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`,
          polyline: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20L8 12L14 16L20 4"/></svg>`,
          polygon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z"/></svg>`,
          rectangle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
          marker: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
          edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
          delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`
        };

        tools.forEach((tool) => {
          if (tool.type === 'divider') {
            const divider = L.DomUtil.create('div', '', container);
            divider.style.cssText = `
              height: 1px;
              background-color: #ddd;
              margin: 2px 4px;
            `;
            return;
          }

          const button = L.DomUtil.create('a', 'map-tool-btn', container);
          button.href = '#';
          button.title = tool.title;
          button.setAttribute('data-tool', tool.id);
          button.innerHTML = icons[tool.icon];
          button.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            color: #333;
            text-decoration: none;
            cursor: pointer;
            border-bottom: 1px solid #ddd;
          `;

          button.onmouseover = function () {
            this.style.backgroundColor = '#f4f4f4';
          };
          button.onmouseout = function () {
            if (!this.classList.contains('active')) {
              this.style.backgroundColor = 'white';
            }
          };

          L.DomEvent.on(button, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            handleToolClick(tool.id, button, container);
          });
        });

        // Remove last border
        const lastBtn = container.querySelector('.map-tool-btn:last-child');
        if (lastBtn) lastBtn.style.borderBottom = 'none';

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      }
    });

    // Tool click handler
    const handleToolClick = (toolId, button, container) => {
      // Remove active state from all buttons
      const clearActive = () => {
        container.querySelectorAll('.map-tool-btn').forEach((btn) => {
          btn.classList.remove('active');
          btn.style.backgroundColor = 'white';
        });
      };

      switch (toolId) {
        case 'fullscreen':
          toggleFullscreen();
          break;
        case 'screenshot':
          takeScreenshot();
          break;
        case 'location':
          goToMyLocation();
          break;
        case 'target':
          enableClickLocation();
          break;
        case 'search':
          searchLocation();
          break;
        case 'fitbounds':
          fitToAllLayers();
          break;
        case 'polyline':
        case 'polygon':
        case 'rectangle':
        case 'marker':
          clearActive();
          button.classList.add('active');
          button.style.backgroundColor = '#e3f2fd';
          startDrawing(toolId);
          break;
        case 'edit':
          message.info('Klik pada gambar untuk mengedit');
          break;
        case 'delete':
          clearDrawings();
          break;
        default:
          break;
      }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
      const elem = map.getContainer();
      if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(() => {
          message.error('Gagal masuk mode fullscreen');
        });
      } else {
        document.exitFullscreen();
      }
    };

    // Take screenshot
    const takeScreenshot = async () => {
      message.loading('Mengambil screenshot...', 1);
      try {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(map.getContainer(), {
          useCORS: true,
          allowTaint: true
        });
        const link = document.createElement('a');
        link.download = `peta-rtrw-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        message.success('Screenshot berhasil disimpan!');
      } catch (err) {
        message.error('Gagal mengambil screenshot. Pastikan html2canvas terinstall.');
        console.error(err);
      }
    };

    // Go to user location
    const goToMyLocation = () => {
      message.loading('Mencari lokasi Anda...', 2);
      map.locate({ setView: true, maxZoom: 16 });
      map.once('locationfound', (e) => {
        L.marker(e.latlng).addTo(drawnItemsRef.current).bindPopup('Lokasi Anda').openPopup();
        message.success('Lokasi ditemukan!');
      });
      map.once('locationerror', () => {
        message.error('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
      });
    };

    // Enable click to get location
    const enableClickLocation = () => {
      message.info('Klik pada peta untuk mendapatkan koordinat');
      map.once('click', (e) => {
        const { lat, lng } = e.latlng;
        L.popup()
          .setLatLng(e.latlng)
          .setContent(`<b>Koordinat:</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`)
          .openOn(map);
      });
    };

    // Search location
    const searchLocation = () => {
      const query = prompt('Masukkan nama lokasi atau koordinat (lat, lng):');
      if (!query) return;

      // Check if it's coordinates
      const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        map.setView([lat, lng], 15);
        L.marker([lat, lng]).addTo(drawnItemsRef.current).bindPopup(`Lokasi: ${lat}, ${lng}`).openPopup();
        return;
      }

      // Search using Nominatim
      message.loading('Mencari lokasi...', 2);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            const { lat, lon, display_name } = data[0];
            map.setView([parseFloat(lat), parseFloat(lon)], 15);
            L.marker([parseFloat(lat), parseFloat(lon)])
              .addTo(drawnItemsRef.current)
              .bindPopup(display_name)
              .openPopup();
            message.success('Lokasi ditemukan!');
          } else {
            message.warning('Lokasi tidak ditemukan');
          }
        })
        .catch(() => {
          message.error('Gagal mencari lokasi');
        });
    };

    // Fit to all layers
    const fitToAllLayers = () => {
      const bounds = L.latLngBounds([]);
      map.eachLayer((layer) => {
        if (layer.getBounds) {
          bounds.extend(layer.getBounds());
        } else if (layer.getLatLng) {
          bounds.extend(layer.getLatLng());
        }
      });
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      } else {
        message.info('Tidak ada layer untuk di-zoom');
      }
    };

    // Start drawing
    const startDrawing = (mode) => {
      // Cancel any existing draw
      if (currentDrawRef.current) {
        currentDrawRef.current.disable();
      }

      message.info(`Mode gambar ${mode} aktif. Klik pada peta untuk mulai.`);

      let drawHandler;
      const drawOptions = {
        shapeOptions: {
          color: '#3388ff',
          weight: 3,
          fillOpacity: 0.3
        }
      };

      switch (mode) {
        case 'polyline':
          drawHandler = new L.Draw.Polyline(map, drawOptions);
          break;
        case 'polygon':
          drawHandler = new L.Draw.Polygon(map, drawOptions);
          break;
        case 'rectangle':
          drawHandler = new L.Draw.Rectangle(map, drawOptions);
          break;
        case 'marker':
          drawHandler = new L.Draw.Marker(map, {});
          break;
        default:
          return;
      }

      drawHandler.enable();
      currentDrawRef.current = drawHandler;
    };

    // Clear all drawings
    const clearDrawings = () => {
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
        message.success('Semua gambar dihapus');
      }
    };

    // Listen for draw created
    const onDrawCreated = (e) => {
      const layer = e.layer;
      drawnItemsRef.current.addLayer(layer);

      // Show area/length info
      if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const areaStr = area > 10000 ? `${(area / 10000).toFixed(2)} ha` : `${area.toFixed(2)} m²`;
        layer.bindPopup(`Luas: ${areaStr}`).openPopup();
      } else if (e.layerType === 'polyline') {
        let length = 0;
        const latlngs = layer.getLatLngs();
        for (let i = 0; i < latlngs.length - 1; i++) {
          length += latlngs[i].distanceTo(latlngs[i + 1]);
        }
        const lengthStr = length > 1000 ? `${(length / 1000).toFixed(2)} km` : `${length.toFixed(2)} m`;
        layer.bindPopup(`Panjang: ${lengthStr}`).openPopup();
      }
    };

    map.on(L.Draw.Event.CREATED, onDrawCreated);

    const control = new MapToolsClass();
    controlRef.current = control;
    map.addControl(control);

    // Toggle position when fullscreen changes
    const onFullscreenChange = () => {
      try {
        const fsElem = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        const isFs = fsElem === map.getContainer();
        const cont = containerRef.current;
        if (!cont) return;
        if (isFs) {
          // move to left in fullscreen
          cont.style.left = '10px';
          cont.style.right = 'auto';
          cont.style.boxShadow = '0 1px 8px rgba(0,0,0,0.6)';
        } else {
          // restore to default (right side handled by Leaflet container placement)
          cont.style.left = '';
          cont.style.right = '';
          cont.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        }
      } catch {
        // ignore
      }
    };

    // listen for various vendor events too
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // call once to ensure correct placement if already fullscreen
    onFullscreenChange();

    // Cleanup
    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, [map, isReady]);

  return null;
};

export default MapToolsControl;
