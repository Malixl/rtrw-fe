import React from 'react';
import asset from '@/utils/asset';

/**
 * LegendItem - Komponen legend kecil untuk sidebar
 * Props:
 * - tipe_geometri: 'point' | 'polyline' | 'polygon'
 * - icon_titik: string (path asset)
 * - warna: string (color)
 * - nama: string (label)
 */
const LegendItem = ({ tipe_geometri, icon_titik, warna, nama }) => {
  if (tipe_geometri === 'point' && icon_titik) {
    return (
      <div className="mb-2 mt-1 flex items-center gap-x-2">
        <img className="h-4 w-4" src={asset(icon_titik)} alt={nama} />
        <span className="text-xs text-gray-700">{nama}</span>
      </div>
    );
  }
  if ((tipe_geometri === 'polyline' || tipe_geometri === 'polygon') && warna) {
    return (
      <div className="mb-2 mt-1 flex items-center gap-x-2">
        <div className="h-2 w-5" style={{ backgroundColor: warna }} />
        <span className="text-xs text-gray-700">{nama}</span>
      </div>
    );
  }
  return null;
};

export default LegendItem;
