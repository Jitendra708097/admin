// /**
//  * @module GeoFenceDrawer
//  * @description Google Maps geofence drawing modal.
//  */
// import { Modal, Button, Row, Col, Card, Statistic } from 'antd';

// export default function GeoFenceDrawer({ open, branch, onSave, onCancel, loading }) {
//   return (
//     <Modal
//       title={`Set Geofence - ${branch?.name}`}
//       open={open}
//       onCancel={onCancel}
//       width="90vw"
//       style={{ top: 0 }}
//       bodyStyle={{ padding: '16px', height: '70vh' }}
//       footer={[
//         <Button key="cancel" onClick={onCancel}>
//           Cancel
//         </Button>,
//         <Button key="save" type="primary" loading={loading} onClick={() => onSave()}>
//           Save Geofence
//         </Button>,
//       ]}
//     >
//       <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//         <Col xs={12}>
//           <Card size="small">
//             <Statistic title="Latitude" value={branch?.latitude} />
//           </Card>
//         </Col>
//         <Col xs={12}>
//           <Card size="small">
//             <Statistic title="Longitude" value={branch?.longitude} />
//           </Card>
//         </Col>
//       </Row>

//       <div style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}>
//         <p style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
//           Google Maps integration - Draw polygon on map to set geofence boundaries
//         </p>
//       </div>
//     </Modal>
//   );
// }


import { useEffect, useRef, useState } from 'react';
import { Button, Input, message } from 'antd';
import axios from 'axios';

export default function BranchGeofenceMap({ branchId, branchAddress }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const drawingManager = useRef(null);
  const currentPolygon = useRef(null);
  const [saving, setSaving] = useState(false);
  const [searchAddress, setSearchAddress] = useState(branchAddress || '');

  useEffect(() => {
    if (window.google) { initMap(); return; }

    const script = document.createElement('script');
    // libraries=drawing,geometry — geometry needed for area calculations later
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=drawing,geometry`;
    script.onload = initMap;
    document.head.appendChild(script);
  }, []);

  function initMap() {
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.209 }, // fallback center
      zoom: 12,
    });

    // Auto-center on branch address as soon as map loads
    if (branchAddress) {
      centerMapOnAddress(branchAddress);
    }

    drawingManager.current = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon'],
      },
      polygonOptions: {
        fillColor: '#4F46E5',
        fillOpacity: 0.2,
        strokeColor: '#4F46E5',
        strokeWeight: 2,
        editable: true,
      },
    });

    drawingManager.current.setMap(mapInstance.current);

    window.google.maps.event.addListener(
      drawingManager.current,
      'polygoncomplete',
      (polygon) => {
        if (currentPolygon.current) currentPolygon.current.setMap(null);
        currentPolygon.current = polygon;
        drawingManager.current.setDrawingMode(null);
      }
    );

    loadExistingPolygon();
  }

  // Geocoding — address text → lat/lng → fly map there
  function centerMapOnAddress(address) {
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK') {
        const loc = results[0].geometry.location;
        mapInstance.current.setCenter(loc);
        mapInstance.current.setZoom(18); // street level — see buildings clearly
      } else {
        message.warning('Address not found. Try adding city or state.');
      }
    });
  }

  async function loadExistingPolygon() {
    try {
      const { data } = await axios.get(`/api/v1/branches/${branchId}/geofence`);
      const polygon = data.data?.polygon;
      if (!polygon || polygon.length < 3) return;

      const path = polygon.map((p) => ({ lat: p.lat, lng: p.lng }));

      currentPolygon.current = new window.google.maps.Polygon({
        paths: path,
        fillColor: '#4F46E5',
        fillOpacity: 0.2,
        strokeColor: '#4F46E5',
        strokeWeight: 2,
        editable: true,
        map: mapInstance.current,
      });

      // Fit map bounds to existing polygon
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      mapInstance.current.fitBounds(bounds);
    } catch {
      // No polygon yet — fine
    }
  }

  async function handleSave() {
    if (!currentPolygon.current) {
      message.warning('Draw a polygon around your office first');
      return;
    }

    const path = currentPolygon.current.getPath().getArray();
    const polygon = path.map((latlng) => ({
      lat: latlng.lat(),
      lng: latlng.lng(),
    }));

    console.log('Saving polygon:', polygon);
    setSaving(true);
    try {
      await axios.put(`/api/v1/branches/${branchId}/geofence`, { polygon });
      message.success('Geo-fence saved!');
    } catch {
      message.error('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Address search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Input
          placeholder="Type office address to jump to it on map"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onPressEnter={() => centerMapOnAddress(searchAddress)}
          style={{ flex: 1 }}
        />
        <Button onClick={() => centerMapOnAddress(searchAddress)}>
          Find on map
        </Button>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ width: '100%', height: 480, borderRadius: 8 }} />

      {/* Save button */}
      <Button
        type="primary"
        loading={saving}
        onClick={handleSave}
        style={{ marginTop: 12 }}
      >
        Save geo-fence
      </Button>
    </div>
  );
}
