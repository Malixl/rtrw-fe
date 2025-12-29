import Model from './Model';

export interface IncomingApiData {
  id: number;
  nama_layer_group: string;
  deskripsi: string;
  urutan_tampil: number;
}

export interface OutgoingApiData {
  nama_layer_group: string;
  deskripsi: string;
  urutan_tampil: number;
}

interface FormValue {
  name: string;
  desc: string;
  order: number;
}

type ReturnType<S, From, To> = S extends From[] ? To[] : To;

export default class LayerGroups extends Model {
  constructor(
    public id: number,
    public name: string,
    public desc: string,
    public order: number
  ) {
    super();
  }

  public static fromApiData<T extends IncomingApiData | IncomingApiData[]>(apiData: T): ReturnType<T, IncomingApiData, LayerGroups> {
    if (Array.isArray(apiData)) return apiData.map((object) => this.fromApiData(object)) as ReturnType<T, IncomingApiData, LayerGroups>;
    return new LayerGroups(apiData.id, apiData.nama_layer_group, apiData.deskripsi, apiData.urutan_tampil) as ReturnType<T, IncomingApiData, LayerGroups>;
  }

  public static toApiData<T extends FormValue | FormValue[]>(layerGroups: T): ReturnType<T, FormValue, OutgoingApiData> {
    if (Array.isArray(layerGroups)) return layerGroups.map((object) => this.toApiData(object)) as ReturnType<T, FormValue, OutgoingApiData>;
    const apiData: OutgoingApiData = {
      nama_layer_group: layerGroups.name,
      deskripsi: layerGroups.desc,
      urutan_tampil: layerGroups.order
    };

    return apiData as ReturnType<T, FormValue, OutgoingApiData>;
  }
}

Model.children.layer_group = LayerGroups;
