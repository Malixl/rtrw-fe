import { DataTable, DataTableHeader } from '@/components';
import { Action, InputType } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { BatasAdministrasiService } from '@/services';
import { Button, Card, Skeleton, Space } from 'antd';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { DeleteOutlined, ExpandAltOutlined, ExpandOutlined, PlusOutlined } from '@ant-design/icons';
import { extractUploadFile, hasNewUploadFile } from '@/utils/formData';

const buildEditFieldsByGeometry = (record) => {
  let fields = [...formFields()];

  if (record.geometry_type === 'polyline') {
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
        { label: <div className="w-full border-4" />, value: 'bold' },
        { label: <div className="w-full border" />, value: 'solid' },
        { label: <div className="w-full border border-dashed" />, value: 'dashed' }
      ]
    });
  }

  return fields;
};

const BatasAdministrasi = () => {
  const { token } = useAuth();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllBatasAdministrasi } = useService(BatasAdministrasiService.getAll);
  const storeBatasAdministrasi = useService(BatasAdministrasiService.store);
  const updateBatasAdministrasi = useService(BatasAdministrasiService.update);
  const deleteBatasAdministrasi = useService(BatasAdministrasiService.delete);
  const deleteBatchBatasAdministrasi = useService(BatasAdministrasiService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllBatasAdministrasi.totalData });

  const [selectedBatasAdministrasi, setSelectedBatasAdministrasi] = React.useState([]);

  const fetchBatasAdministrasi = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, token]);

  React.useEffect(() => {
    fetchBatasAdministrasi();
  }, [fetchBatasAdministrasi, pagination.page, pagination.per_page, token]);

  const batasAdministrasiData = getAllBatasAdministrasi.data ?? [];

  const column = [
    {
      title: 'Nama Area',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Deskripsi',
      dataIndex: 'desc',
      sorter: (a, b) => a.desc.length - b.desc.length,
      searchable: true
    },
    {
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.BATAS_ADMINISTRASI}`}
            action={Action.NONE}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.BATAS_ADMINISTRASI}`,
                data: record,
                formFields: buildEditFieldsByGeometry(record),
                onSubmit: async (values) => {
                  const payload = {
                    ...values,
                    _method: 'PUT'
                  };

                  delete payload.geojson_file;

                  if (record.geometry_type !== 'polyline') {
                    delete payload.line_type;
                  }

                  let fileToSend = null;
                  if (hasNewUploadFile(values.geojson_file)) {
                    fileToSend = extractUploadFile(values.geojson_file);
                  }

                  const { message, isSuccess } = await updateBatasAdministrasi.execute(record.id, payload, token, fileToSend);

                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchBatasAdministrasi();
                  } else {
                    error('Gagal', message);
                  }

                  return isSuccess;
                }
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.BATAS_ADMINISTRASI}`}
            action={Action.NONE}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Area`,
                    children: record.name
                  },
                  {
                    key: 'desc',
                    label: `Deskripsi`,
                    children: record.desc
                  }
                ]
              });
            }}
          />
          <Delete
            title={`Delete ${Modul.BATAS_ADMINISTRASI}`}
            action={Action.NONE}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.BATAS_ADMINISTRASI}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteBatasAdministrasi.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchBatasAdministrasi();
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
    }
  ];

  const onModalCreate = (type) => {
    let fields = [...formFields()];
    if (type === 'polyline') {
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
      title: `Tambah ${Modul.BATAS_ADMINISTRASI}`,
      formFields: fields,
      onSubmit: async (values) => {
        const payload = {
          ...values,
          geometry_type: type
        };

        delete payload.geojson_file;

        if (type !== 'polyline') {
          delete payload.line_type;
        }

        const geojsonFile = extractUploadFile(values.geojson_file);

        const { message, isSuccess } = await storeBatasAdministrasi.execute(payload, token, geojsonFile);

        if (isSuccess) {
          success('Berhasil', message);
          fetchBatasAdministrasi();
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
      title: `Hapus ${selectedBatasAdministrasi.length} ${Modul.BATAS_ADMINISTRASI} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedBatasAdministrasi.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchBatasAdministrasi.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchBatasAdministrasi();
          setSelectedBatasAdministrasi([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllBatasAdministrasi.isLoading}>
        <DataTableHeader modul={Modul.BATAS_ADMINISTRASI} selectedData={selectedBatasAdministrasi} onSearch={(values) => setFilterValues({ search: values })}>
          <Button className="me-auto" icon={<DeleteOutlined />} variant="solid" color="danger" disabled={!selectedBatasAdministrasi?.length} onClick={onDeleteBatch}>
            Hapus {selectedBatasAdministrasi?.length || null} Pilihan
          </Button>
          <Button icon={<PlusOutlined />} type="primary" onClick={onCreate}>
            Tambah
          </Button>
        </DataTableHeader>
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            data={batasAdministrasiData}
            columns={column}
            loading={getAllBatasAdministrasi.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedBatasAdministrasi(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default BatasAdministrasi;
