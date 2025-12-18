import Model from './Model';

export interface IncomingApiData {
  id: number;
  nama: string;
  deskripsi: string;
  geojson_file: string;
  warna: string;
  tipe_geometri: 'polyline' | 'polygon';
  tipe_garis: 'dashed' | 'solid' | 'bold';
}

export interface OutgoingApiData {
  _method?: 'PUT';
  nama: string;
  deskripsi: string;
  geojson_file?: string;
  warna: string;
  tipe_geometri: 'polyline' | 'polygon';
  tipe_garis?: 'dashed' | 'solid' | 'bold';
}

interface FormValue {
  _method?: 'PUT';
  name: string;
  desc: string;
  geojson_file?: string;
  color: string;
  geometry_type: 'polyline' | 'polygon';
  line_type?: 'dashed' | 'solid' | 'bold';
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class BatasAdministrasi extends Model {
  constructor(
    public id: number,
    public name: string,
    public desc: string,
    public geojson_file: string,
    public color: string,
    public geometry_type: 'polyline' | 'polygon',
    public line_type: 'dashed' | 'solid' | 'bold'
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, BatasAdministrasi> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, BatasAdministrasi>;
    return new BatasAdministrasi(apiData.id, apiData.nama, apiData.deskripsi, apiData.geojson_file, apiData.warna, apiData.tipe_geometri, apiData.tipe_garis) as ReturnType<T, IncomingApiData, BatasAdministrasi>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(data: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(data)) return data.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      ...(data._method ? { _method: data._method } : {}),
      nama: data.name,
      deskripsi: data.desc,
      warna: data.color,
      tipe_geometri: data.geometry_type,
      ...(data.line_type ? { tipe_garis: data.line_type } : {})
    };

    if (typeof data.geojson_file === 'string') {
      apiData.geojson_file = data.geojson_file;
    }

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

Model.children.batas_administrasi = BatasAdministrasi;
