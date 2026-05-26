import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Drawer,
  Space,
  message,
  Input,
  InputNumber,
  Popconfirm,
  Typography,
  Tag,
  Segmented,
  Modal,
  Divider,
  Tooltip,
} from 'antd';
import {
  AimOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  EditOutlined,
  AppstoreOutlined,
  UndoOutlined,
  CompressOutlined,
  EyeOutlined,
  PushpinOutlined,
  SaveOutlined,
  CloseOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { GoogleMap, Polygon, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { useSetGeofenceMutation, useTestGeofenceMutation } from '../../store/api/branchApi.js';

const libraries = ['places', 'marker'];
const defaultCenter = { lat: 28.6139, lng: 77.209 };
const mapContainerStyle = { width: '100%', height: 'calc(100vh - 210px)', minHeight: 560, borderRadius: 12 };
const streetViewStyle = { width: 360, height: 'calc(100vh - 210px)', minHeight: 560, borderRadius: 12 };
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const googleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  mapId: googleMapsMapId,
};
const polygonStyle = {
  fillColor: '#16a34a',
  fillOpacity: 0.22,
  strokeColor: '#15803d',
  strokeWeight: 3,
  editable: true,
};

function distanceInMeters(pointA, pointB) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(pointB.lat - pointA.lat);
  const dLng = toRadians(pointB.lng - pointA.lng);
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);
  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function arePointsClose(pointA, pointB) {
  return distanceInMeters(pointA, pointB) <= 35;
}

function getPolygonSignature(path = []) {
  return JSON.stringify(
    (Array.isArray(path) ? path : []).map((point) => ({
      lat: Number(point.lat).toFixed(7),
      lng: Number(point.lng).toFixed(7),
    }))
  );
}

function metersPerDegreeLng(lat) {
  return 111320 * Math.cos((Number(lat) * Math.PI) / 180);
}

function analyzePolygon(path = []) {
  if (!Array.isArray(path) || path.length === 0) {
    return { areaSqMeters: 0, perimeterMeters: 0, warnings: [] };
  }

  const points = path
    .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  if (points.length < 3) {
    return {
      areaSqMeters: 0,
      perimeterMeters: points.length === 2 ? Math.round(distanceInMeters(points[0], points[1])) : 0,
      warnings: points.length > 0 ? ['Add at least 3 points to create a usable boundary.'] : [],
    };
  }

  const referenceLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lngScale = metersPerDegreeLng(referenceLat) || 1;
  const metricPoints = points.map((point) => ({ x: point.lng * lngScale, y: point.lat * 111320 }));
  const seen = new Set();
  const warnings = [];
  let duplicateCount = 0;
  let shortEdgeCount = 0;
  let perimeterMeters = 0;
  let shoelace = 0;

  points.forEach((point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    const metricPoint = metricPoints[index];
    const nextMetricPoint = metricPoints[(index + 1) % metricPoints.length];
    const key = `${point.lat.toFixed(7)},${point.lng.toFixed(7)}`;

    if (seen.has(key)) {
      duplicateCount += 1;
    }
    seen.add(key);

    const edgeLength = distanceInMeters(point, nextPoint);
    perimeterMeters += edgeLength;
    if (edgeLength < 2) {
      shortEdgeCount += 1;
    }
    shoelace += metricPoint.x * nextMetricPoint.y - nextMetricPoint.x * metricPoint.y;
  });

  const areaSqMeters = Math.round(Math.abs(shoelace) / 2);
  if (duplicateCount > 0) warnings.push('Remove duplicate points from the boundary.');
  if (shortEdgeCount > 0) warnings.push('Some boundary points are extremely close together.');
  if (areaSqMeters > 0 && areaSqMeters < 25) warnings.push('Boundary area looks very small for an office.');
  if (areaSqMeters > 200000) warnings.push('Boundary area looks unusually large. Confirm it does not include public areas.');

  return { areaSqMeters, perimeterMeters: Math.round(perimeterMeters), warnings };
}

function formatMeters(value) {
  if (!Number.isFinite(Number(value))) return '0 m';
  if (Number(value) >= 1000) return `${(Number(value) / 1000).toFixed(2)} km`;
  return `${Math.round(Number(value))} m`;
}

