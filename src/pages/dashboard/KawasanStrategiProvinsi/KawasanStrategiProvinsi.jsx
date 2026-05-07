/* eslint-disable no-unused-vars */
import { DataTable, DataTableHeader } from '@/components';
import { Action, InputType } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { KlasifikasisService, KawasanStrategiProvinsiService } from '@/services';
import { Card, ColorPicker, Skeleton, Space } from 'antd';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { KawasanStrategiProvinsi as KawasanStrategiProvinsiModel } from '@/models';
import { useParams } from 'react-router-dom';
import { extractUploadFile, hasNewUploadFile, normalizeColorValue } from '@/utils/formData';
import UploadProgress from '@/components/dashboard/UploadProgress';
import { EnvironmentOutlined, ExpandAltOutlined, ExpandOutlined, ReloadOutlined } from '@ant-design/icons';
import { useChunkedUpload } from '@/hooks';
import { CHUNKED_UPLOAD_THRESHOLD } from '@/hooks/useChunkedUpload';

const { UPDATE, READ, DELETE } = Action;

const buildEditFieldsByGeometry = (record, klasifikasis) => {
  let fields = [...formFields({ options: { klasifikasi: klasifikasis } })];

  if (record.geometry_type === 'point') {
    fields.push({
      label: `Gambar Icon ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
      name: 'icon',
      type: InputType.UPLOAD,
      max: 1,
      beforeUpload: () => false,
      getFileList: () => {
        return record?.point_icon
          ? [
              {
                url: record.point_icon,
                name: record.name || 'icon',
                status: 'done'
              }
            ]
          : [];
      },
      accept: ['.jpg', '.jpeg', '.png', '.svg'],
      rules: []
    });
  }

  if (record.geometry_type === 'polyline') {
    fields.push(
      {
        label: `Tipe garis ${Modul.STRUKTUR}`,
        name: 'line_type',
        type: InputType.SELECT,
        rules: [
          {
            required: true,
            message: `Tipe garis ${Modul.STRUKTUR} harus diisi`
          }
        ],
        options: [
          { label: <div className="w-full border-4 border-black" />, value: 'bold' },
          { label: <div className="w-full border border-black" />, value: 'solid' },
          { label: <div className="w-full border border-dashed border-black" />, value: 'dashed' },
          {
            label: (
              <div
                className="w-full border-2"
                style={{
                  borderStyle: 'dashed',
                  borderColor: 'black',
                  borderImage:
                    'repeating-linear-gradient(90deg, currentColor 0, currentColor 10px, transparent 10px, transparent 13px, currentColor 13px, currentColor 15px, transparent 15px, transparent 18px, currentColor 18px, currentColor 20px, transparent 20px, transparent 23px) 1'
                }}
              />
            ),
            value: 'dash-dot-dot'
          },
          {
            label: (
              <div
                className="w-full border-2"
                style={{
                  borderStyle: 'dashed',
                  borderColor: 'black',
                  borderImage:
                    'repeating-linear-gradient(90deg, currentColor 0, currentColor 12px, transparent 12px, transparent 16px, currentColor 16px, currentColor 18px, transparent 18px, transparent 22px, currentColor 22px, currentColor 34px, transparent 34px, transparent 38px, currentColor 38px, currentColor 40px, transparent 40px, transparent 44px, currentColor 44px, currentColor 46px, transparent 46px, transparent 50px) 1'
                }}
              />
            ),
            value: 'dash-dot-dash-dot-dot'
          }
        ]
      },
      {
        label: `Warna ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
        name: 'color',
        type: InputType.COLOR,
        rules: [
          {
            required: true,
            message: `Warna ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
          }
        ],
        size: 'large'
      }
    );
  }

  if (record.geometry_type === 'polygon') {
    fields.push({
      label: `Warna ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
      name: 'color',
      type: InputType.COLOR,
      rules: [
        {
          required: true,
          message: `Warna ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
        }
      ],
      size: 'large'
    });
  }

  return fields;
};

const KawasanStrategiProvinsiPage = () => {
  const { token, user } = useAuth();
  const params = useParams();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllKawasanStrategiProvinsi } = useService(KawasanStrategiProvinsiService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storeKawasanStrategiProvinsi = useService(KawasanStrategiProvinsiService.store);
  const updateKawasanStrategiProvinsi = useService(KawasanStrategiProvinsiService.update);
  const storeWithMerged = useService(KawasanStrategiProvinsiService.storeWithMergedFile);
  const updateWithMerged = useService(KawasanStrategiProvinsiService.updateWithMergedFile);
  const deleteKawasanStrategiProvinsi = useService(KawasanStrategiProvinsiService.delete);
  const deleteBatchKawasanStrategiProvinsi = useService(KawasanStrategiProvinsiService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });
  const [uploadProgress, setUploadProgress] = React.useState({ visible: false, percent: 0, loaded: 0, total: 0, phaseText: '' });
  const resetProgress = () => setUploadProgress({ visible: false, percent: 0, loaded: 0, total: 0, phaseText: '' });
  const onProgress = (p) => setUploadProgress({ visible: true, ...p });

  const chunkedUpload = useChunkedUpload();
  const pendingGeoJsonFileRef = React.useRef(null);

  const pagination = usePagination({ totalData: getAllKawasanStrategiProvinsi.totalData });

  const [selectedKawasanStrategiProvinsi, setSelectedKawasanStrategiProvinsi] = React.useState([]);

  const fetchKawasanStrategiProvinsi = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search,
      ...(params.klasifikasi_id ? { klasifikasi_id: params.klasifikasi_id } : {})
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, params.klasifikasi_id, token]);

  React.useEffect(() => {
    fetchKawasanStrategiProvinsi();
    fetchKlasifikasis({ token: token, tipe: 'kawasan_strategi_provinsi' });
  }, [fetchKlasifikasis, fetchKawasanStrategiProvinsi, pagination.page, pagination.per_page, token]);

  const kawasanStrategiProvinsi = getAllKawasanStrategiProvinsi.data ?? [];
  const klasifikasis = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Nama',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Klasifikasi Kawasan Strategi Provinsi',
      render: (_, record) => {
        const id = record.klasifikasi_id ?? record.klasifikasi?.id ?? record.klasifikasi;
        const klas = klasifikasis.find((k) => k.id === id);
        return klas?.nama || klas?.name || '-';
      }
    }
  ];

  if (user && user.eitherCan([UPDATE, KawasanStrategiProvinsiModel], [DELETE, KawasanStrategiProvinsiModel], [READ, KawasanStrategiProvinsiModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.KAWASAN_STRATEGI_PROVINSI}`}
            model={KawasanStrategiProvinsiModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
                data: {
                  ...record,
                  id_klasifikasi: record.klasifikasi_id,
                  icon: record.point_icon ?? null
                },
                formFields: buildEditFieldsByGeometry(record, klasifikasis),
                onSubmit: async (values) => {
                  const payload = {
                    ...values,
                    color: normalizeColorValue(values.color),
                    geometry_type: record.geometry_type
                  };

                  delete payload.geojson_file;
                  delete payload.icon;

                  const files = {};

                  let geoFile = null;
                  if (hasNewUploadFile(values.geojson_file)) {
                    const geo = extractUploadFile(values.geojson_file);
                    geoFile = geo?.geojson_file ?? geo;
                    files.geojson_file = geoFile;
                  }

                  let iconFile = null;
                  if (record.geometry_type === 'point' && hasNewUploadFile(values.icon)) {
                    const icon = extractUploadFile(values.icon);
                    iconFile = icon?.icon ?? icon;
                    files.icon_titik = iconFile;
                  }

                  let result;

                  if (geoFile && geoFile.size >= CHUNKED_UPLOAD_THRESHOLD) {
                    pendingGeoJsonFileRef.current = geoFile;
                    setUploadProgress({ visible: true, percent: 0, loaded: 0, total: geoFile.size, phaseText: 'Memulai chunked upload...' });

                    const mergedPath = await chunkedUpload.startUpload(geoFile, token);

                    if (!mergedPath) {
                      setUploadProgress((prev) => ({ ...prev, phaseText: chunkedUpload.error || 'Upload gagal' }));
                      return false;
                    }

                    result = await updateWithMerged.execute(record.id, payload, token, mergedPath, iconFile);
                  } else {
                    const fileToSend = Object.keys(files).length ? files : null;
                    result = await updateKawasanStrategiProvinsi.execute(record.id, payload, token, fileToSend, onProgress);
                  }

                  const { message, isSuccess } = result;

                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchKawasanStrategiProvinsi();
                  } else {
                    error('Gagal', message);
                  }

                  return isSuccess;
                },
                afterClose: resetProgress
              });
            }}
          />

          <Detail
            title={`Detail ${Modul.KAWASAN_STRATEGI_PROVINSI}`}
            model={KawasanStrategiProvinsiModel}
            disabled
            style={{ display: 'none' }}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Kawasan Strategi Provinsi`,
                    children: record.name
                  },
                  {
                    key: 'desc',
                    label: `Deskripsi`,
                    children: record.desc
                  },
                  {
                    key: 'name',
                    label: `Nama Klasifikasi`,
                    children: record.klasifikasi.name
                  },
                  {
                    key: 'desc',
                    label: `Deskripsi Klasifikasi`,
                    children: record.klasifikasi.desc
                  },
                  {
                    key: 'type',
                    label: `Tipe Klasifikasi`,
                    children: record.klasifikasi.type
                  }
                ]
              });
            }}
          />
          <Delete
            title={`Delete ${Modul.KAWASAN_STRATEGI_PROVINSI}`}
            model={KawasanStrategiProvinsiModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteKawasanStrategiProvinsi.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchKawasanStrategiProvinsi();
                  } else {
                    error('Gagal', message);
                  }
                  return isSuccess;
                }
              });
            }}
          />
        </Space>
      )
    });
  }

  const onModalCreate = (type) => {
    let fields = [...formFields({ options: { klasifikasi: klasifikasis } })];

    if (type === 'point') {
      fields.push({
        label: `Gambar Icon ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
        name: 'icon',
        type: InputType.UPLOAD,
        max: 1,
        beforeUpload: () => {
          return false;
        },
        getFileList: (data) => {
          return [
            {
              url: data?.icon,
              name: data?.name
            }
          ];
        },
        accept: ['.jpg', '.jpeg', '.png', '.svg'],
        rules: [
          {
            required: true,
            message: `Icon ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
          }
        ]
      });
    } else if (type === 'polyline') {
      fields.push(
        {
          label: `Tipe garis ${Modul.STRUKTUR}`,
          name: 'line_type',
          type: InputType.SELECT,
          rules: [
            {
              required: true,
              message: `Tipe garis ${Modul.STRUKTUR} harus diisi`
            }
          ],
          options: [
            {
              label: <div className="w-full border-4 border-black" />,
              value: 'bold'
            },
            {
              label: <div className="w-full border border-black" />,
              value: 'solid'
            },
            {
              label: <div className="w-full border border-dashed border-black" />,
              value: 'dashed'
            },
            {
              label: (
                <div
                  className="w-full border-2"
                  style={{
                    borderStyle: 'dashed',
                    borderColor: 'black',
                    borderImage:
                      'repeating-linear-gradient(90deg, currentColor 0, currentColor 10px, transparent 10px, transparent 13px, currentColor 13px, currentColor 15px, transparent 15px, transparent 18px, currentColor 18px, currentColor 20px, transparent 20px, transparent 23px) 1'
                  }}
                />
              ),
              value: 'dash-dot-dot'
            },
            {
              label: (
                <div
                  className="w-full border-2"
                  style={{
                    borderStyle: 'dashed',
                    borderColor: 'black',
                    borderImage:
                      'repeating-linear-gradient(90deg, currentColor 0, currentColor 12px, transparent 12px, transparent 16px, currentColor 16px, currentColor 18px, transparent 18px, transparent 22px, currentColor 22px, currentColor 34px, transparent 34px, transparent 38px, currentColor 38px, currentColor 40px, transparent 40px, transparent 44px, currentColor 44px, currentColor 46px, transparent 46px, transparent 50px) 1'
                  }}
                />
              ),
              value: 'dash-dot-dash-dot-dot'
            }
          ]
        },
        {
          label: `Warna ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
          name: 'color',
          type: InputType.COLOR,
          rules: [
            {
              required: true,
              message: `Warna ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
            }
          ],
          size: 'large'
        }
      );
    } else if (type === 'polygon') {
      fields.push({
        label: `Warna ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
        name: 'color',
        type: InputType.COLOR,
        rules: [
          {
            required: true,
            message: `Warna ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
          }
        ],
        size: 'large'
      });
    }

    modal.create({
      title: `Tambah ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
      data: { geometry_type: type },
      formFields: fields,
      onSubmit: async (values) => {
        const payload = {
          ...values,
          color: normalizeColorValue(values.color),
          geometry_type: type
        };

        delete payload.geojson_file;
        delete payload.icon;

        const geojsonFile = extractUploadFile(values.geojson_file);
        const geoFile = geojsonFile?.geojson_file ?? geojsonFile;

        const iconExtracted = type === 'point' ? extractUploadFile(values.icon) : null;
        const iconFile = iconExtracted?.icon ?? iconExtracted;

        let result;

        if (geoFile && geoFile.size >= CHUNKED_UPLOAD_THRESHOLD) {
          pendingGeoJsonFileRef.current = geoFile;
          setUploadProgress({ visible: true, percent: 0, loaded: 0, total: geoFile.size, phaseText: 'Memulai chunked upload...' });

          const mergedPath = await chunkedUpload.startUpload(geoFile, token);

          if (!mergedPath) {
            setUploadProgress((prev) => ({ ...prev, phaseText: chunkedUpload.error || 'Upload gagal' }));
            return false;
          }

          result = await storeWithMerged.execute(payload, token, mergedPath, iconFile);
        } else {
          const fileToSend = {
            geojson_file: geoFile,
            icon_titik: iconFile
          };
          result = await storeKawasanStrategiProvinsi.execute(payload, token, fileToSend, onProgress);
        }

        const { message, isSuccess } = result;

        if (isSuccess) {
          success('Berhasil', message);
          fetchKawasanStrategiProvinsi();
        } else {
          error('Gagal', message);
        }

        return isSuccess;
      },
      afterClose: resetProgress
    });
  };

  const onCreate = () => {
    modal.show.paragraph({
      data: {
        content: (
          <div className="mt-4 flex items-center justify-center gap-x-4">
            <Card
              className="h-full w-full"
              hoverable
              onClick={() => {
                onModalCreate('point');
              }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-y-2">
                <EnvironmentOutlined className="mb-2 text-3xl" />
                <span className="text-sm font-semibold">Point</span>
                <small className="text-center text-gray-500">Data spasial titik koordinat.</small>
              </div>
            </Card>
            <Card
              className="h-full w-full"
              hoverable
              onClick={() => {
                onModalCreate('polyline');
              }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-y-2">
                <ExpandAltOutlined className="mb-2 text-3xl" />
                <span className="text-sm font-semibold">Polyline</span>
                <small className="text-center text-gray-500">Data spasial garis koordinat.</small>
              </div>
            </Card>
            <Card
              className="h-full w-full"
              hoverable
              onClick={() => {
                onModalCreate('polygon');
              }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-y-2">
                <ExpandOutlined className="mb-2 text-3xl" />
                <span className="text-sm font-semibold">Polygon</span>
                <small className="text-center text-gray-500">Data spasial area koordinat.</small>
              </div>
            </Card>
          </div>
        )
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedKawasanStrategiProvinsi.length} ${Modul.KAWASAN_STRATEGI_PROVINSI} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedKawasanStrategiProvinsi.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchKawasanStrategiProvinsi.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchKlasifikasis(token, pagination.page, pagination.per_page);
          setSelectedKawasanStrategiProvinsi([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  // Sync chunked upload progress
  React.useEffect(() => {
    if (chunkedUpload.isUploading || chunkedUpload.progress.phase === 'merging') {
      setUploadProgress({
        visible: true,
        percent: chunkedUpload.progress.percent,
        loaded: 0,
        total: 0,
        phaseText: chunkedUpload.progress.phaseText,
      });
    } else if (chunkedUpload.progress.phase === 'done' || chunkedUpload.progress.phase === 'idle') {
      resetProgress();
    }
  }, [chunkedUpload.isUploading, chunkedUpload.progress]);

  const handleRetryChunkedUpload = React.useCallback(async () => {
    if (!pendingGeoJsonFileRef.current) return;
    await chunkedUpload.retry(pendingGeoJsonFileRef.current, token);
  }, [chunkedUpload, token]);

  return (
    <Card>
      <Skeleton loading={getAllKawasanStrategiProvinsi.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.KAWASAN_STRATEGI_PROVINSI} onDeleteBatch={onDeleteBatch} selectedData={selectedKawasanStrategiProvinsi} onSearch={(values) => setFilterValues({ search: values })} model={KawasanStrategiProvinsiModel} />
        <UploadProgress {...uploadProgress} onClose={resetProgress} />

        {chunkedUpload.progress.phase === 'error' && (
          <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">
                {chunkedUpload.error || 'Upload gagal. Klik Retry untuk melanjutkan dari chunk terakhir.'}
              </span>
              <Button
                type="primary"
                danger
                icon={<ReloadOutlined />}
                size="small"
                onClick={handleRetryChunkedUpload}
                loading={chunkedUpload.isUploading}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <div className="w-full max-w-full overflow-x-auto">
          <DataTable data={kawasanStrategiProvinsi} columns={column} loading={getAllKawasanStrategiProvinsi.isLoading} map={(registrant) => ({ key: registrant.id, ...registrant })} pagination={pagination} handleSelectedData={(_, selectedRows) => setSelectedKawasanStrategiProvinsi(selectedRows)} />
        </div>
      </Skeleton>
    </Card>
  );
};

export default KawasanStrategiProvinsiPage;
