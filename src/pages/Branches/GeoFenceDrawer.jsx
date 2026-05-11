import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Drawer, Space, message, Input, InputNumber, Card, Popconfirm, Typography, Tag, Segmented } from 'antd';
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
} from '@ant-design/icons';
import { GoogleMap, Polygon, Marker, InfoWindow, Circle, useJsApiLoader } from '@react-google-maps/api';
import { useSetGeofenceMutation, useTestGeofenceMutation } from '../../store/api/branchApi.js';

const libraries = ['places'];
const defaultCenter = { lat: 28.6139, lng: 77.209 };
const mapContainerStyle = { width: '100%', height: '62vh', borderRadius: 20 };
const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
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

export default function GeoFenceDrawer({ open, branch, onClose }) {
  const [polygonPath, setPolygonPath] = useState([]);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [searchAddress, setSearchAddress] = useState('');
  const [mapType, setMapType] = useState('roadmap');
  const [isDrawing, setIsDrawing] = useState(false);
  const [testPoint, setTestPoint] = useState({ lat: null, lng: null });
  const [testResult, setTestResult] = useState(null);
  const [setGeofence, { isLoading }] = useSetGeofenceMutation();
  const [testGeofence, { isLoading: isTesting }] = useTestGeofenceMutation();
  const polygonRef = useRef(null);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextPolygon = Array.isArray(branch?.polygon) ? branch.polygon : [];
    setPolygonPath(nextPolygon);
    setSearchAddress(branch?.address || '');
    setIsDrawing(nextPolygon.length === 0);
    setTestPoint({ lat: null, lng: null });
    setTestResult(null);
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

  const previewRadiusMeters = useMemo(() => {
    if (polygonPath.length < 2) {
      return 0;
    }

    return Math.round(
      polygonPath.reduce((largest, point) => Math.max(largest, distanceInMeters(previewCenter, point)), 0)
    );
  }, [polygonPath, previewCenter]);

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
      message.success('Location found. Start drawing the branch boundary.');
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
        message.success('Current location detected. Start drawing the branch boundary.');
      },
      () => {
        message.warning('Auto location was not detected. Search the branch address manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startPolygonDrawing = () => {
    setIsDrawing(true);
    message.info('Drawing started. Click the map to add points, then click the Start marker or Close Boundary.');
  };

  const closePolygon = () => {
    if (polygonPath.length < 3) {
      message.warning('Add at least 3 points before closing the boundary.');
      return;
    }

    setIsDrawing(false);
    fitMapToPolygon(polygonPath);
    message.success('Boundary closed. Drag points to refine it.');
  };

  const clearPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    setPolygonPath([]);
    setIsDrawing(true);
    setTestResult(null);
  };

  const undoLastPoint = () => {
    if (polygonPath.length === 0) {
      return;
    }

    const nextPath = polygonPath.slice(0, -1);
    setPolygonPath(nextPath);
    setIsDrawing(true);
  };

  const fitPolygonView = () => {
    if (polygonPath.length >= 3) {
      fitMapToPolygon(polygonPath);
      return;
    }

    mapRef.current?.panTo(center);
    mapRef.current?.setZoom(17);
  };

  const handleMapClick = (event) => {
    if (!isDrawing) {
      return;
    }

    const nextPoint = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    if (polygonPath.length >= 3 && arePointsClose(polygonPath[0], nextPoint)) {
      closePolygon();
      return;
    }

    setPolygonPath((current) => [...current, nextPoint]);
  };

  const useCenterAsTestPoint = () => {
    setTestPoint({
      lat: Number(previewCenter.lat.toFixed(6)),
      lng: Number(previewCenter.lng.toFixed(6)),
    });
    setTestResult(null);
  };

  const handleCoordinateTest = async () => {
    if (!branch?.id) {
      return;
    }

    if (!Number.isFinite(Number(testPoint.lat)) || !Number.isFinite(Number(testPoint.lng))) {
      message.warning('Enter valid latitude and longitude.');
      return;
    }

    try {
      const result = await testGeofence({
        id: branch.id,
        lat: Number(testPoint.lat),
        lng: Number(testPoint.lng),
      }).unwrap();
      setTestResult(result);
      message[result.inside ? 'success' : 'warning'](
        result.inside ? 'Coordinate is inside this branch.' : 'Coordinate is outside this branch.'
      );
    } catch (error) {
      message.error(error?.data?.error?.message || 'Failed to test coordinate');
    }
  };

  const handleSave = async () => {
    if (polygonPath.length > 0 && polygonPath.length < 3) {
      message.warning('Draw a polygon with at least 3 points.');
      return;
    }

    try {
      await setGeofence({ id: branch.id, polygon: polygonPath }).unwrap();
      message.success(polygonPath.length === 0 ? 'Geofence cleared' : 'Geofence saved');
      onClose();
    } catch (error) {
      message.error(error?.data?.error?.message || 'Failed to save geofence');
    }
  };

  return (
    <Drawer
      title={branch ? `GeoFence - ${branch.name}` : 'GeoFence'}
      open={open}
      onClose={onClose}
      width={980}
      extra={
        <Space>
          <Popconfirm title="Clear geofence points?" onConfirm={clearPolygon} okText="Clear">
            <Button icon={<DeleteOutlined />}>Clear</Button>
          </Popconfirm>
          <Button icon={<UndoOutlined />} onClick={undoLastPoint} disabled={polygonPath.length === 0}>
            Undo Point
          </Button>
          <Button icon={<CompressOutlined />} onClick={fitPolygonView}>
            Fit View
          </Button>
          <Button type="primary" loading={isLoading} onClick={handleSave}>
            Save Polygon
          </Button>
        </Space>
      }
    >
      {isLoaded ? (
        <>
          <Card
            style={{
              marginBottom: 16,
              borderRadius: 20,
              borderColor: '#d1fae5',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
            }}
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  Branch geofence setup
                </Typography.Title>
                <Typography.Text type="secondary">
                  Search the branch address or detect the current location, then draw the attendance boundary directly on the map.
                </Typography.Text>
              </div>

              <Space wrap style={{ width: '100%' }}>
                <Input
                  value={searchAddress}
                  onChange={(event) => setSearchAddress(event.target.value)}
                  placeholder="Search branch address manually"
                  prefix={<SearchOutlined />}
                  style={{ minWidth: 320 }}
                  onPressEnter={searchLocation}
                />
                <Button icon={<SearchOutlined />} onClick={searchLocation}>
                  Search Address
                </Button>
                <Button icon={<AimOutlined />} onClick={detectCurrentLocation}>
                  Use My Location
                </Button>
                <Button type="primary" icon={<EditOutlined />} onClick={startPolygonDrawing}>
                  {isDrawing ? 'Drawing Active' : 'Draw Boundary'}
                </Button>
                <Button onClick={closePolygon} disabled={polygonPath.length < 3 || !isDrawing}>
                  Close Boundary
                </Button>
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
                <Tag color={polygonPath.length >= 3 ? 'success' : 'warning'} icon={polygonPath.length >= 3 ? <CheckCircleFilled /> : <EnvironmentOutlined />}>
                  {polygonPath.length >= 3
                    ? isDrawing
                      ? `${polygonPath.length} points added, click Start marker to close`
                      : `${polygonPath.length} polygon points ready`
                    : 'Draw at least 3 points'}
                </Tag>
                <Tag color="processing">
                  Center: {previewCenter.lat.toFixed(5)}, {previewCenter.lng.toFixed(5)}
                </Tag>
                <Tag color="purple">Radius preview: {previewRadiusMeters} m</Tag>
              </Space>

              <Typography.Text type="secondary">
                Click `Draw Boundary`, then click around the branch on the map to place points. Click the `Start` marker again or press `Close Boundary` to finish. After that, drag polygon points to refine it. The saved zone appears in green.
              </Typography.Text>
            </Space>
          </Card>

          <Card style={{ marginBottom: 16, borderRadius: 12 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Test a coordinate
              </Typography.Title>
              <Space wrap>
                <InputNumber
                  value={testPoint.lat}
                  onChange={(value) => {
                    setTestPoint((current) => ({ ...current, lat: value }));
                    setTestResult(null);
                  }}
                  placeholder="Latitude"
                  precision={6}
                  style={{ width: 180 }}
                />
                <InputNumber
                  value={testPoint.lng}
                  onChange={(value) => {
                    setTestPoint((current) => ({ ...current, lng: value }));
                    setTestResult(null);
                  }}
                  placeholder="Longitude"
                  precision={6}
                  style={{ width: 180 }}
                />
                <Button onClick={useCenterAsTestPoint}>Use Map Center</Button>
                <Button type="primary" loading={isTesting} onClick={handleCoordinateTest}>
                  Test
                </Button>
              </Space>
              {testResult ? (
                <Alert
                  type={testResult.inside ? 'success' : 'warning'}
                  showIcon
                  message={testResult.inside ? 'Inside branch geofence' : 'Outside branch geofence'}
                  description={
                    testResult.distanceMeters == null
                      ? 'This branch does not have a valid polygon yet.'
                      : `Distance from boundary: ${testResult.distanceMeters} m`
                  }
                />
              ) : null}
            </Space>
          </Card>

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={16}
            options={mapOptions}
            mapTypeId={mapType}
            onClick={handleMapClick}
            onLoad={(map) => {
              mapRef.current = map;
              if (polygonPath.length >= 3) {
                fitMapToPolygon(polygonPath);
              }
            }}
          >
            <Marker position={center} />

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
              <Marker
                key={`${point.lat}-${point.lng}-${index}`}
                position={point}
                label={{
                  text: index === 0 ? 'Start' : String(index + 1),
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                }}
                onClick={() => {
                  if (isDrawing && index === 0 && polygonPath.length >= 3) {
                    closePolygon();
                  }
                }}
              />
            ))}

            {previewRadiusMeters > 0 ? (
              <Circle
                center={previewCenter}
                radius={previewRadiusMeters}
                options={{
                  strokeColor: '#0f766e',
                  strokeOpacity: 0.55,
                  strokeWeight: 1,
                  fillColor: '#14b8a6',
                  fillOpacity: 0.08,
                }}
              />
            ) : null}

            {previewRadiusMeters > 0 ? (
              <InfoWindow position={previewCenter}>
                <div style={{ minWidth: 160 }}>
                  <strong>Fence Preview</strong>
                  <div>Center: {previewCenter.lat.toFixed(5)}, {previewCenter.lng.toFixed(5)}</div>
                  <div>Radius: {previewRadiusMeters} m</div>
                </div>
              </InfoWindow>
            ) : null}
          </GoogleMap>
        </>
      ) : null}
    </Drawer>
  );
}
