import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { KlasifikasisService, PolaruangsService } from '@/services';
import { Card, ColorPicker, Skeleton, Space } from 'antd';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { Polaruangs as PolaruangModel } from '@/models';
import { useParams } from 'react-router-dom';
import { extractUploadFile, hasNewUploadFile, normalizeColorValue } from '@/utils/formData';

const { UPDATE, READ, DELETE } = Action;

const Polaruangs = () => {
  const { token, user } = useAuth();
  const params = useParams();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllPolaruangs } = useService(PolaruangsService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storePolaruang = useService(PolaruangsService.store);
  const updatePolaruang = useService(PolaruangsService.update);
  const deletePolaruang = useService(PolaruangsService.delete);
  const deleteBatchPolaruangs = useService(PolaruangsService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllPolaruangs.totalData });

  const [selectedPolaruangs, setSelectedPolaruangs] = React.useState([]);

  const fetchPolaruangs = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search,
      ...(params.klasifikasi_id ? { klasifikasi_id: params.klasifikasi_id } : {})
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, params.klasifikasi_id, token]);

  React.useEffect(() => {
    fetchPolaruangs();
    fetchKlasifikasis({ token: token, tipe: 'pola_ruang' });
  }, [fetchKlasifikasis, fetchPolaruangs, pagination.page, pagination.per_page, token]);

  const polaRuangs = getAllPolaruangs.data ?? [];
  const klasifikasis = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Nama Polaruang',
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

  if (user && user.eitherCan([UPDATE, PolaruangModel], [DELETE, PolaruangModel], [READ, PolaruangModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.POLARUANG}`}
            model={PolaruangModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.POLARUANG}`,
                data: {
                  ...record,
                  id_klasifikasi: record.klasifikasi_id
                },
                formFields: formFields({ options: { klasifikasi: klasifikasis } }),
                onSubmit: async (values) => {
                  const isFileUpdated = hasNewUploadFile(values.geojson_file);
                  const payload = {
                    ...values,
                    color: normalizeColorValue(values.color)
                  };

                  delete payload.geojson_file;

                  const fileToSend = isFileUpdated ? extractUploadFile(values.geojson_file) : null;

                  const { message, isSuccess } = await updatePolaruang.execute(record.id, payload, token, fileToSend);

                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchPolaruangs();
                  } else {
                    error('Gagal', message);
                  }

                  return isSuccess;
                }
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.POLARUANG}`}
            model={PolaruangModel}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Polaruang`,
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
            title={`Delete ${Modul.POLARUANG}`}
            model={PolaruangModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.POLARUANG}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deletePolaruang.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchPolaruangs();
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
      title: `Tambah ${Modul.POLARUANG}`,
      formFields: formFields({ options: { klasifikasi: klasifikasis } }),
      onSubmit: async (values) => {
        const payload = { ...values, color: normalizeColorValue(values.color) };
        const fileToSend = extractUploadFile(values.geojson_file);
        delete payload.geojson_file;

        const { message, isSuccess } = await storePolaruang.execute(payload, token, fileToSend);
        if (isSuccess) {
          success('Berhasil', message);
          fetchPolaruangs();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedPolaruangs.length} ${Modul.POLARUANG} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedPolaruangs.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchPolaruangs.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchKlasifikasis(token, pagination.page, pagination.per_page);
          setSelectedPolaruangs([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllPolaruangs.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.POLARUANG} onDeleteBatch={onDeleteBatch} selectedData={selectedPolaruangs} onSearch={(values) => setFilterValues({ search: values })} model={PolaruangModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            data={polaRuangs}
            columns={column}
            loading={getAllPolaruangs.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedPolaruangs(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default Polaruangs;
