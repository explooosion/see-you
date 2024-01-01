'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, User } from 'firebase/auth';

import { updatePosition, updateUser } from '@/services/user';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Login() {
  const [loaded, setLoaded] = useState(false);
  const [position, setPosition] = useLocalStorage<GeolocationPosition | null>('position', null);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('user', null);

  const router = useRouter();
  const auth = getAuth();

  // 更新用户位置
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(_position => {
      if (position !== _position) {
        setPosition(_position);
      }
    });
  }, [setPosition, position]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setLoaded(true);
      if (user) {
        setCurrentUser(user);
        updateUser(user);
        if (position && user.uid) {
          updatePosition(user, position);
        }
        router.push('/home');
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [position, router, setCurrentUser, auth]);

  // 在您的组件或应用入口点中
  useEffect(() => {
    getRedirectResult(auth)
      .then(result => {
        const user = result?.user;
        if (user) {
          setCurrentUser(user);
          updateUser(user);
          if (position && user.uid) {
            updatePosition(user, position);
          }
          router.push('/home');
        } else {
          setCurrentUser(null);
        }
      })
      .catch(error => {
        console.error('登入失敗', error);
      });
  }, [auth, router, setCurrentUser, position]);

  const onGoogleLogin = () => {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account',
    });

    signInWithRedirect(auth, provider).catch(error => {
      console.error('登入失敗', error);
    });
  };

  return (
    loaded && (
      <main className="flex min-h-screen flex-col items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4">See You 登入</h1>
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
                d="M24 44c4.5 0 8.5-1.5 11.7-4l-5.4-4.4C28.9 37.4 26.7 38 24 38c-5.8 0-10.7-4.1-12.2-9.6l-6.9 5.1C8.2 39.7 15.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20H24v8h11.8c-.8 4.3-3.6 7.9-7.6 10l5.4 4.4c4.6-4 7.4-9.8 7.4-16 0-1.3-.2-2.7-.4-4z"
              />
            </svg>
            使用 Google 登录
          </button>
        </div>
      </main>
    )
  );
}
