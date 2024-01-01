'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { auth } from '@/config/firebase.config';
import { IUser, subscribeToUsers, updatePosition } from '@/services/user';
import CustomMap, { MapRef } from '@/components/map';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { th } from 'date-fns/locale';

export default function Home() {
  const mapRef = useRef<MapRef>(null);

  const router = useRouter();

  const [loadingMyLocation, setLoadingMyLocation] = useState(false);

  const [position, setPosition] = useLocalStorage<GeolocationPosition | null>('position', null);

  const [users, setUsers] = useState<IUser[]>([]);

  const [isMinimized, setIsMinimized] = useState(false);

  const [watchId, setWatchId] = useState<number | null>(null);

  const onClickMarker = (user: IUser) => {
    const { lat, lng } = user;
    mapRef.current?.map.panTo({ lat, lng });
    mapRef.current?.setZIndexMax(mapRef.current?.markersObjs || [], user);
  };

  const onClickMyLocation = () => {
    if (!navigator.geolocation) {
      throw new Error(`Browser doesn't support Geolocation`);
    }
    if (!mapRef.current) {
      throw new Error('mapRef is undefined');
    }

    setLoadingMyLocation(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        if (auth.currentUser && auth.currentUser.uid) {
          setPosition(position);
          updatePosition(auth.currentUser!, position);
          mapRef.current?.map.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
        setLoadingMyLocation(false);
      },
      () => {
        setLoadingMyLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 1000 * 10,
        // maximumAge: 1000 * 10,
      }
    );
  };

  const onClickLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();

      if (watchId) {
        setWatchId(null);
        navigator.geolocation.clearWatch(watchId);
      }

      router.push('/login');
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToUsers(newUsers => {
      setUsers(newUsers);
    });

    return () => unsubscribe();
  }, [setUsers]);

  useEffect(() => {
    setWatchId(
      navigator.geolocation.watchPosition(
        position => {
          if (auth.currentUser && auth.currentUser.uid) {
            setPosition(position);
            updatePosition(auth.currentUser!, position);
          }
        },
        console.error,
        {
          enableHighAccuracy: false,
          timeout: 1000 * 10,
          maximumAge: 1000 * 60,
        }
      )
    );
  }, [setPosition]);

  useEffect(() => {
    if (!auth.currentUser) {
      router.push('/login');
    }
  }, [router]);

  return (
    auth.currentUser && (
      <div>
        <CustomMap ref={mapRef} users={users} />

        <div className="fixed right-2 top-28 space-y-2">
          <div className="flex justify-center items-center w-[40px] h-[40px] rounded-sm bg-white cursor-pointer">
            <span
              className={`material-symbols-rounded ${loadingMyLocation ? 'animate-spin' : ''}`}
              onClick={!loadingMyLocation ? onClickMyLocation : undefined}
            >
              {loadingMyLocation ? 'progress_activity' : 'my_location'}
            </span>
          </div>
          <div className="flex justify-center items-center w-[40px] h-[40px] rounded-sm bg-white cursor-pointer">
            <span className="material-symbols-rounded" onClick={onClickLogout}>
              logout
            </span>
          </div>
        </div>

        <div
          className={`fixed bottom-0 w-full bg-white p-4 transition-all duration-500 ease-in-out rounded-t-xl ${
            isMinimized ? 'bottom-[-240px]' : 'bottom-0'
          }`}
          style={{ height: '300px' }}
        >
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <h3 className="text-2xl font-bold">朋友列表</h3>
            <span className={`material-symbols-rounded text-2xl transform ${isMinimized && 'rotate-180'} `}>
              expand_more
            </span>
          </div>

          <ul className="mt-5" style={{ height: '220px', overflow: 'auto' }}>
            {users.map(user => (
              <li
                key={user.uid}
                className="flex items-center space-x-4 px-2 py-1 cursor-pointer transition-all active:bg-gray-300"
                onClick={() => onClickMarker(user)}
              >
                <Image src={user.photoURL} alt={user.displayName} width={40} height={40} className="rounded-full" />
                <div>
                  <div className="text-md font-medium">{user.displayName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400">{user.updateAt}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  );
}
