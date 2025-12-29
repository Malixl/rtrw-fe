import Model from '@/models/Model';
import LayerGroups, { IncomingApiData } from '@/models/LayerGroups';
import { describe, expect, it } from 'vitest';

describe('LayerGroups', () => {
  it('should be a valid model', () => {
    expect(LayerGroups).toBeDefined();
    expect(LayerGroups.prototype).toBeDefined();
    expect(LayerGroups.prototype.constructor).toBeDefined();
    expect(LayerGroups.prototype instanceof Model).toBeTruthy();
  });

  it('should registered as a children of Model', () => {
    expect(Model.children.layer_groups).toBe(LayerGroups);
  });

  it('should be able to create a new Layer Groups', () => {
    const layerGroups = new LayerGroups(1, 'Malik');

    expect(layerGroups).toBeDefined();
    expect(layerGroups.id).toBe(1);
    expect(layerGroups.name).toBe('Malik');
  });

  it('should be able to create a new Layer Groups from API data', () => {
    const apiData: IncomingApiData = {
      id: 1,
      name: 'Malik',
    };
    const layerGroups = LayerGroups.fromApiData(apiData);

    expect(layerGroups).toBeDefined();
    expect(layerGroups.id).toBe(apiData.id);
    expect(layerGroups.name).toBe(apiData.name);
  });

  it('should be able to create a new Layer Groups array from API data array', () => {
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
    const layerGroupses = LayerGroups.fromApiData(apiData);

    expect(layerGroupses).toBeDefined();
    expect(layerGroupses.length).toBe(apiData.length);
    expect(layerGroupses[0].id).toBe(apiData[0].id);
    expect(layerGroupses[0].name).toBe(apiData[0].name);
    expect(layerGroupses[1].id).toBe(apiData[1].id);
    expect(layerGroupses[1].name).toBe(apiData[1].name);
  });

  it('should be able to convert Layer Groups to API data', () => {
    const layerGroups = new LayerGroups(1, 'Malik');
    const apiData = LayerGroups.toApiData(layerGroups);

    expect(apiData).toBeDefined();
    expect(apiData.id).toBe(layerGroups.id);
    expect(apiData.name).toBe(layerGroups.name);
  });

  it('should be able to convert Layer Groups array to API data array', () => {
    const layerGroupses = [new LayerGroups(1, 'Malik'), new LayerGroups(2, 'Fauzan')];
    const apiData = LayerGroups.toApiData(layerGroupses);

    expect(apiData).toBeDefined();
    expect(apiData.length).toBe(layerGroupses.length);
    expect(apiData[0].id).toBe(layerGroupses[0].id);
    expect(apiData[0].name).toBe(layerGroupses[0].name);
    expect(apiData[1].id).toBe(layerGroupses[1].id);
    expect(apiData[1].name).toBe(layerGroupses[1].name);
  });
});
