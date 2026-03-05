import { Progress, Typography, Modal } from 'antd';
import { CloudUploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

const { Text } = Typography;

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * UploadProgress - Shows upload progress bar during file upload
 * @param {{ percent: number, loaded: number, total: number, visible: boolean, onClose?: () => void }} props
 */
export default function UploadProgress({ percent = 0, loaded = 0, total = 0, visible = false, onClose }) {
  const isComplete = percent >= 100;
  const status = isComplete ? 'success' : 'active';

  useEffect(() => {
    let timeout;
    if (visible && isComplete && onClose) {
      timeout = setTimeout(() => {
        onClose();
      }, 1500); // Tunda auto-close selama 1.5 detik agar tulisan selesai terbaca
    }
    return () => clearTimeout(timeout);
  }, [visible, isComplete, onClose]);

  if (!visible) return null;

  return (
    <Modal
      open={visible}
      closable={false}
      footer={null}
      centered
      width={400}
      maskClosable={false}
      zIndex={2000} // Ensure it stays above CrudModal
      className="upload-progress-modal"
    >
      <div
        className="rounded-lg border px-4 py-3"
        style={{
          backgroundColor: isComplete ? '#f6ffed' : '#e6f4ff',
          borderColor: isComplete ? '#b7eb8f' : '#91caff'
        }}
      >
        <div className="mb-1 flex items-center gap-2">
          {isComplete ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
          ) : (
            <CloudUploadOutlined style={{ color: '#1677ff', fontSize: 16 }} className="animate-pulse" />
          )}
          <Text strong className="text-sm">
            {isComplete ? 'Upload selesai!' : 'Mengupload file...'}
          </Text>
          {total > 0 && (
            <Text type="secondary" className="ml-auto text-xs">
              {formatBytes(loaded)} / {formatBytes(total)}
            </Text>
          )}
        </div>
        <Progress
          percent={percent}
          status={status}
          size="small"
          strokeColor={isComplete ? '#52c41a' : { from: '#1677ff', to: '#722ed1' }}
        />
        {!isComplete && percent > 0 && (
          <Text type="secondary" className="mt-1 block text-xs">
            {percent < 100 ? 'Jangan tutup halaman ini selama upload berlangsung' : 'Memproses file di server...'}
          </Text>
        )}
      </div>
    </Modal>
  );
}
