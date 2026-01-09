import Model from './Model';
import asset from '@/utils/asset';

export interface IncomingApiData {
  id: number;
  klasifikasi_id: number;
  nama: string;
  warna: string;
  deskripsi: string;
  geojson_file: string;
  tipe_geometri: 'polyline' | 'poin' | 'polygon';
  icon_titik: string;
  tipe_garis: 'dashed' | 'solid' | 'bold' | 'dash-dot-dot' | 'dash-dot-dash-dot-dot';
}

export interface OutgoingApiData {
  _method?: 'PUT';
  nama: string;
  deskripsi: string;
  geojson_file?: string;
  klasifikasi_id: string;
  warna?: string;
  tipe_geometri: 'polyline' | 'poin' | 'polygon';
  icon_titik?: string;
  tipe_garis?: 'dashed' | 'solid' | 'bold' | 'dash-dot-dot' | 'dash-dot-dash-dot-dot';
}

interface FormValue {
  _method?: 'PUT';
  name: string;
  desc: string;
  geojson_file?: string;
  id_klasifikasi: string;
  color?: string;
  geometry_type: 'polyline' | 'poin' | 'polygon';
  point_icon?: string;
  line_type?: 'dashed' | 'solid' | 'bold' | 'dash-dot-dot' | 'dash-dot-dash-dot-dot';
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class DataSpasials extends Model {
  constructor(
    public id: number,
    public klasifikasi_id: number,
    public name: string,
    public color: string,
    public desc: string,
    public geojson_file: string,
    public geometry_type: 'polyline' | 'poin' | 'polygon',
    public point_icon: string,
    public line_type: 'dashed' | 'solid' | 'bold' | 'dash-dot-dot' | 'dash-dot-dash-dot-dot'
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, DataSpasials> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, DataSpasials>;
    return new DataSpasials(apiData.id, apiData.klasifikasi_id, apiData.nama, apiData.warna, apiData.deskripsi, apiData.geojson_file, apiData.tipe_geometri, asset(apiData.icon_titik), apiData.tipe_garis) as ReturnType<
      T,
      IncomingApiData,
      DataSpasials
    >;
  }

  public static toApiData<T extends FormValue | FormValue[]>(dataSpasials: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(dataSpasials)) return dataSpasials.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: dataSpasials.name,
      deskripsi: dataSpasials.desc,
      klasifikasi_id: dataSpasials.id_klasifikasi,
      tipe_geometri: dataSpasials.geometry_type,
      ...(dataSpasials.point_icon ? { icon_titik: dataSpasials.point_icon } : {}),
      ...(dataSpasials.line_type ? { tipe_garis: dataSpasials.line_type } : {}),
      ...(dataSpasials.color ? { warna: dataSpasials.color } : {})
    };

    if (typeof dataSpasials.geojson_file === 'string') {
      apiData.geojson_file = dataSpasials.geojson_file;
    }
    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

// FIXME: you maybe want to change below line. If you don't want to then delete this FIXME line
Model.children.data_spasial = DataSpasials;
