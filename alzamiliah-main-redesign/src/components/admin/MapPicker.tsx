'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface MapPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
}

function MapPickerInner({ lat, lng, onChange }: MapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [L, setL] = useState<typeof import('leaflet') | null>(null);

    useEffect(() => {
        import('leaflet').then(leaflet => {
            setL(leaflet.default || leaflet);
        });
    }, []);

    useEffect(() => {
        if (!L || !mapRef.current || mapInstanceRef.current) return;

        // Fix default icon
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current).setView([lat || 24.7136, lng || 46.6753], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const marker = L.marker([lat || 24.7136, lng || 46.6753], { draggable: true }).addTo(map);

        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
        });

        map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            onChange(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)));
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [L]);

    // Update marker position when lat/lng props change externally
    useEffect(() => {
        if (markerRef.current && mapInstanceRef.current && lat && lng) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
        }
    }, [lat, lng]);

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
            <div ref={mapRef} className="admin-map-container" />
        </>
    );
}

// Dynamic import to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => Promise.resolve(MapPickerInner), {
    ssr: false,
    loading: () => <div className="admin-map-container" style={{ background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Loading map...</div>
});

export default MapPicker;
