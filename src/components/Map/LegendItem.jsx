import PropTypes from 'prop-types';
import asset from '@/utils/asset';

/**
 * Helper untuk memetakan input data dari database ke style yang dikenali
 */
const normalizeLineType = (input) => {
  if (!input) return 'solid';
  const type = input.toLowerCase();

  // Mapping jika nama di database berbeda
  if (type === 'dash-dot-dash-dot-dot' || type.includes('dash-dot-dash-dot-dot')) return 'dash-dot-dash-dot-dot';
  if (type === 'dash-dot-dot' || type.includes('dash-dot-dot')) return 'dash-dot-dot';
  if (type.includes('putus') || type.includes('dash')) return 'dashed';
  if (type.includes('tebal') || type.includes('bold')) return 'bold';
  if (type.includes('titik') || type.includes('dot')) return 'dotted';

  return 'solid';
};

// Konfigurasi style garis
const getLineStyle = (tipe_garis) => {
  const normalizedType = normalizeLineType(tipe_garis);

  switch (normalizedType) {
    case 'dashed':
      return { strokeWidth: 3, dashArray: '6, 3' };
    case 'dotted':
      return { strokeWidth: 3, dashArray: '2, 3' };
    case 'dash-dot-dot':
      return { strokeWidth: 4, dashArray: '12, 3, 2.5, 3, 2.5, 3' }; // pola: ─ ·· ─ ·· (tebal & titik besar)
    case 'dash-dot-dash-dot-dot':
      return { strokeWidth: 4, dashArray: '8, 3, 2.5, 3, 8, 3, 2.5, 3, 2.5, 3' }; // pola: ─ · ─ ·· (tebal & titik besar)
    case 'bold':
      return { strokeWidth: 7, dashArray: undefined }; // Dipertebal jadi 7
    case 'solid':
    default:
      return { strokeWidth: 3, dashArray: undefined };
  }
};

const renderPolyline = (warna, nama, tipe_garis) => {
  const normalizedType = normalizeLineType(tipe_garis);
  const { strokeWidth, dashArray } = getLineStyle(tipe_garis); // Gunakan tipe_garis langsung

  // Debugging: Cek di Console browser (F12) untuk melihat data apa yang masuk
  // console.log(`Legend: ${nama} | Tipe Input: ${tipe_garis} | Hasil: ${normalizedType}`);

  const width = 40;
  const height = 12; // Sedikit dipertinggi agar garis tebal muat
  const centerY = height / 2;

  return (
    <div className="mb-2 ml-6 mt-1 flex items-center gap-x-2">
      <div className="flex w-8 items-center justify-center">
        <svg width="32" height="12" viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <line
            x1="0"
            y1={centerY}
            x2={width}
            y2={centerY}
            stroke={warna}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinecap={normalizedType === 'dashed' || normalizedType === 'dash-dot-dot' || normalizedType === 'dash-dot-dash-dot-dot' ? 'butt' : 'round'}
          />
        </svg>
      </div>
      <span className="text-xs font-medium text-gray-700">{nama}</span>
    </div>
  );
};

const renderPoint = (icon_titik, nama) => (
  <div className="mb-2 ml-6 mt-1 flex items-center gap-x-2">
    <div className="flex h-5 w-8 items-center justify-center">
      <img className="h-5 w-5 object-contain" src={asset(icon_titik)} alt={nama} />
    </div>
    <span className="text-xs font-medium text-gray-700">{nama}</span>
  </div>
);

const renderPolygon = (warna, nama) => (
  <div className="mb-2 ml-6 mt-1 flex items-center gap-x-2">
    <div className="flex h-5 w-8 items-center justify-center">
      <div className="h-4 w-6 rounded-sm border border-gray-400/30" style={{ backgroundColor: warna }} />
    </div>
    <span className="text-xs font-medium text-gray-700">{nama}</span>
  </div>
);

const LegendItem = ({ tipe_geometri, icon_titik, warna, nama, tipe_garis }) => {
  const geometry = tipe_geometri?.toLowerCase();

  switch (geometry) {
    case 'point':
      if (icon_titik) return renderPoint(icon_titik, nama);
      break;
    case 'polygon':
      if (warna) return renderPolygon(warna, nama);
      break;
    case 'polyline': {
      const lineColor = warna || '#333333';
      // Pass tipe_garis apa adanya, nanti dinormalisasi di dalam renderPolyline
      return renderPolyline(lineColor, nama, tipe_garis);
    }
    default:
      return null;
  }
  return null;
};

LegendItem.propTypes = {
  tipe_geometri: PropTypes.string,
  icon_titik: PropTypes.string,
  warna: PropTypes.string,
  nama: PropTypes.string.isRequired,
  tipe_garis: PropTypes.string // Ubah jadi string bebas agar bisa terima input database
};

export default LegendItem;
