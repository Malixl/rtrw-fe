import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { LayerGroupsService } from '@/services';
import { Card, Skeleton, Space } from 'antd';
import { LayerGroups as LayerGroupModel } from '@/models';
import React from 'react';
import { Delete, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';

const { UPDATE, READ, DELETE } = Action;

const LayerGroups = () => {
  const { token, user } = useAuth();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllKlasifikasis } = useService(LayerGroupsService.getAll);
  const storeLayerGroup = useService(LayerGroupsService.store);
  const updateLayerGroup = useService(LayerGroupsService.update);
  const deleteLayerGroup = useService(LayerGroupsService.delete);
  const deleteBatchLayerGroup = useService(LayerGroupsService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllKlasifikasis.totalData });

  const [selectedLayerGroup, setSelectedLayerGroup] = React.useState([]);

  const fetchLayerGroup = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, token]);

  React.useEffect(() => {
    fetchLayerGroup();
  }, [fetchLayerGroup, pagination.page, pagination.per_page, token]);

  const layerGroups = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Layer Group',
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
      title: 'Urutan Tampil',
      dataIndex: 'order',
      sorter: (a, b) => a.order.length - b.order.length,
      searchable: true
    }
  ];

  if (user && user.eitherCan([UPDATE, LayerGroupModel], [DELETE, LayerGroupModel], [READ, LayerGroupModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.LAYER_GROUP}`}
            model={LayerGroupModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.LAYER_GROUP}`,
                data: record,
                formFields: formFields(),
                onSubmit: async (values) => {
                  const { message, isSuccess } = await updateLayerGroup.execute(record.id, values, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchLayerGroup({ token: token, page: pagination.page, per_page: pagination.per_page });
                  } else {
                    error('Gagal', message);
                  }
                  return isSuccess;
                }
              });
            }}
          />
          <Delete
            title={`Delete ${Modul.LAYER_GROUP}`}
            model={LayerGroupModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.LAYER_GROUP}`,
                data: record,
                formFields: formFields,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteLayerGroup.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchLayerGroup({ token: token, page: pagination.page, per_page: pagination.per_page });
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
      title: `Tambah ${Modul.LAYER_GROUP}`,
      formFields: formFields(),
      onSubmit: async (values) => {
        const { message, isSuccess } = await storeLayerGroup.execute(values, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchLayerGroup({ token: token, page: pagination.page, per_page: pagination.per_page });
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedLayerGroup.length} ${Modul.LAYER_GROUP} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedLayerGroup.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchLayerGroup.execute(ids, token);
        if (isSuccess) {
          fetchLayerGroup({ token: token, page: pagination.page, per_page: pagination.per_page });
          success('Berhasil', message);
          setSelectedLayerGroup([]);
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
        <DataTableHeader onStore={onCreate} modul={Modul.LAYER_GROUP} onDeleteBatch={onDeleteBatch} selectedData={selectedLayerGroup} onSearch={(values) => setFilterValues({ search: values })} model={LayerGroupModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            data={layerGroups}
            columns={column}
            loading={getAllKlasifikasis.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedLayerGroup(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default LayerGroups;
