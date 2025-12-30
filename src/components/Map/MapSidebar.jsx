/* eslint-disable react/prop-types */
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Button, Checkbox, Collapse, Skeleton, Typography, Tooltip, Input, Empty } from 'antd';
import { highlightParts, filterTree as filterTreeUtil, filterList, fuzzyMatch } from './searchUtils';
import LegendItem from './LegendItem';
import { AimOutlined, InfoCircleOutlined, MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useCrudModal } from '@/hooks';
import asset from '@/utils/asset';
/* MapUserInfo moved out of the sidebar and positioned fixed on the viewport (bottom-left) */

const { Panel } = Collapse;

/**
 * LayerCheckbox - Reusable checkbox component for layer items
 */
const LayerCheckbox = ({ pemetaan, isChecked, isLoading, onToggle, onInfoClick, label }) => (
  <Checkbox checked={isChecked} onChange={onToggle}>
    <span className="inline-flex items-center gap-x-2">
      {label ? label : pemetaan.title || pemetaan.nama}
      {isLoading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
      {onInfoClick && <Button icon={<InfoCircleOutlined />} type="link" size="small" onClick={onInfoClick} />}
    </span>
  </Checkbox>
);

/**
 * CollapsibleSection - Reusable collapsible panel for layer categories
 */
const CollapsibleSection = ({ title, panelKey, children, defaultActiveKey }) => (
  <Collapse ghost expandIcon={() => ''} defaultActiveKey={defaultActiveKey}>
    <Panel
      key={panelKey}
      header={
        <div className="inline-flex w-full items-center justify-between">
          <div className="inline-flex w-full items-center gap-x-4">
            <div className="flex items-center justify-center rounded-md bg-blue-100 p-3">
              <AimOutlined className="text-blue-500" />
            </div>
            {title}
          </div>
          <MenuOutlined />
        </div>
      }
    >
      <div className="flex flex-col px-4">{children}</div>
    </Panel>
  </Collapse>
);

/**
 * LoadingSkeleton - Loading state for layer sections
 */
const LoadingSkeleton = () => (
  <Collapse ghost expandIcon={() => ''}>
    <Panel
      header={
        <div className="inline-flex w-full items-center justify-between">
          <div className="inline-flex w-full items-center gap-x-4">
            <div className="flex items-center justify-center rounded-md bg-blue-100 p-3">
              <AimOutlined className="text-blue-500" />
            </div>
            <Skeleton.Input size="small" active />
          </div>
          <MenuOutlined />
        </div>
      }
    >
      <div className="flex flex-col gap-y-2 px-4">
        {[1, 2, 3, 4].map((i) => (
          <Checkbox key={i}>
            <Skeleton.Input size="small" active />
          </Checkbox>
        ))}
      </div>
    </Panel>
  </Collapse>
);

/**
 * MapSidebar - Collapsible sidebar component for map layer controls
 */
const MapSidebar = ({
  // Data
  // rtrws,
  batasAdministrasi,
  // treePolaRuangData,
  // treeStrukturRuangData,
  // treeKetentuanKhususData,
  // treePkkprlData,
  // treeIndikasiProgramData,
  selectedLayers,
  loadingLayers,
  // Loading states
  isLoadingBatas,
  isLoadingKlasifikasi,
  // Handlers
  onToggleLayer,
  onReloadKlasifikasi,
  // Collapse control
  isCollapsed,
  onToggleCollapse,
  // Responsive
  isMobile = false,
  treeLayerGroup
}) => {
  const modal = useCrudModal();

  /**
   * Create pemetaan object for batas administrasi
   */
  const createBatasPemetaan = useCallback(
    (item) => ({
      key: `batas-${item.id}`,
      id: item.id,
      type: 'batas_administrasi',
      nama: item.name || item.nama,
      warna: item.color || item.warna || '#000000',
      // Ambil tipe geometri dan tipe garis dari data API jika tersedia.
      tipe_geometri: item.geometry_type || item.tipe_geometri || 'polyline',
      tipe_garis: item.line_type || item.tipe_garis || 'solid',
      fill_opacity: 0.3
    }),
    []
  );

  /**
   * Show info modal for layer item
   */
  const showInfoModal = useCallback(
    (title, data) => {
      modal.show.description({ title, data });
    },
    [modal]
  );

  /**
   * Show paragraph modal for dokumen
   */
  const showDokumenModal = useCallback(
    (fileUrl) => {
      modal.show.paragraph({
        data: {
          content: <iframe className="min-h-96 w-full" src={asset(fileUrl)} />
        }
      });
    },
    [modal]
  );

  /**
   * Get type label for klasifikasi
   */
  const getTypeLabel = useCallback((tipe) => {
    const labels = {
      pola_ruang: 'Pola Ruang',
      struktur_ruang: 'Struktur Ruang',
      ketentuan_khusus: 'Ketentuan Khusus',
      pkkprl: 'PKKPRL',
      indikasi_program: 'Indikasi Program'
    };
    return labels[tipe] || '';
  }, []);

  // Search state and debounced value
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Use helpers from searchUtils module
  const searchInputRef = useRef(null);

  const highlightText = useCallback(
    (text = '') => {
      const parts = highlightParts(text, debouncedSearch);
      return parts.map((p, i) =>
        p.match ? (
          <span key={i} className="rounded bg-yellow-200 px-0.5">
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      );
    },
    [debouncedSearch]
  );

  // Keyboard shortcut: focus search input when user types '/'
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        try {
          searchInputRef.current?.focus?.();
          // Place caret at end
          const val = searchInputRef.current?.input?.value ?? searchInputRef.current?.value;
          if (typeof val === 'string') {
            const inputEl = searchInputRef.current?.input || searchInputRef.current;
            if (inputEl.setSelectionRange) inputEl.setSelectionRange(val.length, val.length);
          }
        } catch (err) {
          console.warn('Search focus error', err);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /**
   * Render layer tree sections
   */
  const filterTree = useCallback((treeData) => filterTreeUtil(treeData, debouncedSearch), [debouncedSearch]);

  const renderLayerTree = useCallback(
    (treeData, labelKey) => {
      if (!Array.isArray(treeData)) return null;
      return treeData.map((item) => {
        const itemMatches = debouncedSearch && (item.title || '').toLowerCase().includes(debouncedSearch);
        const defaultOpen = !!debouncedSearch && (itemMatches || (item.children || []).some((c) => ((c.title || c.nama) + '').toLowerCase().includes(debouncedSearch)));

        return (
          <div key={item.key} className="mt-2">
            <CollapsibleSection title={<>{highlightText(`${item.title} (${getTypeLabel(item.tipe)})`, debouncedSearch)}</>} panelKey={item.key} defaultActiveKey={defaultOpen ? [item.key] : undefined}>
              {(item.children || []).map((pemetaan) => {
                if (pemetaan.type === 'indikasi_program') {
                  return (
                    <div key={pemetaan.key} className="inline-flex w-full items-center gap-x-2">
                      <span>{highlightText(pemetaan.title, debouncedSearch)}</span>
                      <Button icon={<InfoCircleOutlined />} type="link" size="small" onClick={() => showDokumenModal(pemetaan.file_dokumen)} />
                    </div>
                  );
                }

                // Fallback tipe_geometri jika tidak ada (default polygon)
                const tipe_geometri = pemetaan.tipe_geometri || 'polygon';
                return (
                  <div key={pemetaan.key} className="mb-2">
                    <LayerCheckbox
                      pemetaan={pemetaan}
                      label={highlightText(pemetaan.title || pemetaan.nama, debouncedSearch)}
                      isChecked={!!selectedLayers[pemetaan.key]}
                      isLoading={loadingLayers[pemetaan.key]}
                      onToggle={() => onToggleLayer(pemetaan)}
                      onInfoClick={() =>
                        showInfoModal(pemetaan.nama, [
                          { key: 'name', label: `Nama ${labelKey}`, children: pemetaan.nama },
                          { key: 'desc', label: 'Deskripsi', children: pemetaan.deskripsi }
                        ])
                      }
                    />
                    {/* Legend SELALU tampil di bawah checkbox, baik dicentang maupun tidak */}
                    {/* PERBAIKAN: Kirim prop tipe_garis ke LegendItem */}
                    <LegendItem tipe_geometri={tipe_geometri} icon_titik={pemetaan.icon_titik} warna={pemetaan.warna} nama={pemetaan.nama} tipe_garis={pemetaan.tipe_garis} />
                  </div>
                );
              })}
            </CollapsibleSection>
          </div>
        );
      });
    },
    [selectedLayers, loadingLayers, onToggleLayer, showInfoModal, showDokumenModal, getTypeLabel, debouncedSearch, highlightText]
  );

  return (
    <div className="relative flex h-full">
      {/* Toggle Button - responsive positioning */}
      {!isMobile && (
        <Tooltip title={isCollapsed ? 'Buka Panel' : 'Tutup Panel'} placement="left">
          <Button
            type="primary"
            icon={isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleCollapse}
            className="absolute -left-10 top-1/2 z-[1001] h-12 w-10 -translate-y-1/2 rounded-l-lg rounded-r-none shadow-lg"
            style={{ right: '100%', left: 'auto' }}
          />
        </Tooltip>
      )}

      {/* Sidebar Content */}
      <div className={`h-full overflow-y-auto bg-white shadow-xl transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 overflow-hidden p-0' : `w-full ${isMobile ? 'p-4' : 'p-6'}`}`}>
        {/* Mobile Header with Close Button */}
        {isMobile && !isCollapsed && (
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <Typography.Title level={5} style={{ margin: 0 }}>
              Layer Control
            </Typography.Title>
            <Button type="text" icon={<MenuFoldOutlined />} onClick={onToggleCollapse} className="text-gray-500" />
          </div>
        )}

        <div className={`flex flex-col ${isMobile ? 'min-w-0' : 'min-w-[340px]'} ${isCollapsed ? 'invisible opacity-0' : 'visible opacity-100'}`}>
          {/* Header - hide on mobile since we have it above */}
          {!isMobile && (
            <div className="flex flex-col">
              <Typography.Title level={5} style={{ margin: 0 }}>
                Legenda Geospasial
              </Typography.Title>
              <p className="text-sm text-gray-500">Pencarian</p>
            </div>
          )}

          {/* Search box */}
          <div className="mt-2">
            <Input
              ref={searchInputRef}
              placeholder="Cari legenda atau klasifikasi..."
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="large"
              aria-label="Cari legenda atau klasifikasi"
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
          </div>

          {/* Klasifikasi akan dimuat otomatis saat halaman dibuka */}
          <div>
            {/* Show reload when there are no classifications in any group */}
            {(() => {
              const hasAnyClassification =
                Array.isArray(treeLayerGroup) &&
                treeLayerGroup.some((layer) => {
                  const t = layer.tree || {};
                  return (
                    (t.pola && t.pola.length > 0) ||
                    (t.struktur && t.struktur.length > 0) ||
                    (t.ketentuan && t.ketentuan.length > 0) ||
                    (t.pkkprl && t.pkkprl.length > 0) ||
                    (t.indikasi && t.indikasi.length > 0) ||
                    (t.data_spasial && t.data_spasial.length > 0)
                  );
                });

              if (!isLoadingKlasifikasi && !hasAnyClassification) {
                return (
                  <div className="mt-3">
                    <div className="mb-2 text-sm text-gray-500">Tidak ada data klasifikasi. Coba muat ulang.</div>
                    {typeof onReloadKlasifikasi === 'function' ? <Button onClick={onReloadKlasifikasi}>Muat Ulang</Button> : <Button disabled>Muat Ulang</Button>}
                  </div>
                );
              }

              return null;
            })()}
          </div>

          {/* Batas Administrasi Section */}
          <div className="mt-2">
            {/* Batas Administrasi - searchable */}
            {(() => {
              const parentLabel = 'Batas Administrasi';
              let filteredBatas;
              if (!debouncedSearch) filteredBatas = batasAdministrasi;
              else if (fuzzyMatch(debouncedSearch, parentLabel)) {
                // Query matches the parent label -> show all items
                filteredBatas = batasAdministrasi;
              } else {
                filteredBatas = filterList(batasAdministrasi, debouncedSearch, ['name', 'nama']);
              }

              const batasOpen = Boolean(debouncedSearch && filteredBatas.length > 0);

              return (
                <CollapsibleSection title={<>{highlightText('Batas Administrasi')}</>} panelKey="batas" defaultActiveKey={batasOpen ? ['batas'] : ['batas']}>
                  {isLoadingBatas && (
                    <>
                      <Checkbox>
                        <Skeleton.Input size="small" active />
                      </Checkbox>
                      <Checkbox>
                        <Skeleton.Input size="small" active />
                      </Checkbox>
                    </>
                  )}

                  {!isLoadingBatas && filteredBatas.length === 0 && <div className="text-sm italic text-gray-500">Tidak ada data batas administrasi yang cocok.</div>}

                  {filteredBatas.map((item) => {
                    const pemetaan = createBatasPemetaan(item);
                    return (
                      <div key={pemetaan.key} className="mb-2">
                        <LayerCheckbox
                          pemetaan={{ ...pemetaan, title: item.name }}
                          label={highlightText(item.name)}
                          isChecked={!!selectedLayers[pemetaan.key]}
                          isLoading={loadingLayers[pemetaan.key]}
                          onToggle={() => onToggleLayer(pemetaan)}
                          onInfoClick={() =>
                            showInfoModal(item.name, [
                              { key: 'name', label: 'Nama Area', children: item.name },
                              { key: 'desc', label: 'Deskripsi', children: item.desc }
                            ])
                          }
                        />
                        {/* Legend untuk batas administrasi */}
                        <LegendItem tipe_geometri={pemetaan.tipe_geometri || 'polyline'} icon_titik={pemetaan.icon_titik} warna={pemetaan.warna} nama={pemetaan.nama} tipe_garis={pemetaan.tipe_garis} />
                      </div>
                    );
                  })}
                </CollapsibleSection>
              );
            })()}
          </div>

          {/* Layer Tree Sections */}
          {isLoadingKlasifikasi ? (
            <div className="mt-4">
              <LoadingSkeleton />
            </div>
          ) : (
            <div className="flex flex-col">
              {/* If searching, compute whether any group has matches and show Empty if none */}
              {(() => {
                if (debouncedSearch) {
                  const anyMatch = treeLayerGroup.some((layer) => {
                    const t = layer.tree || {};
                    return (
                      filterTree(t.pola || []).length > 0 ||
                      filterTree(t.struktur || []).length > 0 ||
                      filterTree(t.ketentuan || []).length > 0 ||
                      filterTree(t.pkkprl || []).length > 0 ||
                      filterTree(t.indikasi || []).length > 0 ||
                      filterTree(t.data_spasial || []).length > 0
                    );
                  });

                  if (!anyMatch) {
                    return (
                      <div className="mt-4">
                        <Empty description={`Tidak ditemukan: "${search}"`} />
                      </div>
                    );
                  }
                }

                return treeLayerGroup.map((layer) => (
                  <React.Fragment key={layer.id || layer.key}>
                    {/* Debug log to inspect runtime object when troubleshooting */}
                    {typeof window !== 'undefined' && window.__DEBUG_MAPSIDEBAR__ && console.debug('MapSidebar layer:', layer)}
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {layer.layer_group_name || layer.nama || layer.name || layer.title || layer.deskripsi}
                    </Typography.Title>

                    {renderLayerTree(debouncedSearch ? filterTree(layer.tree.pola || []) : layer.tree.pola || [], 'Pola Ruang')}
                    {renderLayerTree(debouncedSearch ? filterTree(layer.tree.struktur || []) : layer.tree.struktur || [], 'Struktur Ruang')}
                    {renderLayerTree(debouncedSearch ? filterTree(layer.tree.ketentuan || []) : layer.tree.ketentuan || [], 'Ketentuan Khusus')}
                    {renderLayerTree(debouncedSearch ? filterTree(layer.tree.pkkprl || []) : layer.tree.pkkprl || [], 'PKKPRL')}
                    {renderLayerTree(debouncedSearch ? filterTree(layer.tree.indikasi || []) : layer.tree.indikasi || [], 'Indikasi Program')}
                    {renderLayerTree(debouncedSearch ? filterTree(layer.tree.data_spasial || []) : layer.tree.data_spasial || [], 'Data Spasial')}
                    {renderLayerTree(debouncedSearch ? filterTree(layer.tree.batas || []) : layer.tree.batas || [], 'Batas Administrasi')}

                    <hr className="mb-4" />
                  </React.Fragment>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapSidebar;
