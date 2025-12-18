import { InputType } from '@/constants';
import Modul from '@/constants/Modul';

export const formFields = () => [
  {
    label: `Nama ${Modul.BATAS_ADMINISTRASI}`,
    name: 'name',
    type: InputType.TEXT,
    rules: [
      {
        required: true,
        message: `Nama ${Modul.BATAS_ADMINISTRASI} harus diisi`
      }
    ],
    size: 'large'
  },
  {
    label: `Deskripsi ${Modul.BATAS_ADMINISTRASI}`,
    name: 'desc',
    type: InputType.LONGTEXT,
    rules: [
      {
        required: true,
        message: `Deskripsi ${Modul.BATAS_ADMINISTRASI} harus diisi`
      }
    ],
    size: 'large'
  },
  {
    label: `File GeoJSON ${Modul.BATAS_ADMINISTRASI}`,
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
    accept: ['.geojson']
  },
  {
    label: `Warna ${Modul.BATAS_ADMINISTRASI}`,
    name: 'color',
    type: InputType.COLOR,
    rules: [
      {
        required: true,
        message: `Warna ${Modul.BATAS_ADMINISTRASI} harus diisi`
      }
    ],
    size: 'large'
  }
];
