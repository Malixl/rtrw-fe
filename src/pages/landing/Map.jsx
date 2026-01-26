/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useAuth, useNotification, useService, useGeoJSONWorker } from '@/hooks';
import { BatasAdministrasiService, LayerGroupsService } from '@/services';
import { BASE_URL } from '@/utils/api';
import asset from '@/utils/asset';
import { fetchGeoJSON, batchFetchGeoJSON } from '@/utils/fetchGeoJSON';

import { LockOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Result, Tooltip } from 'antd';
import React, { useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Popup, LayersControl, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import FeaturePopup from '@/components/Map/FeaturePopup';
import HomeControl from '@/components/Map/HomeControl';
import CoordinateControl from '@/components/Map/CoordinateControl';
import MapToolsControl from '@/components/Map/MapToolsControl';
import { fetchMarkerImage } from '@/utils/fetchMarkerImage';
import MapSidebar from '@/components/Map/MapSidebar';
import MapUserInfo from '@/components/Map/MapUserInfo';
import MapLoader from '@/components/Map/MapLoader';
import BatchLoadingOverlay from '@/components/Map/BatchLoadingOverlay';

const OptimizedLayerRenderer = React.memo(
  ({ selectedLayers, setPopupInfo, getFeatureStyle, layerOpacities, isDrawing }) => {
    const map = useMap();
    const layersRef = React.useRef({});
    const isMovingRef = React.useRef(false);
    const moveTimeoutRef = React.useRef(null);
    const rafRef = React.useRef(null);

    // Create a single Canvas renderer instance - CRITICAL for performance
    // Lower padding = less area to render = faster
    const canvasRenderer = React.useMemo(
      () =>
        L.canvas({
          padding: 0.25, // REDUCED: Less area to render = faster performance
          tolerance: 3 // Smaller hit area = less overhead
        }),
      []
    );

    // ========================================================================
    // PERFORMANCE: Disable interactivity during pan/zoom (NO HIDING!)
    // ========================================================================
    // Google Maps approach: Keep layers ALWAYS visible, just disable clicks
    // This eliminates the "disappearing layer" problem completely
    // ========================================================================
    React.useEffect(() => {
      if (!map) return;

      const setLayersInteractive = (interactive) => {
        Object.values(layersRef.current).forEach((layer) => {
          if (layer && layer.eachLayer) {
            layer.eachLayer((l) => {
              if (l.options) {
                l.options.interactive = interactive;
              }
            });
          }
        });
      };

      const handleMoveStart = () => {
        if (moveTimeoutRef.current) {
          clearTimeout(moveTimeoutRef.current);
          moveTimeoutRef.current = null;
        }
        if (!isMovingRef.current) {
          isMovingRef.current = true;
          // Only disable interactivity - NEVER hide layers
          setLayersInteractive(false);
        }
      };

      const handleMoveEnd = () => {
        if (moveTimeoutRef.current) {
          clearTimeout(moveTimeoutRef.current);
        }
        // Short debounce for rapid pan/zoom
        moveTimeoutRef.current = setTimeout(() => {
          isMovingRef.current = false;
          // Re-enable interactivity
          setLayersInteractive(true);
        }, 50); // 50ms - very fast response
      };

      // Listen to movement events
      map.on('movestart', handleMoveStart);
      map.on('zoomstart', handleMoveStart);
      map.on('moveend', handleMoveEnd);
      map.on('zoomend', handleMoveEnd);

      return () => {
        map.off('movestart', handleMoveStart);
        map.off('zoomstart', handleMoveStart);
        map.off('moveend', handleMoveEnd);
        map.off('zoomend', handleMoveEnd);
        if (moveTimeoutRef.current) {
          clearTimeout(moveTimeoutRef.current);
        }
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }, [map]);

    // Memoize the layer keys to detect changes
    const layerKeys = React.useMemo(() => Object.keys(selectedLayers).sort().join(','), [selectedLayers]);

    // Memoize opacity keys untuk detect perubahan opacity
    const opacityKeys = React.useMemo(
      () =>
        Object.entries(layerOpacities || {})
          .map(([k, v]) => `${k}:${v}`)
          .join(','),
      [layerOpacities]
    );

    // Effect untuk update opacity pada layer yang sudah ada (REAL-TIME)
    React.useEffect(() => {
      if (!map || !layerOpacities) return;

      // Fungsi untuk apply opacity ke semua layer
      const applyOpacity = () => {
        Object.entries(layersRef.current).forEach(([key, layerGroup]) => {
          const opacity = (layerOpacities[key] ?? 80) / 100;
          if (layerGroup && layerGroup.eachLayer) {
            layerGroup.eachLayer((layer) => {
              // Untuk polygon/polyline - gunakan setStyle
              if (layer.setStyle) {
                layer.setStyle({
                  fillOpacity: opacity * 0.8,
                  opacity: opacity
                });
              }
              // Untuk marker (point) - gunakan CSS opacity pada icon element
              if (layer._icon) {
                layer._icon.style.opacity = opacity;
              }
              // Untuk marker dengan shadow
              if (layer._shadow) {
                layer._shadow.style.opacity = opacity;
              }
            });
          }
        });
      };

      // Apply dengan requestAnimationFrame untuk memastikan DOM sudah ready
      const rafId = requestAnimationFrame(() => {
        applyOpacity();
        // Apply lagi setelah delay kecil untuk marker yang baru di-render
        setTimeout(applyOpacity, 100);
      });

      return () => cancelAnimationFrame(rafId);
    }, [map, opacityKeys, layerOpacities]);

    // Effect untuk update interaktivitas layer saat drawing active
    // Saat drawing: Matikan interaksi layer agar tidak mengganggu draw handler
    React.useEffect(() => {
      Object.values(layersRef.current).forEach((layer) => {
        if (layer && layer.eachLayer) {
          layer.eachLayer((l) => {
            if (l.options) {
              // Jika drawing aktif = interactive FALSE
              // Jika drawing mati = interactive TRUE (default)
              l.options.interactive = !isDrawing;
            }
          });
        }
      });
    }, [isDrawing, map]);

    React.useEffect(() => {
      if (!map) return;

      const currentLayerKeys = new Set(Object.keys(selectedLayers));
      const existingLayerKeys = new Set(Object.keys(layersRef.current));

      // Remove layers that are no longer selected
      existingLayerKeys.forEach((key) => {
        if (!currentLayerKeys.has(key)) {
          const layerGroup = layersRef.current[key];
          if (layerGroup) {
            map.removeLayer(layerGroup);
            delete layersRef.current[key];
          }
        }
      });

      // Add new layers
      currentLayerKeys.forEach(async (key) => {
        if (!existingLayerKeys.has(key)) {
          const layer = selectedLayers[key];
          if (!layer?.data) return;

          // Get opacity for this layer (default 80%)
          const layerOpacity = (layerOpacities?.[key] ?? 80) / 100;

          // PRE-LOADING IMAGES: Solusi untuk masalah "gambar load satu per satu" dan "gambar rusak"
          // Kita scan semua URL icon di fitur, download semuanya (paralel) jadi Blob, baru render layer.
          const uniqueIcons = new Set();
          if (layer.data.features) {
            layer.data.features.forEach(f => {
              // Pastikan properti icon_image_url ada
              if (f.properties && f.properties.icon_image_url) {
                uniqueIcons.add(f.properties.icon_image_url);
              }
            });
          }

          // Object map: Original URL -> Blob URL
          const iconBlobMap = {};
          
          if (uniqueIcons.size > 0) {
            // Fetch semua icon secara paralel
            await Promise.all(Array.from(uniqueIcons).map(async (url) => {
              try {
                // fetchMarkerImage otomatis handle caching & headers (ngrok bypass)
                const blobUrl = await fetchMarkerImage(url);
                iconBlobMap[url] = blobUrl;
              } catch (err) {
                console.error("Failed to preload icon:", url, err);
                // Jika gagal, biarkan pakai URL asli (fallback)
                iconBlobMap[url] = url;
              }
            }));
          }

          const geoJsonLayer = L.geoJSON(layer.data, {
            // Use Canvas renderer for vector layers (THE KEY OPTIMIZATION)
            renderer: canvasRenderer,
            // PERFORMANCE: Aggressively simplify geometry during render
            smoothFactor: 3, // Higher = more simplified = faster render

            // Style function with dynamic opacity
            style: (feature) => {
              const props = feature.properties || {};
              let style = getFeatureStyle(feature);
              if (layer.type === 'struktur' && props['stroke-width']) {
                style = { ...style, weight: props['stroke-width'] };
              }
              // Apply layer opacity
              return {
                ...style,
                fillOpacity: layerOpacity * (style.fillOpacity || 0.8),
                opacity: layerOpacity
              };
            },

            // Point rendering (markers) - with opacity support
            pointToLayer: (feature, latlng) => {
              const props = feature.properties || {};
              let marker;
              
              if (props.icon_image_url) {
                // GUNAKAN BLOB URL HASIL PRE-LOAD
                // Ini kunci agar gambar tidak 'pop-in' satu per satu dan tidak 'rusak' kena block
                const secureUrl = iconBlobMap[props.icon_image_url] || props.icon_image_url;

                const icon = L.icon({
                  iconUrl: secureUrl,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                  className: `custom-marker-image layer-marker-${key}`
                });
                marker = L.marker(latlng, { icon });
              } else {
                marker = L.marker(latlng);
              }

              // Simpan layer key di marker untuk referensi
              marker._layerKey = key;

              // Set opacity pada marker setelah ditambahkan ke map
              marker.on('add', () => {
                const currentOpacity = (layerOpacities?.[key] ?? 80) / 100;
                if (marker._icon) {
                  marker._icon.style.opacity = currentOpacity;
                }
                if (marker._shadow) {
                  marker._shadow.style.opacity = currentOpacity;
                }
              });
              return marker;
            },

            // Event handlers
            onEachFeature: (feature, layerGeo) => {
              const props = feature.properties || {};

              // Click event for popup - only when not moving
              layerGeo.on('click', (e) => {
                if (isMovingRef.current) return; // Ignore clicks during movement
                L.DomEvent.stopPropagation(e);
                setPopupInfo({
                  position: e.latlng,
                  properties: props
                });
              });

              // Special handling for batas_administrasi labels
              if (layer.type === 'batas_administrasi') {
                const geomType = feature.geometry.type;
                const isArea = geomType === 'Polygon' || geomType === 'MultiPolygon';
                const featureIndex = layer.data.features.findIndex((f) => JSON.stringify(f) === JSON.stringify(feature));
                const keterangan = props.KETERANGAN || props.keterangan || '';
                const isPulau = keterangan && keterangan.toLowerCase().includes('pulau');

                if (isArea && featureIndex === 0 && !isPulau) {
                  const layerName = layer.meta?.nama || 'Wilayah';
                  layerGeo.once('add', () => {
                    layerGeo.bindTooltip(layerName, {
                      permanent: true,
                      direction: 'center',
                      className: 'batas-label',
                      interactive: false
                    });
                  });
                } else if (isArea && isPulau) {
                  layerGeo.once('add', () => {
                    layerGeo.bindTooltip(keterangan, {
                      permanent: true,
                      direction: 'center',
                      className: 'pulau-label',
                      interactive: false
                    });
                  });
                }
              }
            },

            // Additional performance options
            bubblingMouseEvents: false,
            interactive: true
          });

          geoJsonLayer.addTo(map);
          layersRef.current[key] = geoJsonLayer;
        }
      });
    }, [map, layerKeys, selectedLayers, canvasRenderer, getFeatureStyle, setPopupInfo, layerOpacities]);

    // Cleanup on unmount - separate effect
    React.useEffect(() => {
      const currentLayersRef = layersRef.current;
      return () => {
        Object.values(currentLayersRef).forEach((layer) => {
          if (map && map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        });
      };
    }, [map]);

    return null;
  },
  (prevProps, nextProps) => {
    // Custom memo comparison - re-render if selectedLayers or layerOpacities change
    return prevProps.selectedLayers === nextProps.selectedLayers && prevProps.layerOpacities === nextProps.layerOpacities;
  }
);

OptimizedLayerRenderer.displayName = 'OptimizedLayerRenderer';

const { BaseLayer } = LayersControl;

const Maps = () => {
  const navigate = useNavigate();
  const { canAccessMap, capabilities, isLoading: authLoading } = useAuth();
  const { processGeoJSON: workerProcessGeoJSON } = useGeoJSONWorker();
  const { execute: fetchBatas, data: batasData, isLoading: isLoadingBatas, isSuccess: isBatasSuccess, message: batasMessage } = useService(BatasAdministrasiService.getAll);
  const [selectedLayers, setSelectedLayers] = React.useState({});
  const [loadingLayers, setLoadingLayers] = React.useState({});
  const [popupInfo, setPopupInfo] = React.useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = React.useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);

  const [layerGroupTrees, setLayerGroupTrees] = React.useState([]);

  // State untuk mengontrol visibilitas Loader
  const [showLoader, setShowLoader] = React.useState(true);

  // ============================================================================
  // LAYER OPACITY STATE - Untuk mengatur transparansi tiap layer
  // ============================================================================
  // Key: layer key (e.g., "pola-1", "batas-5")
  // Value: opacity percentage (10-100, default 80)
  const [layerOpacities, setLayerOpacities] = React.useState({});

  // Handler untuk mengubah opacity layer
  const handleOpacityChange = React.useCallback((layerKey, opacity) => {
    setLayerOpacities((prev) => ({
      ...prev,
      [layerKey]: opacity
    }));
  }, []);

  // ============================================================================
  // LAYER DATA CACHE - Prevents re-fetching when toggling layers on/off
  // ============================================================================
  // Smart client-side cache for instant re-rendering (<1 second)
  // Once data is fetched, it's stored here forever (until page refresh)
  // Key: layer key (e.g., "pola-1", "batas-5")
  // Value: { data: enhancedGeoJSON, meta: pemetaan }
  // Using object instead of Map for faster access
  const layerCache = React.useRef({});

  // Track if initial batas administrasi has been loaded to prevent race conditions
  const batasInitializedRef = React.useRef(false);

  // AbortController untuk cancel request yang tidak perlu
  const abortControllerRef = React.useRef(null);

  // State untuk batch loading overlay
  const [batchLoading, setBatchLoading] = React.useState({
    isVisible: false,
    current: 0,
    total: 0,
    isEnabling: true
  });

  // Handle window resize for responsive
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
      // Auto collapse sidebar on mobile
      if (width < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasMapAccess = canAccessMap();
  const showBlurMap = capabilities?.show_blur_map ?? !hasMapAccess;
  const loginMessage = capabilities?.login_message || 'Silakan login untuk melihat peta interaktif';

  React.useEffect(() => {
    if (hasMapAccess) {
      fetchBatas({ page: 1, per_page: 100000 });
    }
  }, [fetchBatas, hasMapAccess]);

  React.useEffect(() => {
    if (!isLoadingBatas && !isBatasSuccess && batasMessage) {
      console.error('Gagal memuat Batas Administrasi:', batasMessage);
    }
  }, [isLoadingBatas, isBatasSuccess, batasMessage]);

  const batasAdministrasi = React.useMemo(() => batasData ?? [], [batasData]);

  /**
   * Batch toggle layers - untuk Select All / Deselect All
   * With caching support for instant re-enable
   * OPTIMIZED: Menggunakan concurrent fetch dan Web Worker
   * @param {Array} layers - array of pemetaan objects
   * @param {boolean} enable - true = aktifkan semua, false = matikan semua
   */
  const handleBatchToggleLayers = async (layers, enable) => {
    if (enable) {
      // Cancel previous request jika ada
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Separate cached vs uncached layers
      const cachedLayers = [];
      const uncachedLayers = [];

      layers.forEach((l) => {
        if (selectedLayers[l.key]) return; // Already selected, skip
        const cached = layerCache.current[l.key];
        if (cached) {
          cachedLayers.push({ ...l, cachedData: cached });
        } else {
          uncachedLayers.push(l);
        }
      });

      // Instantly add cached layers (no loading needed) - INSTANT!
      if (cachedLayers.length > 0) {
        setSelectedLayers((prev) => {
          const updated = { ...prev };
          cachedLayers.forEach((l) => {
            updated[l.key] = {
              id: l.id,
              type: l.type,
              data: l.cachedData.data,
              meta: l.cachedData.meta
            };
          });
          return updated;
        });
      }

      // If nothing to fetch, we're done
      if (uncachedLayers.length === 0) return;

      // Show batch loading overlay only for uncached layers
      setBatchLoading({
        isVisible: true,
        current: 0,
        total: uncachedLayers.length,
        isEnabling: true
      });

      // Set loading state untuk layers yang perlu fetch
      setLoadingLayers((prev) => {
        const updated = { ...prev };
        uncachedLayers.forEach((l) => (updated[l.key] = true));
        return updated;
      });

      // Build URL list untuk batch fetch
      const fetchItems = uncachedLayers.map((pemetaan) => {
        const { key, id, type } = pemetaan;
        let url = '';
        if (type === 'pola') url = `${BASE_URL}/polaruang/${id}/geojson`;
        else if (type === 'struktur') url = `${BASE_URL}/struktur_ruang/${id}/geojson`;
        else if (type === 'ketentuan_khusus') url = `${BASE_URL}/ketentuan_khusus/${id}/geojson`;
        else if (type === 'pkkprl') url = `${BASE_URL}/pkkprl/${id}/geojson`;
        else if (type === 'data_spasial') url = `${BASE_URL}/data_spasial/${id}/geojson`;
        else if (type === 'batas_administrasi') url = `${BASE_URL}/batas_administrasi/${id}/geojson`;
        return { url, key, pemetaan };
      });

      // OPTIMIZED: Fetch dengan concurrency control (4 parallel requests)
      const fetchResults = await batchFetchGeoJSON(
        fetchItems.map((item) => ({ url: item.url, key: item.key })),
        {
          concurrency: 4,
          signal: abortControllerRef.current.signal,
          onProgress: (current, total) => {
            setBatchLoading((prev) => ({ ...prev, current }));
          }
        }
      );

      // OPTIMIZED: Parallel Processing using Promise.all
      // Kirim semua layer ke worker sekaligus, jangan antri (Serial)
      // Ini mempercepat loading data awal secara signifikan
      const processingProps = fetchResults.map(async (result) => {
        if (result.status !== 'fulfilled') return null;

        const item = fetchItems.find((f) => f.key === result.key);
        if (!item) return null;

        const { pemetaan } = item;
        const json = result.data;

        const warna = pemetaan.warna ?? null;
        const iconImageUrl = asset(pemetaan.icon_titik) ?? null;
        const tipe_garis = pemetaan.tipe_garis ?? null;
        const fillOpacity = pemetaan.fill_opacity ?? 0.8;

        try {
          // Process di Web Worker (non-blocking)
          // Karena pakai map + Promise.all, ini dikirim ke worker secara paralel
          const enhanced = await workerProcessGeoJSON(json, {
            warna,
            iconImageUrl,
            tipe_garis,
            fillOpacity,
            simplifyTolerance: 0.001 // Optimized tolerance
          });

          // Save to cache
          layerCache.current[pemetaan.key] = { data: enhanced, meta: pemetaan };

          return {
            key: pemetaan.key,
            id: pemetaan.id,
            type: pemetaan.type,
            data: enhanced,
            meta: pemetaan,
            status: 'fulfilled'
          };
        } catch (error) {
          console.error(`Failed to process layer ${pemetaan.key}:`, error);
          return null;
        }
      });

      // Tunggu semua proses selesai
      const results = await Promise.all(processingProps);
      const processedResults = results.filter(Boolean);

      // Update state sekali untuk semua hasil (accumulative)
      setSelectedLayers((prev) => {
        const updated = { ...prev };
        processedResults.forEach((result) => {
          updated[result.key] = {
            id: result.id,
            type: result.type,
            data: result.data,
            meta: result.meta
          };
        });
        return updated;
      });

      // Clear loading state
      setLoadingLayers((prev) => {
        const updated = { ...prev };
        uncachedLayers.forEach((l) => (updated[l.key] = false));
        return updated;
      });

      // Hide overlay with slight delay
      setTimeout(() => {
        setBatchLoading({
          isVisible: false,
          current: 0,
          total: 0,
          isEnabling: true
        });
      }, 300);
    } else {
      // Matikan semua layers yang aktif - sekali update (keep in cache)
      const keysToDisable = layers.filter((l) => selectedLayers[l.key]).map((l) => l.key);
      if (keysToDisable.length === 0) return;

      // Show overlay for disabling
      setBatchLoading({
        isVisible: true,
        current: keysToDisable.length,
        total: keysToDisable.length,
        isEnabling: false
      });

      // Remove from selected but keep in cache for instant re-enable
      setSelectedLayers((prev) => {
        const updated = { ...prev };
        keysToDisable.forEach((key) => delete updated[key]);
        return updated;
      });

      // Hide overlay immediately for disable (it's fast)
      setTimeout(() => {
        setBatchLoading({
          isVisible: false,
          current: 0,
          total: 0,
          isEnabling: true
        });
      }, 300);
    }
  };

  // ============================================================================
  // HANDLE TOGGLE LAYER - With Caching for instant re-enable
  // OPTIMIZED: Menggunakan fetchGeoJSON dan Web Worker
  // ============================================================================
  const handleToggleLayer = async (pemetaan) => {
    const key = pemetaan.key;
    const id = pemetaan.id;
    const type = pemetaan.type;

    // TOGGLE OFF: Remove from map (but keep in cache for instant re-enable)
    if (selectedLayers[key]) {
      setSelectedLayers((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      return;
    }

    // CHECK CACHE FIRST - Instant render if already fetched before
    const cached = layerCache.current[key];
    if (cached) {
      // Data is in cache - NO loading spinner, instant render!
      setSelectedLayers((prev) => ({
        ...prev,
        [key]: { id, type, data: cached.data, meta: cached.meta }
      }));
      return;
    }

    // NOT IN CACHE - Need to fetch from API
    setLoadingLayers((prev) => ({ ...prev, [key]: true }));

    try {
      let url = '';
      if (type === 'pola') url = `${BASE_URL}/polaruang/${id}/geojson`;
      else if (type === 'struktur') url = `${BASE_URL}/struktur_ruang/${id}/geojson`;
      else if (type === 'ketentuan_khusus') url = `${BASE_URL}/ketentuan_khusus/${id}/geojson`;
      else if (type === 'pkkprl') url = `${BASE_URL}/pkkprl/${id}/geojson`;
      else if (type === 'data_spasial') url = `${BASE_URL}/data_spasial/${id}/geojson`;
      else if (type === 'batas_administrasi') url = `${BASE_URL}/batas_administrasi/${id}/geojson`;

      // OPTIMIZED: Gunakan fetchGeoJSON dengan streaming untuk progressive loading
      // Streaming memungkinkan render fitur sambil download (tidak perlu tunggu selesai)
      let featuresLoaded = 0;
      const json = await fetchGeoJSON(url, {
        useStreaming: true,
        onFeature: (feature, count) => {
          featuresLoaded = count;
          // Progressive update setiap 10 fitur untuk performa
          // (tidak perlu update UI setiap fitur karena akan lambat)
        },
        onProgress: (loaded) => {
          // Optional: bisa tampilkan progress di UI
          // console.log(`Loading ${key}: ${loaded} features...`);
        }
      });

      const warna = pemetaan.warna ?? null;
      const iconImageUrl = asset(pemetaan.icon_titik) ?? null;
      const tipe_garis = pemetaan.tipe_garis ?? null;
      const fillOpacity = pemetaan.fill_opacity ?? 0.8;

      // OPTIMIZED: Process di Web Worker (non-blocking UI thread)
      const enhanced = await workerProcessGeoJSON(json, {
        warna,
        iconImageUrl,
        tipe_garis,
        fillOpacity,
        simplifyTolerance: 0.0015 // INCREASED: More aggressive simplification for speed (approx 150m precision)
      });

      // SAVE TO CACHE for future instant re-enable
      layerCache.current[key] = { data: enhanced, meta: pemetaan };

      // ADD TO SELECTED LAYERS (accumulative - uses functional update)
      setSelectedLayers((prev) => ({
        ...prev,
        [key]: { id, type, data: enhanced, meta: pemetaan }
      }));
    } catch (e) {
      console.error('Gagal mengambil GeoJSON:', e);
    } finally {
      setLoadingLayers((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ============================================================================
  // INITIAL BATAS ADMINISTRASI LOADING - DISABLED
  // ============================================================================
  // DISABLED: Auto-load causes loading stuck at 90% when using Localtunnel
  // User can manually check the layers they need from sidebar
  // Re-enable this when backend is stable (Cloudflare/Production server)
  React.useEffect(() => {
    // DISABLED - Skip auto-load to prevent stuck loading
    return;
    
    // Guard: only run once when data is available
    if (batasInitializedRef.current || batasAdministrasi.length === 0) return;
    batasInitializedRef.current = true;

    const loadAllBatasAdministrasi = async () => {
      // Build pemetaan list for all batas administrasi
      const pemetaanList = batasAdministrasi.map((item) => ({
        key: `batas-${item.id}`,
        id: item.id,
        type: 'batas_administrasi',
        nama: item.name || item.nama,
        warna: item.color || item.warna || '#000000',
        tipe_geometri: item.geometry_type || item.tipe_geometri || 'polyline',
        tipe_garis: item.line_type || item.tipe_garis || 'solid',
        fill_opacity: 0.3
      }));

      // Set loading state for all at once
      setLoadingLayers((prev) => {
        const updated = { ...prev };
        pemetaanList.forEach((p) => (updated[p.key] = true));
        return updated;
      });

      // Build fetch items
      const fetchItems = pemetaanList.map((pemetaan) => ({
        url: `${BASE_URL}/batas_administrasi/${pemetaan.id}/geojson`,
        key: pemetaan.key,
        pemetaan
      }));

      // OPTIMIZED: Batch fetch dengan concurrency control
      const fetchResults = await batchFetchGeoJSON(
        fetchItems.map((item) => ({ url: item.url, key: item.key })),
        { concurrency: 4 }
      );

      // Process results
      const processedResults = [];

      for (const result of fetchResults) {
        if (result.status !== 'fulfilled') continue;

        const item = fetchItems.find((f) => f.key === result.key);
        if (!item) continue;

        const { pemetaan } = item;

        // Check cache first
        const cached = layerCache.current[pemetaan.key];
        if (cached) {
          processedResults.push({
            key: pemetaan.key,
            id: pemetaan.id,
            type: pemetaan.type,
            data: cached.data,
            meta: cached.meta,
            status: 'fulfilled'
          });
          continue;
        }

        const json = result.data;
        const warna = pemetaan.warna ?? '#000000';
        const tipe_garis = pemetaan.tipe_garis ?? 'solid';
        const fillOpacity = pemetaan.fill_opacity ?? 0.3;

        try {
          // OPTIMIZED: Process di Web Worker
          const enhanced = await workerProcessGeoJSON(json, {
            warna,
            tipe_garis,
            fillOpacity,
            simplifyTolerance: 0.0015 // INCREASED: More aggressive simplification for speed (approx 150m precision)
          });

          // Store in cache
          layerCache.current[pemetaan.key] = { data: enhanced, meta: pemetaan };

          processedResults.push({
            key: pemetaan.key,
            id: pemetaan.id,
            type: pemetaan.type,
            data: enhanced,
            meta: pemetaan,
            status: 'fulfilled'
          });
        } catch (error) {
          console.error(`Failed to process batas ${pemetaan.key}:`, error);
        }
      }

      // SINGLE STATE UPDATE with ALL results - prevents race conditions
      setSelectedLayers((prev) => {
        const updated = { ...prev };
        processedResults.forEach((result) => {
          updated[result.key] = {
            id: result.id,
            type: result.type,
            data: result.data,
            meta: result.meta
          };
        });
        return updated;
      });

      // Clear all loading states at once
      setLoadingLayers((prev) => {
        const updated = { ...prev };
        pemetaanList.forEach((p) => (updated[p.key] = false));
        return updated;
      });
    };

    loadAllBatasAdministrasi();
  }, [batasAdministrasi, workerProcessGeoJSON]);

  const mapPolaRuang = React.useCallback((data) => {
    return data.map((klasifikasi) => ({
      title: klasifikasi.nama,
      key: `pola-root-${klasifikasi.id}`,
      ...klasifikasi,
      children: (klasifikasi.pola_ruang || []).map((pola) => ({
        ...pola,
        type: 'pola',
        title: pola.nama,
        key: `pola-${pola.id}`,
        geojson_file: asset(pola.geojson_file),
        isLeaf: true
      }))
    }));
  }, []);

  const mapStrukturRuang = React.useCallback((data) => {
    return data.map((klasifikasi) => ({
      title: klasifikasi.nama,
      key: `struktur-root-${klasifikasi.id}`,
      ...klasifikasi,
      children: (klasifikasi.struktur_ruang || []).map((struktur) => ({
        ...struktur,
        type: 'struktur',
        title: struktur.nama,
        key: `struktur-${struktur.id}`,
        geojson_file: asset(struktur.geojson_file),
        isLeaf: true
      }))
    }));
  }, []);

  const mapKetentuanKhusus = React.useCallback((data) => {
    return data.map((klasifikasi) => ({
      title: klasifikasi.nama,
      key: `ketentuan_khusus-root-${klasifikasi.id}`,
      ...klasifikasi,
      children: (klasifikasi.ketentuan_khusus || []).map((ketentuan_khusus) => ({
        ...ketentuan_khusus,
        type: 'ketentuan_khusus',
        title: ketentuan_khusus.nama,
        key: `ketentuan_khusus-${ketentuan_khusus.id}`,
        geojson_file: asset(ketentuan_khusus.geojson_file),
        isLeaf: true
      }))
    }));
  }, []);

  const mapPkkprl = React.useCallback((data) => {
    return data.map((klasifikasi) => ({
      title: klasifikasi.nama,
      key: `pkkprl-root-${klasifikasi.id}`,
      ...klasifikasi,
      children: (klasifikasi.pkkprl || []).map((pkkprl) => ({
        ...pkkprl,
        type: 'pkkprl',
        title: pkkprl.nama,
        key: `pkkprl-${pkkprl.id}`,
        geojson_file: asset(pkkprl.geojson_file),
        isLeaf: true
      }))
    }));
  }, []);

  const mapIndikasiProgram = React.useCallback((data) => {
    return data.map((klasifikasi) => ({
      title: klasifikasi.nama,
      key: `indikasi_program-root-${klasifikasi.id}`,
      ...klasifikasi,
      children: (klasifikasi.indikasi_program || []).map((indikasi_program) => ({
        ...indikasi_program,
        type: 'indikasi_program',
        title: indikasi_program.nama,
        key: `indikasi_program-${indikasi_program.id}`,
        isLeaf: true
      }))
    }));
  }, []);

  const mapDataSpasial = React.useCallback((data) => {
    return data.map((klasifikasi) => ({
      title: klasifikasi.nama,
      key: `data_spasial-root-${klasifikasi.id}`,
      ...klasifikasi,
      children: (klasifikasi.data_spasial || []).map((data_spasial) => ({
        ...data_spasial,
        type: 'data_spasial',
        title: data_spasial.nama,
        key: `data_spasial-${data_spasial.id}`,
        geojson_file: asset(data_spasial.geojson_file),
        isLeaf: true
      }))
    }));
  }, []);

  const mapBatasAdministrasi = React.useCallback((data) => {
    return data.map((klasifikasi) => ({
      title: klasifikasi.nama,
      key: `batas-root-${klasifikasi.id}`,
      ...klasifikasi,
      children: (klasifikasi.batas_administrasi || []).map((batas) => ({
        ...batas,
        type: 'batas_administrasi',
        title: batas.nama,
        key: `batas-${batas.id}`,
        geojson_file: asset(batas.geojson_file),
        isLeaf: true
      }))
    }));
  }, []);

  // Use stable execute function reference to avoid re-creating the callback when hook data changes
  const { execute, ...getAllLayerGroups } = useService(LayerGroupsService.layerGroupWithKlasifikasi);

  // Definisikan kondisi data sudah siap atau belum
  // Cek juga apakah batas administrasi sudah ter-load ke selectedLayers
  const batasKeysInSelected = React.useMemo(() => {
    return Object.keys(selectedLayers).filter((key) => key.startsWith('batas-')).length;
  }, [selectedLayers]);

  const isDataReady = React.useMemo(() => {
    const apiReady = !authLoading && !getAllLayerGroups.isLoading && !isLoadingBatas;
    const batasDataExists = batasAdministrasi.length > 0;
    const batasLayersLoaded = batasKeysInSelected === batasAdministrasi.length;
    const noLoadingLayers = Object.values(loadingLayers).every((loading) => !loading);

    return apiReady && batasDataExists && batasLayersLoaded && noLoadingLayers;
  }, [authLoading, getAllLayerGroups.isLoading, isLoadingBatas, batasAdministrasi.length, batasKeysInSelected, loadingLayers]);

  const fetchLayerGroups = React.useCallback(() => {
    execute({ page: 1, per_page: 9999 });
  }, [execute]);

  React.useEffect(() => {
    fetchLayerGroups();
  }, [fetchLayerGroups]);

  const layerGroupData = React.useMemo(() => getAllLayerGroups.data ?? [], [getAllLayerGroups.data]);

  React.useEffect(() => {
    if (layerGroupData) {
      const result = layerGroupData.map((group) => {
        const klasifikasis = group.klasifikasis || {};

        const pola_ruang_list = klasifikasis.klasifikasi_pola_ruang ?? [];
        const struktur_ruang_list = klasifikasis.klasifikasi_struktur_ruang ?? [];
        const ketentuan_khusus_list = klasifikasis.klasifikasi_ketentuan_khusus ?? [];
        const pkkprl_list = klasifikasis.klasifikasi_pkkprl ?? [];
        const data_spasial = klasifikasis.klasifikasi_data_spasial ?? [];
        const indikasi_program_list = klasifikasis.klasifikasi_indikasi_program ?? [];
        // For backwards compatibility if backend stores batas_administrasi under data_spasial
        const batas_list = klasifikasis.klasifikasi_batas_administrasi ?? klasifikasis.klasifikasi_data_spasial ?? [];

        // Build tree structure with Virtual Folder Grouping
        const treeStructure = {};

        // KELOMPOK A: DIBUNGKUS FOLDER (Virtual Folder)
        // 1. Pola Ruang - Virtual Folder
        if (pola_ruang_list.length > 0) {
          treeStructure.pola = [
            {
              title: 'Pola Ruang',
              key: `virtual-pola-${group.id}`,
              selectable: false,
              children: mapPolaRuang(pola_ruang_list)
            }
          ];
        } else {
          treeStructure.pola = [];
        }

        // 2. Struktur Ruang - Virtual Folder
        if (struktur_ruang_list.length > 0) {
          treeStructure.struktur = [
            {
              title: 'Struktur Ruang',
              key: `virtual-struktur-${group.id}`,
              selectable: false,
              children: mapStrukturRuang(struktur_ruang_list)
            }
          ];
        } else {
          treeStructure.struktur = [];
        }

        // 3. Ketentuan Khusus - Virtual Folder
        if (ketentuan_khusus_list.length > 0) {
          treeStructure.ketentuan = [
            {
              title: 'Data Khusus',
              key: `virtual-ketentuan-${group.id}`,
              selectable: false,
              children: mapKetentuanKhusus(ketentuan_khusus_list)
            }
          ];
        } else {
          treeStructure.ketentuan = [];
        }

        // 4. PKKPRL - Virtual Folder
        if (pkkprl_list.length > 0) {
          treeStructure.pkkprl = [
            {
              title: 'PKKPRL',
              key: `virtual-pkkprl-${group.id}`,
              selectable: false,
              children: mapPkkprl(pkkprl_list)
            }
          ];
        } else {
          treeStructure.pkkprl = [];
        }

        // KELOMPOK B: TETAP FLAT (Tanpa Folder)
        // 5. Batas Administrasi - FLAT (tidak dibungkus folder)
        treeStructure.batas = mapBatasAdministrasi(batas_list);

        // 6. Data Spasial - FLAT (tidak dibungkus folder)
        treeStructure.data_spasial = mapDataSpasial(data_spasial);

        // 7. Indikasi Program - FLAT (tidak dibungkus folder)
        treeStructure.indikasi = mapIndikasiProgram(indikasi_program_list);

        return {
          id: group.id,
          // Normalize server keys to make UI mapping explicit and robust
          layer_group_name: group.layer_group_name ?? group.nama_layer_group,
          nama: group.layer_group_name ?? group.nama_layer_group,
          name: group.layer_group_name ?? group.nama_layer_group,
          deskripsi: group.deskripsi,
          urutan: group.urutan_tampil,

          // ✅ NEW: Tree structure with Virtual Folder Grouping (Separation of Concerns)
          tree: treeStructure
        };
      });

      if (typeof window !== 'undefined' && window.__DEBUG_MAPLAYERS__) console.debug('Mapped layer groups:', result);
      setLayerGroupTrees(result);
    }
  }, [layerGroupData, mapDataSpasial, mapIndikasiProgram, mapKetentuanKhusus, mapPkkprl, mapPolaRuang, mapStrukturRuang, mapBatasAdministrasi]);

  // Cleanup selectedLayers: remove layers that no longer exist in tree
  React.useEffect(() => {
    if (layerGroupTrees.length === 0 && batasAdministrasi.length === 0) return;

    // Collect all valid keys from tree and batas
    const validKeys = new Set();

    // Add keys from batasAdministrasi
    batasAdministrasi.forEach((item) => {
      validKeys.add(`batas-${item.id}`);
    });

    // Add keys from layerGroupTrees
    const extractKeys = (nodes) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach((node) => {
        if (node.key) validKeys.add(node.key);
        if (node.children) extractKeys(node.children);
      });
    };

    layerGroupTrees.forEach((group) => {
      const tree = group.tree || {};
      extractKeys(tree.pola || []);
      extractKeys(tree.struktur || []);
      extractKeys(tree.ketentuan || []);
      extractKeys(tree.pkkprl || []);
      extractKeys(tree.batas || []);
      extractKeys(tree.data_spasial || []);
      extractKeys(tree.indikasi || []);
    });

    // Check if any selected layer is no longer valid
    setSelectedLayers((prev) => {
      const selectedKeys = Object.keys(prev);
      const orphanedKeys = selectedKeys.filter((key) => !validKeys.has(key));

      if (orphanedKeys.length > 0) {
        console.info('🧹 Cleaning up orphaned layers:', orphanedKeys);
        const updated = { ...prev };
        orphanedKeys.forEach((key) => delete updated[key]);
        return updated;
      }

      return prev; // No changes
    });
  }, [layerGroupTrees, batasAdministrasi]);

  const getFeatureStyle = useCallback((feature) => {
    const props = feature.properties || {};

    const stroke = props.stroke || '#0000ff';
    const weight = props['stroke-width'] ?? 3;
    const opacity = props['stroke-opacity'] ?? 1;
    const fillColor = props.fill;
    const fillOpacity = props['fill-opacity'] ?? 0.8;
    const dashArray = props.dashArray || props['stroke-dasharray'] || null;

    const style = {
      color: stroke,
      weight,
      opacity,
      fillColor,
      fillOpacity
    };

    if (dashArray) style.dashArray = dashArray;

    return style;
  }, []);

  // Show access denied overlay for users without map access
  if (!hasMapAccess && !authLoading) {
    return (
      <section className="relative flex h-screen w-full">
        {/* Blurred Map Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={showBlurMap ? 'pointer-events-none blur-sm grayscale' : ''}>
            <MapContainer center={[0.5412, 123.0595]} zoom={9} minZoom={4} className="h-screen w-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </MapContainer>
          </div>
        </div>

        {/* Overlay with Login Prompt */}
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-xl bg-white p-8 shadow-2xl">
            <Result
              icon={<LockOutlined className="text-6xl text-blue-500" />}
              title="Akses Terbatas"
              subTitle={loginMessage}
              extra={
                <div className="flex flex-col gap-3">
                  <Button key="login" type="primary" size="large" onClick={() => navigate('/auth/login?redirect=/map')}>
                    Login Sekarang
                  </Button>
                  <Button key="home" size="large" onClick={() => navigate('/')}>
                    Kembali ke Beranda
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* === KOMPONEN LOADER BARU === */}
      {/* AnimatePresence memastikan animasi exit (menghilang) berjalan dulu sebelum dihapus dari DOM */}
      <AnimatePresence>{showLoader && <MapLoader isLoaded={isDataReady} onFinished={() => setShowLoader(false)} />}</AnimatePresence>

      {/* === BATCH LOADING OVERLAY === */}
      <BatchLoadingOverlay isVisible={batchLoading.isVisible} current={batchLoading.current} total={batchLoading.total} isEnabling={batchLoading.isEnabling} />

      {/* Dynamic styles for map controls based on sidebar state and screen size */}
      <style>
        {`
          /* Desktop styles */
          @media (min-width: 1024px) {
            .leaflet-top.leaflet-right {
              right: ${isSidebarCollapsed ? '10px' : '410px'};
              transition: right 0.3s ease-in-out;
            }
            .map-tools-control {
              margin-top: 0 !important;
            }
          }
          
          /* Tablet styles */
          @media (min-width: 768px) and (max-width: 1023px) {
            .leaflet-top.leaflet-right {
              right: ${isSidebarCollapsed ? '10px' : '320px'};
              transition: right 0.3s ease-in-out;
            }
            .map-tools-control {
              margin-top: 0 !important;
            }
          }
          
          /* Mobile styles */
          @media (max-width: 767px) {
            .leaflet-top.leaflet-right {
              right: 10px;
              top: 10px;
            }
            .leaflet-control-zoom {
              display: none;
            }
            .map-tools-control {
              transform: scale(0.9);
              margin-top: 70px !important;
            }
            .leaflet-bottom.leaflet-left,
            .leaflet-bottom.leaflet-right {
              bottom: 60px !important;
            }
          }

          /* === LABEL KHUSUS UNTUK BATAS ADMINISTRASI SAJA === */
          .batas-label {
            /* HAPUS BACKGROUND */
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            
            /* STYLE TEKS SAJA */
            font-weight: 700 !important;
            font-size: 13px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #000000 !important;
            
            /* STROKE/TEKS BORDER PUTIH */
            text-shadow: 
              1px 1px 0 #FFFFFF,
              -1px 1px 0 #FFFFFF,
              1px -1px 0 #FFFFFF,
              -1px -1px 0 #FFFFFF,
              0px 1px 0 #FFFFFF,
              0px -1px 0 #FFFFFF,
              1px 0px 0 #FFFFFF,
              -1px 0px 0 #FFFFFF !important;
            
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
          }

          /* === LABEL UNTUK PULAU-PULAU KECIL === */
          .pulau-label {
            /* HAPUS BACKGROUND */
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            
            /* STYLE TEKS LEBIH KECIL */
            font-weight: 600 !important;
            font-size: 10px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #000000 !important;
            
            /* STROKE/TEKS BORDER PUTIH */
            text-shadow: 
              1px 1px 0 #FFFFFF,
              -1px 1px 0 #FFFFFF,
              1px -1px 0 #FFFFFF,
              -1px -1px 0 #FFFFFF,
              0px 1px 0 #FFFFFF,
              0px -1px 0 #FFFFFF,
              1px 0px 0 #FFFFFF,
              -1px 0px 0 #FFFFFF !important;
            
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
          }

          /* ================================================================
             PERFORMANCE: Hide labels and reduce rendering during pan/zoom
             ================================================================ */
          .map-moving .batas-label,
          .map-moving .pulau-label {
            display: none !important;
          }

          /* Disable pointer events on all layers during movement */
          .map-moving .leaflet-interactive {
            pointer-events: none !important;
          }

          /* GPU acceleration for all panes */
          .leaflet-overlay-pane,
          .leaflet-marker-pane,
          .leaflet-canvas-container {
            will-change: auto;
            transform: translateZ(0);
            backface-visibility: hidden;
          }

          /* Hide all vector layers during movement */
          .map-moving .leaflet-overlay-pane {
            visibility: hidden !important;
          }

          /* Hide popups during movement */
          .map-moving .leaflet-popup {
            display: none !important;
          }

          /* Optimize tile layer */
          .leaflet-tile-container {
            will-change: transform;
            transform: translateZ(0);
          }

          /* Smooth transition when movement ends */
          .batas-label,
          .pulau-label {
            transition: opacity 0.15s ease-out;
          }

          /* Overlay pane transition */
          .leaflet-overlay-pane {
            transition: opacity 0.15s ease-out;
          }

          /* === MARKER OPACITY TRANSITION === */
          .leaflet-marker-icon,
          .leaflet-marker-shadow,
          .custom-marker-image {
            transition: opacity 0.15s ease-out !important;
          }

          /* Marker pane transition */
          .leaflet-marker-pane {
            transition: opacity 0.15s ease-out;
          }
        `}
      </style>

      {/* Mobile Floating Button to Open Sidebar */}
      {isMobile && isSidebarCollapsed && (
        <Button type="primary" icon={<MenuUnfoldOutlined />} onClick={() => setIsSidebarCollapsed(false)} className="absolute right-4 top-4 z-[1001] h-12 w-12 rounded-full shadow-xl transition-transform hover:scale-110" size="large" />
      )}

      {/* Floating user info (always mounted as portal) */}
      <MapUserInfo />

      {/* Map Container - Full Width */}
      <div className="h-full w-full">
        <MapContainer
          center={[0.6999, 122.4467]}
          zoom={9}
          minZoom={9}
          maxZoom={18}
          maxBounds={[
            [-1.5, 120.0], // Southwest - Diperluas agar aman di layar besar
            [2.5, 125.0] // Northeast
          ]}
          maxBoundsViscosity={1.0}
          className="h-screen w-full"
          // ============================================================
          // PERFORMANCE OPTIMIZATIONS FOR SMOOTH PAN/ZOOM
          // ============================================================
          // preferCanvas: Use Canvas renderer for ALL vector layers
          preferCanvas={true}
          // Disable zoom animation for faster response
          zoomAnimation={false}
          // Disable fade animation (causes repaint)
          fadeAnimation={false}
          // Disable marker animation during zoom (reduces CPU)
          markerZoomAnimation={false}
          // Don't update layers while zooming (major performance boost)
          updateWhenZooming={false}
          // Only update when map is idle
          updateWhenIdle={true}
          // Smoother scroll wheel zoom (higher = slower/smoother)
          wheelPxPerZoomLevel={80}
          // Fractional zoom for smoother zoom steps
          zoomSnap={0.25}
          zoomDelta={0.5}
          // Disable bounce at edges for snappier feel
          bounceAtZoomLimits={false}
          // Faster zoom animation
          zoomAnimationThreshold={4}
          // SMOOTH INERTIA: Higher values = smoother pan experience
          inertia={true}
          inertiaDeceleration={2000}
          inertiaMaxSpeed={2500}
          easeLinearity={0.25}
          // Disable world copies (reduces rendering overhead)
          worldCopyJump={false}
        >
          {/* Custom Home Control - positioned at topleft */}
          <HomeControl />

          {/* Map Tools Control - drawing, screenshot, etc */}
          <MapToolsControl />

          {/* Coordinate and Scale display - bottom center */}
          <CoordinateControl />

          {/* Base Layer Control - next to zoom buttons (topright) */}
          <LayersControl position="topleft">
            <BaseLayer checked name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                // Tile loading optimizations
                updateWhenZooming={false}
                updateWhenIdle={true}
                keepBuffer={4}
                maxNativeZoom={19}
              />
            </BaseLayer>
            <BaseLayer name="Satelit (Esri)">
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                updateWhenZooming={false}
                updateWhenIdle={true}
                keepBuffer={4}
                maxNativeZoom={18}
              />
            </BaseLayer>
            <BaseLayer name="Terrain">
              <TileLayer
                attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                updateWhenZooming={false}
                updateWhenIdle={true}
                keepBuffer={4}
                maxNativeZoom={17}
              />
            </BaseLayer>
          </LayersControl>

          {/* ================================================================
              PERFORMANCE OPTIMIZED LAYER RENDERING
              ================================================================
              Using Canvas renderer instead of SVG for all vector layers.
              This dramatically improves performance by:
              - Drawing all geometries on a single <canvas> element
              - Reducing DOM nodes from thousands to just one
              - Achieving smooth 60FPS panning and zooming
              - Supporting dynamic opacity per layer
              ================================================================ */}
          <OptimizedLayerRenderer selectedLayers={selectedLayers} setPopupInfo={setPopupInfo} getFeatureStyle={getFeatureStyle} layerOpacities={layerOpacities} />

          {popupInfo && (
            <Popup position={popupInfo.position} onClose={() => setPopupInfo(null)}>
              <FeaturePopup properties={popupInfo.properties} />
            </Popup>
          )}
        </MapContainer>
        <div
          className="absolute top-4 z-[1002] -translate-x-1/2 transition-all duration-300"
          style={{
            left: isSidebarCollapsed ? '50%' : isMobile ? '50%' : isTablet ? 'calc(50% - 160px)' : 'calc(50% - 200px)'
          }}
        >
          <div style={{ backgroundColor: 'rgba(255,255,255,0.92)' }} className={`flex items-center rounded-xl border border-gray-300 shadow-lg ${isMobile ? 'max-w-[280px] gap-2 px-2 py-1.5' : 'gap-4 px-6 py-3'}`}>
            <img src="/image_asset/gorontalo-logo.png" alt="Lambang Provinsi Gorontalo" className={`rounded object-contain ${isMobile ? 'h-5 w-5' : 'h-7 w-7'}`} />
            <div className={`font-bold capitalize text-black ${isMobile ? 'text-xs leading-tight' : isTablet ? 'text-base' : 'text-lg'}`}>
              {isMobile ? 'RTRW Prov. Gorontalo' : 'Peta Rencana Tata Ruang Wilayah Provinsi Gorontalo'}
            </div>
          </div>
        </div>

        {/* Legend removed - MapUserInfo only */}
      </div>

      {/* Collapsible Sidebar - Responsive */}
      {/* Z-Index raised to 3000 to cover map controls including zoom buttons and title */}
      <div className={`absolute right-0 top-0 z-[3000] h-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0' : isMobile ? 'w-full' : isTablet ? 'w-[340px]' : 'w-[420px]'}`}>
        <MapSidebar
          // rtrws={rtrws}
          batasAdministrasi={batasAdministrasi}
          // treePolaRuangData={treePolaRuangData}
          // treeStrukturRuangData={treeStrukturRuangData}
          // treeKetentuanKhususData={treeKetentuanKhususData}
          // treePkkprlData={treePkkprlData}
          // treeIndikasiProgramData={treeIndikasiProgramData}
          treeLayerGroup={layerGroupTrees}
          selectedLayers={selectedLayers}
          loadingLayers={loadingLayers}
          isLoadingBatas={isLoadingBatas}
          isLoadingKlasifikasi={getAllLayerGroups.isLoading}
          onToggleLayer={handleToggleLayer}
          onBatchToggleLayers={handleBatchToggleLayers}
          // Opacity controls
          layerOpacities={layerOpacities}
          onOpacityChange={handleOpacityChange}
          // onReloadKlasifikasi={loadAllKlasifikasi}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      </div>

      {/* Mobile Floating Button to Open Sidebar */}
      {isMobile && isSidebarCollapsed && (
        <Button type="primary" icon={<MenuUnfoldOutlined />} onClick={() => setIsSidebarCollapsed(false)} className="absolute right-4 top-4 z-[1001] h-12 w-12 rounded-full shadow-xl transition-transform hover:scale-110" size="large" />
      )}

      {/* Mobile overlay when sidebar is open */}
      {isMobile && !isSidebarCollapsed && <div className="absolute inset-0 z-[2999] bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsSidebarCollapsed(true)} onTouchEnd={() => setIsSidebarCollapsed(true)} />}
    </section>
  );
};

export default Maps;
