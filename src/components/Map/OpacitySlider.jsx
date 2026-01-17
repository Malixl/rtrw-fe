/* eslint-disable react/prop-types */
import { Slider, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

/**
 * OpacitySlider - Slider untuk mengatur transparansi layer GeoJSON
 * Mirip dengan fitur di aplikasi editing seperti Photoshop/Figma
 */
const OpacitySlider = ({ value = 80, onChange, disabled = false }) => {
  return (
    <div className="ml-6 mt-1 flex items-center gap-x-2">
      <Tooltip title="Transparansi">
        <EyeOutlined className="text-gray-400" style={{ fontSize: '12px' }} />
      </Tooltip>
      <Slider
        min={10}
        max={100}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="m-0 w-24 md:w-28"
        tooltip={{
          formatter: (val) => `${val}%`
        }}
        styles={{
          track: {
            background: 'linear-gradient(to right, #3b82f6, #60a5fa)'
          },
          rail: {
            background: '#e5e7eb'
          }
        }}
      />
      <span className="min-w-[32px] text-xs text-gray-500">{value}%</span>
    </div>
  );
};

export default OpacitySlider;
