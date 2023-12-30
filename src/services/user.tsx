'use client';

import { User } from 'firebase/auth';
import { ref, update, set, get, remove } from 'firebase/database';

import { database } from '@/config/firebase.config';

export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  lat: number;
  lng: number;
}

export const setUser = async (user: User, position: GeolocationPosition) => {
  const payload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
  console.log('setUser', payload);
  await set(ref(database, 'users/' + user.uid), payload);
};

export const updateUser = async (user: User) => {
  const payload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
  console.log('updateUser', payload);
  await update(ref(database, 'users/' + user.uid), payload);
};

export const updatePosition = async (user: User, position: GeolocationPosition) => {
  const payload = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
  console.log('updatePosition', payload);
  await update(ref(database, 'users/' + user.uid), payload);
};

export const getUser = async (uid: string): Promise<IUser | null> => {
  const snapshot = await get(ref(database, 'users/' + uid));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};

export const getUsers = async (): Promise<IUser[]> => {
  const snapshot = await get(ref(database, 'users'));
  if (snapshot.exists()) {
    const data = snapshot.val() ?? {};
    return Object.values(data);
  } else {
    return [];
  }
};

export const removeUser = async (uid: string) => {
  await remove(ref(database, 'users/' + uid));
};
