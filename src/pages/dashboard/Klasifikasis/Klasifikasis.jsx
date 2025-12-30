import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { KlasifikasisService, LayerGroupsService } from '@/services';
import { Card, Skeleton, Space } from 'antd';
import { Klasifikasis as KlasifikasiModel } from '@/models';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';

const { UPDATE, READ, DELETE } = Action;

const Klasifikasis = () => {
  const { token, user } = useAuth();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const { execute: fetchLayerGroups, ...getAllLayerGroups } = useService(LayerGroupsService.getAll);
  const storeKlasifikasi = useService(KlasifikasisService.store);
  const updateKlasifikasi = useService(KlasifikasisService.update);
  const deleteKlasifikasi = useService(KlasifikasisService.delete);
  const deleteBatchKlasifikasis = useService(KlasifikasisService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllKlasifikasis.totalData });

  const [selectedKlasifikasis, setSelectedKlasifikasis] = React.useState([]);

  const fetchKlasifikasis = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, token]);

  React.useEffect(() => {
    fetchKlasifikasis();
    fetchLayerGroups({ token: token });
  }, [fetchKlasifikasis, pagination.page, pagination.per_page, token, fetchLayerGroups]);

  const klasifikasis = getAllKlasifikasis.data ?? [];
  const layerGroups = getAllLayerGroups.data ?? [];

  const column = [
    {
      title: 'Klasifikasi',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Layer Group',
      // Layer may be stored as object or id; render name from fetched layerGroups
      render: (_, record) => {
        const id = record.layer_group_id ?? record.layer_group?.id ?? record.layer_group;
        const group = layerGroups.find((g) => g.id === id || g.layer_group_name === id || g.nama_layer_group === id || g.name === id || g.nama === id);
        return group?.layer_group_name || group?.name || group?.nama || '-';
      },
      searchable: true
    },
    {
      title: 'Tipe Klasifikasi',
      dataIndex: 'type',
      sorter: (a, b) => a.type.length - b.type.length,
      searchable: true
    }
  ];

  if (user && user.eitherCan([UPDATE, KlasifikasiModel], [DELETE, KlasifikasiModel], [READ, KlasifikasiModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.KLASIFIKASI}`}
            model={KlasifikasiModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.KLASIFIKASI}`,
                // normalize layer group id for the form
                data: { ...record, layer_group_id: record.layer_group_id ?? record.layer_group?.id ?? record.layer_group },
                formFields: formFields({ options: { layerGroups: layerGroups } }),
                onSubmit: async (values) => {
                  const { message, isSuccess } = await updateKlasifikasi.execute(record.id, values, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchKlasifikasis({ token: token, page: pagination.page, per_page: pagination.per_page });
                  } else {
                    error('Gagal', message);
                  }
                  return isSuccess;
                }
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.KLASIFIKASI}`}
            model={KlasifikasiModel}
            onClick={() => {
              const layer = layerGroups.find((g) => g.id === (record.layer_group_id ?? record.layer_group?.id ?? record.layer_group));
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Klasifikasi`,
                    children: record.name
                  },
                  {
                    key: 'desc',
                    label: `Deskripsi`,
                    children: record.desc
                  },
                  {
                    key: 'type',
                    label: `Tipe`,
                    children: record.type
                  },
                  {
                    key: 'layer_group',
                    label: `Layer Group`,
                    children: layer ? layer.layer_group_name || layer.name || layer.nama : ' - '
                  }
                ]
              });
            }}
          />

          <Delete
            title={`Delete ${Modul.KLASIFIKASI}`}
            model={KlasifikasiModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.KLASIFIKASI}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteKlasifikasi.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchKlasifikasis({ token: token, page: pagination.page, per_page: pagination.per_page });
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
      title: `Tambah ${Modul.KLASIFIKASI}`,
      formFields: formFields({ options: { layerGroups: layerGroups } }),
      onSubmit: async (values) => {
        const { message, isSuccess } = await storeKlasifikasi.execute(values, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchKlasifikasis({ token: token, page: pagination.page, per_page: pagination.per_page });
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedKlasifikasis.length} ${Modul.KLASIFIKASI} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedKlasifikasis.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchKlasifikasis.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          setSelectedKlasifikasis([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllKlasifikasis.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.KLASIFIKASI} onDeleteBatch={onDeleteBatch} selectedData={selectedKlasifikasis} onSearch={(values) => setFilterValues({ search: values })} model={KlasifikasiModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            data={klasifikasis}
            columns={column}
            loading={getAllKlasifikasis.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedKlasifikasis(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default Klasifikasis;
