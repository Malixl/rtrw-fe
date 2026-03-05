type ModelKeys = 'rtrw' | 'klasifikasi' | 'polaruang' | 'periode' | 'struktur_ruang' | 'ketentuan_khusus' | 'kawasan_strategi_provinsi' | 'dokumen' | 'berita' | 'batas_administrasi' | 'data_spasial' | 'layer_group';

export default abstract class Model {
  static children: { [key in ModelKeys]?: ModelChildren | ModelChildren[] } = {
    rtrw: undefined,
    klasifikasi: undefined,
    polaruang: undefined,
    periode: undefined,
    struktur_ruang: undefined,
    ketentuan_khusus: undefined,
    kawasan_strategi_provinsi: undefined,
    dokumen: undefined,
    berita: undefined,
    batas_administrasi: undefined,
    data_spasial: undefined,
    layer_group: undefined
  };
}

export type ModelChildren = new (...args: any[]) => Model;
