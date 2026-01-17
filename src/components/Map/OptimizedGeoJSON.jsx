/* eslint-disable react/prop-types */
import { useEffect, useRef, useMemo, memo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * OptimizedGeoJSON - High-performance GeoJSON layer component using Canvas renderer
 * 
 * Key optimizations:
 * 1. Uses Canvas renderer instead of SVG for massive performance gains
 * 2. Single canvas instance shared across all vector layers
 * 3. Memoized style and pointToLayer functions
 * 4. Efficient layer management with proper cleanup
 * 
 * @param {Object} props
 * @param {Object} props.data - GeoJSON data object
 * @param {Function} props.style - Style function for features
 * @param {Function} props.pointToLayer - Custom point rendering function
 * @param {Function} props.onEachFeature - Feature event handler
 * @param {string} props.layerKey - Unique key for the layer
 * @param {Object} props.canvasRenderer - Shared canvas renderer instance
 */
const OptimizedGeoJSON = memo(({ 
  data, 
  style, 
  pointToLayer, 
  onEachFeature, 
  // eslint-disable-next-line no-unused-vars
  layerKey, // Used in memo comparison below
  canvasRenderer 
}) => {
  const map = useMap();
  const layerRef = useRef(null);

  // Memoize the GeoJSON options to prevent unnecessary recalculations
  const geoJsonOptions = useMemo(() => ({
    // Use canvas renderer for vector layers (polygons, polylines)
    renderer: canvasRenderer,
    style,
    pointToLayer,
    onEachFeature,
    // Performance tweaks
    interactive: true, // Keep interactivity for popups
    bubblingMouseEvents: false, // Prevent event bubbling overhead
  }), [canvasRenderer, style, pointToLayer, onEachFeature]);

  useEffect(() => {
    if (!map || !data) return;

    // Create the GeoJSON layer with canvas renderer
    const layer = L.geoJSON(data, geoJsonOptions);
    
    // Add to map
    layer.addTo(map);
    layerRef.current = layer;

    // Cleanup on unmount or data change
    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, data, geoJsonOptions]);

  return null;
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if data or key changes
  return (
    prevProps.layerKey === nextProps.layerKey &&
    prevProps.data === nextProps.data
  );
});

OptimizedGeoJSON.displayName = 'OptimizedGeoJSON';

/**
 * CanvasLayerGroup - Container component that provides shared canvas renderer
 * 
 * This component creates a single canvas renderer instance that is shared
 * across all child GeoJSON layers, significantly reducing DOM operations.
 */
const CanvasLayerGroup = memo(({ 
  layers, 
  getStyle, 
  getPointToLayer, 
  getOnEachFeature 
}) => {
  // Create a single canvas renderer instance - CRITICAL for performance
  // padding: 0.5 means render tiles with 50% padding to reduce re-rendering on pan
  const canvasRenderer = useMemo(() => L.canvas({ 
    padding: 0.5,
    tolerance: 5 // Slightly increase hit tolerance for better click detection
  }), []);

  // Memoize the layers array to prevent unnecessary renders
  const memoizedLayers = useMemo(() => {
    return Object.entries(layers).map(([key, layer]) => ({
      key,
      ...layer
    }));
  }, [layers]);

  return (
    <>
      {memoizedLayers.map((layer) => (
        <OptimizedGeoJSON
          key={`${layer.type}-${layer.id}`}
          layerKey={`${layer.type}-${layer.id}`}
          data={layer.data}
          style={getStyle(layer)}
          pointToLayer={getPointToLayer(layer)}
          onEachFeature={getOnEachFeature(layer)}
          canvasRenderer={canvasRenderer}
        />
      ))}
    </>
  );
});

CanvasLayerGroup.displayName = 'CanvasLayerGroup';

export { OptimizedGeoJSON, CanvasLayerGroup };
export default OptimizedGeoJSON;
