/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useAuth, useNotification, useService } from '@/hooks';
import { BatasAdministrasiService, LayerGroupsService } from '@/services';
import { BASE_URL } from '@/utils/api';
import asset from '@/utils/asset';

import { LockOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Result, Tooltip } from 'antd';
import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, LayersControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import FeaturePopup from '@/components/Map/FeaturePopup';
import HomeControl from '@/components/Map/HomeControl';
import CoordinateControl from '@/components/Map/CoordinateControl';
import MapToolsControl from '@/components/Map/MapToolsControl';
import MapSidebar from '@/components/Map/MapSidebar';
import MapUserInfo from '@/components/Map/MapUserInfo';
import MapLoader from '@/components/Map/MapLoader';
import BatchLoadingOverlay from '@/components/Map/BatchLoadingOverlay';

const { BaseLayer } = LayersControl;

const Maps = () => {
  const navigate = useNavigate();
  const { canAccessMap, capabilities, isLoading: authLoading } = useAuth();
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
   * @param {Array} layers - array of pemetaan objects
   * @param {boolean} enable - true = aktifkan semua, false = matikan semua
   */
  const handleBatchToggleLayers = async (layers, enable) => {
    if (enable) {
      // Aktifkan semua layers yang belum aktif
      const layersToEnable = layers.filter((l) => !selectedLayers[l.key]);
      if (layersToEnable.length === 0) return;

      // Show batch loading overlay
      setBatchLoading({
        isVisible: true,
        current: 0,
        total: layersToEnable.length,
        isEnabling: true
      });

      // Set loading state untuk semua
      setLoadingLayers((prev) => {
        const updated = { ...prev };
        layersToEnable.forEach((l) => (updated[l.key] = true));
        return updated;
      });

      // Fetch semua GeoJSON secara parallel dengan progress tracking
      const results = [];
      let completed = 0;

      await Promise.all(
        layersToEnable.map(async (pemetaan) => {
          const key = pemetaan.key;
          const id = pemetaan.id;
          const type = pemetaan.type;

          let url = '';
          if (type === 'pola') url = `${BASE_URL}/polaruang/${id}/geojson`;
          else if (type === 'struktur') url = `${BASE_URL}/struktur_ruang/${id}/geojson`;
          else if (type === 'ketentuan_khusus') url = `${BASE_URL}/ketentuan_khusus/${id}/geojson`;
          else if (type === 'pkkprl') url = `${BASE_URL}/pkkprl/${id}/geojson`;
          else if (type === 'data_spasial') url = `${BASE_URL}/data_spasial/${id}/geojson`;
          else if (type === 'batas_administrasi') url = `${BASE_URL}/batas_administrasi/${id}/geojson`;

          try {
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
                if (warna) {
                  props.stroke = warna;
                  props.fill = warna;
                  props['stroke-opacity'] = 1;
                  props['fill-opacity'] = fillOpacity;
                }
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
                  props['stroke-width'] = 6;
                }
                if (tipe_garis === 'dash-dot-dot') {
                  props.dashArray = '20 8 3 8 3 8'; // pola: ─── ·  · ───
                  props['stroke-width'] = 3;
                }
                if (iconImageUrl) {
                  props.icon_image_url = iconImageUrl;
                }
                return { ...feature, properties: props };
              })
            };

            results.push({ key, id, type, data: enhanced, meta: pemetaan, status: 'fulfilled' });
          } catch (error) {
            console.error(`Failed to load layer ${key}:`, error);
            results.push({ key, status: 'rejected' });
          } finally {
            completed++;
            // Update progress
            setBatchLoading((prev) => ({
              ...prev,
              current: completed
            }));
          }
        })
      );

      // Update state sekali untuk semua hasil
      setSelectedLayers((prev) => {
        const updated = { ...prev };
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { key, id, type, data, meta } = result;
            updated[key] = { id, type, data, meta };
          }
        });
        return updated;
      });

      // Clear loading state
      setLoadingLayers((prev) => {
        const updated = { ...prev };
        layersToEnable.forEach((l) => (updated[l.key] = false));
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
      }, 500);
    } else {
      // Matikan semua layers yang aktif - sekali update
      const keysToDisable = layers.filter((l) => selectedLayers[l.key]).map((l) => l.key);
      if (keysToDisable.length === 0) return;

      // Show overlay for disabling
      setBatchLoading({
        isVisible: true,
        current: keysToDisable.length,
        total: keysToDisable.length,
        isEnabling: false
      });

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
      else if (type === 'data_spasial') url = `${BASE_URL}/data_spasial/${id}/geojson`;
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

          if (tipe_garis === 'dash-dot-dot') {
            props.dashArray = '20 8 3 8 3 8'; // pola: ─── ·  · ───
            props['stroke-width'] = 3;
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
          nama: item.name || item.nama,
          warna: item.color || item.warna || '#000000', // Default color for boundaries
          tipe_geometri: item.geometry_type || item.tipe_geometri || 'polyline',
          tipe_garis: item.line_type || item.tipe_garis || 'solid',
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

                  // Cek apakah ada atribut KETERANGAN yang berisi "Pulau"
                  const keterangan = props.KETERANGAN || props.keterangan || '';
                  const isPulau = keterangan && keterangan.toLowerCase().includes('pulau');

                  // LOGIKA PEMISAHAN:
                  // 1. Jika feature pertama (index 0) dan bukan pulau -> tampilkan label wilayah utama
                  // 2. Jika feature berapapun (termasuk pertama) dan adalah pulau -> tampilkan label pulau

                  if (isArea && featureIndex === 0 && !isPulau) {
                    // Label untuk wilayah utama (Kabupaten/Kota)
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
                  } else if (isArea && isPulau) {
                    // Label untuk pulau-pulau kecil
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
        <div
          className="absolute top-4 z-[1002] -translate-x-1/2 transition-all duration-300"
          style={{
            left: isSidebarCollapsed ? '50%' : isMobile ? '50%' : isTablet ? 'calc(50% - 160px)' : 'calc(50% - 200px)'
          }}
        >
          <div style={{ backgroundColor: 'rgba(255,255,255,0.92)' }} className={`flex items-center rounded-xl border border-gray-300 shadow-lg ${isMobile ? 'max-w-[calc(100vw-32px)] gap-2 px-3 py-2' : 'gap-4 px-6 py-3'}`}>
            <img src="/image_asset/gorontalo-logo.png" alt="Lambang Provinsi Gorontalo" className={`rounded object-contain ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`} />
            <div className={`font-bold capitalize text-black ${isMobile ? 'text-xs leading-tight' : isTablet ? 'text-base' : 'text-lg'}`}>Peta Rencana Tata Ruang Wilayah Provinsi Gorontalo</div>
          </div>
        </div>

        {/* Legend removed - MapUserInfo only */}
      </div>

      {/* Collapsible Sidebar - Responsive */}
      <div className={`absolute right-0 top-0 z-[1000] h-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0' : isMobile ? 'w-full' : isTablet ? 'w-[340px]' : 'w-[420px]'}`}>
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
          // onReloadKlasifikasi={loadAllKlasifikasi}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && !isSidebarCollapsed && <div className="absolute inset-0 z-[999] bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsSidebarCollapsed(true)} onTouchEnd={() => setIsSidebarCollapsed(true)} />}
    </section>
  );
};

export default Maps;
