import { InputType } from '@/constants';
import Modul from '@/constants/Modul';

export const formFields = ({ options }) => [
  {
    label: `Nama ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
    name: 'name',
    type: InputType.TEXT,
    rules: [
      {
        required: true,
        message: `Nama ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
      }
    ],
    size: 'large'
  },
  {
    label: `Deskripsi ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
    name: 'desc',
    type: InputType.CONTENT_EDITOR,
    rules: [
      {
        required: true,
        message: `Deskripsi ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
      }
    ],
    size: 'large'
  },
  {
    label: `Klasifikasi ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
    name: 'id_klasifikasi',
    type: InputType.SELECT,
    rules: [
      {
        required: true,
        message: `Klasifikasi ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
      }
    ],
    size: 'large',
    options: options.klasifikasi.map((item) => ({
      label: item.name,
      value: item.id
    }))
  },
  {
    label: `File Dokumen ${Modul.KAWASAN_STRATEGI_PROVINSI}`,
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
    rules: [
      {
        required: true,
        message: `File dokumen ${Modul.KAWASAN_STRATEGI_PROVINSI} harus diisi`
      }
    ]
  }
];
