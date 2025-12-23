/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useAuth, useNotification, useService } from '@/hooks';
import { RtrwsService, BatasAdministrasiService } from '@/services';
import { BASE_URL } from '@/utils/api';
import asset from '@/utils/asset';

import { LockOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Result, Skeleton, Tooltip } from 'antd';
import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, LayersControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as AntdIcons from '@ant-design/icons';
import FeaturePopup from '@/components/Map/FeaturePopup';
import MapUserInfo from '@/components/Map/MapUserInfo';
import HomeControl from '@/components/Map/HomeControl';
import CoordinateControl from '@/components/Map/CoordinateControl';
import MapToolsControl from '@/components/Map/MapToolsControl';
import MapSidebar from '@/components/Map/MapSidebar';

const { BaseLayer } = LayersControl;

const Maps = () => {
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const { canAccessMap, capabilities, isAuthenticated, isLoading: authLoading } = useAuth();
  const { execute, ...getAllRtrws } = useService(RtrwsService.getAll);
  const { execute: fetchBatas, data: batasData, isLoading: isLoadingBatas, isSuccess: isBatasSuccess, message: batasMessage } = useService(BatasAdministrasiService.getAll);
  const klasifikasisByRtrw = useService(RtrwsService.getAllKlasifikasisByRtrw);
  const [selectedLayers, setSelectedLayers] = React.useState({});
  const [loadingLayers, setLoadingLayers] = React.useState({});
  const [treePolaRuangData, setTreePolaRuangData] = React.useState([]);
  const [treeStrukturRuangData, setTreeStrukturRuangData] = React.useState([]);
  const [treeKetentuanKhususData, setTreeKetentuanKhususData] = React.useState([]);
  const [treePkkprlData, setTreePkkprlData] = React.useState([]);
  const [treeIndikasiProgramData, setTreeIndikasiProgramData] = React.useState([]);
  const [popupInfo, setPopupInfo] = React.useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true); // Default collapsed on mobile
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = React.useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  // Handle window resize for responsive
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      // Auto collapse sidebar on mobile
      if (width < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if user can access the map
  const hasMapAccess = canAccessMap();
  const showBlurMap = capabilities?.show_blur_map ?? !hasMapAccess;
  const loginMessage = capabilities?.login_message || 'Silakan login untuk melihat peta interaktif';

  const fetchRtrws = React.useCallback(() => {
    if (hasMapAccess) {
      execute({ page: 1, per_page: 100000 });
    }
  }, [execute, hasMapAccess]);

  React.useEffect(() => {
    if (hasMapAccess) {
      fetchRtrws();
      fetchBatas({ page: 1, per_page: 100000 });
    }
  }, [fetchRtrws, fetchBatas, hasMapAccess]);

  React.useEffect(() => {
    if (!isLoadingBatas && !isBatasSuccess && batasMessage) {
      console.error('Gagal memuat Batas Administrasi:', batasMessage);
    }
  }, [isLoadingBatas, isBatasSuccess, batasMessage]);

  const rtrws = React.useMemo(() => getAllRtrws.data ?? [], [getAllRtrws.data]);
  const batasAdministrasi = batasData ?? [];

  const handleToggleLayer = async (pemetaan) => {
    const key = pemetaan.key;
    const id = pemetaan.id;
    const type = pemetaan.type;

    if (selectedLayers[key]) {
      const updated = { ...selectedLayers };
      delete updated[key];
      setSelectedLayers(updated);
      return;
    }

    setLoadingLayers((prev) => ({ ...prev, [key]: true }));

    try {
      let url = '';
      if (type === 'pola') url = `${BASE_URL}/polaruang/${id}/geojson`;
      else if (type === 'struktur') url = `${BASE_URL}/struktur_ruang/${id}/geojson`;
      else if (type === 'ketentuan_khusus') url = `${BASE_URL}/ketentuan_khusus/${id}/geojson`;
      else if (type === 'pkkprl') url = `${BASE_URL}/pkkprl/${id}/geojson`;
      else if (type === 'batas_administrasi') url = `${BASE_URL}/batas_administrasi/${id}/geojson`;

      const res = await fetch(url);
      const json = await res.json();
      const warna = pemetaan.warna ?? null;
      const iconImageUrl = asset(pemetaan.icon_titik) ?? null;
      const tipe_garis = pemetaan.tipe_garis ?? null;
      const fillOpacity = pemetaan.fill_opacity ?? 0.8;

      const enhanced = {
        ...json,
        features: (json.features || []).map((feature) => {
          const props = { ...(feature.properties || {}) };

          // warna
          if (warna) {
            props.stroke = warna;
            props.fill = warna;
            props['stroke-opacity'] = 1;
            props['fill-opacity'] = fillOpacity;
          }

          // tipe garis
          if (tipe_garis === 'dashed') {
            props.dashArray = '6 6';
            props['stroke-width'] = 3;
          }

          if (tipe_garis === 'solid') {
            props.dashArray = null;
            props['stroke-width'] = 3;
          }

          if (tipe_garis === 'bold') {
            props.dashArray = null;
            props['stroke-width'] = 6; // 🔥 LEBIH TEBAL
          }

          if (iconImageUrl) {
            props.icon_image_url = iconImageUrl;
          }

          return {
            ...feature,
            properties: props
          };
        })
      };

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

  React.useEffect(() => {
    if (batasAdministrasi.length > 0) {
      batasAdministrasi.forEach((item) => {
        const pemetaan = {
          key: `batas-${item.id}`,
          id: item.id,
          type: 'batas_administrasi',
          nama: item.name,
          warna: item.color || '#000000', // Default color for boundaries
          tipe_garis: 'solid',
          fill_opacity: 0.3
        };
        // Only toggle if not already selected
        if (!selectedLayers[pemetaan.key]) {
          handleToggleLayer(pemetaan);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batasAdministrasi]);

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

  // Load classifications for ALL RTRW and aggregate results
  const [isLoadingKlasifikasiAll, setIsLoadingKlasifikasiAll] = React.useState(false);
  const isLoadingKlasifikasiAllRef = React.useRef(false);

  // Utility: run promises in batches to avoid overloading server or triggering too many concurrent requests
  const runInBatches = React.useCallback(async (items, worker, batchSize = 3) => {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      // Execute batch in parallel
      const res = await Promise.allSettled(batch.map((it) => worker(it)));
      results.push(...res);
      // small delay between batches to be gentle to server
      await new Promise((resDelay) => setTimeout(resDelay, 150));
    }
    return results;
  }, []);

  // Use stable execute function reference to avoid re-creating the callback when hook data changes
  const { execute: fetchKlasifikasiByRtrw } = klasifikasisByRtrw;

  const loadAllKlasifikasi = React.useCallback(async () => {
    if (!rtrws || rtrws.length === 0) return;
    // Avoid re-entry using ref (avoid dependency on state)
    if (isLoadingKlasifikasiAllRef.current) return;
    isLoadingKlasifikasiAllRef.current = true;
    setIsLoadingKlasifikasiAll(true);

    try {
      const worker = async (r) => fetchKlasifikasiByRtrw({ idRtrw: r.id });
      const results = await runInBatches(rtrws, worker, 3);

      const polaAcc = [];
      const strukturAcc = [];
      const ketentuanAcc = [];
      const pkkprlAcc = [];
      const indikasiAcc = [];

      let successCount = 0;
      let failCount = 0;

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          const val = res.value;
          if (val.isSuccess && val.data) {
            successCount += 1;
            const data = val.data;
            polaAcc.push(...(data.klasifikasi_pola_ruang ?? []));
            strukturAcc.push(...(data.klasifikasi_struktur_ruang ?? []));
            ketentuanAcc.push(...(data.klasifikasi_ketentuan_khusus ?? []));
            pkkprlAcc.push(...(data.klasifikasi_pkkprl ?? []));
            indikasiAcc.push(...(data.klasifikasi_indikasi_program ?? []));
          } else {
            failCount += 1;
          }
        } else {
          failCount += 1;
        }
      }

      const polaTree = mapPolaRuang(polaAcc);
      const strukturTree = mapStrukturRuang(strukturAcc);
      const ketentuanTree = mapKetentuanKhusus(ketentuanAcc);
      const pkkprlTree = mapPkkprl(pkkprlAcc);
      const indikasiTree = mapIndikasiProgram(indikasiAcc);

      // Set tree state once to avoid extra renders
      setTreePolaRuangData(polaTree);
      setTreeStrukturRuangData(strukturTree);
      setTreeKetentuanKhususData(ketentuanTree);
      setTreePkkprlData(pkkprlTree);
      setTreeIndikasiProgramData(indikasiTree);

      // Debug in console: counts per category
      console.debug('Loaded data counts', {
        pola: polaAcc.length,
        struktur: strukturAcc.length,
        ketentuan: ketentuanAcc.length,
        pkkprl: pkkprlAcc.length,
        indikasi: indikasiAcc.length
      });

      // Single summary notification (label changed to Data RTRW)
      const totalItems = polaAcc.length + strukturAcc.length + ketentuanAcc.length + pkkprlAcc.length + indikasiAcc.length;
      if (successCount > 0 && failCount === 0) {
        success(`Berhasil memuat Data RTRW (${successCount}/${rtrws.length}). Jumlah item: ${totalItems}`);
      } else if (successCount > 0 && failCount > 0) {
        error(`Sebagian Data RTRW dimuat: ${successCount}/${rtrws.length} berhasil, ${failCount} gagal — Jumlah item: ${totalItems}`);
      } else {
        error('Gagal memuat Data RTRW untuk semua RTRW. Coba muat ulang.');
      }
    } catch (err) {
      console.error('Error loading klasifikasi:', err);
      error('Gagal memuat Data RTRW');
    } finally {
      isLoadingKlasifikasiAllRef.current = false;
      setIsLoadingKlasifikasiAll(false);
    }
  }, [rtrws, fetchKlasifikasiByRtrw, mapPolaRuang, mapStrukturRuang, mapKetentuanKhusus, mapPkkprl, mapIndikasiProgram, runInBatches, success, error]);

  React.useEffect(() => {
    if (rtrws && rtrws.length > 0) {
      loadAllKlasifikasi();
    }
  }, [rtrws, loadAllKlasifikasi]);

  const getFeatureStyle = (feature) => {
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
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <section className="flex h-screen w-full items-center justify-center">
        <Skeleton active paragraph={{ rows: 6 }} />
      </section>
    );
  }

  // Show access denied overlay for users without map access
  if (!hasMapAccess) {
    return (
      <section className="relative flex h-screen w-full">
        {/* Blurred Map Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={showBlurMap ? 'pointer-events-none blur-sm grayscale' : ''}>
            <MapContainer center={[0.5412, 123.0595]} zoom={9} className="h-screen w-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
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
      {/* Dynamic styles for map controls based on sidebar state and screen size */}
      <style>
        {`
          /* Desktop styles */
          @media (min-width: 1024px) {
            .leaflet-top.leaflet-right {
              right: ${isSidebarCollapsed ? '10px' : '410px'};
              transition: right 0.3s ease-in-out;
            }
          }
          
          /* Tablet styles */
          @media (min-width: 768px) and (max-width: 1023px) {
            .leaflet-top.leaflet-right {
              right: ${isSidebarCollapsed ? '10px' : '320px'};
              transition: right 0.3s ease-in-out;
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
        `}
      </style>

      {/* Mobile Floating Button to Open Sidebar */}
      {isMobile && isSidebarCollapsed && <Button type="primary" icon={<MenuUnfoldOutlined />} onClick={() => setIsSidebarCollapsed(false)} className="absolute right-4 top-4 z-[1001] h-10 w-10 rounded-full shadow-lg" size="large" />}

      {/* Floating user info (always mounted as portal) */}
      <MapUserInfo />

      {/* Map Container - Full Width */}
      <div className="h-full w-full">
        <MapContainer center={[0.5412, 123.0595]} zoom={9} className="h-screen w-full">
          {/* Custom Home Control - positioned at topleft */}
          <HomeControl />

          {/* Map Tools Control - drawing, screenshot, etc */}
          <MapToolsControl />

          {/* Coordinate and Scale display - bottom center */}
          <CoordinateControl />

          {/* Base Layer Control - next to zoom buttons (topright) */}
          <LayersControl position="topleft">
            <BaseLayer checked name="OpenStreetMap">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </BaseLayer>
            <BaseLayer name="Satelit (Esri)">
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </BaseLayer>
            <BaseLayer name="Terrain">
              <TileLayer
                attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            </BaseLayer>
          </LayersControl>
          {Object.values(selectedLayers).map((layer) => (
            <GeoJSON
              key={`${layer.type}-${layer.id}`}
              data={layer.data}
              style={(feature) => {
                const props = feature.properties || {};
                let style = getFeatureStyle(feature);
                if (layer.type === 'struktur' && props['stroke-width']) {
                  style = { ...style, weight: props['stroke-width'] };
                }
                return style;
              }}
              pointToLayer={(feature, latlng) => {
                const props = feature.properties || {};
                if (props.icon_image_url) {
                  const icon = L.icon({
                    iconUrl: props.icon_image_url,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    className: 'custom-marker-image'
                  });
                  return L.marker(latlng, { icon });
                }
                return L.marker(latlng);
              }}
              onEachFeature={(feature, layerGeo) => {
                const props = feature.properties || {};

                // Event klik untuk popup
                layerGeo.on('click', (e) => {
                  L.DomEvent.stopPropagation(e);
                  setPopupInfo({
                    position: e.latlng,
                    properties: props
                  });
                });

                // === HANYA UNTUK BATAS ADMINISTRASI - SANGAT SPESIFIK ===
                // Cek: 1. Hanya batas administrasi, 2. Hanya polygon/multipolygon, 3. Hanya fitur pertama
                if (layer.type === 'batas_administrasi') {
                  const geomType = feature.geometry.type;
                  const isArea = geomType === 'Polygon' || geomType === 'MultiPolygon';

                  // Dapatkan index fitur ini dalam array features
                  const featureIndex = layer.data.features.findIndex((f) => JSON.stringify(f) === JSON.stringify(feature));

                  // Hanya tambahkan label pada fitur pertama yang area
                  if (isArea && featureIndex === 0) {
                    const layerName = layer.meta?.nama || 'Wilayah';

                    // Gunakan event 'add' untuk memastikan map tersedia
                    layerGeo.once('add', () => {
                      layerGeo.bindTooltip(layerName, {
                        permanent: true,
                        direction: 'center',
                        className: 'batas-label',
                        interactive: false
                      });
                    });
                  }
                }

                // === HAPUS SEMUA LOGIKA PENAMBAHAN ICON DI TENGAH POLYGON ===
                // Ini menyebabkan gambar rusak muncul di Pola Ruang dan layer lainnya
                // HAPUS KODE DI BAWAH INI:
                // if (props.icon_image_url && feature.geometry && feature.geometry.type !== 'Point' && layer.type !== 'batas_administrasi') {
                //   try {
                //     const center = layerGeo.getBounds().getCenter();
                //     const icon = L.icon({
                //       iconUrl: props.icon_image_url,
                //       iconSize: [32, 32],
                //       iconAnchor: [16, 32]
                //     });
                //
                //     setTimeout(() => {
                //       if (layerGeo._map) {
                //         L.marker(center, { icon }).addTo(layerGeo._map);
                //       }
                //     }, 100);
                //   } catch (err) {
                //     console.warn('Gagal menambahkan icon:', err);
                //   }
                // }
              }}
            />
          ))}
          {popupInfo && (
            <Popup position={popupInfo.position} onClose={() => setPopupInfo(null)}>
              <FeaturePopup properties={popupInfo.properties} />
            </Popup>
          )}
        </MapContainer>

        {/* Small map header (centered) */}
        <div className="absolute left-1/2 top-4 z-[1002] -translate-x-1/2">
          <div style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 shadow-md">
            <img src="/image_asset/gorontalo-logo.png" alt="Lambang Provinsi Gorontalo" className="h-6 w-6 rounded object-contain" />
            <div className="text-sm font-bold capitalize text-black">Peta Rencana Tata Ruang Wilayah Provinsi Gorontalo</div>
          </div>
        </div>
      </div>

      {/* Collapsible Sidebar - Responsive */}
      <div className={`absolute right-0 top-0 z-[1000] h-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0' : isMobile ? 'w-full' : isTablet ? 'w-[320px]' : 'w-[400px]'}`}>
        <MapSidebar
          rtrws={rtrws}
          batasAdministrasi={batasAdministrasi}
          treePolaRuangData={treePolaRuangData}
          treeStrukturRuangData={treeStrukturRuangData}
          treeKetentuanKhususData={treeKetentuanKhususData}
          treePkkprlData={treePkkprlData}
          treeIndikasiProgramData={treeIndikasiProgramData}
          selectedLayers={selectedLayers}
          loadingLayers={loadingLayers}
          isLoadingRtrws={getAllRtrws.isLoading}
          isLoadingBatas={isLoadingBatas}
          isLoadingKlasifikasi={isLoadingKlasifikasiAll}
          onToggleLayer={handleToggleLayer}
          onReloadKlasifikasi={loadAllKlasifikasi}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobile={isMobile}
        />
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && !isSidebarCollapsed && <div className="absolute inset-0 z-[999] bg-black/50" onClick={() => setIsSidebarCollapsed(true)} />}
    </section>
  );
};

export default Maps;
