import React, { useState } from 'react';
import { Button, Input, message, Tooltip, Form, Alert } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { generateDeskripsiAI } from '@/utils/aiGenerator';
import Modul from '@/constants/Modul';
import { normalizeColorValue } from '@/utils/formData';

const { TextArea } = Input;

/**
 * Mengumpulkan konteks dari form untuk dikirim ke AI generator
 */
const gatherFormContext = (form, klasifikasiOptions = []) => {
  const context = {};

  // Ambil klasifikasi (nama label, bukan ID)
  const klasId = form.getFieldValue('id_klasifikasi');
  if (klasId && klasifikasiOptions.length > 0) {
    const found = klasifikasiOptions.find(k => k.value === klasId);
    if (found) context.klasifikasi = found.label;
  }

  // Ambil geometry_type jika tersedia di form value (biasanya tidak di form, tapi kadang di-set)
  const geometryType = form.getFieldValue('geometry_type');
  if (geometryType) context.geometryType = geometryType;

  // Ambil warna
  const colorRaw = form.getFieldValue('color');
  if (colorRaw) {
    try {
      context.color = normalizeColorValue(colorRaw) || colorRaw;
    } catch {
      context.color = typeof colorRaw === 'string' ? colorRaw : null;
    }
  }

  // Ambil tipe garis
  const lineType = form.getFieldValue('line_type');
  if (lineType) context.lineType = lineType;

  // Cek apakah ada icon upload
  const icon = form.getFieldValue('icon');
  if (icon && ((Array.isArray(icon) && icon.length > 0) || (icon && !Array.isArray(icon)))) {
    context.hasIcon = true;
  }

  return context;
};

/**
 * Custom TextArea dengan fitur Generate AI
 * Komponen ini kompatibel dengan Form.Item dari Ant Design karena meneruskan value & onChange
 */
export const AiTextArea = ({ 
  value, 
  onChange, 
  form, 
  aiSourceField = 'name', 
  label = 'Deskripsi', 
  modulName = Modul.BATAS_ADMINISTRASI,
  klasifikasiOptions = [],
  geometryType = null,
  ...props 
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
      // Kumpulkan semua konteks dari form
      const context = gatherFormContext(form, klasifikasiOptions);
      // Override geometry type jika diberikan secara eksplisit (dari parent)
      if (geometryType) context.geometryType = geometryType;

      const generatedText = await generateDeskripsiAI(sourceValue, modulName, context);
      onChange(generatedText);
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
    <div className="relative w-full flex flex-col gap-y-2">
      {quotaAlert && (
        <Alert
          message="Batas Kuota AI"
          description={quotaAlert}
          type="warning"
          showIcon
          closable
          onClose={() => setQuotaAlert(null)}
          className="mb-1"
        />
      )}
      <TextArea 
        value={value} 
        onChange={onChange} 
        rows={6}
        {...props} 
      />
      {!props.readOnly && !props.disabled && (
        <div className="flex justify-end">
          <Tooltip title={isReady ? "Hasilkan deskripsi otomatis menggunakan AI berdasarkan nama, klasifikasi, dan konteks data spasial" : "Harap isi Nama dan Klasifikasi terlebih dahulu untuk menggunakan AI"}>
            <Button 
              size="small" 
              type="primary" 
              icon={<BulbOutlined />}
              onClick={handleGenerateAI}
              loading={isGenerating}
              disabled={!isReady}
              className={`border-none shadow-sm ${isReady ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-400 opacity-60'}`}
              style={{ fontSize: '12px' }}
            >
              ✨ Generate AI
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default AiTextArea;
