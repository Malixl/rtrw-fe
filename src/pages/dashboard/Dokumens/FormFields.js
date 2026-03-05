import { InputType } from '@/constants';
import Modul from '@/constants/Modul';

export const formFields = ({ options }) => [
    {
        label: `Nama ${Modul.DOKUMEN}`,
        name: 'name',
        type: InputType.TEXT,
        rules: [
            {
                required: true,
                message: `Nama ${Modul.DOKUMEN} harus diisi`
            }
        ],
        size: 'large'
    },
    {
        label: 'Deskripsi',
        name: 'deskripsi',
        type: InputType.LONGTEXT,
        rules: [],
    },
    {
        label: `Klasifikasi ${Modul.DOKUMEN}`,
        name: 'id_klasifikasi',
        type: InputType.SELECT,
        rules: [
            {
                required: true,
                message: `Klasifikasi ${Modul.DOKUMEN} harus diisi`
            }
        ],
        size: 'large',
        options: options.klasifikasi.map((item) => ({
            label: item.name,
            value: item.id
        }))
    },
    {
        label: `File Dokumen ${Modul.DOKUMEN}`,
        name: 'doc',
        type: InputType.UPLOAD,
        max: 1,
        beforeUpload: () => {
            return false;
        },
        getFileList: (data) => {
            return [
                {
                    url: data?.doc,
                    name: data?.name
                }
            ];
        },
        accept: ['.pdf'],
        rules: []
    }
];
