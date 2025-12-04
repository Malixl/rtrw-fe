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
import { getLeafletIcon } from '@/utils/leafletIcon';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

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

  const rtrws = getAllRtrws.data ?? [];
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
      const iconName = pemetaan.icon_titik ?? null;
      const tipe_garis = pemetaan.tipe_garis ?? null;
      const fillOpacity = pemetaan.fill_opacity ?? 0.8;

      const enhanced = {
        ...json,
        features: (json.features || []).map((feature) => {
          const props = { ...(feature.properties || {}) };
          if (iconName) props.icon = iconName;
          if (warna) {
            props.stroke = warna;
            props['stroke-width'] = props['stroke-width'] ?? 3;
            props['stroke-opacity'] = props['stroke-opacity'] ?? 1;

            props.fill = props.fill ?? warna; // <-- FILL POLYGON
            props['fill-opacity'] = props['fill-opacity'] ?? fillOpacity;
          }
          if (tipe_garis === 'dashed') {
            props.dashArray = props.dashArray ?? '6 6';
          } else if (tipe_garis === 'solid') {
            props.dashArray = null;
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

  function mapPolaRuang(data) {
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
  }

  function mapStrukturRuang(data) {
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
  }

  function mapKetentuanKhusus(data) {
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
  }

  function mapPkkprl(data) {
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
  }

  function mapIndikasiProgram(data) {
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
  }

  const handleFetchKlasifikasi = async (values) => {
    const { message, isSuccess, data } = await klasifikasisByRtrw.execute({
      idRtrw: values.id_rtrw
    });

    if (isSuccess) {
      success('Berhasil', message);

      const pola_ruang_list = data.klasifikasi_pola_ruang ?? [];
      const struktur_ruang_list = data.klasifikasi_struktur_ruang ?? [];
      const ketentuan_khusus_list = data.klasifikasi_ketentuan_khusus ?? [];
      const pkkprl_list = data.klasifikasi_pkkprl ?? [];
      const indikasi_program_list = data.klasifikasi_indikasi_program ?? [];

      setTreePolaRuangData(mapPolaRuang(pola_ruang_list));
      setTreeStrukturRuangData(mapStrukturRuang(struktur_ruang_list));
      setTreeKetentuanKhususData(mapKetentuanKhusus(ketentuan_khusus_list));
      setTreePkkprlData(mapPkkprl(pkkprl_list));
      setTreeIndikasiProgramData(mapIndikasiProgram(indikasi_program_list));
    } else {
      error('Gagal', message);
    }

    return isSuccess;
  };

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
    <section className="relative h-screen w-full">
      {/* Dynamic styles for map controls based on sidebar state */}
      <style>
        {`
          .leaflet-top.leaflet-right {
            right: ${isSidebarCollapsed ? '10px' : '410px'};
            transition: right 0.3s ease-in-out;
          }
        `}
      </style>

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
            <BaseLayer name="Satelit dengan Label">
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png" attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>' />
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
              style={getFeatureStyle}
              pointToLayer={(feature, latlng) => {
                const iconName = feature.properties?.icon;
                const color = feature.properties?.stroke || feature.properties?.fill || '#1677ff';
                const leafletIcon = iconName ? getLeafletIcon(iconName, color) : undefined;
                if (leafletIcon) return L.marker(latlng, { icon: leafletIcon });
                return L.marker(latlng);
              }}
              onEachFeature={(feature, layerGeo) => {
                layerGeo.on('click', (e) => {
                  L.DomEvent.stopPropagation(e);
                  setPopupInfo({
                    position: e.latlng,
                    properties: feature.properties
                  });
                });

                const iconName = feature.properties?.icon;
                if (iconName && feature.geometry && feature.geometry.type !== 'Point') {
                  const color = feature.properties?.stroke || '#1677ff';
                  const leafletIcon = getLeafletIcon(iconName, color);
                  try {
                    const latlng = layerGeo.getBounds().getCenter();
                    L.marker(latlng, { icon: leafletIcon }).addTo(layerGeo._map);
                  } catch (err) {
                    console.warn(err);
                  }
                }
              }}
            />
          ))}
          {popupInfo && (
            <Popup position={popupInfo.position} onClose={() => setPopupInfo(null)}>
              <FeaturePopup properties={popupInfo.properties} />
            </Popup>
          )}
        </MapContainer>
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="w-96 rounded-lg bg-white p-4 shadow-lg">
            <h4 className="mb-2 font-semibold">Legend</h4>
            {/* POLA RUANG */}
            {Object.entries(selectedLayers).some(([key]) => key.startsWith('pola')) && (
              <>
                <div className="flex max-h-28 flex-wrap gap-2">
                  <b className="w-full text-sm">Pola Ruang</b>

                  {Object.entries(selectedLayers)
                    .filter(([key]) => key.startsWith('pola'))
                    .map(([_, item]) => (
                      <div key={item.id} className="inline-flex items-center gap-x-1">
                        <div className="h-2 w-5" style={{ backgroundColor: item.meta.warna }} />
                        <small>{item.meta.nama}</small>
                      </div>
                    ))}
                </div>
                <hr className="my-2" />
              </>
            )}
            {/* STRUKTUR RUANG */}
            {Object.entries(selectedLayers).some(([key]) => key.startsWith('struktur')) && (
              <>
                <div className="flex max-h-28 flex-wrap gap-2">
                  <b className="w-full text-sm">Struktur Ruang</b>

                  {Object.entries(selectedLayers)
                    .filter(([key]) => key.startsWith('struktur'))
                    .map(([_, item]) => {
                      const IconComponent = item.meta.icon_titik ? AntdIcons[item.meta.icon_titik] : null;
                      return (
                        <div key={item.id} className="inline-flex items-center gap-x-1">
                          {IconComponent ? <IconComponent style={{ fontSize: 18, color: item.meta.warna }} /> : <div className="h-1 w-6" style={{ backgroundColor: item.meta.warna }} />}

                          <small>{item.meta.nama}</small>
                        </div>
                      );
                    })}
                </div>
                <hr className="my-2" />
              </>
            )}
            {Object.entries(selectedLayers).some(([key]) => key.startsWith('ketentuan_khusus')) && (
              <>
                <div className="flex max-h-28 flex-wrap gap-2">
                  <b className="w-full text-sm">Ketentuan Khusus</b>

                  {Object.entries(selectedLayers)
                    .filter(([key]) => key.startsWith('ketentuan_khusus'))
                    .map(([_, item]) => (
                      <div key={item.id} className="inline-flex items-center gap-x-1">
                        <div className="h-2 w-5" style={{ backgroundColor: item.meta.warna }} />
                        <small>{item.meta.nama}</small>
                      </div>
                    ))}
                </div>
                <hr className="my-2" />
              </>
            )}
            {Object.entries(selectedLayers).some(([key]) => key.startsWith('pkkprl')) && (
              <>
                <div className="flex max-h-28 flex-wrap gap-2">
                  <b className="w-full text-sm">PKKPRL</b>

                  {Object.entries(selectedLayers)
                    .filter(([key]) => key.startsWith('pkkprl'))
                    .map(([_, item]) => (
                      <div key={item.id} className="inline-flex items-center gap-x-1">
                        <div className="h-2 w-5" style={{ backgroundColor: item.meta.warna }} />
                        <small>{item.meta.nama}</small>
                      </div>
                    ))}
                </div>
                <hr className="my-2" />
              </>
            )}
            {Object.entries(selectedLayers).some(([key]) => key.startsWith('batas')) && (
              <>
                <div className="flex max-h-28 flex-wrap gap-2">
                  <b className="w-full text-sm">Batas Administrasi</b>

                  {Object.entries(selectedLayers)
                    .filter(([key]) => key.startsWith('batas'))
                    .map(([_, item]) => (
                      <div key={item.id} className="inline-flex items-center gap-x-1">
                        <div className="h-2 w-5" style={{ backgroundColor: item.meta.warna, opacity: 0.3 }} />
                        <small>{item.meta.nama}</small>
                      </div>
                    ))}
                </div>
                <hr className="my-2" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Sidebar - Overlay on right */}
      <div className={`absolute right-0 top-0 z-[1000] h-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0' : 'w-[400px]'}`}>
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
          isLoadingKlasifikasi={klasifikasisByRtrw.isLoading}
          onToggleLayer={handleToggleLayer}
          onFetchKlasifikasi={handleFetchKlasifikasi}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>
    </section>
  );
};

export default Maps;
