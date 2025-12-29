import asset from '@/utils/asset';
import Model from './Model';

export interface IncomingApiData {
  id: number;
  klasifikasi: {
    id: number;
    nama: string;
    deskripsi: string;
    tipe: string;
    layer_group: {
      id: number;
      nama_layer_group: string;
    };
  };
  nama: string;
  file_dokumen: string;
}

export interface OutgoingApiData {
  _method?: 'PUT';
  nama: string;
  file_dokumen?: string;
  klasifikasi_id: string;
}

interface FormValue {
  _method?: 'PUT';
  id_klasifikasi: string;
  name: string;
  doc?: string;
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class IndikasiProgram extends Model {
  constructor(
    public id: number,
    public klasifikasi: {
      id: number;
      name: string;
      desc: string;
      type: string;
      layer_group: {
        id: number;
        name: string;
      };
    },
    public name: string,
    public doc: string
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, IndikasiProgram> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, IndikasiProgram>;
    return new IndikasiProgram(
      apiData.id,
      {
        id: apiData.klasifikasi.id,
        name: apiData.klasifikasi.nama,
        desc: apiData.klasifikasi.deskripsi,
        type: apiData.klasifikasi.tipe,
        layer_group: {
          id: apiData.klasifikasi.layer_group.id,
          name: apiData.klasifikasi.layer_group.nama_layer_group
        }
      },
      apiData.nama,
      asset(apiData.file_dokumen)
    ) as ReturnType<T, IncomingApiData, IndikasiProgram>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(indikasiProgram: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(indikasiProgram)) return indikasiProgram.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: indikasiProgram.name,
      klasifikasi_id: indikasiProgram.id_klasifikasi
    };

    if (typeof indikasiProgram.doc === 'string') {
      apiData.file_dokumen = indikasiProgram.doc;
    }

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

// FIXME: you maybe want to change below line. If you don't want to then delete this FIXME line
Model.children.indikasi_program = IndikasiProgram;
