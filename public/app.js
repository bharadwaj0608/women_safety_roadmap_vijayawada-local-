const API_URL = '/api';

// Initialize MapLibre GL JS Map
const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            'osm-tiles': {
                type: 'raster',
                tiles: [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
            }
        },
        layers: [
            {
                id: 'osm-tiles-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19
            }
        ]
    },
    center: [80.6480, 16.5062], // Vijayawada center
    zoom: 12,
    attributionControl: true
});

// Add navigation controls (zoom buttons)
map.addControl(new maplibregl.NavigationControl(), 'top-right');

// Add fullscreen control
map.addControl(new maplibregl.FullscreenControl(), 'top-right');

// Add geolocate control to the map.
map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    }),
    'top-right'
);

// ===== ROAD DATA MANAGEMENT =====

// State for selected road
let selectedRoadId = null; // Will use OSM way ID
let selectedRoadName = null; // Real street name from OSM
let selectedRoadCoordinates = null;

// State for segment selection (distance-based)
let isDragging = false;
let dragStartPoint = null;
let dragEndPoint = null;
let selectedSegmentStart = null; // Coordinate
let selectedSegmentEnd = null; // Coordinate
let selectedSegmentGeometry = null;
let selectedSegmentId = null; // Stable ID based on percentages
let selectedSegmentStartPercent = null; // % along road
let selectedSegmentEndPercent = null; // % along road

// Rating storage (in-memory)
const segmentRatings = new Map(); // Key: segmentId, Value: array of rating objects
const segmentAggregates = new Map(); // Key: segmentId, Value: aggregated stats

// Road-level rating storage
const roadRatings = new Map(); // Key: roadId, Value: array of rating objects
const roadAggregates = new Map(); // Key: roadId, Value: aggregated stats

