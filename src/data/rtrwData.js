import { EnvironmentOutlined, GlobalOutlined, FileTextOutlined } from '@ant-design/icons';

export const rtrwDefinition = {
  title: 'Pengertian RTRW',
  icon: FileTextOutlined,
  description:
    'Menurut Undang-Undang Nomor 26 Tahun 2007 tentang Penataan Ruang, Rencana Tata Ruang Wilayah (RTRW) adalah hasil perencanaan tata ruang yang berisi struktur ruang dan pola ruang, serta dilengkapi dengan arahan pemanfaatan ruang dan pengendalian pemanfaatan ruang di wilayah tertentu.'
};

export const rtrwObjectives = {
  title: 'Tujuan RTRW',
  icon: GlobalOutlined,
  items: [
    {
      id: 1,
      title: 'Pengelolaan Ruang Berkelanjutan',
      description: 'Mengatur pemanfaatan ruang agar sesuai dengan potensi dan daya dukung lingkungan.'
    },
    {
      id: 2,
      title: 'Keterpaduan Pembangunan',
      description: 'Mewujudkan keterpaduan pembangunan antar sektor dan antar wilayah.'
    },
    {
      id: 3,
      title: 'Keseimbangan Ekonomi & Lingkungan',
      description: 'Menjaga keseimbangan antara pembangunan ekonomi dan pelestarian lingkungan.'
    },
    {
      id: 4,
      title: 'Pencegahan Konflik',
      description: 'Mencegah konflik tata ruang, seperti tumpang tindih antara permukiman, industri, pertanian, dan kawasan lindung.'
    }
  ]
};

export const rtrwContents = {
  title: 'Isi RTRW',
  icon: EnvironmentOutlined,
  items: [
    {
      id: 1,
      title: 'Struktur Ruang',
      description: 'Susunan pusat-pusat kegiatan dan jaringan prasarana (jalan, pelabuhan, bandara, dsb).',
      icon: '🏗️'
    },
    {
      id: 2,
      title: 'Pola Ruang',
      description: 'Peruntukan ruang, seperti kawasan lindung, kawasan budidaya, permukiman, industri, pertanian, dan sebagainya.',
      icon: '🗺️'
    },
    {
      id: 3,
      title: 'Arahan Pemanfaatan Ruang',
      description: 'Pedoman untuk penggunaan ruang yang sesuai dengan rencana.',
      icon: '📋'
    },
    {
      id: 4,
      title: 'Pengendalian Pemanfaatan Ruang',
      description: 'Ketentuan untuk mencegah pelanggaran',
      icon: '⚖️'
    }
  ]
};

export const heroData = {
  title: 'Rencana Tata Ruang Wilayah',
  subtitle: 'Provinsi Gorontalo',
  description: 'Dokumen perencanaan tata ruang yang mengatur pemanfaatan ruang di Provinsi Gorontalo dalam jangka waktu 20 tahun.'
};
