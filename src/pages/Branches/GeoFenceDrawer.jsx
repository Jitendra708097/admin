import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Drawer, Space, message } from 'antd';
import { GoogleMap, DrawingManager, Polygon, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useSetGeofenceMutation } from '../../store/api/branchApi.js';

const libraries = ['drawing'];
const defaultCenter = { lat: 28.6139, lng: 77.209 };

export default function GeoFenceDrawer({ open, branch, onClose }) {
  const [polygonPath, setPolygonPath] = useState([]);
  const [setGeofence, { isLoading }] = useSetGeofenceMutation();
  const polygonRef = useRef(null);
  const drawingManagerRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries,
  });

  useEffect(() => {
    if (open) {
      setPolygonPath(branch?.polygon || []);
    }
  }, [branch, open]);

  const center = useMemo(() => {
    if (polygonPath.length > 0) {
      return polygonPath[0];
    }

    return defaultCenter;
  }, [polygonPath]);

  const handlePolygonComplete = (polygon) => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    polygonRef.current = polygon;

    const path = polygon
      .getPath()
      .getArray()
      .map((point) => ({
        lat: point.lat(),
        lng: point.lng(),
      }));

    setPolygonPath(path);

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
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

  const handleSave = async () => {
    if (polygonPath.length < 3) {
      message.warning('Draw a polygon with at least 3 points.');
      return;
    }

    try {
      await setGeofence({ id: branch.id, polygon: polygonPath }).unwrap();
      message.success('Geofence saved');
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
      width={900}
      extra={
        <Space>
          <Button onClick={() => setPolygonPath([])}>Clear</Button>
          <Button type="primary" loading={isLoading} onClick={handleSave}>
            Save Polygon
          </Button>
        </Space>
      }
    >
      {isLoaded ? (
        <GoogleMap mapContainerStyle={{ width: '100%', height: '70vh', borderRadius: 12 }} center={center} zoom={16}>
          <Marker position={center} />
          <DrawingManager
            onLoad={(manager) => {
              drawingManagerRef.current = manager;
            }}
            onPolygonComplete={handlePolygonComplete}
            options={{
              drawingControl: true,
              drawingControlOptions: {
                drawingModes: ['polygon'],
              },
              polygonOptions: {
                fillColor: '#1677ff',
                fillOpacity: 0.18,
                strokeColor: '#1677ff',
                strokeWeight: 2,
                editable: true,
              },
            }}
          />
          {polygonPath.length >= 3 ? (
            <Polygon
              path={polygonPath}
              options={{
                fillColor: '#1677ff',
                fillOpacity: 0.18,
                strokeColor: '#1677ff',
                strokeWeight: 2,
                editable: true,
              }}
              onLoad={bindEditablePolygon}
            />
          ) : null}
        </GoogleMap>
      ) : null}
    </Drawer>
  );
}