// Calculate distance between two points (Haversine for lat/lng)
function distance(point1, point2) {
    const R = 6371000; // Earth radius in meters
    const lat1 = point1[1] * Math.PI / 180;
    const lat2 = point2[1] * Math.PI / 180;
    const deltaLat = (point2[1] - point1[1]) * Math.PI / 180;
    const deltaLng = (point2[0] - point1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Calculate total length of a LineString
function calculateRoadLength(coordinates) {
    let totalLength = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        totalLength += distance(coordinates[i], coordinates[i + 1]);
    }
    return totalLength;
}

// Calculate distance from start of road to a specific point
function calculateDistanceToPoint(roadCoordinates, targetLinearPosition) {
    let accumulatedDistance = 0;
    const segmentIndex = Math.floor(targetLinearPosition);
    const t = targetLinearPosition - segmentIndex;

    // Add distances of complete segments
    for (let i = 0; i < segmentIndex; i++) {
        accumulatedDistance += distance(roadCoordinates[i], roadCoordinates[i + 1]);
    }

    // Add partial distance of final segment
    if (t > 0 && segmentIndex < roadCoordinates.length - 1) {
        const segmentLength = distance(roadCoordinates[segmentIndex], roadCoordinates[segmentIndex + 1]);
        accumulatedDistance += segmentLength * t;
    }

    return accumulatedDistance;
}

// Convert linear position to percentage along road
function linearPositionToPercent(roadCoordinates, linearPosition) {
    const totalLength = calculateRoadLength(roadCoordinates);
    const distanceToPoint = calculateDistanceToPoint(roadCoordinates, linearPosition);
    return (distanceToPoint / totalLength) * 100;
}

// Generate stable segment ID
function generateSegmentId(roadId, startPercent, endPercent) {
    // Ensure start < end
    const [start, end] = startPercent < endPercent ?
        [startPercent, endPercent] : [endPercent, startPercent];

    return `${roadId}_${start.toFixed(2)}_${end.toFixed(2)}`;
}

// Find closest point on a line segment to a given point
function closestPointOnSegment(point, segmentStart, segmentEnd) {
    const [px, py] = point;
    const [x1, y1] = segmentStart;
    const [x2, y2] = segmentEnd;

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
        return { point: segmentStart, index: 0, t: 0 };
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

    return {
        point: [x1 + t * dx, y1 + t * dy],
        t: t
    };
}

// Find closest point on entire road LineString
function findClosestPointOnRoad(clickPoint, roadCoordinates) {
    let minDist = Infinity;
    let closestPoint = null;
    let closestSegmentIndex = 0;
    let closestT = 0;

    for (let i = 0; i < roadCoordinates.length - 1; i++) {
        const result = closestPointOnSegment(clickPoint, roadCoordinates[i], roadCoordinates[i + 1]);
        const dist = distance(clickPoint, result.point);

        if (dist < minDist) {
            minDist = dist;
            closestPoint = result.point;
            closestSegmentIndex = i;
            closestT = result.t;
        }
    }

    return {
        point: closestPoint,
        segmentIndex: closestSegmentIndex,
        t: closestT,
        linearPosition: closestSegmentIndex + closestT
    };
}

// Extract segment between two positions on road
function extractRoadSegment(roadCoordinates, startPos, endPos) {
    if (startPos > endPos) {
        [startPos, endPos] = [endPos, startPos];
    }

    const startSegment = Math.floor(startPos);
    const endSegment = Math.floor(endPos);
    const startT = startPos - startSegment;
    const endT = endPos - endSegment;

    const segmentCoords = [];

    // Add start point
    if (startT === 0) {
        segmentCoords.push(roadCoordinates[startSegment]);
    } else {
        const [x1, y1] = roadCoordinates[startSegment];
        const [x2, y2] = roadCoordinates[startSegment + 1];
        segmentCoords.push([
            x1 + startT * (x2 - x1),
            y1 + startT * (y2 - y1)
        ]);
    }

    // Add intermediate points
    for (let i = startSegment + 1; i <= endSegment; i++) {
        segmentCoords.push(roadCoordinates[i]);
    }

    // Add end point
    if (endT > 0 && endSegment < roadCoordinates.length - 1) {
        const [x1, y1] = roadCoordinates[endSegment];
        const [x2, y2] = roadCoordinates[endSegment + 1];
        segmentCoords.push([
            x1 + endT * (x2 - x1),
            y1 + endT * (y2 - y1)
        ]);
    }

    return segmentCoords;
}

// Load roads from local GeoJSON file
async function loadLocalRoadsGeoJSON() {
    try {
        console.log('Loading roads from local GeoJSON file...');
        const response = await fetch('/vijayawada_roads.geojson');

        if (!response.ok) {
            throw new Error(`Failed to load GeoJSON: ${response.status}`);
        }

        const geojson = await response.json();
        console.log(`✅ Loaded ${geojson.features?.length || 0} roads from local file`);
        return geojson;
    } catch (error) {
        console.error('❌ Error loading local GeoJSON:', error);
        return { type: 'FeatureCollection', features: [] };
    }
}

// Load ratings from database
async function loadRatingsFromDatabase() {
    try {
        console.log('💾 Loading ratings from database...');

        const response = await fetch(`${API_URL}/road-ratings`);
        const result = await response.json();

        if (!result.success) {
            console.error('❌ Failed to load ratings:', result.error);
            return;
        }

        const aggregates = result.data;

        // Clear existing in-memory data
        roadRatings.clear();
        roadAggregates.clear();

        // Populate in-memory storage from database
        Object.values(aggregates).forEach(agg => {
            // Store individual ratings
            roadRatings.set(agg.roadId, agg.ratings);

            // Store aggregates
            roadAggregates.set(agg.roadId, {
                roadId: agg.roadId,
                totalReviews: agg.totalReviews,
                averageRating: agg.averageRating,
                ratings: agg.ratings
            });
        });

        console.log(`✅ Loaded ratings for ${Object.keys(aggregates).length} roads from database`);

        // Update road colors on map
        updateRoadColors();

        return aggregates;
    } catch (error) {
        console.error('❌ Error loading ratings from database:', error);
        return null;
    }
}

// ===== SEGMENT RATING MANAGEMENT =====

// Add rating to storage
function addRating(segmentId, ratingData) {
    if (!segmentRatings.has(segmentId)) {
        segmentRatings.set(segmentId, []);
    }
    segmentRatings.get(segmentId).push(ratingData);

    // Recalculate aggregates
    updateAggregates(segmentId);
}

// Calculate aggregated ratings for a segment
function updateAggregates(segmentId) {
    const ratings = segmentRatings.get(segmentId);
    if (!ratings || ratings.length === 0) {
        segmentAggregates.delete(segmentId);
        return null;
    }

    const aggregate = {
        segmentId: segmentId,
        totalReviews: ratings.length,
        dayAverage: average(ratings.map(r => r.dayRating).filter(r => r != null)),
        nightAverage: average(ratings.map(r => r.nightRating).filter(r => r != null)),
        dayCount: ratings.filter(r => r.dayRating != null).length,
        nightCount: ratings.filter(r => r.nightRating != null).length,
        lightingAverage: average(ratings.map(r => r.lighting).filter(r => r != null)),
        crowdAverage: average(ratings.map(r => r.crowd).filter(r => r != null)),
        visibilityAverage: average(ratings.map(r => r.visibility).filter(r => r != null)),
        roadConditionAverage: average(ratings.map(r => r.roadCondition).filter(r => r != null))
    };

    segmentAggregates.set(segmentId, aggregate);
    return aggregate;
}

// Get aggregated ratings for a segment
function getAggregates(segmentId) {
    return segmentAggregates.get(segmentId) || null;
}

// Calculate average
function average(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

// Get color based on rating (for segments)
function getSegmentColor(avgRating) {
    if (!avgRating || avgRating === 0) return '#3b82f6'; // Blue (unrated)
    if (avgRating >= 4.0) return '#10b981'; // Green (safe)
    if (avgRating >= 3.0) return '#f59e0b'; // Orange (moderate)
    return '#ef4444'; // Red (unsafe)
}

// Get color based on road rating (updated thresholds)
function getRoadColor(avgRating) {
    if (!avgRating || avgRating === 0) return '#3b82f6'; // Blue (unrated)
    if (avgRating >= 5.0) return '#10b981'; // Green (safe) - rating >= 5
    if (avgRating >= 1.0) return '#f59e0b'; // Orange (moderate) - rating >= 1 and < 5
    return '#ef4444'; // Red (unsafe) - rating < 1
}

// Render stars for display
function renderStars(rating) {
    if (!rating) return '☆☆☆☆☆';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return '⭐'.repeat(fullStars) +
        (halfStar ? '⭐' : '') +
        '☆'.repeat(emptyStars);
}

// ===== ROAD-LEVEL RATING MANAGEMENT =====

// Add rating to road storage
function addRoadRating(roadId, ratingData) {
    if (!roadRatings.has(roadId)) {
        roadRatings.set(roadId, []);
    }
    roadRatings.get(roadId).push(ratingData);

    // Recalculate aggregates
    updateRoadAggregates(roadId);

    // Update road color on map
    updateRoadColors();
}

// Calculate aggregated ratings for a road
function updateRoadAggregates(roadId) {
    const ratings = roadRatings.get(roadId);
    if (!ratings || ratings.length === 0) {
        roadAggregates.delete(roadId);
        return null;
    }

    const aggregate = {
        roadId: roadId,
        totalReviews: ratings.length,
        averageRating: average(ratings.map(r => r.rating).filter(r => r != null)),
        ratings: ratings
    };

    roadAggregates.set(roadId, aggregate);
    return aggregate;
}

// Get aggregated ratings for a road
function getRoadAggregates(roadId) {
    return roadAggregates.get(roadId) || null;
}

// Update road colors on map based on ratings
function updateRoadColors() {
    if (!map.getSource('roads-source')) return;

    const source = map.getSource('roads-source');
    const data = source._data;

    // Update each feature with rating data
    data.features.forEach(feature => {
        const roadId = feature.properties.roadId;
        const aggregates = getRoadAggregates(roadId);

        if (aggregates) {
            feature.properties.avgRating = aggregates.averageRating;
            feature.properties.totalReviews = aggregates.totalReviews;
        } else {
            feature.properties.avgRating = 0;
            feature.properties.totalReviews = 0;
        }
    });

    // Update the source
    source.setData(data);
}

// Setup road interaction with drag-based segment selection
function setupRoadInteraction() {
    const layerId = 'roads-layer';

    // Change cursor to pointer when hovering
    map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
        if (!isDragging) {
            map.getCanvas().style.cursor = '';
        }
    });

    // Handle road click to select road
    map.on('click', layerId, (e) => {
        if (isDragging) return; // Ignore click if dragging

        if (e.features.length > 0) {
            const feature = e.features[0];

            // Use the roadId that was assigned when loading the GeoJSON
            const roadId = feature.properties.roadId || 'unknown';

            // Get real street name from OSM
            const roadName = feature.properties.name || 'Unnamed Road';
            const coordinates = feature.geometry.coordinates;

            // Reset segment selection when selecting new road
            selectedSegmentStart = null;
            selectedSegmentEnd = null;
            selectedSegmentGeometry = null;
            selectedSegmentId = null;
            selectedSegmentStartPercent = null;
            selectedSegmentEndPercent = null;

            // Remove segment highlight if exists
            if (map.getLayer('segment-highlighted')) {
                map.removeLayer('segment-highlighted');
            }
            if (map.getSource('segment-source')) {
                map.removeSource('segment-source');
            }

            // Update selected road state
            selectedRoadId = roadId;
            selectedRoadName = roadName;
            selectedRoadCoordinates = coordinates;

            // Update highlighted layer
            if (map.getLayer('roads-highlighted')) {
                map.removeLayer('roads-highlighted');
            }

            map.addLayer({
                id: 'roads-highlighted',
                type: 'line',
                source: 'roads-source',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#ef4444', // Red
                    'line-width': 8,
                    'line-opacity': 1
                },
                filter: ['==', ['get', 'roadId'], roadId]
            });

            // Log to console
            console.log('=== ROAD SELECTED ===');
            console.log('Road ID:', roadId);
            console.log('Road Name:', roadName);
            console.log('Coordinates:', coordinates);
            console.log('Total Points:', coordinates.length);

            // Show popup notification
            showRoadSelectionPopup(roadId, roadName, coordinates);
        }
    });

    // Mouse down on selected road to start dragging
    map.on('mousedown', layerId, (e) => {
        if (!selectedRoadId || !selectedRoadCoordinates) return;

        // Check if clicking on the selected road
        if (e.features.length > 0) {
            const feature = e.features[0];
            const roadId = feature.properties.roadId || feature.properties.id || feature.id || 'unknown';

            if (roadId === selectedRoadId) {
                isDragging = true;
                const lngLat = [e.lngLat.lng, e.lngLat.lat];
                const closest = findClosestPointOnRoad(lngLat, selectedRoadCoordinates);

                dragStartPoint = closest;
                dragEndPoint = null;

                map.getCanvas().style.cursor = 'crosshair';
                e.preventDefault();

                console.log('🖱️ Drag started at position:', closest.linearPosition);
            }
        }
    });

    // Mouse move while dragging
    map.on('mousemove', (e) => {
        if (!isDragging || !dragStartPoint || !selectedRoadCoordinates) return;

        const lngLat = [e.lngLat.lng, e.lngLat.lat];
        const closest = findClosestPointOnRoad(lngLat, selectedRoadCoordinates);

        dragEndPoint = closest;

        // Extract and display segment
        const segmentCoords = extractRoadSegment(
            selectedRoadCoordinates,
            dragStartPoint.linearPosition,
            dragEndPoint.linearPosition
        );

        // Update segment layer
        if (map.getSource('segment-source')) {
            map.getSource('segment-source').setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: segmentCoords
                    }
                }]
            });
        } else {
            map.addSource('segment-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: segmentCoords
                        }
                    }]
                }
            });

            map.addLayer({
                id: 'segment-highlighted',
                type: 'line',
                source: 'segment-source',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#10b981', // Green
                    'line-width': 10,
                    'line-opacity': 1
                }
            });
        }
    });

    // Mouse up to finish dragging
    map.on('mouseup', () => {
        if (isDragging && dragStartPoint && dragEndPoint) {
            // Finalize segment selection
            const segmentCoords = extractRoadSegment(
                selectedRoadCoordinates,
                dragStartPoint.linearPosition,
                dragEndPoint.linearPosition
            );

            // Calculate percentages along road
            const startPercent = linearPositionToPercent(selectedRoadCoordinates, dragStartPoint.linearPosition);
            const endPercent = linearPositionToPercent(selectedRoadCoordinates, dragEndPoint.linearPosition);

            // Generate stable segment ID
            const segmentId = generateSegmentId(selectedRoadId, startPercent, endPercent);

            selectedSegmentStart = dragStartPoint.point;
            selectedSegmentEnd = dragEndPoint.point;
            selectedSegmentGeometry = segmentCoords;
            selectedSegmentStartPercent = startPercent;
            selectedSegmentEndPercent = endPercent;
            selectedSegmentId = segmentId;

            console.log('=== SEGMENT SELECTED ===');
            console.log('Road ID:', selectedRoadId);
            console.log('Road Name:', selectedRoadName);
            console.log('Segment ID:', segmentId);
            console.log('Start Position:', dragStartPoint.linearPosition);
            console.log('End Position:', dragEndPoint.linearPosition);
            console.log('Start Percent:', startPercent.toFixed(2) + '%');
            console.log('End Percent:', endPercent.toFixed(2) + '%');
            console.log('Start Coordinate:', selectedSegmentStart);
            console.log('End Coordinate:', selectedSegmentEnd);
            console.log('Segment Geometry:', selectedSegmentGeometry);
            console.log('Segment Length (points):', selectedSegmentGeometry.length);

            // Show action panel instead of just popup
            showSegmentActionPanel();
        }

        isDragging = false;
        dragStartPoint = null;
        dragEndPoint = null;
        map.getCanvas().style.cursor = '';
    });
}

