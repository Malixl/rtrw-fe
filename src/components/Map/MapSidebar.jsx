/* eslint-disable react/prop-types */
import React, { useCallback } from 'react';
import { Button, Checkbox, Collapse, Skeleton, Typography, Tooltip } from 'antd';
import { AimOutlined, InfoCircleOutlined, MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useCrudModal } from '@/hooks';
import asset from '@/utils/asset';
import MapUserInfo from './MapUserInfo';

const { Panel } = Collapse;

/**
 * LayerCheckbox - Reusable checkbox component for layer items
 */
const LayerCheckbox = ({ pemetaan, isChecked, isLoading, onToggle, onInfoClick }) => (
  <Checkbox checked={isChecked} onChange={onToggle}>
    <span className="inline-flex items-center gap-x-2">
      {pemetaan.title || pemetaan.nama}
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
      <div className="flex flex-col gap-y-2 px-4">{children}</div>
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
      nama: item.name,
      warna: item.color || '#000000',
      tipe_garis: 'solid',
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

  /**
   * Render layer tree sections
   */
  const renderLayerTree = useCallback(
    (treeData, labelKey) => {
      return treeData.map((item) => (
        <div key={item.key} className="mt-2">
          <CollapsibleSection title={`${item.title} (${getTypeLabel(item.tipe)})`} panelKey={item.key}>
            {item.children.map((pemetaan) => {
              if (pemetaan.type === 'indikasi_program') {
                return (
                  <div key={pemetaan.key} className="inline-flex w-full items-center gap-x-2">
                    <span>{pemetaan.title}</span>
                    <Button icon={<InfoCircleOutlined />} type="link" size="small" onClick={() => showDokumenModal(pemetaan.file_dokumen)} />
                  </div>
                );
              }

              return (
                <LayerCheckbox
                  key={pemetaan.key}
                  pemetaan={pemetaan}
                  isChecked={!!selectedLayers[pemetaan.key]}
                  isLoading={loadingLayers[pemetaan.key]}
                  onToggle={() => {
                    console.log('CLICK:', pemetaan.key);
                    onToggleLayer(pemetaan);
                  }}
                  onInfoClick={() =>
                    showInfoModal(pemetaan.nama, [
                      { key: 'name', label: `Nama ${labelKey}`, children: pemetaan.nama },
                      { key: 'desc', label: 'Deskripsi', children: pemetaan.deskripsi }
                    ])
                  }
                />
              );
            })}
          </CollapsibleSection>
        </div>
      ));
    },
    [selectedLayers, loadingLayers, onToggleLayer, showInfoModal, showDokumenModal, getTypeLabel]
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

        <div className={`flex flex-col gap-y-4 ${isMobile ? 'min-w-0' : 'min-w-[340px]'} ${isCollapsed ? 'invisible opacity-0' : 'visible opacity-100'}`}>
          {/* User Info */}
          <MapUserInfo />

          {/* Header - hide on mobile since we have it above */}
          {!isMobile && (
            <div className="flex flex-col">
              <Typography.Title level={5} style={{ margin: 0 }}>
                Geospasial
              </Typography.Title>
              <p className="text-sm text-gray-500">Tampilan Map</p>
            </div>
          )}

          {/* Batas Administrasi Section */}
          <div className="mt-2">
            <CollapsibleSection title="Batas Administrasi" panelKey="batas" defaultActiveKey={['batas']}>
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

              {!isLoadingBatas && batasAdministrasi.length === 0 && <div className="text-sm italic text-gray-500">Tidak ada data batas administrasi.</div>}

              {batasAdministrasi.map((item) => {
                const pemetaan = createBatasPemetaan(item);
                return (
                  <LayerCheckbox
                    key={pemetaan.key}
                    pemetaan={{ ...pemetaan, title: item.name }}
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
                );
              })}
            </CollapsibleSection>
          </div>

          {/* Layer Tree Sections */}
          {isLoadingKlasifikasi ? (
            <div className="mt-4">
              <LoadingSkeleton />
            </div>
          ) : (
            <div className="flex flex-col">
              {treeLayerGroup.map((layer) => (
                <React.Fragment key={layer.id || layer.key}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {layer.deskripsi}
                  </Typography.Title>
                  {renderLayerTree(layer.tree.pola, 'Pola Ruang')}
                  {renderLayerTree(layer.tree.struktur, 'Struktur Ruang')}
                  {renderLayerTree(layer.tree.ketentuan, 'Ketentuan Khusus')}
                  {renderLayerTree(layer.tree.pkkprl, 'PKKPRL')}
                  {renderLayerTree(layer.tree.indikasi, 'Indikasi Program')}
                  {renderLayerTree(layer.tree.data_spasial, 'Data Spasial')}
                  <hr className="mb-4" />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapSidebar;
