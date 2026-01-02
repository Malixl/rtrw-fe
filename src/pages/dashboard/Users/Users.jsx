import { DataTable, DataTableHeader } from '@/components';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { UserService } from '@/services';
import { Card, Skeleton, Space, Tag } from 'antd';
import Role from '@/constants/Role';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import { formFields } from './FormFields';

const ROLE_COLORS = {
  [Role.ADMIN]: 'red',
  [Role.OPD]: 'blue',
  [Role.GUEST]: 'default'
};

const ROLE_LABELS = {
  [Role.ADMIN]: 'Admin',
  [Role.OPD]: 'OPD',
  [Role.GUEST]: 'Guest'
};

const Users = () => {
  const { token } = useAuth();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllUsers } = useService(UserService.getAll);
  const storeUser = useService(UserService.create);
  const updateUser = useService(UserService.update);
  const deleteUser = useService(UserService.delete);
  const deleteBatchUsers = useService(UserService.multiDelete);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllUsers.totalData });

  const [selectedUsers, setSelectedUsers] = React.useState([]);

  const fetchUsers = React.useCallback(() => {
    execute({
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search,
      token
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, token]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers, pagination.page, pagination.per_page, token]);

  const users = getAllUsers.data ?? [];

  const column = [
    {
      title: 'Nama',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      searchable: true
    },
    {
      title: 'Email',
      dataIndex: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
      searchable: true
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role) => {
        const roleName = typeof role === 'object' ? role?.name : role;
        return <Tag color={ROLE_COLORS[roleName] || 'default'}>{ROLE_LABELS[roleName] || roleName || 'Unknown'}</Tag>;
      },
      filters: [
        { text: 'Admin', value: Role.ADMIN },
        { text: 'OPD', value: Role.OPD }
      ],
      onFilter: (value, record) => {
        const roleName = typeof record.role === 'object' ? record.role?.name : record.role;
        return roleName === value;
      }
    },
    // {
    //   title: 'Dibuat',
    //   dataIndex: 'created_at',
    //   render: (date) => (date ? new Date(date).toLocaleDateString('id-ID') : '-'),
    //   sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
    // },
    {
      title: 'Aksi',
      render: (_, record) => {
        const roleName = typeof record.role === 'object' ? record.role?.name : record.role;
        return (
          <Space size="small">
            <Edit
              title="Edit User"
              onClick={() => {
                modal.edit({
                  title: `Edit User: ${record.name}`,
                  data: {
                    ...record,
                    role: roleName === Role.GUEST ? null : roleName,
                    password: '',
                    password_confirmation: ''
                  },
                  formFields: formFields({ isEdit: true }),
                  onSubmit: async (values) => {
                    // Remove empty password fields
                    const submitData = { ...values };
                    if (!submitData.password) {
                      delete submitData.password;
                      delete submitData.password_confirmation;
                    }

                    const { message, isSuccess } = await updateUser.execute(record.id, submitData, token);
                    if (isSuccess) {
                      success('Berhasil', message);
                      fetchUsers();
                    } else {
                      error('Gagal', message);
                    }
                    return isSuccess;
                  }
                });
              }}
            />
            <Detail
              title="Detail User"
              onClick={() => {
                modal.show.description({
                  title: record.name,
                  data: [
                    {
                      key: 'name',
                      label: 'Nama',
                      children: record.name
                    },
                    {
                      key: 'email',
                      label: 'Email',
                      children: record.email
                    },
                    {
                      key: 'role',
                      label: 'Role',
                      children: <Tag color={ROLE_COLORS[roleName] || 'default'}>{ROLE_LABELS[roleName] || roleName}</Tag>
                    },
                    {
                      key: 'created_at',
                      label: 'Dibuat',
                      children: record.created_at ? new Date(record.created_at).toLocaleString('id-ID') : '-'
                    },
                    {
                      key: 'updated_at',
                      label: 'Diperbarui',
                      children: record.updated_at ? new Date(record.updated_at).toLocaleString('id-ID') : '-'
                    }
                  ]
                });
              }}
            />
            <Delete
              title="Hapus User"
              onClick={() => {
                modal.delete.default({
                  title: `Hapus User: ${record.name}`,
                  onSubmit: async () => {
                    const { isSuccess, message } = await deleteUser.execute(record.id, token);
                    if (isSuccess) {
                      success('Berhasil', message);
                      fetchUsers();
                    } else {
                      error('Gagal', message);
                    }
                    return isSuccess;
                  }
                });
              }}
            />
          </Space>
        );
      }
    }
  ];

  const onCreate = () => {
    modal.create({
      title: 'Tambah User Baru',
      formFields: formFields({ isEdit: false }),
      onSubmit: async (values) => {
        const { message, isSuccess } = await storeUser.execute(values, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchUsers();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedUsers.length} User Yang Dipilih?`,
      onSubmit: async () => {
        const ids = selectedUsers.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchUsers.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          setSelectedUsers([]);
          fetchUsers();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllUsers.isLoading}>
        <DataTableHeader onStore={onCreate} modul="User" onDeleteBatch={onDeleteBatch} selectedData={selectedUsers} onSearch={(values) => setFilterValues({ search: values })} hideCreate={false} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable data={users} columns={column} loading={getAllUsers.isLoading} map={(user) => ({ key: user.id, ...user })} pagination={pagination} handleSelectedData={(_, selectedRows) => setSelectedUsers(selectedRows)} />
        </div>
      </Skeleton>
    </Card>
  );
};

export default Users;