// Add road layer after map loads
map.on('load', async () => {
    console.log('🗺️ Map loaded, loading local road data...');
    console.log('📍 Centered on Vijayawada, Andhra Pradesh');

    // Show loading notification
    showNotification('Loading road data from local file...');

    try {
        // Load roads from local GeoJSON file
        const roadsData = await loadLocalRoadsGeoJSON();

        if (roadsData.features.length === 0) {
            console.warn('⚠️ No roads found in GeoJSON file');
            showNotification('No roads found in GeoJSON file');
            return;
        }

        // Assign unique roadId to each feature
        roadsData.features.forEach((feature, index) => {
            // Try to get OSM ID from various possible properties
            const osmId = feature.properties.osmId ||
                feature.properties.id ||
                feature.properties['@id'] ||
                feature.id;

            // Create unique roadId - use OSM ID if available, otherwise use index
            if (osmId) {
                feature.properties.roadId = `way_${osmId}`;
            } else {
                // Use index as fallback to ensure uniqueness
                feature.properties.roadId = `road_${index}`;
            }

            // Initialize rating properties
            feature.properties.avgRating = 0;
            feature.properties.totalReviews = 0;
        });

        console.log('✅ Assigned unique IDs to', roadsData.features.length, 'roads');

        // Add roads source
        map.addSource('roads-source', {
            type: 'geojson',
            data: roadsData
        });

        // Add roads line layer with dynamic colors
        map.addLayer({
            id: 'roads-layer',
            type: 'line',
            source: 'roads-source',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': [
                    'case',
                    ['==', ['get', 'avgRating'], 0], '#3b82f6', // Blue (unrated)
                    ['>=', ['get', 'avgRating'], 5], '#10b981', // Green (safe) - rating >= 5
                    ['>=', ['get', 'avgRating'], 1], '#f59e0b', // Orange (moderate) - rating >= 1 and < 5
                    '#ef4444' // Red (unsafe) - rating < 1
                ],
                'line-width': 4,
                'line-opacity': 0.7
            }
        });

        // Setup interaction
        setupRoadInteraction();

        console.log('✅ Road layer added successfully!');
        console.log(`📊 Total roads: ${roadsData.features.length}`);
        showNotification(`Loaded ${roadsData.features.length} roads successfully!`);

        // Load ratings from database
        await loadRatingsFromDatabase();

    } catch (error) {
        console.error('❌ Error setting up road layer:', error);
        showNotification('Error loading road data');
    }
});

