import { Progress, Typography, Modal } from 'antd';
import { CloudUploadOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
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
 * UploadProgress - Shows upload progress bar during file upload.
 * Supports both regular upload and chunked upload phases.
 *
 * @param {{
 *   percent: number,
 *   loaded: number,
 *   total: number,
 *   visible: boolean,
 *   phaseText?: string,
 *   onClose?: () => void,
 * }} props
 */
export default function UploadProgress({ percent = 0, loaded = 0, total = 0, visible = false, phaseText = '', onClose }) {
  const isComplete = percent >= 100 && (!phaseText || phaseText === 'Upload selesai!');
  const isMerging = phaseText?.toLowerCase().includes('menggabungkan') || phaseText?.toLowerCase().includes('merging');
  const status = isComplete ? 'success' : 'active';

  useEffect(() => {
    let timeout;
    // Auto-close hanya jika upload benar-benar selesai (bukan sedang merging)
    if (visible && isComplete && onClose && !isMerging) {
      timeout = setTimeout(() => {
        onClose();
      }, 1500);
    }
    return () => clearTimeout(timeout);
  }, [visible, isComplete, isMerging, onClose]);

  if (!visible) return null;

  // Tentukan icon dan judul berdasarkan status
  let icon, title;
  if (isComplete) {
    icon = <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
    title = 'Upload selesai!';
  } else if (isMerging) {
    icon = <SyncOutlined spin style={{ color: '#722ed1', fontSize: 16 }} />;
    title = phaseText || 'Menggabungkan file di server...';
  } else {
    icon = <CloudUploadOutlined style={{ color: '#1677ff', fontSize: 16 }} className="animate-pulse" />;
    title = phaseText || 'Mengupload file...';
  }

  return (
    <Modal
      open={visible}
      closable={false}
      footer={null}
      centered
      width={400}
      maskClosable={false}
      zIndex={2000}
      className="upload-progress-modal"
    >
      <div
        className="rounded-lg border px-4 py-3"
        style={{
          backgroundColor: isComplete ? '#f6ffed' : isMerging ? '#f9f0ff' : '#e6f4ff',
          borderColor: isComplete ? '#b7eb8f' : isMerging ? '#d3adf7' : '#91caff'
        }}
      >
        <div className="mb-1 flex items-center gap-2">
          {icon}
          <Text strong className="text-sm">
            {title}
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
          strokeColor={isComplete ? '#52c41a' : isMerging ? { from: '#722ed1', to: '#eb2f96' } : { from: '#1677ff', to: '#722ed1' }}
        />
        {!isComplete && percent > 0 && (
          <Text type="secondary" className="mt-1 block text-xs">
            {isMerging
              ? 'Server sedang menggabungkan file. Jangan tutup halaman ini.'
              : 'Jangan tutup halaman ini selama upload berlangsung'}
          </Text>
        )}
      </div>
    </Modal>
  );
}

