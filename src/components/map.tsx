'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { User } from 'firebase/auth';

import { auth } from '@/config/firebase.config';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { IUser } from '@/services/user';
import { createCircleImageFromUrl } from '@/utils';

type MapProps = {
  users: IUser[];
};

export interface IMarkerObject {
  user: IUser;
  marker: google.maps.Marker;
  circle?: google.maps.Circle;
}

export interface MapRef {
  /**
   * Google Map 實例
   */
  map: google.maps.Map;
  /**
   * 標點物件
   */
  markersObjs: IMarkerObject[];
  /**
   * 設定標點物件
   */
  setMarkersObjs: React.Dispatch<React.SetStateAction<IMarkerObject[]>>;
  /**
   * 設定標點的 z-index 最大值
   * @param markersObjects
   * @param user
   * @returns
   */
  setZIndexMax: (markersObjects: IMarkerObject[], user: IUser | User) => void;
  /**
   * Google Map Marker Library
   */
  markerLibrary: google.maps.MarkerLibrary;
  /**
   * Google Map Geometry Library
   */
  geometryLibrary: google.maps.GeometryLibrary;
}

const Map = forwardRef(({ users }: MapProps, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);

  const [map, setMap] = useState<google.maps.Map>();
  const [loadedMap, setLoadedMap] = useState(false);

  const [markerLibrary, setMarkerLibrary] = useState<google.maps.MarkerLibrary>();
  const [geometryLibrary, setGeometryLibrary] = useState<google.maps.GeometryLibrary>();

  const [markersObjs, setMarkersObjs] = useState<IMarkerObject[]>([]);
  const [loadedMarkersObjs, setLoadedMarkersObjs] = useState(false);

  const [position, setPosition] = useLocalStorage<{ lat: number; lng: number } | null>('position', null);

  /**
   * 設定標點的 z-index 最大值
   * @param markersObjects
   * @param user
   */
  const setZIndexMax = (markersObjects: IMarkerObject[], user: IUser | User) => {
    let maxZIndex = 0;
    markersObjects.forEach(mkObj => {
      const zIndex = mkObj.marker.getZIndex() || 0;
      if (zIndex > maxZIndex) maxZIndex = zIndex;
    });

    const currentObj = markersObjects.find(obj => obj.user.uid === user.uid);
    if (currentObj) currentObj.marker.setZIndex(maxZIndex + 1);
  };

  // 初始化地圖
  useEffect(() => {
    if (!loadedMap && position) {
      const initialMap = async () => {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
          version: 'weekly',
          libraries: ['places'],
        });

        const [mapLibrary, markerLib, geometryLibrary] = await Promise.all([
          loader.importLibrary('maps'),
          loader.importLibrary('marker'),
          loader.importLibrary('geometry'),
        ]);
        setMarkerLibrary(markerLib);
        setGeometryLibrary(geometryLibrary);

        const initialPosition = {
          lat: position.lat - 0.00002,
          lng: position.lng,
        };

        const userAgent = navigator.userAgent;
        const isMobile = /mobile/i.test(userAgent);

        const mapOptions: google.maps.MapOptions = {
          center: initialPosition,
          zoom: 20,
          // maxZoom: 20,
          // minZoom: 12,
          fullscreenControl: false,
          streetViewControl: false,
          clickableIcons: false,
          zoomControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
          },
          gestureHandling: isMobile ? 'greedy' : 'auto', // Enable one-finger touch gesture
        };

        setMap(new mapLibrary.Map(mapRef.current as HTMLDivElement, mapOptions));
        setLoadedMap(true);
      };
      initialMap();
    }
  }, [loadedMap, position]);

  // 初始化標點
  useEffect(() => {
    if (!loadedMarkersObjs && map && auth.currentUser) {
      const loadMarkersObjs = async () => {
        const markersObjects = await Promise.all(
          users.map(user => {
            return new Promise<IMarkerObject>(async resolve => {
              const dataUrl = await createCircleImageFromUrl(user.photoURL);

              const marker = new google.maps.Marker({
                icon: {
                  url: dataUrl,
                  scaledSize: new google.maps.Size(50, 50),
                  anchor: new google.maps.Point(25, 25),
                },
                position: { lat: user.lat, lng: user.lng },
                map,
              });

              // const circle =
              //   user.uid === auth.currentUser?.uid
              //     ? new google.maps.Circle({
              //         center: { lat: user.lat, lng: user.lng },
              //         radius: 500,
              //         strokeColor: 'yellow',
              //         strokeOpacity: 1,
              //         strokeWeight: 2,
              //         fillColor: 'yellow',
              //         fillOpacity: 0.15,
              //         map,
              //       })
              //     : undefined;

              resolve({ user, marker, circle: undefined });
            });
          })
        );

        if (markersObjects.length > 0) {
          // 設定標點的 z-index 最大值
          setZIndexMax(markersObjects, auth.currentUser!);
          // 設定標點物件
          setMarkersObjs(markersObjects);
          // 設定標點初始化完畢
          setLoadedMarkersObjs(true);
          console.log('標點初始化完畢', markersObjects);
        }
      };

      loadMarkersObjs();
    }
  }, [loadedMarkersObjs, map, users]);

  // 將相鄰的標點群組化
  // useEffect(() => {
  //   if (map && geometryLibrary && markerLibrary && markersObjs && auth.currentUser) {
  //     const groupedMarkersObjs: IMarkerObject[][] = [];

  //     markersObjs.forEach(markerObj => {
  //       const { marker } = markerObj;

  //       const markerPosition = marker.getPosition();

  //       const isGrouped = groupedMarkersObjs.some(groupedMarkersObj => {
  //         const groupedMarker = groupedMarkersObj[0].marker;

  //         const groupedMarkerPosition = groupedMarker.getPosition();

  //         const distance = geometryLibrary.spherical.computeDistanceBetween(
  //           markerPosition as google.maps.LatLng,
  //           groupedMarkerPosition as google.maps.LatLng
  //         );

  //         if (distance < 500) {
  //           groupedMarkersObj.push(markerObj);
  //           return true;
  //         }

  //         return false;
  //       });

  //       if (!isGrouped) {
  //         groupedMarkersObjs.push([markerObj]);
  //       }
  //     });

  //     groupedMarkersObjs.forEach(groupedMarkersObj => {
  //       const { marker } = groupedMarkersObj[0];

  //       const markerPosition = marker.getPosition();

  //       function computeCentroid(points: google.maps.LatLng[]) {
  //         let totalLat = 0;
  //         let totalLng = 0;

  //         points.forEach(point => {
  //           totalLat += point.lat();
  //           totalLng += point.lng();
  //         });

  //         const averageLat = totalLat / points.length;
  //         const averageLng = totalLng / points.length;

  //         return new google.maps.LatLng(averageLat, averageLng);
  //       }

  //       const groupCenter = computeCentroid(
  //         groupedMarkersObj.map(markerObj => markerObj.marker.getPosition() as google.maps.LatLng)
  //       );

  //       const distance = geometryLibrary.spherical.computeDistanceBetween(
  //         markerPosition as google.maps.LatLng,
  //         groupCenter
  //       );

  //       if (distance < 500) {
  //         const circle = new google.maps.Circle({
  //           center: groupCenter,
  //           radius: distance,
  //           strokeColor: 'yellow',
  //           strokeOpacity: 1,
  //           strokeWeight: 2,
  //           fillColor: 'yellow',
  //           fillOpacity: 0.25,
  //         });

  //         circle.setMap(map);
  //       }
  //     });
  //   }
  // }, [map, geometryLibrary, markerLibrary, markersObjs, auth.currentUser]);

  // 監聽地圖縮放事件
  useEffect(() => {
    if (map && markersObjs && auth.currentUser) {
      google.maps.event.addListener(map, 'zoom_changed', () => {
        console.log('zoom_changed');
      });
    }
  }, [map, markersObjs]);

  useImperativeHandle(ref, () => ({
    map,
    markersObjs,
    setMarkersObjs,
    setZIndexMax,
    markerLibrary,
    geometryLibrary,
  }));

  return <div ref={mapRef} style={{ height: '100vh', width: '100vw' }} />;
});

Map.displayName = 'Map';

export default Map;