// Show road selection popup
function showRoadSelectionPopup(roadId, roadName, coordinates) {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.road-selection-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Get rating data for this road
    const aggregates = getRoadAggregates(roadId);
    const avgRating = aggregates ? aggregates.averageRating : 0;
    const totalReviews = aggregates ? aggregates.totalReviews : 0;
    const ratingColor = getRoadColor(avgRating);
    const stars = renderStars(avgRating);

    const popup = document.createElement('div');
    popup.className = 'road-selection-popup';
    popup.innerHTML = `
        <div class="popup-header">
            <span class="popup-icon">🛣️</span>
            <span class="popup-title">Road Selected</span>
        </div>
        <div class="popup-content">
            <div class="popup-row">
                <strong>Road ID:</strong> <span class="road-id">${roadId}</span>
            </div>
            <div class="popup-row">
                <strong>Name:</strong> ${roadName}
            </div>
            <div class="popup-row">
                <strong>Points:</strong> ${coordinates.length}
            </div>
            <div class="popup-row rating-row">
                <strong>Rating:</strong> 
                <span class="rating-badge" style="background: ${ratingColor}; padding: 4px 8px; border-radius: 4px; margin-left: 8px; font-weight: bold;">
                    ${avgRating > 0 ? avgRating.toFixed(1) : 'No rating'} ${stars}
                </span>
            </div>
            <div class="popup-row">
                <strong>Reviews:</strong> ${totalReviews}
            </div>
            ${avgRating > 0 && avgRating < 3.0 ? `
            <div class="safety-alert-banner">
                <span class="safety-alert-icon">⚠️</span>
                <span><strong>Caution:</strong> This road has a low safety rating. Please be careful if travelling alone or at night.</span>
            </div>
            ` : ''}

            <div id="popup-alerts-container">
                <div style="font-size:12px; color:#666; margin-top:10px;">Loading alerts...</div>
            </div>

            <button class="review-btn" onclick="openRoadReviewModal('${roadId}', '${roadName.replace(/'/g, "\\'")}')"
                style="width: 100%; padding: 10px; margin-top: 10px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;">
                ⭐ Rate this Road
            </button>
            <button class="review-btn" onclick="openRoadAlertModal('${roadId}')"
                style="width: 100%; padding: 10px; margin-top: 5px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;">
                ⚠️ Report Alert
            </button>
            <button class="review-btn" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${coordinates[0][1]},${coordinates[0][0]}', '_blank')"
                style="width: 100%; padding: 10px; margin-top: 5px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;">
                🗺️ Get Directions
            </button>
        </div>
    `;

    popup.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        min-width: 280px;
        width: 320px;
        overflow: hidden;
    `;

    // Add inline styles for popup elements
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .road-selection-popup .popup-header {
            background: rgba(0,0,0,0.2);
            padding: 15px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 2px solid rgba(255,255,255,0.2);
        }
        .road-selection-popup .popup-icon {
            font-size: 24px;
        }
        .road-selection-popup .popup-title {
            font-size: 18px;
            font-weight: 700;
        }
        .road-selection-popup .popup-content {
            padding: 20px;
        }
        .road-selection-popup .popup-row {
            margin-bottom: 12px;
            font-size: 14px;
        }
        .road-selection-popup .popup-row:last-child {
            margin-bottom: 0;
        }
        .road-selection-popup .road-id {
            background: rgba(255,255,255,0.2);
            padding: 2px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-weight: bold;
        }
    `;
    document.head.appendChild(styleSheet);

    document.body.appendChild(popup);

    // Fetch and display alerts (no timeout)
    fetchRecentAlerts(roadId);
}

