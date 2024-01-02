'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { auth } from '@/config/firebase.config';
import { IUser, IPosition, IGoogleUser, subscribeToUsers, updateUserPosition } from '@/services/firebase';
import CustomMap, { MapRef } from '@/components/map';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Home() {
  const mapRef = useRef<MapRef>(null);

  const router = useRouter();

  const [loadingMyLocation, setLoadingMyLocation] = useState(false);

  const [position, setPosition] = useLocalStorage<IPosition | null>('position', null);

  const [googleUser, setGoogleUser] = useLocalStorage<IGoogleUser | null>('user', null);

  const [users, setUsers] = useState<IUser[]>([]);

  const [currentUser, setCurrentUser] = useState<IUser>();

  const [isMinimized, setIsMinimized] = useState(false);

  const [watchUser, setWatchUser] = useState<IUser>();

  const onMapToUser = (user: IUser) => {
    if (mapRef.current) {
      const { lat, lng } = user;
      // 由於下方用戶列表會擋住畫面，因此做 lat 的微調
      mapRef.current.map.panTo({ lat: lat - 0.00005, lng });
      mapRef.current.setZIndexMax(mapRef.current.markersObjs, user);
      // 監控選擇的用戶
      setWatchUser(user);
    }
  };

  const onUpdateMyLocation = () => {
    setLoadingMyLocation(true);

    // 從瀏覽器定位取得位置
    navigator.geolocation.getCurrentPosition(
      success => {
        if (mapRef.current && currentUser) {
          const p = {
            lat: success.coords.latitude,
            lng: success.coords.longitude,
          };
          setPosition(p);
          setWatchUser(currentUser);

          updateUserPosition(currentUser, p);

          mapRef.current.map.setCenter({ lat: p.lat - 0.00005, lng: p.lng });
          mapRef.current.setZIndexMax(mapRef.current.markersObjs, currentUser);
        }
        setLoadingMyLocation(false);
      },
      error => {
        setLoadingMyLocation(false);
        console.error(error);
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

      if (mapRef.current && mapRef.current.watchId) {
        navigator.geolocation.clearWatch(mapRef.current.watchId);
        mapRef.current.setWatchId(null);
      }

      router.push('/login');
    } catch (error: any) {
      console.error('home.signOut.error', error.message);
      alert(error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToUsers(newUsers => {
      console.log('home.subscribeToUsers.complete', newUsers);
      setUsers(newUsers);

      // 如果 currentUser 沒數據，則設置為 auth.currentUser
      if (!currentUser) {
        const cuser = newUsers.find(u => u.uid === auth.currentUser?.uid);
        setCurrentUser(cuser);
        setWatchUser(cuser);
      }
    });
    return () => unsubscribe();
  }, [setUsers, watchUser, currentUser]);

  // 如果 googleUser 沒數據則跳轉到登入頁
  useEffect(() => {
    if (!googleUser) {
      router.push('/login');
    }
  }, [googleUser, router]);

  const renderMapControls = () => {
    return (
      <div className="fixed right-2 top-28 space-y-2">
        <div className="flex justify-center items-center w-[40px] h-[40px] rounded-sm bg-white cursor-pointer">
          <span
            className={`material-symbols-rounded ${loadingMyLocation ? 'animate-spin' : ''}`}
            onClick={!loadingMyLocation ? onUpdateMyLocation : undefined}
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
    );
  };

  const renderUser = (user: IUser) => {
    return (
      <li
        key={user.uid}
        className="flex items-center space-x-4 px-2 py-1 cursor-pointer transition-all active:bg-gray-300"
        onClick={() => onMapToUser(user)}
      >
        {user.photoURL && (
          <Image src={user.photoURL} alt={user.photoURL} width={40} height={40} className="rounded-full" />
        )}
        <div>
          <div className="text-md font-medium">{user.displayName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="text-xs text-gray-400">{user.updateAt}</div>
        </div>
      </li>
    );
  };

  const renderUserList = () => {
    // 將 currentUser 設置為第一筆，並且依照相鄰距離排序
    const usersSorted = currentUser
      ? [
          currentUser,
          ...users
            // 排除 currentUser
            .filter(user => user.uid !== currentUser.uid)
            // 依照 currentUser 的 lat,lng 相鄰距離排序
            .sort((a, b) => {
              // 根據用戶對於 currentUser 的距離排序
              const distanceA = Math.sqrt(Math.pow(a.lat - currentUser.lat, 2) + Math.pow(a.lng - currentUser.lng, 2));
              const distanceB = Math.sqrt(Math.pow(b.lat - currentUser.lat, 2) + Math.pow(b.lng - currentUser.lng, 2));
              return distanceA - distanceB;
            }),
        ]
      : users;

    return (
      <div
        className={`fixed bottom-0 w-full bg-white p-4 transition-all duration-500 ease-in-out rounded-t-xl ${
          isMinimized ? 'bottom-[-240px]' : 'bottom-0'
        }`}
        style={{ height: '300px' }}
      >
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
          <h3 className="text-2xl font-bold">小圈圈列表</h3>
          <span className={`material-symbols-rounded text-2xl transform ${isMinimized && 'rotate-180'} `}>
            expand_more
          </span>
        </div>

        <ul className="mt-5" style={{ height: '220px', overflow: 'auto' }}>
          {usersSorted.map(user => renderUser(user))}
        </ul>
      </div>
    );
  };

  if (!currentUser || !watchUser) return;

  return (
    <div>
      <CustomMap ref={mapRef} users={users} currentUser={currentUser} watchUser={watchUser} />
      {renderMapControls()}
      {renderUserList()}
    </div>
  );
}
