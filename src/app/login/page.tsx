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

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(position => {
      console.log('getCurrentPosition', position);
      setPosition(position);
    });
  }, [setPosition]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setLoaded(true);

      if (user && user.uid) {
        setCurrentUser(auth.currentUser);
        updateUser(user);

        if (position && user.uid) {
          updatePosition(user, position);
        }

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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">{isReadyLogin && '登入'}</h1>
        <div id="firebaseui-auth-container" className={loaded ? '' : 'hidden'}></div>
      </div>
    </main>
  );
}
