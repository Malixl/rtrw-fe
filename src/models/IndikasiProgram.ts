import asset from '@/utils/asset';
import Model from './Model';

export interface IncomingApiData {
  id: number;
  klasifikasi_id: number;
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
    public klasifikasi_id: number,
    public name: string,
    public doc: string
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, IndikasiProgram> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, IndikasiProgram>;
    return new IndikasiProgram(apiData.id, apiData.klasifikasi_id, apiData.nama, asset(apiData.file_dokumen)) as ReturnType<T, IncomingApiData, IndikasiProgram>;
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
