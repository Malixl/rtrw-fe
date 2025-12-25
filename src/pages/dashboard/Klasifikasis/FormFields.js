import { InputType } from '@/constants';
import Modul from '@/constants/Modul';

export const formFields = ({ options = {} } = {}) => [
  {
    label: `Nama ${Modul.KLASIFIKASI}`,
    name: 'name',
    type: InputType.TEXT,
    rules: [
      {
        required: true,
        message: `Nama ${Modul.KLASIFIKASI} harus diisi`
      }
    ],
    size: 'large'
  },
  {
    label: `Deskripsi ${Modul.KLASIFIKASI}`,
    name: 'desc',
    type: InputType.LONGTEXT,
    rules: [
      {
        required: true,
        message: `Deskripsi ${Modul.KLASIFIKASI} harus diisi`
      }
    ],
    size: 'large'
  },
  {
    label: `RTRW ${Modul.KLASIFIKASI}`,
    name: 'rtrw_id',
    type: InputType.SELECT,
    rules: [
      {
        required: true,
        message: `RTRW ${Modul.KLASIFIKASI} harus diisi`
      }
    ],
    size: 'large',
    options: (options.rtrws || []).map((item) => ({
      label: item.name,
      value: item.id
    }))
  },
  {
    label: `Tipe ${Modul.KLASIFIKASI}`,
    name: 'type',
    type: InputType.SELECT,
    rules: [
      {
        required: true,
        message: `Tipe ${Modul.KLASIFIKASI} harus diisi`
      }
    ],
    size: 'large',
    options: [
      {
        label: 'Pola Ruang',
        value: 'pola_ruang'
      },
      {
        label: 'Struktur Ruang',
        value: 'struktur_ruang'
      },
      {
        label: 'Ketentuan Khusus',
        value: 'ketentuan_khusus'
      },
      {
        label: 'Indikasi Program',
        value: 'indikasi_program'
      },
      {
        label: 'PKKPRL',
        value: 'pkkprl'
      }
    ]
  }
];
