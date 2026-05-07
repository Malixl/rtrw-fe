/* eslint-disable no-unused-vars */
import { DataTable, DataTableHeader } from '@/components';
import { Action } from '@/constants';
import { useAuth, useChunkedUpload, useCrudModal, useNotification, usePagination, useService } from '@/hooks';
import { CHUNKED_UPLOAD_THRESHOLD } from '@/hooks/useChunkedUpload';
import { KlasifikasisService, PolaruangsService } from '@/services';
import { Button, Card, ColorPicker, Skeleton, Space } from 'antd';
import React from 'react';
import { Delete, Detail, Edit } from '@/components/dashboard/button';
import Modul from '@/constants/Modul';
import { formFields } from './FormFields';
import { Polaruangs as PolaruangModel } from '@/models';
import { useParams } from 'react-router-dom';
import { extractUploadFile, hasNewUploadFile, normalizeColorValue } from '@/utils/formData';
import UploadProgress from '@/components/dashboard/UploadProgress';
import { ReloadOutlined } from '@ant-design/icons';

const { UPDATE, READ, DELETE } = Action;

const Polaruangs = () => {
  const { token, user } = useAuth();
  const params = useParams();
  const modal = useCrudModal();
  const { success, error } = useNotification();
  const { execute, ...getAllPolaruangs } = useService(PolaruangsService.getAll);
  const { execute: fetchKlasifikasis, ...getAllKlasifikasis } = useService(KlasifikasisService.getAll);
  const storePolaruang = useService(PolaruangsService.store);
  const storeWithMerged = useService(PolaruangsService.storeWithMergedFile);
  const updatePolaruang = useService(PolaruangsService.update);
  const updateWithMerged = useService(PolaruangsService.updateWithMergedFile);
  const deletePolaruang = useService(PolaruangsService.delete);
  const deleteBatchPolaruangs = useService(PolaruangsService.deleteBatch);
  const [filterValues, setFilterValues] = React.useState({ search: '' });
  const [uploadProgress, setUploadProgress] = React.useState({ visible: false, percent: 0, loaded: 0, total: 0, phaseText: '' });

  const resetProgress = () => setUploadProgress({ visible: false, percent: 0, loaded: 0, total: 0, phaseText: '' });
  const onProgress = (p) => setUploadProgress({ visible: true, ...p });

  const chunkedUpload = useChunkedUpload();
  const pendingGeoJsonFileRef = React.useRef(null);

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
      title: 'Nama',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      searchable: true
    },
    {
      title: 'Klasifikasi Pola Ruang',
      render: (_, record) => {
        const id = record.klasifikasi_id ?? record.klasifikasi?.id ?? record.klasifikasi;
        const klas = klasifikasis.find((k) => k.id === id);
        return klas?.nama || klas?.name || '-';
      }
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

                  let fileToSend = null;
                  if (isFileUpdated) {
                    const extracted = extractUploadFile(values.geojson_file);
                    fileToSend = extracted?.geojson_file ?? extracted;
                  }

                  let result;

                  if (fileToSend && fileToSend.size >= CHUNKED_UPLOAD_THRESHOLD) {
                    pendingGeoJsonFileRef.current = fileToSend;
                    setUploadProgress({ visible: true, percent: 0, loaded: 0, total: fileToSend.size, phaseText: 'Memulai chunked upload...' });

                    const mergedPath = await chunkedUpload.startUpload(fileToSend, token);

                    if (!mergedPath) {
                      setUploadProgress((prev) => ({ ...prev, phaseText: chunkedUpload.error || 'Upload gagal' }));
                      return false;
                    }

                    result = await updateWithMerged.execute(record.id, payload, token, mergedPath);
                  } else {
                    result = await updatePolaruang.execute(record.id, payload, token, fileToSend, onProgress);
                  }

                  const { message, isSuccess } = result;

                  if (isSuccess) {
                    success('Berhasil', message);
                    fetchPolaruangs();
                  } else {
                    error('Gagal', message);
                  }

                  return isSuccess;
                },
                afterClose: resetProgress
              });
            }}
          />
          <Detail
            title={`Detail ${Modul.POLARUANG}`}
            model={PolaruangModel}
            disabled
            style={{ display: 'none' }}
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
        const extracted = extractUploadFile(values.geojson_file);
        const fileToSend = extracted?.geojson_file ?? extracted;
        delete payload.geojson_file;

        let result;

        if (fileToSend && fileToSend.size >= CHUNKED_UPLOAD_THRESHOLD) {
          pendingGeoJsonFileRef.current = fileToSend;
          setUploadProgress({ visible: true, percent: 0, loaded: 0, total: fileToSend.size, phaseText: 'Memulai chunked upload...' });

          const mergedPath = await chunkedUpload.startUpload(fileToSend, token);

          if (!mergedPath) {
            setUploadProgress((prev) => ({ ...prev, phaseText: chunkedUpload.error || 'Upload gagal' }));
            return false;
          }

          result = await storeWithMerged.execute(payload, token, mergedPath);
        } else {
          result = await storePolaruang.execute(payload, token, fileToSend, onProgress);
        }

        const { message, isSuccess } = result;

        if (isSuccess) {
          success('Berhasil', message);
          fetchPolaruangs();
        } else {
          error('Gagal', message);
        }
        return isSuccess;
      },
      afterClose: resetProgress
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

  // Sync chunked upload progress
  React.useEffect(() => {
    if (chunkedUpload.isUploading || chunkedUpload.progress.phase === 'merging') {
      setUploadProgress({
        visible: true,
        percent: chunkedUpload.progress.percent,
        loaded: 0,
        total: 0,
        phaseText: chunkedUpload.progress.phaseText,
      });
    } else if (chunkedUpload.progress.phase === 'done' || chunkedUpload.progress.phase === 'idle') {
      resetProgress();
    }
  }, [chunkedUpload.isUploading, chunkedUpload.progress]);

  const handleRetryChunkedUpload = React.useCallback(async () => {
    if (!pendingGeoJsonFileRef.current) return;
    await chunkedUpload.retry(pendingGeoJsonFileRef.current, token);
  }, [chunkedUpload, token]);

  return (
    <Card>
      <Skeleton loading={getAllPolaruangs.isLoading}>
        <DataTableHeader onStore={onCreate} modul={Modul.POLARUANG} onDeleteBatch={onDeleteBatch} selectedData={selectedPolaruangs} onSearch={(values) => setFilterValues({ search: values })} model={PolaruangModel} />
        <UploadProgress {...uploadProgress} onClose={resetProgress} />

        {chunkedUpload.progress.phase === 'error' && (
          <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">
                {chunkedUpload.error || 'Upload gagal. Klik Retry untuk melanjutkan dari chunk terakhir.'}
              </span>
              <Button
                type="primary"
                danger
                icon={<ReloadOutlined />}
                size="small"
                onClick={handleRetryChunkedUpload}
                loading={chunkedUpload.isUploading}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

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
