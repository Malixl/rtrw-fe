import { InputType } from '@/constants';
import Modul from '@/constants/Modul';

export const formFields = () => [
  {
    label: `Nama ${Modul.LAYER_GROUP}`,
    name: 'name',
    type: InputType.TEXT,
    rules: [
      {
        required: true,
        message: `Nama ${Modul.LAYER_GROUP} harus diisi`
      }
    ],
    size: 'large'
  },
  // {
  //   label: `Deskripsi ${Modul.LAYER_GROUP}`,
  //   name: 'desc',
  //   type: InputType.LONGTEXT,
  //   rules: [
  //     {
  //       required: true,
  //       message: `Deskripsi ${Modul.LAYER_GROUP} harus diisi`
  //     }
  //   ],
  //   size: 'large'
  // },
  {
    label: `Urutan Tampil ${Modul.LAYER_GROUP}`,
    name: 'order',
    type: InputType.NUMBER,
    rules: [
      {
        required: true,
        message: `Urutan tampil ${Modul.LAYER_GROUP} harus diisi`
      }
    ],
    size: 'large'
  }
];