// Show segment selection popup
function showSegmentSelectionPopup(roadId, segmentGeometry) {
    const popup = document.createElement('div');
    popup.className = 'road-selection-popup';
    popup.innerHTML = `
        <div class="popup-header">
            <span class="popup-icon">✂️</span>
            <span class="popup-title">Segment Selected</span>
        </div>
        <div class="popup-content">
            <div class="popup-row">
                <strong>Road ID:</strong> <span class="road-id">${roadId}</span>
            </div>
            <div class="popup-row">
                <strong>Segment Points:</strong> ${segmentGeometry.length}
            </div>
            <div class="popup-row">
                <strong>Start:</strong> [${segmentGeometry[0][0].toFixed(5)}, ${segmentGeometry[0][1].toFixed(5)}]
            </div>
            <div class="popup-row">
                <strong>End:</strong> [${segmentGeometry[segmentGeometry.length - 1][0].toFixed(5)}, ${segmentGeometry[segmentGeometry.length - 1][1].toFixed(5)}]
            </div>
        </div>
    `;

    popup.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        min-width: 320px;
        overflow: hidden;
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => popup.remove(), 300);
    }, 5000);
}

// Show segment action panel
function showSegmentActionPanel() {
    // Remove existing panel if any
    const existingPanel = document.getElementById('segment-action-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'segment-action-panel';
    panel.innerHTML = `
        <div class="action-panel-content">
            <div class="action-panel-header">
                <span class="action-icon">✂️</span>
                <span class="action-title">Segment Selected</span>
            </div>
            <div class="action-buttons">
                <button class="action-btn rate-btn" onclick="openRateSafetyModal()">
                    <span class="btn-icon">⭐</span>
                    Rate Safety
                </button>
                <button class="action-btn report-btn" onclick="openReportIssueModal()">
                    <span class="btn-icon">⚠️</span>
                    Report Issue
                </button>
                <button class="action-btn cancel-btn" onclick="cancelSegmentSelection()">
                    <span class="btn-icon">✖️</span>
                    Cancel
                </button>
            </div>
        </div>
    `;

    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideUp 0.3s ease;
        padding: 20px;
        min-width: 400px;
    `;

    document.body.appendChild(panel);
}

// Open Road Review Modal (for quick road ratings)
function openRoadReviewModal(roadId, roadName) {
    // Get existing ratings for this road to display review history
    const existingRatings = roadRatings.get(roadId) || [];

    const modal = document.createElement('div');
    modal.id = 'road-review-modal';
    modal.className = 'modal-overlay';

    // Build review history HTML
    let reviewHistoryHTML = '';
    if (existingRatings.length > 0) {
        reviewHistoryHTML = `
            <div class="review-history-section">
                <h3 style="margin-bottom: 15px; color: #333;">📝 Previous Reviews (${existingRatings.length})</h3>
                <div class="review-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 20px;">
        `;

        existingRatings.forEach((review, index) => {
            const date = new Date(review.timestamp).toLocaleDateString();

            // Handle both new (day/night) and old (single rating) formats
            let dayDisplay, nightDisplay;

            if (review.dayRating || review.nightRating) {
                // New format with separate day/night ratings
                dayDisplay = review.dayRating ? `${renderStars(review.dayRating)} (${review.dayRating}/5)` : '<span style="color: #999;">Not rated</span>';
                nightDisplay = review.nightRating ? `${renderStars(review.nightRating)} (${review.nightRating}/5)` : '<span style="color: #999;">Not rated</span>';
            } else if (review.rating) {
                // Old format with single rating - show it for both day and night
                dayDisplay = `${renderStars(review.rating)} (${review.rating}/5) <em style="color: #666; font-size: 11px;">(overall)</em>`;
                nightDisplay = `${renderStars(review.rating)} (${review.rating}/5) <em style="color: #666; font-size: 11px;">(overall)</em>`;
            } else {
                dayDisplay = '<span style="color: #999;">Not rated</span>';
                nightDisplay = '<span style="color: #999;">Not rated</span>';
            }

            reviewHistoryHTML += `
                <div class="review-item" style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>Review #${existingRatings.length - index}</strong>
                        <span style="color: #666; font-size: 12px;">${date}</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <strong>Day:</strong> ${dayDisplay}
                    </div>
                    <div style="margin-bottom: 5px;">
                        <strong>Night:</strong> ${nightDisplay}
                    </div>
                    ${review.hasStreetLights !== null && review.hasStreetLights !== undefined ? `<div style="margin-bottom: 5px;"><strong>Street Lights:</strong> ${review.hasStreetLights ? '✅ Yes' : '❌ No'}</div>` : ''}
                    ${review.hasPopulationDensity !== null && review.hasPopulationDensity !== undefined ? `<div style="margin-bottom: 5px;"><strong>Population Density:</strong> ${review.hasPopulationDensity ? '✅ Yes' : '❌ No'}</div>` : ''}
                    ${review.comments ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-style: italic; color: #555;">"${review.comments}"</div>` : ''}
                </div>
            `;
        });

        reviewHistoryHTML += `
                </div>
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 2px solid #e0e0e0;">
        `;
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2>⭐ Rate Road: ${roadName}</h2>
                <button class="modal-close" onclick="closeModal('road-review-modal')">✖️</button>
            </div>
            <div class="modal-body">
                ${reviewHistoryHTML}
                
                <h3 style="margin-bottom: 15px; color: #333;">Add Your Review</h3>
                <form id="road-rating-form">
                    <div class="form-section">
                        <label class="form-label">☀️ Day Safety Rating</label>
                        <div class="star-rating" id="day-star-rating">
                            <span class="star" data-rating="1" data-type="day">★</span>
                            <span class="star" data-rating="2" data-type="day">★</span>
                            <span class="star" data-rating="3" data-type="day">★</span>
                            <span class="star" data-rating="4" data-type="day">★</span>
                            <span class="star" data-rating="5" data-type="day">★</span>
                        </div>
                        <input type="hidden" id="day-rating-value" name="dayRating">
                        <small class="form-hint">How safe is this road during the day?</small>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">🌙 Night Safety Rating</label>
                        <div class="star-rating" id="night-star-rating">
                            <span class="star" data-rating="1" data-type="night">★</span>
                            <span class="star" data-rating="2" data-type="night">★</span>
                            <span class="star" data-rating="3" data-type="night">★</span>
                            <span class="star" data-rating="4" data-type="night">★</span>
                            <span class="star" data-rating="5" data-type="night">★</span>
                        </div>
                        <input type="hidden" id="night-rating-value" name="nightRating">
                        <small class="form-hint">How safe is this road at night?</small>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">💡 Does the street contain street lights?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="streetLights" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="streetLights" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="street-lights-value" name="hasStreetLights">
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">👥 Does the place have population density?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="populationDensity" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="populationDensity" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="population-density-value" name="hasPopulationDensity">
                    </div>
                    <div class="form-section">
                        <label class="form-label">📹 Does the road have CCTV cameras?</label>
                        <div class="yes-no-buttons" style="display: flex; gap: 10px;">
                            <button type="button" class="yn-btn" data-question="cctv" data-value="true" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ Yes</button>
                            <button type="button" class="yn-btn" data-question="cctv" data-value="false" style="flex: 1; padding: 10px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: bold;">❌ No</button>
                        </div>
                        <input type="hidden" id="cctv-value" name="hasCCTV">
                    </div>
                    
                    
                    <div class="form-section">
                        <label class="form-label">Comments (Optional)</label>
                        <textarea name="comments" rows="3" placeholder="Share your experience with this road..."></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('road-review-modal')">Cancel</button>
                        <button type="submit" class="btn-primary">Submit Rating</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add CSS for active state of yes/no buttons
    const style = document.createElement('style');
    style.textContent = `
        .yn-btn.active {
            background: #10b981 !important;
            color: white !important;
            border-color: #10b981 !important;
        }
    `;
    document.head.appendChild(style);

    // Setup day star rating
    const dayStars = modal.querySelectorAll('#day-star-rating .star');
    const dayRatingInput = modal.querySelector('#day-rating-value');

    dayStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            dayRatingInput.value = rating;

            dayStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Setup night star rating
    const nightStars = modal.querySelectorAll('#night-star-rating .star');
    const nightRatingInput = modal.querySelector('#night-rating-value');

    nightStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            nightRatingInput.value = rating;

            nightStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Setup yes/no buttons
    const ynButtons = modal.querySelectorAll('.yn-btn');
    ynButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.getAttribute('data-question');
            const value = btn.getAttribute('data-value');

            // Remove active class from siblings
            const siblings = modal.querySelectorAll(`[data-question="${question}"]`);
            siblings.forEach(s => s.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Set hidden input value
            if (question === 'streetLights') {
                modal.querySelector('#street-lights-value').value = value;
            } else if (question === 'populationDensity') {
                modal.querySelector('#population-density-value').value = value;
            }
        });
    });

    // Handle form submission
    modal.querySelector('#road-rating-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const dayRating = parseInt(formData.get('dayRating'));
        const nightRating = parseInt(formData.get('nightRating'));

        // Validate that at least one rating is provided
        if (!dayRating && !nightRating) {
            alert('Please provide at least one rating (day or night)');
            return;
        }

        // Calculate overall rating (average of day and night, or single rating)
        let overallRating;
        if (dayRating && nightRating) {
            overallRating = (dayRating + nightRating) / 2;
        } else {
            overallRating = dayRating || nightRating;
        }

        const ratingData = {
            roadId: roadId,
            roadName: roadName,
            rating: overallRating,
            dayRating: dayRating || null,
            nightRating: nightRating || null,
            hasStreetLights: formData.get('hasStreetLights') ? formData.get('hasStreetLights') === 'true' : null,
            hasPopulationDensity: formData.get('hasPopulationDensity') ? formData.get('hasPopulationDensity') === 'true' : null,
            comments: formData.get('comments'),
            timestamp: new Date().toISOString()
        };

        console.log('=== ROAD RATING SUBMITTED ===');
        console.log(ratingData);

        // Add rating to in-memory storage for immediate UI update
        addRoadRating(roadId, ratingData);

        // Save to database
        try {
            const response = await fetch(`${API_URL}/road-ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ratingData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Rating saved to database:', result.data);
                showNotification('Road rating submitted successfully!');
            } else {
                console.error('❌ Failed to save rating:', result.error);
                showNotification('Rating saved locally but failed to sync to database');
            }
        } catch (error) {
            console.error('❌ Error saving rating to database:', error);
            showNotification('Rating saved locally but failed to sync to database');
        }

        closeModal('road-review-modal');
    });
}


