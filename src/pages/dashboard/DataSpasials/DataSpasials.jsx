/* eslint-disable no-unused-vars */
import { DataTable, DataTableHeader } from '@/components';
import { Action, InputType } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { KlasifikasisService, DataSpasialsService } from '@/services';
import { Card, ColorPicker, Skeleton, Space } from 'antd';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { DataSpasials as DataSpasialModel } from '@/models';
import { useParams } from 'react-router-dom';
import { extractUploadFile, hasNewUploadFile, normalizeColorValue } from '@/utils/formData';
import { EnvironmentOutlined, ExpandAltOutlined, ExpandOutlined } from '@ant-design/icons';

const { UPDATE, READ, DELETE } = Action;

const buildEditFieldsByGeometry = (record, klasifikasis) => {
  let fields = [...formFields({ options: { klasifikasi: klasifikasis } })];

  if (record.geometry_type === 'point') {
    fields.push({
      label: `Gambar Icon ${Modul.DATA_SPASIAL}`,
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
        label: `Warna ${Modul.DATA_SPASIAL}`,
        name: 'color',
        type: InputType.COLOR,
        rules: [
          {
            required: true,
            message: `Warna ${Modul.DATA_SPASIAL} harus diisi`
          }
        ],
        size: 'large'
      }
    );
  }

  if (record.geometry_type === 'plygon') {
    fields.push({
      label: `Warna ${Modul.DATA_SPASIAL}`,
      name: 'color',
      type: InputType.COLOR,
      rules: [
        {
          required: true,
          message: `Warna ${Modul.DATA_SPASIAL} harus diisi`
        }
      ],
      size: 'large'
    });
  }

  return fields;
};

const DataSpasials = () => {
  const { token, user } = useAuth();
  const params = useParams();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllDataSpasials } = useService(DataSpasialsService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storeDataSpasials = useService(DataSpasialsService.store);
  const updateDataSpasials = useService(DataSpasialsService.update);
  const deleteDataSpasials = useService(DataSpasialsService.delete);
  const deleteBatchDataSpasials = useService(DataSpasialsService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllDataSpasials.totalData });

  const [selectedDataSpasials, setSelectedDataSpasials] = React.useState([]);

  const fetchDataSpasials = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search,
      ...(params.klasifikasi_id ? { klasifikasi_id: params.klasifikasi_id } : {})
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, params.klasifikasi_id, token]);

  React.useEffect(() => {
    fetchDataSpasials();
    fetchKlasifikasis({ token: token, tipe: 'data_spasial' });
  }, [fetchKlasifikasis, fetchDataSpasials, pagination.page, pagination.per_page, token]);

  const dataSpasials = getAllDataSpasials.data ?? [];
  const klasifikasis = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Nama',
      dataIndex: 'name',
      sorter: (a, b) => (a.name || '').length - (b.name || '').length,
      searchable: true
    },
    {
      title: 'Klasifikasi Data Spasial',
      render: (_, record) => {
        const id = record.klasifikasi_id ?? record.klasifikasi?.id ?? record.klasifikasi;
        const klas = klasifikasis.find((k) => k.id === id);
        return klas?.nama || klas?.name || '-';
      }
    }
  ];

  if (user && user.eitherCan([UPDATE, DataSpasialModel], [DELETE, DataSpasialModel], [READ, DataSpasialModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.DATA_SPASIAL}`}
            model={DataSpasialModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.DATA_SPASIAL}`,
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

                  if (hasNewUploadFile(values.geojson_file)) {
                    const geo = extractUploadFile(values.geojson_file);
                    files.geojson_file = geo?.geojson_file ?? geo;
                  }

                  if (record.geometry_type === 'point' && hasNewUploadFile(values.icon)) {
                    const icon = extractUploadFile(values.icon);
                    files.icon_titik = icon?.icon ?? icon;
                  }

                  const fileToSend = Object.keys(files).length ? files : null;

                  const { message, isSuccess } = await updateDataSpasials.execute(record.id, payload, token, fileToSend);

                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchDataSpasials();
                  } else {
                    error('Gagal', message);
                  }

                  return isSuccess;
                }
              });
            }}
          />

          <Detail
            title={`Detail ${Modul.DATA_SPASIAL}`}
            model={DataSpasialModel}
            disabled
            style={{ display: 'none' }}
            onClick={() => {
              const klasifikasi = record.klasifikasi || {};
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Data Spasial`,
                    children: record.name || '-'
                  },
                  {
                    key: 'geometry_type',
                    label: `Tipe Geometri`,
                    children: record.geometry_type || '-'
                  },
                  {
                    key: 'desc',
                    label: `Deskripsi`,
                    children: record.desc || '-'
                  },
                  {
                    key: 'type',
                    label: `Klasifikasi Data Spasial`,
                    children: klasifikasi.type || '-'
                  }
                ]
              });
            }}
          />
          <Delete
            title={`Delete ${Modul.DATA_SPASIAL}`}
            model={DataSpasialModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.DATA_SPASIAL}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteDataSpasials.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchDataSpasials();
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
        label: `Gambar Icon ${Modul.DATA_SPASIAL}`,
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
            message: `Icon ${Modul.DATA_SPASIAL} harus diisi`
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
          label: `Warna ${Modul.DATA_SPASIAL}`,
          name: 'color',
          type: InputType.COLOR,
          rules: [
            {
              required: true,
              message: `Warna ${Modul.DATA_SPASIAL} harus diisi`
            }
          ],
          size: 'large'
        }
      );
    } else if (type === 'polygon') {
      fields.push({
        label: `Warna ${Modul.DATA_SPASIAL}`,
        name: 'color',
        type: InputType.COLOR,
        rules: [
          {
            required: true,
            message: `Warna ${Modul.DATA_SPASIAL} harus diisi`
          }
        ],
        size: 'large'
      });
    }

    modal.create({
      title: `Tambah ${Modul.DATA_SPASIAL}`,
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
        const iconFile = type === 'point' ? extractUploadFile(values.icon) : null;

        const fileToSend = {
          geojson_file: geojsonFile?.geojson_file ?? geojsonFile,
          icon_titik: iconFile?.icon ?? iconFile
        };

        const { message, isSuccess } = await storeDataSpasials.execute(payload, token, fileToSend);

        if (isSuccess) {
          success('Berhasil', message);
          fetchDataSpasials();
        } else {
          error('Gagal', message);
        }

        return isSuccess;
      }
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
      title: `Hapus ${selectedDataSpasials.length} ${Modul.DATA_SPASIAL} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedDataSpasials.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchDataSpasials.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchKlasifikasis(token, pagination.page, pagination.per_page);
          setSelectedDataSpasials([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllDataSpasials.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.DATA_SPASIAL} onDeleteBatch={onDeleteBatch} selectedData={selectedDataSpasials} onSearch={(values) => setFilterValues({ search: values })} model={DataSpasialModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            data={dataSpasials}
            columns={column}
            loading={getAllDataSpasials.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedDataSpasials(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default DataSpasials;
