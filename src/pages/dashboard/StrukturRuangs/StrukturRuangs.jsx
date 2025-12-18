import { DataTable, DataTableHeader } from '@/components';
import { Action, InputType } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { KlasifikasisService, StrukturRuangsService } from '@/services';
import { Card, ColorPicker, Skeleton, Space } from 'antd';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { StrukturRuangs as StrukturRuangModel } from '@/models';
import { EnvironmentOutlined, ExpandAltOutlined } from '@ant-design/icons';
import { formFields } from './FormFields';
import { useParams } from 'react-router-dom';
import { extractUploadFile, hasNewUploadFile, normalizeColorValue } from '@/utils/formData';

const { UPDATE, READ, DELETE } = Action;

const StrukturRuangs = () => {
  const { token, user } = useAuth();
  const modal = useCrudModal();
  const params = useParams();
  const { success, error } = useNotification();
  const { execute, ...getAllStrukturRuangs } = useService(StrukturRuangsService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storeStrukturRuang = useService(StrukturRuangsService.store);
  const updateStrukturRuang = useService(StrukturRuangsService.update);
  const deleteStrukturRuang = useService(StrukturRuangsService.delete);
  const deleteBatchStrukturRuangs = useService(StrukturRuangsService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllStrukturRuangs.totalData });

  const [selectedStrukturRuangs, setSelectedStrukturRuangs] = React.useState([]);

  const fetchStrukturRuangs = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search,
      ...(params.klasifikasi_id ? { klasifikasi_id: params.klasifikasi_id } : {})
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, params.klasifikasi_id, token]);

  React.useEffect(() => {
    fetchStrukturRuangs();
    fetchKlasifikasis({ token: token, tipe: 'struktur_ruang' });
  }, [fetchKlasifikasis, fetchStrukturRuangs, pagination.page, pagination.per_page, token]);

  const strukturRuangs = getAllStrukturRuangs.data ?? [];
  const klasifikasis = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Nama Struktur Ruang',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Warna',
      dataIndex: 'color',
      sorter: (a, b) => a.color.length - b.color.length,
      searchable: true,
      render: (record) => <ColorPicker value={record} showText disabled />
    },
    {
      title: 'Klasifikasi',
      dataIndex: ['klasifikasi', 'name'],
      sorter: (a, b) => a.klasifikasi.name.length - b.klasifikasi.name.length,
      searchable: true
    }
  ];

  if (user && user.eitherCan([UPDATE, StrukturRuangModel], [DELETE, StrukturRuangModel], [READ, StrukturRuangModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit  ${Modul.STRUKTUR}`}
            model={StrukturRuangModel}
            onClick={() => {
              const type = record.geometry_type;
              let fields = [...formFields({ options: { klasifikasi: klasifikasis } })];

              if (type === 'point') {
                fields.push({
                  label: `Icon Poin ${Modul.STRUKTUR}`,
                  name: 'point_icon',
                  type: InputType.SELECT_ICON,
                  rules: [{ required: true, message: `Icon ${Modul.STRUKTUR} harus diisi` }]
                });
              } else if (type === 'polyline') {
                fields.push({
                  label: `Tipe garis ${Modul.STRUKTUR}`,
                  name: 'line_type',
                  type: InputType.SELECT,
                  rules: [{ required: true, message: `Tipe garis ${Modul.STRUKTUR} harus diisi` }],
                  options: [
                    { label: <div className="w-full border" />, value: 'solid' },
                    { label: <div className="w-full border border-dashed" />, value: 'dashed' }
                  ]
                });
              }

              modal.edit({
                title: `Edit ${Modul.STRUKTUR}`,
                data: {
                  ...record,
                  id_klasifikasi: record.klasifikasi.id
                },
                formFields: fields,

                onSubmit: async (values) => {
                  const isFileUpdated = hasNewUploadFile(values.geojson_file);

                  const payload = {
                    ...values,
                    geometry_type: type,
                    color: normalizeColorValue(values.color)
                  };

                  delete payload.geojson_file;

                  const fileToSend = isFileUpdated ? extractUploadFile(values.geojson_file) : null;

                  const { message, isSuccess } = await updateStrukturRuang.execute(record.id, payload, token, fileToSend);

                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchStrukturRuangs();
                  } else {
                    error('Gagal', message);
                  }

                  return isSuccess;
                }
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.STRUKTUR}`}
            model={StrukturRuangModel}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Struktur Ruang`,
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
            title={`Delete ${Modul.STRUKTUR}`}
            model={StrukturRuangModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.STRUKTUR}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteStrukturRuang.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchStrukturRuangs();
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
        label: `Icon Poin ${Modul.STRUKTUR}`,
        name: 'point_icon',
        type: InputType.SELECT_ICON,
        rules: [
          {
            required: true,
            message: `Icon ${Modul.STRUKTUR} harus diisi`
          }
        ]
      });
    } else if (type === 'polyline') {
      fields.push({
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
            label: <div className="w-full border-4" />,
            value: 'bold'
          },
          {
            label: <div className="w-full border" />,
            value: 'solid'
          },
          {
            label: <div className="w-full border border-dashed" />,
            value: 'dashed'
          }
        ]
      });
    }

    modal.create({
      title: `Tambah ${Modul.STRUKTUR}`,
      formFields: fields,
      onSubmit: async (values) => {
        const payload = { ...values, geometry_type: type, color: normalizeColorValue(values.color) };
        delete payload.geojson_file;
        const fileToSend = extractUploadFile(values.geojson_file);

        const { message, isSuccess } = await storeStrukturRuang.execute(payload, token, fileToSend);

        if (isSuccess) {
          success('Berhasil', message);
          fetchStrukturRuangs();
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
          </div>
        )
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedStrukturRuangs.length} ${Modul.STRUKTUR} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedStrukturRuangs.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchStrukturRuangs.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchKlasifikasis(token, pagination.page, pagination.per_page);
          setSelectedStrukturRuangs([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllStrukturRuangs.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.STRUKTUR} onDeleteBatch={onDeleteBatch} selectedData={selectedStrukturRuangs} onSearch={(values) => setFilterValues({ search: values })} model={StrukturRuangModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            data={strukturRuangs}
            columns={column}
            loading={getAllStrukturRuangs.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedStrukturRuangs(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default StrukturRuangs;
