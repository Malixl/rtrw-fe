import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
import { useAuth, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { IndikasiProgramService, KlasifikasisService } from '@/services';
import { Button, Card, Skeleton, Space } from 'antd';
import { IndikasiProgram as IndikasiProgramModel } from '@/models';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { DownloadOutlined } from '@ant-design/icons';
import { extractUploadFile, hasNewUploadFile } from '@/utils/formData';

const { UPDATE, READ, DELETE } = Action;

const IndikasiPrograms = () => {
  const { token, user } = useAuth();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllIndikasiPrograms } = useService(IndikasiProgramService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storeIndikasiProgram = useService(IndikasiProgramService.store);
  const updateIndikasiProgram = useService(IndikasiProgramService.update);
  const deleteIndikasiProgram = useService(IndikasiProgramService.delete);
  const deleteBatchIndikasiProgram = useService(IndikasiProgramService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });

  const pagination = usePagination({ totalData: getAllIndikasiPrograms.totalData });

  const [selectedIndikasiPrograms, setSelectedIndikasiPrograms] = React.useState([]);

  const fetchIndikasiPrograms = React.useCallback(() => {
    execute({
      token: token,
      page: pagination.page,
      per_page: pagination.per_page,
      search: filterValues.search
    });
  }, [execute, filterValues.search, pagination.page, pagination.per_page, token]);

  React.useEffect(() => {
    fetchIndikasiPrograms();
    fetchKlasifikasis({ token: token, tipe: 'indikasi_program' });
  }, [fetchIndikasiPrograms, fetchKlasifikasis, pagination.page, pagination.per_page, token]);

  const indikasiPrograms = getAllIndikasiPrograms.data ?? [];
  const klasifikasis = getAllKlasifikasis.data ?? [];

  const column = [
    {
      title: 'Indikasi Program',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    }
  ];

  if (user && user.eitherCan([UPDATE, IndikasiProgramModel], [DELETE, IndikasiProgramModel], [READ, IndikasiProgramModel])) {
    column.push({
      title: 'Aksi',
      render: (_, record) => (
        <Space size="small">
          <Edit
            title={`Edit ${Modul.INDIKASI_PROGRAM}`}
            model={IndikasiProgramModel}
            onClick={() => {
              modal.edit({
                title: `Edit ${Modul.INDIKASI_PROGRAM}`,
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

                  const { message, isSuccess } = await updateIndikasiProgram.execute(record.id, payload, token, fileToSend);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchIndikasiPrograms();
                  } else {
                    error('Gagal', message);
                  }
                  return isSuccess;
                }
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.INDIKASI_PROGRAM}`}
            model={IndikasiProgramModel}
            onClick={() => {
              modal.show.description({
                title: record.name,
                data: [
                  {
                    key: 'name',
                    label: `Nama Indikasi Program`,
                    children: record.name
                  },
                  {
                    key: 'file_dokumen',
                    label: `File Dokumen Dasar Hukum`,
                    children: (
                      <Button icon={<DownloadOutlined />} onClick={() => window.open(record.doc, '_blank')}>
                        Download
                      </Button>
                    )
                  }
                ]
              });
            }}
          />
          <Delete
            title={`Delete ${Modul.INDIKASI_PROGRAM}`}
            model={IndikasiProgramModel}
            onClick={() => {
              modal.delete.default({
                title: `Delete ${Modul.INDIKASI_PROGRAM}`,
                data: record,
                onSubmit: async () => {
                  const { isSuccess, message } = await deleteIndikasiProgram.execute(record.id, token);
                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchIndikasiPrograms({ token: token, page: pagination.page, per_page: pagination.per_page });
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
      title: `Tambah ${Modul.INDIKASI_PROGRAM}`,
      formFields: formFields({ options: { klasifikasi: klasifikasis } }),
      onSubmit: async (values) => {
        const payload = { ...values };
        const fileToSend = extractUploadFile(values.doc);
        delete payload.doc;

        const { message, isSuccess } = await storeIndikasiProgram.execute(payload, token, fileToSend);
        if (isSuccess) {
          success('Berhasil', message);
          fetchIndikasiPrograms();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  const onDeleteBatch = () => {
    modal.delete.batch({
      title: `Hapus ${selectedIndikasiPrograms.length} ${Modul.INDIKASI_PROGRAM} Yang Dipilih ? `,
      onSubmit: async () => {
        const ids = selectedIndikasiPrograms.map((item) => item.id);
        const { message, isSuccess } = await deleteBatchIndikasiProgram.execute(ids, token);
        if (isSuccess) {
          success('Berhasil', message);
          fetchIndikasiPrograms();
          setSelectedIndikasiPrograms([]);
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      }
    });
  };

  return (
    <Card>
      <Skeleton loading={getAllIndikasiPrograms.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.INDIKASI_PROGRAM} onDeleteBatch={onDeleteBatch} selectedData={selectedIndikasiPrograms} onSearch={(values) => setFilterValues({ search: values })} model={IndikasiProgramModel} />
        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            data={indikasiPrograms}
            columns={column}
            loading={getAllIndikasiPrograms.isLoading}
            map={(registrant) => ({ key: registrant.id, ...registrant })}
            pagination={pagination}
            handleSelectedData={(_, selectedRows) => setSelectedIndikasiPrograms(selectedRows)}
          />
        </div>
      </Skeleton>
    </Card>
  );
};

export default IndikasiPrograms;
