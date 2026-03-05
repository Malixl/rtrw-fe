import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { DokumenService, KlasifikasisService } from '@/services';
import { Button, Card, Skeleton, Space } from 'antd';
import { Dokumen as DokumenModel } from '@/models';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { DownloadOutlined } from '@ant-design/icons';
import { extractUploadFile, hasNewUploadFile } from '@/utils/formData';

const { UPDATE, READ, DELETE } = Action;

const Dokumens = () => {
  const { token, user } = useAuth();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllDokumens } = useService(DokumenService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storeDokumen = useService(DokumenService.store);
  const updateDokumen = useService(DokumenService.update);
  const deleteDokumen = useService(DokumenService.delete);
  const deleteBatchDokumen = useService(DokumenService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllDokumens.totalData });

  const [selectedDokumens, setSelectedDokumens] = React.useState([]);

  const fetchDokumens = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, token]);

  React.useEffect(() => {
    fetchDokumens();
    fetchKlasifikasis({ token: token, tipe: 'dokumen' });
  }, [fetchDokumens, fetchKlasifikasis, pagination.page, pagination.per_page, token]);

  const dokumens = getAllDokumens.data ?? [];
  const klasifikasis = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Dokumen',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Deskripsi',
      dataIndex: 'deskripsi',
      searchable: true
    }
  ];

  if (user && user.eitherCan([UPDATE, DokumenModel], [DELETE, DokumenModel], [READ, DokumenModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.DOKUMEN}`}
            model={DokumenModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.DOKUMEN}`,
                data: {
                  ...record,
                  id_klasifikasi: record.klasifikasi_id
                },
                formFields: formFields({ options: { klasifikasi: klasifikasis } }),

                onSubmit: async (values) => {
                  const isFileUpdated = hasNewUploadFile(values.doc);
                  const payload = { ...values };
                  delete payload.doc;
                  const fileToSend = isFileUpdated ? extractUploadFile(values.doc) : null;

                  const { message, isSuccess } = await updateDokumen.execute(record.id, payload, token, fileToSend);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchDokumens();
                  } else {
                    error('Gagal', message);
                  }
                  return isSuccess;
                }
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.DOKUMEN}`}
            model={DokumenModel}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Dokumen`,
                    children: record.name
                  },
                  {
                    key: 'deskripsi',
                    label: 'Deskripsi',
                    children: record.deskripsi || '-'
                  },
                  {
                    key: 'file_dokumen',
                    label: `File Dokumen`,
                    children: record.doc ? (
                      <Button icon={<DownloadOutlined />} onClick={() => window.open(record.doc, '_blank')}>
                        Download
                      </Button>
                    ) : (
                      <span>Tidak ada file</span>
                    )
                  }
                ]
              });
            }}
          />
          <Delete
            title={`Delete ${Modul.DOKUMEN}`}
            model={DokumenModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.DOKUMEN}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteDokumen.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchDokumens({ token: token, page: pagination.page, per_page: pagination.per_page });
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
      title: `Tambah ${Modul.DOKUMEN}`,
      formFields: formFields({ options: { klasifikasi: klasifikasis } }),
      onSubmit: async (values) => {
        const payload = { ...values };
        const fileToSend = extractUploadFile(values.doc);
        delete payload.doc;

        const { message, isSuccess } = await storeDokumen.execute(payload, token, fileToSend);
        if (isSuccess) {
          success('Berhasil', message);
          fetchDokumens();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedDokumens.length} ${Modul.DOKUMEN} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedDokumens.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchDokumen.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchDokumens();
          setSelectedDokumens([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllDokumens.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.DOKUMEN} onDeleteBatch={onDeleteBatch} selectedData={selectedDokumens} onSearch={(values) => setFilterValues({ search: values })} model={DokumenModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            data={dokumens}
            columns={column}
            loading={getAllDokumens.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedDokumens(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default Dokumens;
