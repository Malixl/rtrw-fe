/* eslint-disable react/prop-types */
import { motion, AnimatePresence } from 'framer-motion';
import { EnvironmentFilled, LoadingOutlined } from '@ant-design/icons';
import { Progress } from 'antd';

const BatchLoadingOverlay = ({ isVisible, current, total, isEnabling }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/20 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {/* Modal Card */}
          <motion.div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ duration: 0.2 }}>
            {/* Icon & Title */}
            <div className="mb-4 flex items-center gap-4">
              <motion.div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <EnvironmentFilled className="text-2xl text-blue-600" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{isEnabling ? 'Memuat Layer' : 'Menonaktifkan Layer'}</h3>
                <p className="text-sm text-gray-500">
                  {current} dari {total} layer
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <Progress
                percent={percentage}
                strokeColor={{
                  '0%': '#3b82f6',
                  '100%': '#2563eb'
                }}
                trailColor="#e5e7eb"
                showInfo={false}
                strokeWidth={8}
              />
            </div>

            {/* Percentage & Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-blue-600">{percentage}%</span>
              <span className="flex items-center gap-2 text-gray-500">
                <LoadingOutlined className="animate-spin" />
                Mohon tunggu...
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BatchLoadingOverlay;
