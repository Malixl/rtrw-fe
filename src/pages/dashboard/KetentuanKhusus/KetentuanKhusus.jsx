import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
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

const { UPDATE, READ, DELETE } = Action;

const KetentuanKhusus = () => {
  const { token, user } = useAuth();
  const params = useParams();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllKetentuanKhusus } = useService(KetentuanKhususService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storeKetentuanKhusus = useService(KetentuanKhususService.store);
  const updateKetentuanKhusus = useService(KetentuanKhususService.update);
  const deleteKetentuanKhusus = useService(KetentuanKhususService.delete);
  const deleteBatchKetentuanKhusus = useService(KetentuanKhususService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

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
      title: 'Nama Ketentuan Khusus',
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
                data: { ...record, id_klasifikasi: record.klasifikasi.id },
                formFields: formFields({ options: { klasifikasi: klasifikasis } }),
                onSubmit: async (values) => {
                  const isFileUpdated = hasNewUploadFile(values.geojson_file);

                  const payload = {
                    ...values,
                    color: normalizeColorValue(values.color)
                  };

                  delete payload.geojson_file;

                  const fileToSend = isFileUpdated ? extractUploadFile(values.geojson_file) : null;

                  const { message, isSuccess } = await updateKetentuanKhusus.execute(record.id, payload, token, fileToSend);

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
          <Detail
            title={`Detail ${Modul.KETENTUAN_KHUSUS}`}
            model={KetentuanKhususModel}
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

  const onCreate = () => {
    modal.create({
      title: `Tambah ${Modul.KETENTUAN_KHUSUS}`,
      formFields: formFields({ options: { klasifikasi: klasifikasis } }),
      onSubmit: async (values) => {
        const payload = { ...values, color: normalizeColorValue(values.color) };
        delete payload.geojson_file;
        const fileToSend = extractUploadFile(values.geojson_file);

        const { message, isSuccess } = await storeKetentuanKhusus.execute(payload, token, fileToSend);
        if (isSuccess) {
          success('Berhasil', message);
          fetchKetentuanKhusus();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
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

  return (
    <Card>
      <Skeleton loading={getAllKetentuanKhusus.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.KETENTUAN_KHUSUS} onDeleteBatch={onDeleteBatch} selectedData={selectedKetentuanKhusus} onSearch={(values) => setFilterValues({ search: values })} model={KetentuanKhususModel} />
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
