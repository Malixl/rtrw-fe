import Model from './Model';

export interface IncomingApiData {
  id: number;
  layer_group: {
    id: number;
    nama_layer_group: string;
  };
  nama: string;
  deskripsi: string;
  tipe: 'pola_ruang' | 'struktur_ruang' | 'ketentuan_khusus' | 'pkkprl' | 'indikasi_program';
}

export interface OutgoingApiData {
  nama: string;
  deskripsi: string;
  layer_group_id: number;
  tipe: 'pola_ruang' | 'struktur_ruang' | 'ketentuan_khusus' | 'pkkprl' | 'indikasi_program';
}

interface FormValue {
  name: string;
  desc: string;
  layer_group_id: number;
  type: 'pola_ruang' | 'struktur_ruang' | 'ketentuan_khusus' | 'pkkprl' | 'indikasi_program';
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class Klasifikasis extends Model {
  constructor(
    public id: number,
    public layer_group: {
      id: number;
      name: string;
    },
    public name: string,
    public desc: string,
    public type: 'pola_ruang' | 'struktur_ruang' | 'ketentuan_khusus' | 'pkkprl' | 'indikasi_program'
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, Klasifikasis> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, Klasifikasis>;
    return new Klasifikasis(
      apiData.id,
      {
        id: apiData.layer_group.id,
        name: apiData.layer_group.nama_layer_group
      },
      apiData.nama,
      apiData.deskripsi,
      apiData.tipe
    ) as ReturnType<T, IncomingApiData, Klasifikasis>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(klasifikasis: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(klasifikasis)) return klasifikasis.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: klasifikasis.name,
      deskripsi: klasifikasis.desc,
      layer_group_id: klasifikasis.layer_group_id,
      tipe: klasifikasis.type
    };

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

Model.children.klasifikasi = Klasifikasis;
