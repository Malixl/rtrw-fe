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
  deskripsi: string;
  geojson_file: string;
  tipe_geometri: 'polyline' | 'poin';
  icon_titik: string;
  tipe_garis: 'dashed' | 'solid' | 'bold';
  warna: string;
}

export interface OutgoingApiData {
  _method?: 'PUT';
  nama: string;
  deskripsi: string;
  geojson_file?: string;
  klasifikasi_id: string;
  warna: string;
  tipe_geometri: 'polyline' | 'poin';
  icon_titik?: string;
  tipe_garis?: 'dashed' | 'solid' | 'bold';
}

interface FormValue {
  _method?: 'PUT';
  name: string;
  desc: string;
  geojson_file?: string;
  id_klasifikasi: string;
  color: string;
  geometry_type: 'polyline' | 'poin';
  point_icon?: string;
  line_type?: 'dashed' | 'solid' | 'bold';
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class StrukturRuangs extends Model {
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
    public desc: string,
    public geojson_file: string,
    public geometry_type: 'polyline' | 'poin',
    public point_icon: string,
    public line_type: 'dashed' | 'solid' | 'bold',
    public color: string
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, StrukturRuangs> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, StrukturRuangs>;
    return new StrukturRuangs(
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
      apiData.deskripsi,
      apiData.geojson_file,
      apiData.tipe_geometri,
      asset(apiData.icon_titik),
      apiData.tipe_garis,
      apiData.warna
    ) as ReturnType<T, IncomingApiData, StrukturRuangs>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(strukturRuangs: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(strukturRuangs)) return strukturRuangs.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: strukturRuangs.name,
      deskripsi: strukturRuangs.desc,
      klasifikasi_id: strukturRuangs.id_klasifikasi,
      tipe_geometri: strukturRuangs.geometry_type,
      ...(strukturRuangs.point_icon ? { icon_titik: strukturRuangs.point_icon } : {}),
      ...(strukturRuangs.line_type ? { tipe_garis: strukturRuangs.line_type } : {}),
      warna: strukturRuangs.color
    };

    if (typeof strukturRuangs.geojson_file === 'string') {
      apiData.geojson_file = strukturRuangs.geojson_file;
    }

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

Model.children.struktur_ruang = StrukturRuangs;
