import React, { useState } from 'react';
import { Button, message, Tooltip, Form, Alert } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { generateDeskripsiAI } from '@/utils/aiGenerator';
import Modul from '@/constants/Modul';
import { normalizeColorValue } from '@/utils/formData';

/**
 * Mengumpulkan konteks dari form untuk dikirim ke AI generator
 */
const gatherFormContext = (form, klasifikasiOptions = []) => {
  const context = {};

  const klasId = form.getFieldValue('id_klasifikasi');
  if (klasId && klasifikasiOptions.length > 0) {
    const found = klasifikasiOptions.find(k => k.value === klasId);
    if (found) context.klasifikasi = found.label;
  }

  const geometryType = form.getFieldValue('geometry_type');
  if (geometryType) context.geometryType = geometryType;

  const colorRaw = form.getFieldValue('color');
  if (colorRaw) {
    try {
      context.color = normalizeColorValue(colorRaw) || colorRaw;
    } catch {
      context.color = typeof colorRaw === 'string' ? colorRaw : null;
    }
  }

  const lineType = form.getFieldValue('line_type');
  if (lineType) context.lineType = lineType;

  const icon = form.getFieldValue('icon');
  if (icon && ((Array.isArray(icon) && icon.length > 0) || (icon && !Array.isArray(icon)))) {
    context.hasIcon = true;
  }

  return context;
};

export const AiGeneratorButton = ({ 
  form, 
  aiSourceField = 'name', 
  modulName = Modul.BATAS_ADMINISTRASI, 
  klasifikasiOptions = [],
  geometryType = null,
  onGenerate 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [quotaAlert, setQuotaAlert] = useState(null);

  const nameValue = Form.useWatch(aiSourceField, form);
  const klasifikasiValue = Form.useWatch('id_klasifikasi', form);
  const isReady = !!(nameValue && nameValue.trim() !== '' && klasifikasiValue);

  const handleGenerateAI = async () => {
    const sourceValue = form.getFieldValue(aiSourceField);
    
    if (!sourceValue || sourceValue.trim() === '') {
      message.warning(`Silakan isi field Nama terlebih dahulu agar AI tahu apa yang harus dijelaskan.`);
      return;
    }

    setIsGenerating(true);
    const hideLoading = message.loading(`Sedang membuat deskripsi AI untuk "${sourceValue}"...`, 0);

    try {
      const context = gatherFormContext(form, klasifikasiOptions);
      if (geometryType) context.geometryType = geometryType;

      const generatedText = await generateDeskripsiAI(sourceValue, modulName, context);
      if (onGenerate) onGenerate(generatedText);
      setQuotaAlert(null); // Clear alert if successful
      message.success('Deskripsi berhasil di-generate oleh AI!');
    } catch (error) {
      console.error(error);
      if (error.isQuotaError) {
        setQuotaAlert(error.message);
        // Auto hide alert after 60 seconds
        setTimeout(() => setQuotaAlert(null), 60000);
      }
      message.error(error.message || 'Gagal memanggil layanan AI.');
    } finally {
      hideLoading();
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-1">
      {quotaAlert && (
        <Alert
          message="Batas Kuota AI"
          description={quotaAlert}
          type="warning"
          showIcon
          closable
          onClose={() => setQuotaAlert(null)}
          className="mb-2"
        />
      )}
      <div className="flex justify-end w-full">
        <Tooltip title={isReady ? "Klik untuk generate deskripsi otomatis menggunakan AI berdasarkan nama, klasifikasi, dan konteks data." : "Harap isi Nama dan Klasifikasi terlebih dahulu untuk menggunakan AI"} placement="left">
          <Button 
            size="small" 
            type="primary" 
            icon={<BulbOutlined />}
            onClick={handleGenerateAI}
            loading={isGenerating}
            disabled={!isReady}
            className={`border-none shadow-sm flex items-center justify-center -mb-2 z-10 ${isReady ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-400 opacity-60'}`}
          style={{ fontSize: '12px' }}
        >
          ✨ Generate AI
        </Button>
      </Tooltip>
      </div>
    </div>
  );
};

export default AiGeneratorButton;
