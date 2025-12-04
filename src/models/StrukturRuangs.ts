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
  deskripsi: string;
  geojson_file: string;
  tipe_geometri: 'polyline' | 'poin';
  icon_titik: string;
  tipe_garis: 'dashed' | 'solid';
  warna: string;
}

export interface OutgoingApiData {
  _method?: 'PUT';
  nama: string;
  deskripsi: string;
  geojson_file?: string;
  klasifikasi_id: string;
  tipe_geometri: 'polyline' | 'poin';
  icon_titik?: string;
  tipe_garis?: 'dashed' | 'solid';
  warna: string;
}

interface FormValue {
  _method?: 'PUT';
  name: string;
  desc: string;
  geojson_file?: string;
  id_klasifikasi: string;
  geometry_type: 'polyline' | 'poin';
  point_icon?: string;
  line_type?: 'dashed' | 'solid';
  color: string;
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
    public desc: string,
    public geojson_file: string,
    public geometry_type: 'polyline' | 'poin',
    public point_icon: string,
    public line_type: 'dashed' | 'solid',
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
      apiData.deskripsi,
      apiData.geojson_file,
      apiData.tipe_geometri,
      apiData.icon_titik,
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
