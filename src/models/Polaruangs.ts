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
  warna: string;
  deskripsi: string;
  geojson_file: string;
}

export interface OutgoingApiData {
  _method?: 'PUT';
  nama: string;
  deskripsi: string;
  geojson_file?: string;
  klasifikasi_id: string;
  warna: string;
}

interface FormValue {
  _method?: 'PUT';
  name: string;
  desc: string;
  geojson_file?: string;
  id_klasifikasi: string;
  color: string;
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class Polaruangs extends Model {
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
    public color: string,
    public desc: string,
    public geojson_file: string
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, Polaruangs> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, Polaruangs>;
    return new Polaruangs(
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
      apiData.warna,
      apiData.deskripsi,
      apiData.geojson_file
    ) as ReturnType<T, IncomingApiData, Polaruangs>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(polaruang: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(polaruang)) return polaruang.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: polaruang.name,
      deskripsi: polaruang.desc,
      klasifikasi_id: polaruang.id_klasifikasi,
      warna: polaruang.color
    };

    if (typeof polaruang.geojson_file === 'string') {
      apiData.geojson_file = polaruang.geojson_file;
    }

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

Model.children.polaruang = Polaruangs;