// Open Rate Safety Modal
function openRateSafetyModal() {
    const modal = document.createElement('div');
    modal.id = 'rate-safety-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>⭐ Rate Road Safety</h2>
                <button class="modal-close" onclick="closeModal('rate-safety-modal')">✖️</button>
            </div>
            <div class="modal-body">
                <form id="safety-rating-form">
                    <div class="form-section">
                        <label class="form-label">Overall Safety Rating</label>
                        <div class="star-rating" id="star-rating">
                            <span class="star" data-rating="1">★</span>
                            <span class="star" data-rating="2">★</span>
                            <span class="star" data-rating="3">★</span>
                            <span class="star" data-rating="4">★</span>
                            <span class="star" data-rating="5">★</span>
                        </div>
                        <input type="hidden" id="rating-value" name="rating" required>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">Time of Day</label>
                        <div class="time-selector">
                            <label class="time-option">
                                <input type="radio" name="time" value="day" required>
                                <span>☀️ Day</span>
                            </label>
                            <label class="time-option">
                                <input type="radio" name="time" value="evening">
                                <span>🌆 Evening</span>
                            </label>
                            <label class="time-option">
                                <input type="radio" name="time" value="night">
                                <span>🌙 Night</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">Safety Concerns (check all that apply)</label>
                        <div class="checkbox-group">
                            <label class="checkbox-option">
                                <input type="checkbox" name="concerns" value="poor_lighting">
                                Poor Lighting
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="concerns" value="heavy_traffic">
                                Heavy Traffic
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="concerns" value="no_sidewalk">
                                No Sidewalk
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="concerns" value="poor_visibility">
                                Poor Visibility
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="concerns" value="speeding">
                                Speeding Vehicles
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">Additional Comments (Optional)</label>
                        <textarea name="comments" rows="3" placeholder="Share your experience..."></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('rate-safety-modal')">Cancel</button>
                        <button type="submit" class="btn-primary">Submit Rating</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Setup star rating
    const stars = modal.querySelectorAll('.star');
    const ratingInput = modal.querySelector('#rating-value');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            ratingInput.value = rating;

            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Handle form submission
    modal.querySelector('#safety-rating-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const concerns = [];
        formData.getAll('concerns').forEach(c => concerns.push(c));

        const ratingData = {
            roadId: selectedRoadId,
            segmentStart: selectedSegmentStart,
            segmentEnd: selectedSegmentEnd,
            segmentGeometry: selectedSegmentGeometry,
            rating: parseInt(formData.get('rating')),
            time: formData.get('time'),
            concerns: concerns,
            comments: formData.get('comments'),
            timestamp: new Date().toISOString()
        };

        console.log('=== SAFETY RATING SUBMITTED ===');
        console.log(ratingData);

        // TODO: Send to backend API
        // await fetch('/api/ratings', { method: 'POST', body: JSON.stringify(ratingData) });

        showNotification('Safety rating submitted successfully!');
        closeModal('rate-safety-modal');
        cancelSegmentSelection();
    });
}

