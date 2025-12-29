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
  warna: string;
  deskripsi: string;
  geojson_file: string;
  tipe_geometri: 'polyline' | 'poin' | 'polygon';
  icon_titik: string;
  tipe_garis: 'dashed' | 'solid' | 'bold';
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
  tipe_garis?: 'dashed' | 'solid' | 'bold';
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
  line_type?: 'dashed' | 'solid' | 'bold';
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class KetentuanKhusus extends Model {
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
    public geojson_file: string,
    public geometry_type: 'polyline' | 'poin' | 'polygon',
    public point_icon: string,
    public line_type: 'dashed' | 'solid' | 'bold'
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, KetentuanKhusus> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, KetentuanKhusus>;
    return new KetentuanKhusus(
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
      apiData.geojson_file,
      apiData.tipe_geometri,
      asset(apiData.icon_titik),
      apiData.tipe_garis
    ) as ReturnType<T, IncomingApiData, KetentuanKhusus>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(ketentuanKhusus: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(ketentuanKhusus)) return ketentuanKhusus.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: ketentuanKhusus.name,
      deskripsi: ketentuanKhusus.desc,
      klasifikasi_id: ketentuanKhusus.id_klasifikasi,
      tipe_geometri: ketentuanKhusus.geometry_type,
      ...(ketentuanKhusus.point_icon ? { icon_titik: ketentuanKhusus.point_icon } : {}),
      ...(ketentuanKhusus.line_type ? { tipe_garis: ketentuanKhusus.line_type } : {}),
      ...(ketentuanKhusus.color ? { warna: ketentuanKhusus.color } : {})
    };

    if (typeof ketentuanKhusus.geojson_file === 'string') {
      apiData.geojson_file = ketentuanKhusus.geojson_file;
    }

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

Model.children.ketentuan_khusus = KetentuanKhusus;
