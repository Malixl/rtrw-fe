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

export default class KetentuanKhusus extends Model {
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
    public geojson_file: string
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
      apiData.geojson_file
    ) as ReturnType<T, IncomingApiData, KetentuanKhusus>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(ketentuanKhusus: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(ketentuanKhusus)) return ketentuanKhusus.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama: ketentuanKhusus.name,
      deskripsi: ketentuanKhusus.desc,
      klasifikasi_id: ketentuanKhusus.id_klasifikasi,
      warna: ketentuanKhusus.color
    };

    if (typeof ketentuanKhusus.geojson_file === 'string') {
      apiData.geojson_file = ketentuanKhusus.geojson_file;
    }

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

Model.children.ketentuan_khusus = KetentuanKhusus;
