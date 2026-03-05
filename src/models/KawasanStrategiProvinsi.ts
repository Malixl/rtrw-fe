import asset from '@/utils/asset';
import Model from './Model';

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

export default class KawasanStrategiProvinsi extends Model {
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

    public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, KawasanStrategiProvinsi> {
        if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, KawasanStrategiProvinsi>;
        return new KawasanStrategiProvinsi(apiData.id, apiData.klasifikasi_id, apiData.nama, apiData.warna, apiData.deskripsi, apiData.geojson_file, apiData.tipe_geometri, asset(apiData.icon_titik) ?? '', apiData.tipe_garis) as ReturnType<T, IncomingApiData, KawasanStrategiProvinsi>;
    }

    public static toApiData<T extends FormValue | FormValue[]>(kawasanStrategiProvinsi: T): ReturnType<T, FormValue, OutgoingApiData> {
        if (Array.isArray(kawasanStrategiProvinsi)) return kawasanStrategiProvinsi.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
        const apiData: OutgoingApiData = {
            nama: kawasanStrategiProvinsi.name,
            deskripsi: kawasanStrategiProvinsi.desc,
            klasifikasi_id: kawasanStrategiProvinsi.id_klasifikasi,
            tipe_geometri: kawasanStrategiProvinsi.geometry_type,
            ...(kawasanStrategiProvinsi.point_icon ? { icon_titik: kawasanStrategiProvinsi.point_icon } : {}),
            ...(kawasanStrategiProvinsi.line_type ? { tipe_garis: kawasanStrategiProvinsi.line_type } : {}),
            ...(kawasanStrategiProvinsi.color ? { warna: kawasanStrategiProvinsi.color } : {})
        };

        if (typeof kawasanStrategiProvinsi.geojson_file === 'string') {
            apiData.geojson_file = kawasanStrategiProvinsi.geojson_file;
        }

        return apiData as ReturnType<T, FormValue, OutgoingApiData>;
    }
}

Model.children.kawasan_strategi_provinsi = KawasanStrategiProvinsi;
