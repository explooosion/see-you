'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { IUser } from '@/services/user';

type MapProps = {
  users: IUser[];
};

export interface IMarkerObject {
  user: IUser;
  marker: google.maps.Marker;
  circle?: google.maps.Circle;
}

const Map = forwardRef(({ users }: MapProps, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);

  const [map, setMap] = useState<google.maps.Map>();
  const [markerLibrary, setMarkerLibrary] = useState<google.maps.MarkerLibrary>();
  const [markerObjs, setMarkerObjs] = useState<IMarkerObject[]>([]);

  const [position] = useLocalStorage<GeolocationPosition | null>('position', null);

  useEffect(() => {
    const iniMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        version: 'weekly',
        libraries: ['places'],
      });

      const [mapLibrary, markerLib] = await Promise.all([loader.importLibrary('maps'), loader.importLibrary('marker')]);
      setMarkerLibrary(markerLib);

      const initialPosition = position
        ? {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
        : {
            lat: 24.2236791,
            lng: 120.6456605,
          };

      console.log('initialPosition', initialPosition);

      const userAgent = navigator.userAgent;
      const isMobile = /mobile/i.test(userAgent);

      const mapOptions: google.maps.MapOptions = {
        center: initialPosition,
        zoom: 15,
        // maxZoom: 20,
        minZoom: 12,
        fullscreenControl: false,
        streetViewControl: false,
        clickableIcons: false,
        zoomControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
        },
        gestureHandling: isMobile ? 'greedy' : 'auto', // Enable one-finger touch gesture
      };

      setMap(new mapLibrary.Map(mapRef.current as HTMLDivElement, mapOptions));
    };

    iniMap();
  }, [position]);

  useEffect(() => {
    if (map && markerLibrary && users.length > 0) {
      users.forEach(user => {
        const { photoURL, lat, lng } = user;
        const marker = new google.maps.Marker({
          icon: {
            url: photoURL,
            scaledSize: new google.maps.Size(50, 50),
            anchor: new google.maps.Point(25, 25),
          },
          position: { lat, lng },
          map,
        });
        setMarkerObjs(prev => [...prev, { user, marker }]);
      });
      // new google.maps.Circle({
      //   center: users[0].position,
      //   radius: 500,
      //   strokeColor: 'yellow',
      //   strokeOpacity: 1,
      //   strokeWeight: 2,
      //   fillColor: 'yellow',
      //   fillOpacity: 0.35,
      //   map,
      // });
      // const { lat, lng } = users[0];
      // map.setCenter({ lat, lng });
      // const bounds = new google.maps.LatLngBounds();
      // users.forEach(user => bounds.extend(user.position));
      // map.fitBounds(bounds);
    }
  }, [markerLibrary, users, map]);

  useImperativeHandle(ref, () => ({
    map,
    markerObjs,
    setMarkerObjs,
    markerLibrary,
  }));

  return <div ref={mapRef} style={{ height: '100vh', width: '100vw' }} />;
});

Map.displayName = 'Map';

export default Map;
