'use client';

import React, { useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function Map() {
  const mapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const iniMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        version: 'weekly',
        libraries: ['places'],
      });

      const [mapLibrary, markerLibrary] = await Promise.all([
        loader.importLibrary('maps'),
        loader.importLibrary('marker'),
      ]);

      const position = {
        lat: 24.2236791,
        lng: 120.6456605,
      };

      const mapOptions: google.maps.MapOptions = {
        center: position,
        zoom: 17,
        mapTypeControl: false,
        maxZoom: 20,
        minZoom: 12,
        fullscreenControl: false,
        streetViewControl: false,
      };

      const map = new mapLibrary.Map(mapRef.current as HTMLDivElement, mapOptions);

      const marker = new markerLibrary.Marker({
        position,
        map,
      });
    };

    iniMap();
  }, []);

  return <div ref={mapRef} style={{ height: '100vh' }} />;
}
