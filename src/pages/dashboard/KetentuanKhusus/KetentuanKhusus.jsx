/* eslint-disable no-unused-vars */
import { DataTable, DataTableHeader } from '@/components';
import { Action, InputType } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { KlasifikasisService, KetentuanKhususService } from '@/services';
import { Card, ColorPicker, Skeleton, Space } from 'antd';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { KetentuanKhusus as KetentuanKhususModel } from '@/models';
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
      label: `Gambar Icon ${Modul.KETENTUAN_KHUSUS}`,
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
        label: `Warna ${Modul.KETENTUAN_KHUSUS}`,
        name: 'color',
        type: InputType.COLOR,
        rules: [
          {
            required: true,
            message: `Warna ${Modul.KETENTUAN_KHUSUS} harus diisi`
          }
        ],
        size: 'large'
      }
    );
  }

  if (record.geometry_type === 'polygon') {
    fields.push({
      label: `Warna ${Modul.KETENTUAN_KHUSUS}`,
      name: 'color',
      type: InputType.COLOR,
      rules: [
        {
          required: true,
          message: `Warna ${Modul.KETENTUAN_KHUSUS} harus diisi`
        }
      ],
      size: 'large'
    });
  }

  return fields;
};

const KetentuanKhusus = () => {
  const { token, user } = useAuth();
  const params = useParams();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllKetentuanKhusus } = useService(KetentuanKhususService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storeKetentuanKhusus = useService(KetentuanKhususService.store);
  const updateKetentuanKhusus = useService(KetentuanKhususService.update);
  const storeWithMerged = useService(KetentuanKhususService.storeWithMergedFile);
  const updateWithMerged = useService(KetentuanKhususService.updateWithMergedFile);
  const deleteKetentuanKhusus = useService(KetentuanKhususService.delete);
  const deleteBatchKetentuanKhusus = useService(KetentuanKhususService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });
  const [uploadProgress, setUploadProgress] = React.useState({ visible: false, percent: 0, loaded: 0, total: 0, phaseText: '' });
  const resetProgress = () => setUploadProgress({ visible: false, percent: 0, loaded: 0, total: 0, phaseText: '' });
  const onProgress = (p) => setUploadProgress({ visible: true, ...p });

  const chunkedUpload = useChunkedUpload();
  const pendingGeoJsonFileRef = React.useRef(null);

  const pagination = usePagination({ totalData: getAllKetentuanKhusus.totalData });

  const [selectedKetentuanKhusus, setSelectedKetentuanKhusus] = React.useState([]);

  const fetchKetentuanKhusus = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search,
      ...(params.klasifikasi_id ? { klasifikasi_id: params.klasifikasi_id } : {})
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, params.klasifikasi_id, token]);

  React.useEffect(() => {
    fetchKetentuanKhusus();
    fetchKlasifikasis({ token: token, tipe: 'ketentuan_khusus' });
  }, [fetchKlasifikasis, fetchKetentuanKhusus, pagination.page, pagination.per_page, token]);

  const ketentuanKhusus = getAllKetentuanKhusus.data ?? [];
  const klasifikasis = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Nama',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Klasifikasi Ketentuan Khusus',
      render: (_, record) => {
        const id = record.klasifikasi_id ?? record.klasifikasi?.id ?? record.klasifikasi;
        const klas = klasifikasis.find((k) => k.id === id);
        return klas?.nama || klas?.name || '-';
      }
    }
  ];

  if (user && user.eitherCan([UPDATE, KetentuanKhususModel], [DELETE, KetentuanKhususModel], [READ, KetentuanKhususModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.KETENTUAN_KHUSUS}`}
            model={KetentuanKhususModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.KETENTUAN_KHUSUS}`,
                data: {
                  ...record,
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
                    result = await updateKetentuanKhusus.execute(record.id, payload, token, fileToSend, onProgress);
                  }

                  const { message, isSuccess } = result;

                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchKetentuanKhusus();
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
            title={`Detail ${Modul.KETENTUAN_KHUSUS}`}
            model={KetentuanKhususModel}
            disabled
            style={{ display: 'none' }}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Ketentuan Khusus`,
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
            title={`Delete ${Modul.KETENTUAN_KHUSUS}`}
            model={KetentuanKhususModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.KETENTUAN_KHUSUS}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteKetentuanKhusus.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchKetentuanKhusus();
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
        label: `Gambar Icon ${Modul.KETENTUAN_KHUSUS}`,
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
            message: `Icon ${Modul.KETENTUAN_KHUSUS} harus diisi`
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
          label: `Warna ${Modul.KETENTUAN_KHUSUS}`,
          name: 'color',
          type: InputType.COLOR,
          rules: [
            {
              required: true,
              message: `Warna ${Modul.KETENTUAN_KHUSUS} harus diisi`
            }
          ],
          size: 'large'
        }
      );
    } else if (type === 'polygon') {
      fields.push({
        label: `Warna ${Modul.KETENTUAN_KHUSUS}`,
        name: 'color',
        type: InputType.COLOR,
        rules: [
          {
            required: true,
            message: `Warna ${Modul.KETENTUAN_KHUSUS} harus diisi`
          }
        ],
        size: 'large'
      });
    }

    modal.create({
      title: `Tambah ${Modul.KETENTUAN_KHUSUS}`,
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
          result = await storeKetentuanKhusus.execute(payload, token, fileToSend, onProgress);
        }

        const { message, isSuccess } = result;

        if (isSuccess) {
          success('Berhasil', message);
          fetchKetentuanKhusus();
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
      title: `Hapus ${selectedKetentuanKhusus.length} ${Modul.KETENTUAN_KHUSUS} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedKetentuanKhusus.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchKetentuanKhusus.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchKlasifikasis(token, pagination.page, pagination.per_page);
          setSelectedKetentuanKhusus([]);
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
      <Skeleton loading={getAllKetentuanKhusus.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.KETENTUAN_KHUSUS} onDeleteBatch={onDeleteBatch} selectedData={selectedKetentuanKhusus} onSearch={(values) => setFilterValues({ search: values })} model={KetentuanKhususModel} />
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
          <DataTable
            data={ketentuanKhusus}
            columns={column}
            loading={getAllKetentuanKhusus.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedKetentuanKhusus(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default KetentuanKhusus;