// Open Report Issue Modal
function openReportIssueModal() {
    const modal = document.createElement('div');
    modal.id = 'report-issue-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>⚠️ Report Road Issue</h2>
                <button class="modal-close" onclick="closeModal('report-issue-modal')">✖️</button>
            </div>
            <div class="modal-body">
                <form id="issue-report-form">
                    <div class="form-section">
                        <label class="form-label">Issue Type</label>
                        <select name="issueType" required>
                            <option value="">Select issue type...</option>
                            <option value="pothole">Pothole</option>
                            <option value="damage">Road Damage</option>
                            <option value="debris">Debris/Obstruction</option>
                            <option value="signage">Missing/Damaged Signage</option>
                            <option value="lighting">Lighting Issue</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">Description</label>
                        <textarea name="description" rows="4" placeholder="Describe the issue in detail..." required></textarea>
                    </div>
                    
                    <div class="form-section">
                        <label class="form-label">Upload Photo/Video (Optional)</label>
                        <input type="file" name="media" accept="image/*,video/*">
                        <small class="form-hint">Max file size: 10MB</small>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('report-issue-modal')">Cancel</button>
                        <button type="submit" class="btn-primary">Submit Report</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    modal.querySelector('#issue-report-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const reportData = {
            roadId: selectedRoadId,
            segmentStart: selectedSegmentStart,
            segmentEnd: selectedSegmentEnd,
            segmentGeometry: selectedSegmentGeometry,
            issueType: formData.get('issueType'),
            description: formData.get('description'),
            media: formData.get('media')?.name || null,
            timestamp: new Date().toISOString()
        };

        console.log('=== ISSUE REPORT SUBMITTED ===');
        console.log(reportData);

        // TODO: Send to backend API with media upload
        // const formDataToSend = new FormData();
        // Object.keys(reportData).forEach(key => formDataToSend.append(key, reportData[key]));
        // await fetch('/api/reports', { method: 'POST', body: formDataToSend });

        showNotification('Issue report submitted successfully!');
        closeModal('report-issue-modal');
        cancelSegmentSelection();
    });
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Cancel segment selection
function cancelSegmentSelection() {
    // Remove action panel
    const panel = document.getElementById('segment-action-panel');
    if (panel) {
        panel.remove();
    }

    // Remove segment highlight
    if (map.getLayer('segment-highlighted')) {
        map.removeLayer('segment-highlighted');
    }
    if (map.getSource('segment-source')) {
        map.removeSource('segment-source');
    }

    // Reset state
    selectedSegmentStart = null;
    selectedSegmentEnd = null;
    selectedSegmentGeometry = null;

    console.log('Segment selection cancelled');
}