function formatArea(value) {
  if (!Number.isFinite(Number(value))) return '0 sq m';
  if (Number(value) >= 1000000) return `${(Number(value) / 1000000).toFixed(2)} sq km`;
  return `${Math.round(Number(value)).toLocaleString()} sq m`;
}

function AdvancedMapMarker({ map, position, label, onClick, tone = 'branch' }) {
  const markerRef = useRef(null);
  const contentRef = useRef(null);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) {
      return undefined;
    }

    const palette = {
      branch: { bg: '#15803d', shadow: 'rgba(21, 128, 61, 0.35)' },
      point: { bg: '#2563eb', shadow: 'rgba(37, 99, 235, 0.3)' },
      success: { bg: '#16a34a', shadow: 'rgba(22, 163, 74, 0.3)' },
      danger: { bg: '#dc2626', shadow: 'rgba(220, 38, 38, 0.3)' },
      neutral: { bg: '#475569', shadow: 'rgba(71, 85, 105, 0.3)' },
    }[tone];

    const content = document.createElement('button');
    content.type = 'button';
    content.textContent = label || '';
    content.style.cssText = [
      'min-width: 34px',
      'height: 34px',
      'padding: 0 8px',
      'border: 2px solid #ffffff',
      'border-radius: 999px',
      `background: ${palette.bg}`,
      'color: #ffffff',
      'font: 700 11px/1 system-ui, sans-serif',
      `box-shadow: 0 8px 18px ${palette.shadow}`,
      'cursor: pointer',
      'white-space: nowrap',
    ].join(';');

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      content,
    });

    const listener = marker.addListener('click', () => {
      onClickRef.current?.();
    });

    markerRef.current = marker;
    contentRef.current = content;

    return () => {
      listener.remove();
      marker.map = null;
      markerRef.current = null;
      contentRef.current = null;
    };
  }, [map, tone]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.position = position;
    }
  }, [position]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.textContent = label || '';
    }
  }, [label]);

  return null;
}

