type ModelKeys = 'rtrw' | 'klasifikasi' | 'polaruang' | 'periode' | 'struktur_ruang' | 'ketentuan_khusus' | 'pkkprl' | 'indikasi_program' | 'berita' | 'batas_administrasi' | 'data_spasial' | 'layer_group';

export default abstract class Model {
  static children: { [key in ModelKeys]?: ModelChildren | ModelChildren[] } = {
    rtrw: undefined,
    klasifikasi: undefined,
    polaruang: undefined,
    periode: undefined,
    struktur_ruang: undefined,
    ketentuan_khusus: undefined,
    pkkprl: undefined,
    indikasi_program: undefined,
    berita: undefined,
    batas_administrasi: undefined,
    data_spasial: undefined,
    layer_group: undefined
  };
}

export type ModelChildren = new (...args: any[]) => Model;
