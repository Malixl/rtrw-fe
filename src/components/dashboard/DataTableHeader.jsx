import { Action } from '@/constants';
import { useAuth } from '@/hooks';
import { DeleteOutlined, ExportOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Skeleton, Typography } from 'antd';
import PropTypes from 'prop-types';

const { CREATE, DELETE } = Action;

const { Title, Text } = Typography;

export default function DataHeader({ modul, subtitle, selectedData, onStore, onDeleteBatch, model, children, onImport, onExport }) {
  const { user } = useAuth();
  return (
    <>
      <div className="mb-6">
        {modul ? <Title level={5} className="!text-base sm:!text-lg">Data {modul}</Title> : <Skeleton.Input size="small" />}
        {subtitle &&
          (typeof subtitle === 'string' ? (
            <Text type="secondary" style={{ display: 'block', marginTop: '10px' }}>
              {subtitle}
            </Text>
          ) : (
            subtitle
          ))}
      </div>
      {(children || (user && user.eitherCan([DELETE, model], [CREATE, model]))) && (
        <div className="mb-6 flex flex-col-reverse justify-end gap-2 empty:hidden md:flex-row">
          {user && user.can(DELETE, model) && onDeleteBatch && (
            <Button className="me-auto" icon={<DeleteOutlined />} variant="solid" color="danger" disabled={!selectedData?.length} onClick={onDeleteBatch}>
              Hapus {selectedData?.length || null} Pilihan
            </Button>
          )}
          {user && user.can(CREATE, model) && onStore && (
            <Button icon={<PlusOutlined />} type="primary" onClick={onStore}>
              Tambah
            </Button>
          )}
          {onImport && (
            <Button variant="solid" icon={<ImportOutlined />} onClick={onImport}>
              Import
            </Button>
          )}
          {onExport && (
            <Button variant="solid" icon={<ExportOutlined />} onClick={onExport}>
              Export
            </Button>
          )}

          {children}
        </div>
      )}
    </>
  );
}

DataHeader.propTypes = {
  modul: PropTypes.string,
  subtitle: PropTypes.node,
  onVerify: PropTypes.func,
  onStore: PropTypes.func,
  onImport: PropTypes.func,
  onExport: PropTypes.func,
  onDeleteBatch: PropTypes.func,
  selectedData: PropTypes.array,
  model: PropTypes.func,
  children: PropTypes.node
};