// Show notification (simple version)
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);


// Fetch recent alerts for a road
// Fetch recent alerts for a road
async function fetchRecentAlerts(roadId) {
    try {
        const response = await fetch(`${API_URL}/road-alerts/${roadId}`);
        const result = await response.json();

        const container = document.getElementById('popup-alerts-container');
        if (!container) return;

        if (result.success && result.data && result.data.length > 0) {
            let alertsHtml = `<div class="recent-alerts"><h4>Recent Alerts</h4>`;

            result.data.forEach(alert => {
                const date = new Date(alert.timestamp);
                const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                alertsHtml += `
                    <div class="alert-item">
                        <div class="alert-header">
                            <span>${capitalize(alert.alertType.replace('_', ' '))}</span>
                            <span class="alert-time">${timeStr}</span>
                        </div>
                        <div>${alert.description}</div>
                    </div>
                `;
            });

            alertsHtml += `</div>`;
            container.innerHTML = alertsHtml;
        } else {
            container.innerHTML = ''; // No alerts to show
        }
    } catch (error) {
        console.error('Failed to load alerts:', error);
        const container = document.getElementById('popup-alerts-container');
        if (container) container.innerHTML = '<div style="font-size:12px; color:#ffcccc;">Failed to load alerts</div>';
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Alert Modal Functions
let currentAlertRoadId = null;

function openRoadAlertModal(roadId) {
    currentAlertRoadId = roadId;
    document.getElementById('alert-modal').style.display = 'flex';
}

function closeAlertModal() {
    document.getElementById('alert-modal').style.display = 'none';
    document.getElementById('alert-description').value = '';
    currentAlertRoadId = null;
}

async function submitAlert() {
    if (!currentAlertRoadId) return;

    const alertTypeInput = document.querySelector('input[name="alertType"]:checked');
    const alertType = alertTypeInput ? alertTypeInput.value : 'other';
    const description = document.getElementById('alert-description').value;

    if (!description.trim()) {
        alert('Please provide a description');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/road-alerts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roadId: currentAlertRoadId,
                alertType,
                description
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Alert reported successfully. Thank you for helping keep the community safe!');
            closeAlertModal();
            // Refresh the popup if it's still open for the same road
            fetchRecentAlerts(currentAlertRoadId);
        } else {
            alert('Failed to report alert: ' + result.error);
        }
    } catch (error) {
        console.error('Error reporting alert:', error);
        alert('An error occurred while reporting the alert.');
    }
}

