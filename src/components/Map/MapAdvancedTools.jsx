import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { message } from 'antd';
import { CloudUploadOutlined, DeleteOutlined, CaretUpOutlined, CaretDownOutlined, FileTextOutlined } from '@ant-design/icons';
import { createPortal } from 'react-dom';
import ReactDOM from 'react-dom/client';
import FeaturePopup from './FeaturePopup';

// 15 warna berbeda yang kontras dan mudah dibedakan
const LAYER_COLORS = [
  '#e74c3c', // Merah
  '#2ecc71', // Hijau
  '#3498db', // Biru
  '#f39c12', // Oranye
  '#9b59b6', // Ungu
  '#1abc9c', // Teal
  '#e67e22', // Coklat Oranye
  '#e91e63', // Pink
  '#00bcd4', // Cyan
  '#8bc34a', // Lime
  '#ff5722', // Deep Orange
  '#607d8b', // Blue Grey
  '#795548', // Brown
  '#ffc107', // Amber
  '#673ab7', // Deep Purple
];

const MAX_FILES = 15;

const MapAdvancedTools = ({ setPopupInfo }) => {
  const map = useMap();
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]); // { id, name, color, layer }
  const fileIdCounter = useRef(0);

  // Cleanup semua layer saat unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(f => {
        if (f.layer && map && map.hasLayer(f.layer)) {
          try { map.removeLayer(f.layer); } catch(e) { /* ignore */ }
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const parseFile = async (file) => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
      const text = await file.text();
      return JSON.parse(text);
    }

    if (fileName.endsWith('.zip')) {
      const shpModule = await import('shpjs');
      const shpFn = shpModule.default || shpModule;
      const buffer = await file.arrayBuffer();
      return await shpFn(buffer);
    }

    if (fileName.endsWith('.kml')) {
      const { kml: kmlParser } = await import('@tmcw/togeojson');
      const { DOMParser } = await import('@xmldom/xmldom');
      const text = await file.text();
      const doc = new DOMParser().parseFromString(text, 'text/xml');
      return kmlParser(doc);
    }

    if (fileName.endsWith('.shp')) {
      throw new Error('File .shp individual tidak didukung. Kompres semua file shapeset (.shp, .dbf, .shx, .prj) ke .zip terlebih dahulu.');
    }

    throw new Error('Format tidak didukung. Gunakan .geojson, .zip (SHP), atau .kml');
  };

  const createPopupContent = (properties) => {
    // Buat container div dan render React FeaturePopup ke dalamnya
    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    root.render(<FeaturePopup properties={properties} />);
    return container;
  };

  const handleFileUpload = async (event) => {
    const files = event.target?.files;
    if (!files || files.length === 0) return;

    // Cek batas max
    const currentCount = uploadedFiles.length;
    const remainingSlots = MAX_FILES - currentCount;
    if (remainingSlots <= 0) {
      message.warning(`Maksimal ${MAX_FILES} file. Hapus salah satu terlebih dahulu.`);
      if (event.target) event.target.value = '';
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const colorIndex = (currentCount + filesToProcess.indexOf(file)) % LAYER_COLORS.length;
      const color = LAYER_COLORS[colorIndex];
      const hideLoading = message.loading(`Memproses: ${file.name}...`, 0);

      try {
        const geojsonData = await parseFile(file);
        if (!geojsonData) throw new Error('Data kosong.');

        // Gabungkan array (SHP bisa return array)
        let finalData = geojsonData;
        if (Array.isArray(geojsonData)) {
          const allFeatures = [];
          geojsonData.forEach(fc => {
            if (fc && fc.features) allFeatures.push(...fc.features);
          });
          finalData = { type: 'FeatureCollection', features: allFeatures };
        }

        if (finalData.type === 'FeatureCollection' && (!finalData.features || finalData.features.length === 0)) {
          throw new Error('File tidak mengandung fitur spasial.');
        }

        // Buat layer
        const newLayer = L.geoJSON(finalData, {
          style: (feature) => {
            const isPolygon = feature.geometry?.type?.includes('Polygon');
            return {
              color: isPolygon ? '#000000' : color,
              weight: isPolygon ? 1.5 : 3,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.3
            };
          },
          pointToLayer: (feature, latlng) => {
            const svgIcon = L.divIcon({
              className: 'custom-color-marker hide-on-print-bg bg-transparent border-none',
              html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="28" height="28" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(1px 2px 2px rgba(0,0,0,0.4)); margin-top:-28px; margin-left:-14px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
              popupAnchor: [0, -28]
            });
            return L.marker(latlng, { icon: svgIcon });
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties && Object.keys(feature.properties).length > 0) {
              // Gunakan click handler yang sama seperti sistem utama (setPopupInfo)
              layer.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                if (setPopupInfo) {
                  setPopupInfo({
                    position: e.latlng,
                    properties: feature.properties
                  });
                } else {
                  // Fallback: render popup langsung jika setPopupInfo tidak tersedia
                  const popupEl = createPopupContent(feature.properties);
                  layer.bindPopup(popupEl, { maxWidth: 350, maxHeight: 300 }).openPopup();
                }
              });
            }
          }
        });

        newLayer.addTo(map);

        // Fit bounds
        try {
          const bounds = newLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          }
        } catch (e) { /* ignore bounds error */ }

        const fileId = ++fileIdCounter.current;
        setUploadedFiles(prev => [...prev, {
          id: fileId,
          name: file.name,
          color: color,
          layer: newLayer,
          featureCount: newLayer.getLayers().length
        }]);

        hideLoading();
        message.success(`"${file.name}" dimuat (${newLayer.getLayers().length} fitur)`);
        
        // Pastikan map kembali bisa di-drag setelah proses selesai
        if (map?.dragging) map.dragging.enable();
        if (map?.scrollWheelZoom) map.scrollWheelZoom.enable();

      } catch (error) {
        console.error('[MapAdvancedTools] Error:', error);
        hideLoading();
        message.error(`Gagal "${file.name}": ${error.message}`);
      }
    }

    if (event.target) event.target.value = '';
  };

  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.layer && map && map.hasLayer(file.layer)) {
        map.removeLayer(file.layer);
      }
      return prev.filter(f => f.id !== fileId);
    });
    message.success('Layer dihapus dari peta');
  }, [map]);

  const removeAllFiles = useCallback(() => {
    setUploadedFiles(prev => {
      prev.forEach(f => {
        if (f.layer && map && map.hasLayer(f.layer)) {
          map.removeLayer(f.layer);
        }
      });
      return [];
    });
    message.success('Semua layer lokal dihapus');
  }, [map]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hitung jumlah sisa slot
  const remainingSlots = MAX_FILES - uploadedFiles.length;

  const node = (
    <div 
      className="hide-on-print" 
      data-html2canvas-ignore="true"
      style={{ bottom: isMobile ? 65 : 16, left: isMobile ? 8 : 240, position: 'fixed', zIndex: 1200, pointerEvents: 'auto' }}
    >
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 transition-all duration-300" 
        style={{ width: isMobile ? 280 : 320 }}
        onMouseEnter={() => { if(map?.dragging) map.dragging.disable(); if(map?.scrollWheelZoom) map.scrollWheelZoom.disable(); }}
        onMouseLeave={() => { if(map?.dragging) map.dragging.enable(); if(map?.scrollWheelZoom) map.scrollWheelZoom.enable(); }}
      >
        {/* Header / Toggle */}
        <div 
          className="bg-blue-50 px-4 py-3 flex justify-between items-center cursor-pointer border-b border-blue-100 hover:bg-blue-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <CloudUploadOutlined className="text-blue-600 text-lg" />
            <h3 className="font-semibold text-blue-800 m-0 text-sm">Upload Spasial Lokal</h3>
            {uploadedFiles.length > 0 && (
              <span className="bg-blue-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none font-bold">
                {uploadedFiles.length}
              </span>
            )}
          </div>
          {isExpanded ? <CaretDownOutlined className="text-blue-500" /> : <CaretUpOutlined className="text-blue-500" />}
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
            <p className="text-xs text-gray-500 m-0">
              Upload SHP (.zip), KML, atau GeoJSON untuk pratinjau. Data tidak disimpan ke server.
            </p>

            {/* Drop Zone */}
            {remainingSlots > 0 && (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('spatial-file-upload-input').click()}
              >
                <input 
                  type="file" 
                  id="spatial-file-upload-input" 
                  style={{ display: 'none' }}
                  accept=".geojson,.json,.zip,.kml" 
                  onChange={handleFileUpload}
                  multiple
                />
                <CloudUploadOutlined className="text-2xl text-gray-400 mb-1" />
                <p className="text-sm text-gray-600 text-center m-0">
                  <span className="text-blue-600 font-medium">Klik</span> atau seret file ke sini
                </p>
                <p className="text-[10px] text-gray-400 mt-1 text-center m-0">
                  .zip (SHP) · .kml · .geojson · Sisa slot: {remainingSlots}/{MAX_FILES}
                </p>
              </div>
            )}

            {remainingSlots <= 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-center">
                Batas maksimal {MAX_FILES} file tercapai. Hapus file untuk menambah yang baru.
              </div>
            )}

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">File Aktif</span>
                  {uploadedFiles.length > 1 && (
                    <button 
                      onClick={removeAllFiles}
                      className="text-[10px] text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer underline"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>
                {uploadedFiles.map(f => (
                  <div key={f.id} className="bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 flex items-center gap-2">
                    {/* Color dot */}
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm" 
                      style={{ backgroundColor: f.color }}
                    />
                    <div className="flex-1 overflow-hidden min-w-0">
                      <span className="text-xs text-gray-700 truncate block" title={f.name}>
                        {f.name}
                      </span>
                      <span className="text-[10px] text-gray-400">{f.featureCount} fitur</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                      className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer flex-shrink-0 p-0.5"
                      title="Hapus layer ini"
                    >
                      <DeleteOutlined style={{ fontSize: 12 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
};

export default MapAdvancedTools;
