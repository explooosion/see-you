'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { IGoogleUser, IPosition, updateUserPosition, updateUser } from '@/services/firebase';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Login() {
  const [loaded, setLoaded] = useState(false);
  const [position, setPosition] = useLocalStorage<IPosition | null>('position', null);
  const [googleUser, setGoogleUser] = useLocalStorage<IGoogleUser | null>('user', null);

  const [loadingMyLocation, setLoadingMyLocation] = useState(false);
  const [error, setError] = useState<string>('');

  const router = useRouter();
  const auth = getAuth();

  const onGetCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      throw new Error(`Browser doesn't support Geolocation`);
    }

    setLoadingMyLocation(true);

    navigator.geolocation.getCurrentPosition(
      success => {
        const p = {
          lat: success.coords.latitude,
          lng: success.coords.longitude,
        };
        setPosition(p);
        setLoadingMyLocation(false);
      },
      error => {
        console.error('login.getCurrentPosition.error', error);
        setError(error.message);
        setLoadingMyLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 1000 * 10,
        // maximumAge: 1000 * 10,
      }
    );
  }, [setPosition]);

  // 更新用户位置
  useEffect(() => {
    onGetCurrentPosition();
  }, [onGetCurrentPosition, setPosition]);

  useEffect(() => {
    if (!loaded) {
      const unsubscribe = auth.onAuthStateChanged(user => {
        if (user && user?.uid) {
          const payload = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          };
          setGoogleUser(payload);
          setLoaded(true);
          updateUser(Object.assign(user, position));
          router.push('/home');
        } else {
          setLoaded(true);
        }
      });

      return () => unsubscribe();
    }
  }, [position, router, setGoogleUser, auth, loaded]);

  const onGoogleLogin = () => {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account',
    });

    signInWithPopup(auth, provider)
      .then(result => {
        // Google 登录成功，用户信息在 result.user 中
        const user = result.user;
        setGoogleUser(user);
        updateUser(user);
        if (position && user.uid) {
          updateUserPosition(user, position);
        }
        router.push('/home');
      })
      .catch(error => {
        console.error('login.signInWithPopup.error', error);
        alert('登入失敗' + error.message);
      });
  };

  const renderLoginButton = () => {
    return (
      <button
        className="bg-white text-gray-700 font-bold py-2 px-4 rounded border border-gray-300 shadow-sm hover:bg-gray-50 flex items-center"
        onClick={onGoogleLogin}
      >
        <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.6 20H24v8h11.8C34.7 37.9 29.8 42 24 42c-8.8 0-16-7.2-16-16s7.2-16 16-16c3.9 0 7.4 1.4 10.1 3.7l6-6C35.9 4.6 30.7 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c13.3 0 22-10.8 22-22 0-1.3-.2-2.7-.4-4z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.1l6.9 5.1C14.9 16.4 19 14 24 14c3.9 0 7.4 1.4 10.1 3.7l6-6C35.9 4.6 30.7 2 24 2 16.1 2 9.2 6.5 6.3 14.1z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c4.5 0 8.5-1.5 11.7-4l-5.4-4.4C28.9 37.4 26.7 38 24 38c-5.8 0-10.7-4.1-12.2-9.6l-6.9 5.1C8.2 39.7 15.2 44 24 44
          z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20H24v8h11.8c-.8 4.3-3.6 7.9-7.6 10l5.4 4.4c4.6-4 7.4-9.8 7.4-16
          0-1.3-.2-2.7-.4-4z"
          />
        </svg>
        使用 Google 登录
      </button>
    );
  };

  const renderCheckPositionButton = () => {
    return (
      <>
        {loadingMyLocation ? <p className="mb-1">正在取得位置...</p> : <p className="mb-1 text-red-500">{error}</p>}
        <button
          className="bg-white text-gray-700 font-bold py-2 px-4 rounded border border-gray-300 shadow-sm hover:bg-gray-50 flex items-center"
          disabled={loadingMyLocation}
          onClick={onGetCurrentPosition}
        >
          <svg
            className="w-6 h-6 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z"></path>
            <circle cx="12" cy="9" r="3"></circle>
          </svg>
          取得座標
        </button>
      </>
    );
  };

  if (!loaded && !auth.currentUser) return;

  return (
    loaded &&
    !auth.currentUser && (
      <main className="flex min-h-screen flex-col items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4">See You</h1>
          {position && (
            <p className="text-gray-500 text-sm mb-4">
              {position.lat}, {position.lng}
            </p>
          )}

          {position ? renderLoginButton() : renderCheckPositionButton()}
        </div>
      </main>
    )
  );
}
