import asset from '@/utils/asset';
import Model from './Model';

export interface IncomingApiData {
  id: number;
  klasifikasi: {
    id: number;
    nama: string;
    deskripsi: string;
    tipe: string;
    rtrw: {
      id: number;
      nama: string;
      periode: {
        id: number;
        tahun_mulai: string;
        tahun_akhir: string;
      };
      deskripsi: string;
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

export default class Pkkprl extends Model {
  constructor(
    public id: number,
    public klasifikasi: {
      id: number;
      name: string;
      desc: string;
      type: string;
      rtrw: {
        id: number;
        name: string;
        periode: {
          id: number;
          year_start: string;
          year_end: string;
        };
        desc: string;
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

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, Pkkprl> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, Pkkprl>;
    return new Pkkprl(
      apiData.id,
      {
        id: apiData.klasifikasi.id,
        name: apiData.klasifikasi.nama,
        desc: apiData.klasifikasi.deskripsi,
        type: apiData.klasifikasi.tipe,
        rtrw: {
          id: apiData.klasifikasi.rtrw.id,
          name: apiData.klasifikasi.rtrw.nama,
          periode: {
            id: apiData.klasifikasi.rtrw.periode.id,
            year_start: apiData.klasifikasi.rtrw.periode.tahun_mulai,
            year_end: apiData.klasifikasi.rtrw.periode.tahun_akhir
          },
          desc: apiData.klasifikasi.rtrw.deskripsi
        }
      },
      apiData.nama,
      apiData.warna,
      apiData.deskripsi,
      apiData.geojson_file,
      apiData.tipe_geometri,
      asset(apiData.icon_titik),
      apiData.tipe_garis
    ) as ReturnType<T, IncomingApiData, Pkkprl>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(pkkprl: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(pkkprl)) return pkkprl.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: pkkprl.name,
      deskripsi: pkkprl.desc,
      klasifikasi_id: pkkprl.id_klasifikasi,
      tipe_geometri: pkkprl.geometry_type,
      ...(pkkprl.point_icon ? { icon_titik: pkkprl.point_icon } : {}),
      ...(pkkprl.line_type ? { tipe_garis: pkkprl.line_type } : {}),
      ...(pkkprl.color ? { warna: pkkprl.color } : {})
    };

    if (typeof pkkprl.geojson_file === 'string') {
      apiData.geojson_file = pkkprl.geojson_file;
    }

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

Model.children.pkkprl = Pkkprl;
