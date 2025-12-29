/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useCrudModal, useNotification, useService } from '@/hooks';
import { LayerGroupsService } from '@/services';
import { BASE_URL } from '@/utils/api';
import asset from '@/utils/asset';
import { AimOutlined, InfoCircleOutlined, MenuOutlined } from '@ant-design/icons';
import { Button, Checkbox, Collapse, Form, Select, Skeleton, Typography } from 'antd';
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { getLeafletIcon } from '@/utils/leafletIcon';
import * as AntdIcons from '@ant-design/icons';

const Maps = () => {
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const modal = useCrudModal();
  const [selectedLayers, setSelectedLayers] = React.useState({});
  const { execute, ...getAllLayerGroups } = useService(LayerGroupsService.layerGroupWithKlasifikasi);
  const [loadingLayers, setLoadingLayers] = React.useState({});
  const [treePolaRuangData, setTreePolaRuangData] = React.useState([]);
  const [treeStrukturRuangData, setTreeStrukturRuangData] = React.useState([]);
  const [treeKetentuanKhususData, setTreeKetentuanKhususData] = React.useState([]);
  const [treePkkprlData, setTreePkkprlData] = React.useState([]);
  const [treeIndikasiProgramData, setTreeIndikasiProgramData] = React.useState([]);

  const [layerGroupTrees, setLayerGroupTrees] = React.useState([]);

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

      const res = await fetch(url);
      const json = await res.json();
      const warna = pemetaan.warna ?? null;
      const iconName = pemetaan.icon_titik ?? null;
      const tipe_garis = pemetaan.tipe_garis ?? null;

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
            props['fill-opacity'] = props['fill-opacity'] ?? 0.8;
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

  function mapPolaRuang(data) {
    console.log(data);

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
        const indikasi_program_list = klasifikasis.klasifikasi_indikasi_program ?? [];

        return {
          id: group.id,
          nama: group.layer_group_name,
          deskripsi: group.deskripsi,
          urutan: group.urutan_tampil,

          // 🔥 HASIL TREEMAP LAMA KAMU
          tree: {
            pola: mapPolaRuang(pola_ruang_list),
            struktur: mapStrukturRuang(struktur_ruang_list),
            ketentuan: mapKetentuanKhusus(ketentuan_khusus_list),
            pkkprl: mapPkkprl(pkkprl_list),
            indikasi: mapIndikasiProgram(indikasi_program_list)
          }
        };
      });

      setLayerGroupTrees(result);
    }
  }, [layerGroupData]);

  console.log(layerGroupTrees);

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

  return (
    <section className="flex h-screen w-full">
      <div className="relative h-full w-full flex-[3]">
        <MapContainer center={[0.5412, 123.0595]} zoom={9} className="h-screen w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
                const name = feature.properties?.nama || feature.properties?.title || '';
                if (name) {
                  layerGeo.bindPopup(`<strong>${name}</strong>`);
                }
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
          </div>
        </div>
      </div>
      <div className="flex h-full w-full flex-[1] flex-col gap-y-4 overflow-y-auto bg-white p-8">
        <div className="inline-flex items-center justify-between">
          <div className="flex flex-col">
            <Typography.Title level={5} style={{ margin: 0 }}>
              Geospasial
            </Typography.Title>
            <p className="text-sm">Tampilan Map</p>
          </div>
          <Button variant="solid" color="primary" shape="round" onClick={() => navigate('/')}>
            Ke Beranda
          </Button>
        </div>

        {getAllLayerGroups.isLoading ? (
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-2">
              <div className="mt-4 flex flex-col gap-y-4">
                <Collapse ghost expandIcon={() => ''}>
                  <Collapse.Panel
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
                      <Checkbox>
                        <Skeleton.Input size="small" active />
                      </Checkbox>
                      <Checkbox>
                        <Skeleton.Input size="small" active />
                      </Checkbox>
                      <Checkbox>
                        <Skeleton.Input size="small" active />
                      </Checkbox>
                      <Checkbox>
                        <Skeleton.Input size="small" active />
                      </Checkbox>
                    </div>
                  </Collapse.Panel>
                </Collapse>
              </div>
            </div>
          </div>
        ) : (
          <>
            {layerGroupTrees.map((layerGroupTree) => (
              <>
                <div className="flex flex-col">
                  {layerGroupTree.tree.pola.map((item) => (
                    <div key={item.key} className="flex flex-col gap-y-2">
                      <div className="mt-2 flex flex-col gap-y-4">
                        <Collapse ghost expandIcon={() => ''}>
                          <Collapse.Panel
                            header={
                              <div className="inline-flex w-full items-center justify-between">
                                <div className="inline-flex w-full items-center gap-x-4">
                                  <div className="flex items-center justify-center rounded-md bg-blue-100 p-3">
                                    <AimOutlined className="text-blue-500" />
                                  </div>
                                  {item.title} {`(${item.tipe === 'struktur_ruang' ? 'Struktur Ruang' : ''})`}
                                </div>
                                <MenuOutlined />
                              </div>
                            }
                          >
                            <div className="flex flex-col gap-y-2 px-4">
                              {item.children.map((pemetaan) => (
                                <Checkbox key={pemetaan.key} onChange={() => handleToggleLayer(pemetaan)}>
                                  <span className="inline-flex items-center gap-x-2">
                                    {pemetaan.title}

                                    {loadingLayers[pemetaan.key] && <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>}
                                  </span>

                                  <Button
                                    icon={<InfoCircleOutlined />}
                                    type="link"
                                    onClick={() => {
                                      modal.show.description({
                                        title: pemetaan.nama,
                                        data: [
                                          {
                                            key: 'name',
                                            label: `Nama Struktur Ruang`,
                                            children: pemetaan.nama
                                          },
                                          {
                                            key: 'desc',
                                            label: `Deskripsi`,
                                            children: pemetaan.deskripsi
                                          }
                                        ]
                                      });
                                    }}
                                  />
                                </Checkbox>
                              ))}
                            </div>
                          </Collapse.Panel>
                        </Collapse>
                      </div>
                    </div>
                  ))}
                  {layerGroupTree.tree.struktur.map((item) => (
                    <div key={item.key} className="flex flex-col gap-y-2">
                      <div className="mt-2 flex flex-col gap-y-4">
                        <Collapse ghost expandIcon={() => ''}>
                          <Collapse.Panel
                            header={
                              <div className="inline-flex w-full items-center justify-between">
                                <div className="inline-flex w-full items-center gap-x-4">
                                  <div className="flex items-center justify-center rounded-md bg-blue-100 p-3">
                                    <AimOutlined className="text-blue-500" />
                                  </div>
                                  {item.title} {`(${item.klasifikasi.tipe === 'struktur_ruang' ? 'Struktur Ruang' : ''})`}
                                </div>
                                <MenuOutlined />
                              </div>
                            }
                          >
                            <div className="flex flex-col gap-y-2 px-4">
                              {item.children.map((pemetaan) => (
                                <Checkbox key={pemetaan.key} onChange={() => handleToggleLayer(pemetaan)}>
                                  <span className="inline-flex items-center gap-x-2">
                                    {pemetaan.title}

                                    {loadingLayers[pemetaan.key] && <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>}
                                  </span>

                                  <Button
                                    icon={<InfoCircleOutlined />}
                                    type="link"
                                    onClick={() => {
                                      modal.show.description({
                                        title: pemetaan.nama,
                                        data: [
                                          {
                                            key: 'name',
                                            label: `Nama Struktur Ruang`,
                                            children: pemetaan.nama
                                          },
                                          {
                                            key: 'desc',
                                            label: `Deskripsi`,
                                            children: pemetaan.deskripsi
                                          }
                                        ]
                                      });
                                    }}
                                  />
                                </Checkbox>
                              ))}
                            </div>
                          </Collapse.Panel>
                        </Collapse>
                      </div>
                    </div>
                  ))}
                  {layerGroupTree.tree.ketentuan.map((item) => (
                    <div key={item.key} className="flex flex-col gap-y-2">
                      <div className="mt-2 flex flex-col gap-y-4">
                        <Collapse ghost expandIcon={() => ''}>
                          <Collapse.Panel
                            header={
                              <div className="inline-flex w-full items-center justify-between">
                                <div className="inline-flex w-full items-center gap-x-4">
                                  <div className="flex items-center justify-center rounded-md bg-blue-100 p-3">
                                    <AimOutlined className="text-blue-500" />
                                  </div>
                                  {item.title} {`(${item.tipe === 'ketentuan_khusus' ? 'Ketentuan Khusus' : ''})`}
                                </div>
                                <MenuOutlined />
                              </div>
                            }
                          >
                            <div className="flex flex-col gap-y-2 px-4">
                              {item.children.map((pemetaan) => (
                                <Checkbox key={pemetaan.key} onChange={() => handleToggleLayer(pemetaan)}>
                                  <span className="inline-flex items-center gap-x-2">
                                    {pemetaan.title}

                                    {loadingLayers[pemetaan.key] && <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>}
                                  </span>

                                  <Button
                                    icon={<InfoCircleOutlined />}
                                    type="link"
                                    onClick={() => {
                                      modal.show.description({
                                        title: pemetaan.nama,
                                        data: [
                                          {
                                            key: 'name',
                                            label: `Nama Struktur Ruang`,
                                            children: pemetaan.nama
                                          },
                                          {
                                            key: 'desc',
                                            label: `Deskripsi`,
                                            children: pemetaan.deskripsi
                                          }
                                        ]
                                      });
                                    }}
                                  />
                                </Checkbox>
                              ))}
                            </div>
                          </Collapse.Panel>
                        </Collapse>
                      </div>
                    </div>
                  ))}
                  {layerGroupTree.tree.pkkprl.map((item) => (
                    <div key={item.key} className="flex flex-col gap-y-2">
                      <div className="mt-2 flex flex-col gap-y-4">
                        <Collapse ghost expandIcon={() => ''}>
                          <Collapse.Panel
                            header={
                              <div className="inline-flex w-full items-center justify-between">
                                <div className="inline-flex w-full items-center gap-x-4">
                                  <div className="flex items-center justify-center rounded-md bg-blue-100 p-3">
                                    <AimOutlined className="text-blue-500" />
                                  </div>
                                  {item.title} {`(${item.tipe === 'pkkprl' ? 'PKKPRL' : ''})`}
                                </div>
                                <MenuOutlined />
                              </div>
                            }
                          >
                            <div className="flex flex-col gap-y-2 px-4">
                              {item.children.map((pemetaan) => (
                                <Checkbox key={pemetaan.key} onChange={() => handleToggleLayer(pemetaan)}>
                                  <span className="inline-flex items-center gap-x-2">
                                    {pemetaan.title}

                                    {loadingLayers[pemetaan.key] && <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>}
                                  </span>

                                  <Button
                                    icon={<InfoCircleOutlined />}
                                    type="link"
                                    onClick={() => {
                                      modal.show.description({
                                        title: pemetaan.nama,
                                        data: [
                                          {
                                            key: 'name',
                                            label: `Nama Struktur Ruang`,
                                            children: pemetaan.nama
                                          },
                                          {
                                            key: 'desc',
                                            label: `Deskripsi`,
                                            children: pemetaan.deskripsi
                                          }
                                        ]
                                      });
                                    }}
                                  />
                                </Checkbox>
                              ))}
                            </div>
                          </Collapse.Panel>
                        </Collapse>
                      </div>
                    </div>
                  ))}
                  {layerGroupTree.tree.indikasi.map((item) => (
                    <div key={item.key} className="flex flex-col gap-y-2">
                      <div className="mt-2 flex flex-col gap-y-4">
                        <Collapse ghost expandIcon={() => ''}>
                          <Collapse.Panel
                            header={
                              <div className="inline-flex w-full items-center justify-between">
                                <div className="inline-flex w-full items-center gap-x-4">
                                  <div className="flex items-center justify-center rounded-md bg-blue-100 p-3">
                                    <AimOutlined className="text-blue-500" />
                                  </div>
                                  {item.title} {`(${item.tipe === 'indikasi_program' ? 'Indikasi Program' : ''})`}
                                </div>
                                <MenuOutlined />
                              </div>
                            }
                          >
                            <div className="flex flex-col gap-y-2 px-4">
                              {item.children.map((pemetaan) => (
                                <div key={pemetaan.key} className="inline-flex w-full items-center gap-x-2">
                                  <span>{pemetaan.title}</span>
                                  <Button
                                    icon={<InfoCircleOutlined />}
                                    type="link"
                                    onClick={() => {
                                      modal.show.paragraph({
                                        data: {
                                          content: <iframe className="min-h-96 w-full" src={asset(pemetaan.file_dokumen)} />
                                        }
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </Collapse.Panel>
                        </Collapse>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ))}
          </>
        )}

        {/* {getAllLayerGroups.isLoading ? (
         
        ) : (
          
        )} */}
      </div>
    </section>
  );
};

export default Maps;
