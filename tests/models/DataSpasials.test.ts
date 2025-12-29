import Model from '@/models/Model';
import DataSpasials, { IncomingApiData } from '@/models/DataSpasials';
import { describe, expect, it } from 'vitest';

describe('DataSpasials', () => {
  it('should be a valid model', () => {
    expect(DataSpasials).toBeDefined();
    expect(DataSpasials.prototype).toBeDefined();
    expect(DataSpasials.prototype.constructor).toBeDefined();
    expect(DataSpasials.prototype instanceof Model).toBeTruthy();
  });

  it('should registered as a children of Model', () => {
    expect(Model.children.data_spasials).toBe(DataSpasials);
  });

  it('should be able to create a new Data Spasials', () => {
    const dataSpasials = new DataSpasials(1, 'Malik');

    expect(dataSpasials).toBeDefined();
    expect(dataSpasials.id).toBe(1);
    expect(dataSpasials.name).toBe('Malik');
  });

  it('should be able to create a new Data Spasials from API data', () => {
    const apiData: IncomingApiData = {
      id: 1,
      name: 'Malik',
    };
    const dataSpasials = DataSpasials.fromApiData(apiData);

    expect(dataSpasials).toBeDefined();
    expect(dataSpasials.id).toBe(apiData.id);
    expect(dataSpasials.name).toBe(apiData.name);
  });

  it('should be able to create a new Data Spasials array from API data array', () => {
    const apiData: IncomingApiData[] = [
      {
        id: 1,
        name: 'Rapik'
      },
      {
        id: 2,
        name: 'Aqshal'
      }
    ];
    const dataSpasialses = DataSpasials.fromApiData(apiData);

    expect(dataSpasialses).toBeDefined();
    expect(dataSpasialses.length).toBe(apiData.length);
    expect(dataSpasialses[0].id).toBe(apiData[0].id);
    expect(dataSpasialses[0].name).toBe(apiData[0].name);
    expect(dataSpasialses[1].id).toBe(apiData[1].id);
    expect(dataSpasialses[1].name).toBe(apiData[1].name);
  });

  it('should be able to convert Data Spasials to API data', () => {
    const dataSpasials = new DataSpasials(1, 'Malik');
    const apiData = DataSpasials.toApiData(dataSpasials);

    expect(apiData).toBeDefined();
    expect(apiData.id).toBe(dataSpasials.id);
    expect(apiData.name).toBe(dataSpasials.name);
  });

  it('should be able to convert Data Spasials array to API data array', () => {
    const dataSpasialses = [new DataSpasials(1, 'Malik'), new DataSpasials(2, 'Fauzan')];
    const apiData = DataSpasials.toApiData(dataSpasialses);

    expect(apiData).toBeDefined();
    expect(apiData.length).toBe(dataSpasialses.length);
    expect(apiData[0].id).toBe(dataSpasialses[0].id);
    expect(apiData[0].name).toBe(dataSpasialses[0].name);
    expect(apiData[1].id).toBe(dataSpasialses[1].id);
    expect(apiData[1].name).toBe(dataSpasialses[1].name);
  });
});
