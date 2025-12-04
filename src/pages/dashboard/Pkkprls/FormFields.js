import { InputType } from '@/constants';
import Modul from '@/constants/Modul';

export const formFields = ({ options }) => [
  {
    label: `Nama ${Modul.PKKPRL}`,
    name: 'name',
    type: InputType.TEXT,
    rules: [
      {
        required: true,
        message: `Nama ${Modul.PKKPRL} harus diisi`
      }
    ],
    size: 'large'
  },
  {
    label: `Deskripsi ${Modul.PKKPRL}`,
    name: 'desc',
    type: InputType.LONGTEXT,
    rules: [
      {
        required: true,
        message: `Deskripsi ${Modul.PKKPRL} harus diisi`
      }
    ],
    size: 'large'
  },
  {
    label: `Klasifkasi ${Modul.PKKPRL}`,
    name: 'id_klasifikasi',
    type: InputType.SELECT,
    rules: [
      {
        required: true,
        message: `Klasifikasi ${Modul.PKKPRL} harus diisi`
      }
    ],
    size: 'large',
    options: options.klasifikasi.map((item) => ({
      label: item.name,
      value: item.id
    }))
  },
  {
    label: `File Dokumen ${Modul.PKKPRL}`,
    name: 'geojson_file',
    type: InputType.UPLOAD,
    max: 1,
    beforeUpload: () => {
      return false;
    },
    getFileList: (data) => {
      return [
        {
          url: data?.geojson_file,
          name: data?.name
        }
      ];
    },
    accept: ['.geojson'],
    rules: []
  },
  {
    label: `Warna ${Modul.STRUKTUR}`,
    name: 'color',
    type: InputType.COLOR,
    rules: [
      {
        required: true,
        message: `Warna ${Modul.STRUKTUR} harus diisi`
      }
    ],
    size: 'large'
  }
];
