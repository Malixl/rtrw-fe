import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { PeriodesService, RtrwsService } from '@/services';
import { Card, Skeleton, Space } from 'antd';
import { Rtrws as RtrwModel } from '@/models';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';

const { UPDATE, READ, DELETE } = Action;

const Rtrws = () => {
  const { token, user } = useAuth();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllRtrws } = useService(RtrwsService.getAll);
  const { execute: fetchPeriodes, ...getAllPeriodes } = useService(PeriodesService.getAll);
  const storeRtrw = useService(RtrwsService.store);
  const updateRtrw = useService(RtrwsService.update);
  const deleteRtrw = useService(RtrwsService.delete);
  const deleteBatchRtrws = useService(RtrwsService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllRtrws.totalData });

  const [selectedRtrws, setSelectedRtrws] = React.useState([]);

  const fetchRtrws = React.useCallback(() => {
    execute({
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search,
      token
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, token]);

  React.useEffect(() => {
    fetchRtrws();
    fetchPeriodes({ token: token });
  }, [fetchPeriodes, fetchRtrws, pagination.page, pagination.per_page, token]);

  const rtrws = getAllRtrws.data ?? [];
  const periodes = getAllPeriodes.data ?? [];

  const column = [
    {
      title: 'RTRW',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Tahun Mulai',
      dataIndex: ['periode', 'year_start'],
      sorter: (a, b) => a.periode.year_start.length - b.periode.year_start.length,
      searchable: true
    },
    {
      title: 'Tahun Akhir',
      dataIndex: ['periode', 'year_end'],
      sorter: (a, b) => a.periode.year_end.length - b.periode.year_end.length,
      searchable: true
    }
  ];

  if (user && user.eitherCan([UPDATE, RtrwModel], [DELETE, RtrwModel], [READ, RtrwModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.RTRW}`}
            model={RtrwModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.RTRW}`,
                data: { ...record, periode_id: record.periode.id },
                formFields: formFields({ options: { periodes } }),
                onSubmit: async (values) => {
                  const { message, isSuccess } = await updateRtrw.execute(record.id, values, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchRtrws();
                  } else {
                    error('Gagal', message);
                  }
                  return isSuccess;
                }
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.RTRW}`}
            model={RtrwModel}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Klasifikasi`,
                    children: record.name
                  },
                  {
                    key: 'start_year',
                    label: `Tahun Mulai`,
                    children: record.periode.year_start
                  },
                  {
                    key: 'end_year',
                    label: `Tahun Akhir`,
                    children: record.periode.year_end
                  },

                  {
                    key: 'deskripsi',
                    label: `Deskripsi`,
                    children: record.desc
                  }
                ]
              });
            }}
          />
          <Delete
            title={`Delete ${Modul.RTRW}`}
            model={RtrwModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.RTRW}`,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteRtrw.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchRtrws();
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
      title: `Tambah ${Modul.RTRW}`,
      formFields: formFields({ options: { periodes } }),
      onSubmit: async (values) => {
        const { message, isSuccess } = await storeRtrw.execute(values, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchRtrws();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedRtrws.length} ${Modul.RTRW} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedRtrws.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchRtrws.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          setSelectedRtrws([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllRtrws.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.RTRW} onDeleteBatch={onDeleteBatch} selectedData={selectedRtrws} onSearch={(values) => setFilterValues({ search: values })} model={RtrwModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable data={rtrws} columns={column} loading={getAllRtrws.isLoading} map={(registrant) => ({ key: registrant.id, ...registrant })} pagination={pagination} handleSelectedData={(_, selectedRows) => setSelectedRtrws(selectedRows)} />
        </div>
      </Skeleton>
    </Card>
  );
};

export default Rtrws;
