'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

import { updatePosition, updateUser } from '@/services/user';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { auth, uiConfig } from '@/config/firebase.config';

export default function Login() {
  const [loaded, setLoaded] = useState(false);

  const [position, setPosition] = useLocalStorage<GeolocationPosition | null>('position', null);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('user', null);

  const router = useRouter();

  const isReadyLogin = useMemo(() => {
    return loaded && !currentUser;
  }, [loaded, currentUser]);

  // 更新使用者位置
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(_position => {
      if (position !== _position) {
        setPosition(_position);
      }
    });
  }, [setPosition, position]);

  // 登入後跳轉
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setLoaded(true);

      if (user && user.uid) {
        setCurrentUser(auth.currentUser);
        updateUser(user);

        if (position && user.uid) {
          updatePosition(user, position);
        }

        console.log('登入完畢後跳轉', user);
        router.push('/home');
      } else {
        setCurrentUser(null);

        if (!firebaseui.auth.AuthUI.getInstance()) {
          const ui = new firebaseui.auth.AuthUI(auth);
          ui.start('#firebaseui-auth-container', uiConfig());
        }
      }
    });

    return () => unsubscribe();
  }, [position, router, setCurrentUser]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-24">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">{isReadyLogin ? 'See You 登入' : '資料載入中...'}</h1>
        <div id="firebaseui-auth-container" className={loaded ? '' : 'hidden'}></div>
      </div>
    </main>
  );
}
