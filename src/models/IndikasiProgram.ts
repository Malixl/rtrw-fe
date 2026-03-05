import asset from '@/utils/asset';
import Model from './Model';

export interface IncomingApiData {
  id: number;
  klasifikasi_id: number;
  nama: string;
  deskripsi: string | null;
  file_dokumen: string | null;
}

export interface OutgoingApiData {
  _method?: 'PUT';
  nama: string;
  deskripsi: string | null;
  file_dokumen?: string | null;
  klasifikasi_id: string;
}

interface FormValue {
  _method?: 'PUT';
  id_klasifikasi: string;
  name: string;
  deskripsi?: string;
  doc?: string | null;
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class IndikasiProgram extends Model {
  constructor(
    public id: number,
    public klasifikasi_id: number,
    public name: string,
    public deskripsi: string | null,
    public doc: string | null
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, IndikasiProgram> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, IndikasiProgram>;
    return new IndikasiProgram(apiData.id, apiData.klasifikasi_id, apiData.nama, apiData.deskripsi, apiData.file_dokumen ? asset(apiData.file_dokumen) : null) as ReturnType<T, IncomingApiData, IndikasiProgram>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(indikasiProgram: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(indikasiProgram)) return indikasiProgram.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: indikasiProgram.name,
      deskripsi: indikasiProgram.deskripsi || null,
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
