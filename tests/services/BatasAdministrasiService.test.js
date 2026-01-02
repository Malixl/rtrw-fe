import { describe, it, expect, vi } from 'vitest';
import BatasAdministrasiService from '@/services/BatasAdministrasiService';
import api from '@/utils/api';

vi.mock('@/utils/api');

describe('BatasAdministrasiService.getGeoJson', () => {
    it('should return geojson data from api', async () => {
        const geo = { type: 'FeatureCollection', features: [] };
        api.get.mockResolvedValue({ data: geo });

        const res = await BatasAdministrasiService.getGeoJson(123);

        expect(api.get).toHaveBeenCalledWith('/batas_administrasi/123/geojson', { token: undefined });
        expect(res).toEqual(geo);
    });
});
