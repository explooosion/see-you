'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { User } from 'firebase/auth';

import { auth } from '@/config/firebase.config';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { IUser, IPosition, updateUserPosition } from '@/services/firebase';
import { createCircleImageFromUrl } from '@/utils';

type MapProps = {
  watchUser: IUser;
  currentUser: IUser;
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
  /**
   * Map Component 的 watchId
   */
  watchId: number | null;
  /**
   * Map Component 的 watchId
   */
  setWatchId: React.Dispatch<React.SetStateAction<number | null>>;
}

const Map = forwardRef(({ users, currentUser, watchUser }: MapProps, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);

  const [map, setMap] = useState<google.maps.Map>();
  const [loadedMap, setLoadedMap] = useState(false);

  const [markerLibrary, setMarkerLibrary] = useState<google.maps.MarkerLibrary>();
  const [geometryLibrary, setGeometryLibrary] = useState<google.maps.GeometryLibrary>();

  const [markersObjs, setMarkersObjs] = useState<IMarkerObject[]>([]);
  const [loadedMarkersObjs, setLoadedMarkersObjs] = useState(false);

  const [position, setPosition] = useLocalStorage<IPosition | null>('position', null);

  const [watchId, setWatchId] = useState<number | null>(null);

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

        const center = {
          lat: position.lat - 0.00005,
          lng: position.lng,
        };

        const userAgent = navigator.userAgent;
        const isMobile = /mobile/i.test(userAgent);

        const mapOptions: google.maps.MapOptions = {
          center,
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
  }, [loadedMap, position, watchUser, currentUser]);

  // 初始化標點
  useEffect(() => {
    if (!loadedMarkersObjs && map) {
      const loadMarkersObjs = async () => {
        const markersObjects = await Promise.all(
          users.map(user => {
            return new Promise<IMarkerObject>(async resolve => {
              let icon: google.maps.Icon | null = null;

              if (user.photoURL) {
                const iconUrl = await createCircleImageFromUrl(user.photoURL);
                icon = {
                  url: iconUrl,
                  scaledSize: new google.maps.Size(50, 50),
                  anchor: new google.maps.Point(25, 25),
                };
              }

              const marker = new google.maps.Marker({
                icon,
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
          // 設置所有標點物件
          setMarkersObjs(markersObjects);
          // 設定標點初始化完畢
          setLoadedMarkersObjs(true);
          // 設定標點的 z-index 最大值
          setZIndexMax(markersObjects, currentUser);
          // 移動地圖到使用者位置
          map.panTo({ lat: currentUser.lat - 0.00005, lng: currentUser.lng });
          console.log('map.objects.initial.complete', markersObjects);
        }
      };

      loadMarkersObjs();
    }
  }, [loadedMarkersObjs, map, users, currentUser]);

  // 更新標點或者刪除標點
  useEffect(() => {
    if (loadedMarkersObjs && map && auth.currentUser) {
      // 比對 database.users 和 state.markersObjs[n].user 差異，進行更新或刪除
      markersObjs.forEach(markerObjs => {
        const { user } = markerObjs;
        const userData = users.find(u => u.uid === user.uid);

        if (userData) {
          // 更新標點
          markerObjs.marker.setPosition({ lat: userData.lat, lng: userData.lng });
          markerObjs.circle?.setCenter({ lat: userData.lat, lng: userData.lng });
          markerObjs.user = userData;
        } else {
          // 刪除標點
          markerObjs.marker.setMap(null);
          markerObjs.circle?.setMap(null);
          markerObjs.user = null as any;
        }
      });

      // 移動至追蹤者位置
      map.panTo({ lat: watchUser.lat - 0.00005, lng: watchUser.lng });
      // 設定標點的 z-index 最大值
      setZIndexMax(markersObjs, watchUser);

      console.log('map.objects.update.complete');
    }
  }, [map, users, loadedMarkersObjs, markersObjs, watchUser]);

  // 監聽 currentUser 位置
  useEffect(() => {
    setWatchId(
      navigator.geolocation.watchPosition(
        success => {
          if (map && geometryLibrary && position) {
            // 當新座標的距離超過 10 公尺，才更新座標
            const distance = geometryLibrary.spherical.computeDistanceBetween(
              new google.maps.LatLng(position),
              new google.maps.LatLng(success.coords.latitude, success.coords.longitude)
            );

            if (distance > 10) {
              const p = {
                lat: success.coords.latitude,
                lng: success.coords.longitude,
              };
              // 更新本地儲存的 currentUser 座標
              setPosition(p);
              // 更新 currentUser 座標
              updateUserPosition(currentUser, p);
              // 移動至追蹤者位置
              map.panTo({ lat: watchUser.lat - 0.00005, lng: watchUser.lng });
              // 設定標點的 z-index 最大值
              setZIndexMax(markersObjs, watchUser);
              console.log('map.watchPosition.complete', distance, p);
            }
          }
        },
        error => {
          console.error('map.watchPosition.error', error.message);
        },
        {
          enableHighAccuracy: false,
          timeout: 1000 * 10,
          maximumAge: 1000 * 60,
        }
      )
    );
  }, [geometryLibrary, setPosition, position, markersObjs, currentUser, watchUser, map]);

  // 監聽地圖縮放事件
  useEffect(() => {
    if (map && markersObjs) {
      google.maps.event.addListener(map, 'zoom_changed', () => {
        console.log('map.zoom_changed.complete');
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
