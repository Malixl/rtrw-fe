/**
 * Web Worker untuk memproses GeoJSON di background thread
 * Mencegah blocking UI saat parsing dan transformasi data besar
 */

// Simplify geometry dengan Douglas-Peucker algorithm
const simplifyCoordinates = (coords, tolerance = 0.0001) => {
    if (!coords || coords.length < 3) return coords;

    const sqTolerance = tolerance * tolerance;

    // Square distance from point to segment
    const getSqSegDist = (p, p1, p2) => {
        let x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y;

        if (dx !== 0 || dy !== 0) {
            const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = p2[0];
                y = p2[1];
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = p[0] - x;
        dy = p[1] - y;

        return dx * dx + dy * dy;
    };

    // Radial distance simplification
    const simplifyRadialDist = (points, sqTolerance) => {
        let prevPoint = points[0];
        const newPoints = [prevPoint];
        let point;

        for (let i = 1, len = points.length; i < len; i++) {
            point = points[i];
            const dx = point[0] - prevPoint[0];
            const dy = point[1] - prevPoint[1];
            if (dx * dx + dy * dy > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }

        if (prevPoint !== point) newPoints.push(point);
        return newPoints;
    };

    // Douglas-Peucker simplification
    const simplifyDPStep = (points, first, last, sqTolerance, simplified) => {
        let maxSqDist = sqTolerance;
        let index;

        for (let i = first + 1; i < last; i++) {
            const sqDist = getSqSegDist(points[i], points[first], points[last]);

            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
            simplified.push(points[index]);
            if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    };

    const simplifyDP = (points, sqTolerance) => {
        const last = points.length - 1;
        const simplified = [points[0]];
        simplifyDPStep(points, 0, last, sqTolerance, simplified);
        simplified.push(points[last]);
        return simplified;
    };

    // Apply simplification
    let result = simplifyRadialDist(coords, sqTolerance);
    result = simplifyDP(result, sqTolerance);
    return result;
};

// Simplify geometry based on type
const simplifyGeometry = (geometry, tolerance) => {
    if (!geometry) return geometry;

    const simplifyRing = (ring) => simplifyCoordinates(ring, tolerance);

    switch (geometry.type) {
        case 'LineString':
            return {
                ...geometry,
                coordinates: simplifyCoordinates(geometry.coordinates, tolerance)
            };

        case 'MultiLineString':
            return {
                ...geometry,
                coordinates: geometry.coordinates.map(simplifyRing)
            };

        case 'Polygon':
            return {
                ...geometry,
                coordinates: geometry.coordinates.map(simplifyRing)
            };

        case 'MultiPolygon':
            return {
                ...geometry,
                coordinates: geometry.coordinates.map((polygon) => polygon.map(simplifyRing))
            };

        default:
            return geometry;
    }
};

// Process GeoJSON dengan enhancement dan simplification
const processGeoJSON = (json, options = {}) => {
    const { warna, iconImageUrl, tipe_garis, fillOpacity = 0.8, simplifyTolerance = 0.0001 } = options;

    const features = (json.features || []).map((feature) => {
        const props = { ...(feature.properties || {}) };

        // Apply styling
        if (warna) {
            props.stroke = warna;
            props.fill = warna;
            props['stroke-opacity'] = 1;
            props['fill-opacity'] = fillOpacity;
        }

        // Apply line style
        if (tipe_garis === 'dashed') {
            props.dashArray = '6 6';
            props['stroke-width'] = 3;
        } else if (tipe_garis === 'solid') {
            props.dashArray = null;
            props['stroke-width'] = 3;
        } else if (tipe_garis === 'bold') {
            props.dashArray = null;
            props['stroke-width'] = 6;
        } else if (tipe_garis === 'dash-dot-dot') {
            props.dashArray = '20 8 3 8 3 8';
            props['stroke-width'] = 3;
        } else if (tipe_garis === 'dash-dot-dash-dot-dot') {
            props.dashArray = '15 5 3 5 15 5 3 5 3 5';
            props['stroke-width'] = 3;
        }

        if (iconImageUrl) {
            props.icon_image_url = iconImageUrl;
        }

        // Simplify geometry untuk performa
        const simplifiedGeometry = simplifyGeometry(feature.geometry, simplifyTolerance);

        return {
            ...feature,
            geometry: simplifiedGeometry,
            properties: props
        };
    });

    return { ...json, features };
};

// Handle messages from main thread
self.onmessage = (e) => {
    const { type, payload, id } = e.data;

    switch (type) {
        case 'PROCESS_GEOJSON': {
            try {
                const result = processGeoJSON(payload.json, payload.options);
                self.postMessage({ type: 'RESULT', id, data: result });
            } catch (error) {
                self.postMessage({ type: 'ERROR', id, error: error.message });
            }
            break;
        }

        case 'BATCH_PROCESS': {
            try {
                const results = payload.items.map((item) => ({
                    key: item.key,
                    data: processGeoJSON(item.json, item.options)
                }));
                self.postMessage({ type: 'BATCH_RESULT', id, data: results });
            } catch (error) {
                self.postMessage({ type: 'ERROR', id, error: error.message });
            }
            break;
        }

        default:
            break;
    }
};
