import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { KlasifikasisService, PkkprlService } from '@/services';
import { Card, ColorPicker, Skeleton, Space } from 'antd';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { Pkkprl as PkkprlModel } from '@/models';
import { useParams } from 'react-router-dom';
import { extractUploadFile, hasNewUploadFile, normalizeColorValue } from '@/utils/formData';

const { UPDATE, READ, DELETE } = Action;

const Pkkprls = () => {
  const { token, user } = useAuth();
  const params = useParams();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllPkkprls } = useService(PkkprlService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storePkkprl = useService(PkkprlService.store);
  const updatePkkprl = useService(PkkprlService.update);
  const deletePkkprl = useService(PkkprlService.delete);
  const deleteBatchPkkprl = useService(PkkprlService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllPkkprls.totalData });

  const [selectedPkkprl, setSelectedPkkprl] = React.useState([]);

  const fetchPkkprl = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search,
      ...(params.klasifikasi_id ? { klasifikasi_id: params.klasifikasi_id } : {})
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, params.klasifikasi_id, token]);

  React.useEffect(() => {
    fetchPkkprl();
    fetchKlasifikasis({ token: token, tipe: 'pkkprl' });
  }, [fetchKlasifikasis, fetchPkkprl, pagination.page, pagination.per_page, token]);

  const pkkprl = getAllPkkprls.data ?? [];
  const klasifikasis = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Nama Pkkprl',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Klasifikasi',
      dataIndex: ['klasifikasi', 'name'],
      sorter: (a, b) => a.klasifikasi.name.length - b.klasifikasi.name.length,
      searchable: true
    },
    {
      title: 'Warna',
      dataIndex: 'color',
      sorter: (a, b) => a.color.length - b.color.length,
      searchable: true,
      render: (record) => <ColorPicker value={record} showText disabled />
    }
  ];

  if (user && user.eitherCan([UPDATE, PkkprlModel], [DELETE, PkkprlModel], [READ, PkkprlModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.PKKPRL}`}
            model={PkkprlModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.PKKPRL}`,
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

                  const { message, isSuccess } = await updatePkkprl.execute(record.id, payload, token, fileToSend);

                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchPkkprl();
                  } else {
                    error('Gagal', message);
                  }

                  return isSuccess;
                }
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.PKKPRL}`}
            model={PkkprlModel}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama PKKPRL`,
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
            title={`Delete ${Modul.PKKPRL}`}
            model={PkkprlModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.PKKPRL}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deletePkkprl.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchPkkprl();
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
      title: `Tambah ${Modul.PKKPRL}`,
      formFields: formFields({ options: { klasifikasi: klasifikasis } }),
      onSubmit: async (values) => {
        const payload = { ...values, color: normalizeColorValue(values.color) };
        delete payload.geojson_file;
        const fileToSend = extractUploadFile(values.geojson_file);

        const { message, isSuccess } = await storePkkprl.execute(payload, token, fileToSend);
        if (isSuccess) {
          success('Berhasil', message);
          fetchPkkprl();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedPkkprl.length} ${Modul.PKKPRL} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedPkkprl.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchPkkprl.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchKlasifikasis(token, pagination.page, pagination.per_page);
          setSelectedPkkprl([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllPkkprls.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.PKKPRL} onDeleteBatch={onDeleteBatch} selectedData={selectedPkkprl} onSearch={(values) => setFilterValues({ search: values })} model={PkkprlModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable data={pkkprl} columns={column} loading={getAllPkkprls.isLoading} map={(registrant) => ({ key: registrant.id, ...registrant })} pagination={pagination} handleSelectedData={(_, selectedRows) => setSelectedPkkprl(selectedRows)} />
        </div>
      </Skeleton>
    </Card>
  );
};

export default Pkkprls;