export default function GeoFenceDrawer({ open, branch, onClose }) {
  const [polygonPath, setPolygonPath] = useState([]);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [searchAddress, setSearchAddress] = useState('');
  const [mapType, setMapType] = useState('roadmap');
  const [interactionMode, setInteractionMode] = useState('draw');
  const [testPoint, setTestPoint] = useState({ lat: null, lng: null });
  const [testResult, setTestResult] = useState(null);
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewPosition, setStreetViewPosition] = useState(null);
  const [streetViewAvailable, setStreetViewAvailable] = useState(null);
  const [setGeofence, { isLoading }] = useSetGeofenceMutation();
  const [testGeofence, { isLoading: isTesting }] = useTestGeofenceMutation();
  const polygonRef = useRef(null);
  const mapRef = useRef(null);
  const streetViewRef = useRef(null);
  const initialSignatureRef = useRef('[]');
  const [map, setMap] = useState(null);
  const geocoderRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
    libraries,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextPolygon = Array.isArray(branch?.polygon) ? branch.polygon : [];
    setPolygonPath(nextPolygon);
    initialSignatureRef.current = getPolygonSignature(nextPolygon);
    setSearchAddress(branch?.address || '');
    setInteractionMode(nextPolygon.length === 0 ? 'draw' : 'pan');
    setTestPoint({ lat: null, lng: null });
    setTestResult(null);
    setStreetViewOpen(false);
    setStreetViewAvailable(null);
  }, [branch, open]);

  useEffect(() => {
    if (!isLoaded || !window.google) {
      return;
    }

    geocoderRef.current = new window.google.maps.Geocoder();
  }, [isLoaded]);

  const center = useMemo(() => {
    if (polygonPath.length > 0) {
      return polygonPath[0];
    }

    return mapCenter || defaultCenter;
  }, [mapCenter, polygonPath]);

  useEffect(() => {
    if (!open || !isLoaded || !branch?.address || polygonPath.length > 0 || !geocoderRef.current) {
      return;
    }

    geocoderRef.current.geocode({ address: branch.address }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        const nextCenter = { lat: location.lat(), lng: location.lng() };
        setMapCenter(nextCenter);
        mapRef.current?.panTo(nextCenter);
      }
    });
  }, [branch?.address, isLoaded, open, polygonPath.length]);

  const previewCenter = useMemo(() => {
    if (polygonPath.length === 0) {
      return center;
    }

    const totals = polygonPath.reduce(
      (accumulator, point) => ({
        lat: accumulator.lat + point.lat,
        lng: accumulator.lng + point.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: totals.lat / polygonPath.length,
      lng: totals.lng / polygonPath.length,
    };
  }, [center, polygonPath]);

  const polygonAnalysis = useMemo(() => analyzePolygon(polygonPath), [polygonPath]);
  const hasUnsavedChanges = getPolygonSignature(polygonPath) !== initialSignatureRef.current;
  const isDrawing = interactionMode === 'draw';
  const isTestingPoint = interactionMode === 'test';

  useEffect(() => {
    if (!streetViewOpen || !isLoaded || !window.google || !streetViewRef.current || !streetViewPosition) {
      return;
    }

    const streetViewService = new window.google.maps.StreetViewService();
    streetViewService.getPanorama({ location: streetViewPosition, radius: 80 }, (data, status) => {
      if (status !== 'OK' || !data?.location?.latLng) {
        setStreetViewAvailable(false);
        return;
      }

      setStreetViewAvailable(true);
      new window.google.maps.StreetViewPanorama(streetViewRef.current, {
        position: data.location.latLng,
        pov: { heading: 34, pitch: 8 },
        zoom: 1,
        addressControl: true,
        linksControl: true,
        panControl: true,
        fullscreenControl: false,
      });
    });
  }, [isLoaded, streetViewOpen, streetViewPosition]);

  const fitMapToPolygon = (path) => {
    if (!mapRef.current || !window.google || !Array.isArray(path) || path.length < 3) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    path.forEach((point) => bounds.extend(point));
    mapRef.current.fitBounds(bounds, 60);
  };

  const bindEditablePolygon = (polygon) => {
    polygonRef.current = polygon;

    const syncPath = () => {
      const path = polygon
        .getPath()
        .getArray()
        .map((point) => ({
          lat: point.lat(),
          lng: point.lng(),
        }));

      setPolygonPath(path);
      setTestResult(null);
    };

    polygon.getPath().addListener('set_at', syncPath);
    polygon.getPath().addListener('insert_at', syncPath);
    polygon.getPath().addListener('remove_at', syncPath);
  };

  const searchLocation = () => {
    if (!searchAddress.trim()) {
      message.warning('Enter a branch address to search.');
      return;
    }

    if (!geocoderRef.current) {
      message.error('Map search is not ready yet.');
      return;
    }

    geocoderRef.current.geocode({ address: searchAddress.trim() }, (results, status) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) {
        message.error('Could not find that location. Try a more complete address.');
        return;
      }

      const location = results[0].geometry.location;
      const nextCenter = { lat: location.lat(), lng: location.lng() };
      setMapCenter(nextCenter);
      mapRef.current?.panTo(nextCenter);
      mapRef.current?.setZoom(17);
      message.success('Location found. Draw or inspect the branch boundary.');
    });
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error('Current location is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(nextCenter);
        mapRef.current?.panTo(nextCenter);
        mapRef.current?.setZoom(17);
        message.success('Current location detected.');
      },
      () => {
        message.warning('Auto location was not detected. Search the branch address manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startPolygonDrawing = () => {
    setInteractionMode('draw');
    message.info('Draw mode active. Click the map to add points.');
  };

  const closePolygon = () => {
    if (polygonPath.length < 3) {
      message.warning('Add at least 3 points before closing the boundary.');
      return;
    }

    setInteractionMode('pan');
    fitMapToPolygon(polygonPath);
    message.success('Boundary closed. Drag points to refine it.');
  };

  const clearPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    setPolygonPath([]);
    setInteractionMode('draw');
    setTestResult(null);
  };

  const undoLastPoint = () => {
    if (polygonPath.length === 0) {
      return;
    }

    const nextPath = polygonPath.slice(0, -1);
    setPolygonPath(nextPath);
    setInteractionMode('draw');
    setTestResult(null);
  };

  const fitPolygonView = () => {
    if (polygonPath.length >= 3) {
      fitMapToPolygon(polygonPath);
      return;
    }

    mapRef.current?.panTo(center);
    mapRef.current?.setZoom(17);
  };

  const openStreetViewAt = (position = previewCenter) => {
    setStreetViewPosition(position);
    setStreetViewAvailable(null);
    setStreetViewOpen(true);
  };

  const runCoordinateTest = async (point) => {
    if (!branch?.id) {
      return;
    }

    try {
      const result = await testGeofence({
        id: branch.id,
        lat: Number(point.lat),
        lng: Number(point.lng),
      }).unwrap();
      setTestResult(result);
      message[result.inside ? 'success' : 'warning'](
        result.inside ? 'Coordinate is inside this branch.' : 'Coordinate is outside this branch.'
      );
    } catch (error) {
      message.error(error?.data?.error?.message || 'Failed to test coordinate');
    }
  };

  const handleMapClick = (event) => {
    const nextPoint = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    if (isTestingPoint) {
      const roundedPoint = {
        lat: Number(nextPoint.lat.toFixed(6)),
        lng: Number(nextPoint.lng.toFixed(6)),
      };
      setTestPoint(roundedPoint);
      runCoordinateTest(roundedPoint);
      return;
    }

    if (!isDrawing) {
      return;
    }

    if (polygonPath.length >= 3 && arePointsClose(polygonPath[0], nextPoint)) {
      closePolygon();
      return;
    }

    setPolygonPath((current) => [...current, nextPoint]);
    setTestResult(null);
  };

  const useCenterAsTestPoint = () => {
    const point = {
      lat: Number(previewCenter.lat.toFixed(6)),
      lng: Number(previewCenter.lng.toFixed(6)),
    };
    setTestPoint(point);
    runCoordinateTest(point);
  };

  const handleCoordinateTest = async () => {
    if (!Number.isFinite(Number(testPoint.lat)) || !Number.isFinite(Number(testPoint.lng))) {
      message.warning('Enter valid latitude and longitude.');
      return;
    }

    await runCoordinateTest({ lat: Number(testPoint.lat), lng: Number(testPoint.lng) });
  };

  const handleSave = async () => {
    if (polygonPath.length > 0 && polygonPath.length < 3) {
      message.warning('Draw a polygon with at least 3 points.');
      return;
    }

    try {
      await setGeofence({ id: branch.id, polygon: polygonPath }).unwrap();
      initialSignatureRef.current = getPolygonSignature(polygonPath);
      message.success(polygonPath.length === 0 ? 'Geofence cleared' : 'Geofence saved');
      onClose();
    } catch (error) {
      message.error(error?.data?.error?.message || 'Failed to save geofence');
    }
  };

  const requestClose = () => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    Modal.confirm({
      title: 'Discard unsaved geofence changes?',
      content: 'The polygon has been edited since the last save.',
      okText: 'Discard',
      okButtonProps: { danger: true },
      cancelText: 'Keep editing',
      onOk: onClose,
    });
  };

  const modeOptions = [
    { label: 'Move', value: 'pan', icon: <CompressOutlined /> },
    { label: 'Draw', value: 'draw', icon: <EditOutlined /> },
    { label: 'Test', value: 'test', icon: <PushpinOutlined /> },
  ];

  return (
    <Drawer
      title={
        <Space size={10} wrap>
          <span>{branch ? `GeoFence - ${branch.name}` : 'GeoFence'}</span>
          {hasUnsavedChanges ? <Tag color="warning">Unsaved changes</Tag> : null}
          {branch?.isRemote ? <Tag color="blue">Remote branch</Tag> : null}
        </Space>
      }
      open={open}
      onClose={requestClose}
      width="min(1320px, 96vw)"
      extra={
        <Space>
          <Popconfirm title="Clear geofence points?" onConfirm={clearPolygon} okText="Clear">
            <Button icon={<DeleteOutlined />}>Clear</Button>
          </Popconfirm>
          <Button icon={<UndoOutlined />} onClick={undoLastPoint} disabled={polygonPath.length === 0}>
            Undo
          </Button>
          <Button icon={<CompressOutlined />} onClick={fitPolygonView}>
            Fit
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={isLoading} onClick={handleSave}>
            Save
          </Button>
        </Space>
      }
    >
      {!googleMapsApiKey ? (
        <Alert
          type="error"
          showIcon
          message="Google Maps API key is missing"
          description="Set VITE_GOOGLE_MAPS_KEY in the admin deployment environment and rebuild the admin app."
        />
      ) : loadError ? (
        <Alert
          type="error"
          showIcon
          message="Google Maps failed to load"
          description="Check that Maps JavaScript API is enabled, billing is active, and the API key allows this deployed IP/domain as an HTTP referrer."
        />
      ) : isLoaded ? (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {branch?.isRemote ? (
            <Alert
              type="info"
              showIcon
              message="Geofence is optional for remote branches"
              description="Remote branches do not require a fixed office polygon, but you can still save one for reference."
            />
          ) : null}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              padding: 12,
              border: '1px solid #f0f0f0',
              borderRadius: 12,
              background: '#ffffff',
            }}
          >
            <Space wrap>
              <Input
                value={searchAddress}
                onChange={(event) => setSearchAddress(event.target.value)}
                placeholder="Search branch address"
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                onPressEnter={searchLocation}
              />
              <Button icon={<SearchOutlined />} onClick={searchLocation}>
                Search
              </Button>
              <Button icon={<AimOutlined />} onClick={detectCurrentLocation}>
                My Location
              </Button>
              <Segmented
                value={interactionMode}
                onChange={setInteractionMode}
                options={modeOptions.map((option) => ({
                  label: (
                    <Space size={6}>
                      {option.icon}
                      <span>{option.label}</span>
                    </Space>
                  ),
                  value: option.value,
                }))}
              />
              <Button onClick={closePolygon} disabled={polygonPath.length < 3 || !isDrawing}>
                Close Boundary
              </Button>
            </Space>

            <Space wrap>
              <Segmented
                value={mapType}
                onChange={setMapType}
                options={[
                  {
                    label: (
                      <Space size={6}>
                        <AppstoreOutlined />
                        <span>Map</span>
                      </Space>
                    ),
                    value: 'roadmap',
                  },
                  {
                    label: (
                      <Space size={6}>
                        <EnvironmentOutlined />
                        <span>Satellite</span>
                      </Space>
                    ),
                    value: 'hybrid',
                  },
                ]}
              />
              <Tooltip title="Open Street View near the branch center">
                <Button icon={<EyeOutlined />} onClick={() => openStreetViewAt()}>
                  Street View
                </Button>
              </Tooltip>
            </Space>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: streetViewOpen ? 'minmax(0, 1fr) 360px' : 'minmax(0, 1fr)',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <div style={{ position: 'relative' }}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={16}
                options={mapOptions}
                mapTypeId={mapType}
                onClick={handleMapClick}
                onLoad={(loadedMap) => {
                  mapRef.current = loadedMap;
                  setMap(loadedMap);
                  if (polygonPath.length >= 3) {
                    fitMapToPolygon(polygonPath);
                  }
                }}
                onUnmount={() => {
                  mapRef.current = null;
                  setMap(null);
                }}
              >
                <AdvancedMapMarker map={map} position={center} label="Branch" />

                {branch?.address ? (
                  <InfoWindow position={center}>
                    <div style={{ maxWidth: 220 }}>
                      <strong>{branch?.name || 'Branch'}</strong>
                      <div>{branch.address}</div>
                    </div>
                  </InfoWindow>
                ) : null}

                {polygonPath.length >= 3 ? <Polygon path={polygonPath} options={polygonStyle} onLoad={bindEditablePolygon} /> : null}

                {polygonPath.map((point, index) => (
                  <AdvancedMapMarker
                    key={`${point.lat}-${point.lng}-${index}`}
                    map={map}
                    position={point}
                    tone="point"
                    label={index === 0 ? 'Start' : String(index + 1)}
                    onClick={() => {
                      if (isDrawing && index === 0 && polygonPath.length >= 3) {
                        closePolygon();
                      } else {
                        openStreetViewAt(point);
                      }
                    }}
                  />
                ))}

                {Number.isFinite(Number(testPoint.lat)) && Number.isFinite(Number(testPoint.lng)) ? (
                  <AdvancedMapMarker
                    map={map}
                    position={{ lat: Number(testPoint.lat), lng: Number(testPoint.lng) }}
                    tone={testResult ? (testResult.inside ? 'success' : 'danger') : 'neutral'}
                    label={testResult ? (testResult.inside ? 'Inside' : 'Outside') : 'Test'}
                  />
                ) : null}
              </GoogleMap>

              <div
                style={{
                  position: 'absolute',
                  left: 16,
                  right: 16,
                  bottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.94)',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14)',
                }}
              >
                <Space wrap size={[8, 8]}>
                  <Tag color={polygonPath.length >= 3 ? 'success' : 'warning'} icon={polygonPath.length >= 3 ? <CheckCircleFilled /> : <EnvironmentOutlined />}>
                    {polygonPath.length >= 3 ? `${polygonPath.length} points ready` : 'Draw at least 3 points'}
                  </Tag>
                  <Tag color="processing">Area: {formatArea(polygonAnalysis.areaSqMeters)}</Tag>
                  <Tag>Perimeter: {formatMeters(polygonAnalysis.perimeterMeters)}</Tag>
                  <Tag>Center: {previewCenter.lat.toFixed(5)}, {previewCenter.lng.toFixed(5)}</Tag>
                </Space>
                <Typography.Text type="secondary">
                  {isDrawing
                    ? 'Click map to add boundary points. Click Start or Close Boundary when done.'
                    : isTestingPoint
                      ? 'Click the map to test whether a point is inside.'
                      : 'Drag polygon points to refine the saved zone.'}
                </Typography.Text>
              </div>
            </div>

            {streetViewOpen ? (
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 12,
                  padding: 10,
                  background: '#ffffff',
                }}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Typography.Text strong>Street View</Typography.Text>
                  <Button type="text" icon={<CloseOutlined />} onClick={() => setStreetViewOpen(false)} />
                </Space>
                <div ref={streetViewRef} style={streetViewStyle} />
                {streetViewAvailable === false ? (
                  <Alert
                    style={{ marginTop: 10 }}
                    type="warning"
                    showIcon
                    message="Street View is not available near this location."
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.8fr)',
              gap: 12,
            }}
          >
            <div
              style={{
                padding: 12,
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                background: '#ffffff',
              }}
            >
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Space wrap>
                  <Typography.Text strong>Quality checks</Typography.Text>
                  {polygonAnalysis.warnings.length === 0 && polygonPath.length >= 3 ? (
                    <Tag color="success">No obvious issues</Tag>
                  ) : null}
                </Space>
                {polygonAnalysis.warnings.length > 0 ? (
                  <Space direction="vertical" size={6}>
                    {polygonAnalysis.warnings.map((warning) => (
                      <Alert key={warning} type="warning" showIcon icon={<WarningOutlined />} message={warning} />
                    ))}
                  </Space>
                ) : (
                  <Typography.Text type="secondary">
                    Quality warnings appear here while you draw. They do not block saving unless the polygon has fewer than 3 points.
                  </Typography.Text>
                )}
              </Space>
            </div>

            <div
              style={{
                padding: 12,
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                background: '#ffffff',
              }}
            >
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Typography.Text strong>Test coordinate</Typography.Text>
                  <Button size="small" icon={<PushpinOutlined />} onClick={() => setInteractionMode('test')}>
                    Place on map
                  </Button>
                </Space>
                <Space wrap>
                  <InputNumber
                    value={testPoint.lat}
                    onChange={(value) => {
                      setTestPoint((current) => ({ ...current, lat: value }));
                      setTestResult(null);
                    }}
                    placeholder="Latitude"
                    precision={6}
                    style={{ width: 150 }}
                  />
                  <InputNumber
                    value={testPoint.lng}
                    onChange={(value) => {
                      setTestPoint((current) => ({ ...current, lng: value }));
                      setTestResult(null);
                    }}
                    placeholder="Longitude"
                    precision={6}
                    style={{ width: 150 }}
                  />
                  <Button onClick={useCenterAsTestPoint}>Use Center</Button>
                  <Button type="primary" loading={isTesting} onClick={handleCoordinateTest}>
                    Test
                  </Button>
                </Space>
                {testResult ? (
                  <>
                    <Divider style={{ margin: '4px 0' }} />
                    <Alert
                      type={testResult.inside ? 'success' : 'warning'}
                      showIcon
                      message={testResult.inside ? 'Inside branch geofence' : 'Outside branch geofence'}
                      description={
                        testResult.distanceMeters == null
                          ? 'This branch does not have a valid polygon yet.'
                          : `Distance from boundary: ${formatMeters(testResult.distanceMeters)}. Mobile check-ins may also consider GPS accuracy buffer.`
                      }
                    />
                  </>
                ) : null}
              </Space>
            </div>
          </div>
        </Space>
      ) : null}
    </Drawer>
  );
}
