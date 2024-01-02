'use client';

import { User } from 'firebase/auth';
import { ref, update, set, get, remove, onValue, off } from 'firebase/database';
import { format } from 'date-fns';

import { database } from '@/config/firebase.config';

/**
 * Google 使用者資料
 */
export type IGoogleUser = Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL'>;

/**
 * 使用者位置
 */
export interface IPosition {
  lat: number;
  lng: number;
}

/**
 * 使用者資料
 */
export interface IUser extends IGoogleUser, IPosition {
  updateAt: string;
}

/**
 * 設定使用者資料
 * @param user
 * @param position
 */
export const setUser = async (user: User, position: IPosition) => {
  const payload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lat: position.lat,
    lng: position.lng,
    updateAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };
  console.log('firebase.setUser', payload);
  await set(ref(database, 'users/' + user.uid), payload);
};

/**
 * 更新使用者資料
 * @param user
 */
export const updateUser = async (user: User, position?: IPosition) => {
  const payload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    ...position,
    updateAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };
  console.log('firebase.updateUser', payload);
  await update(ref(database, 'users/' + user.uid), payload);
};

/**
 * 更新使用者位置
 * @param user
 * @param position
 */
export const updateUserPosition = async (user: User | IUser, position: IPosition) => {
  const payload = {
    ...position,
    updateAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };
  console.log('firebase.updateUserPosition', payload);
  await update(ref(database, 'users/' + user.uid), payload);
};

/**
 * 取得使用者資料
 * @param uid
 * @returns
 */
export const getUser = async (uid: string): Promise<IUser | null> => {
  const snapshot = await get(ref(database, 'users/' + uid));
  if (snapshot.exists()) {
    const data = snapshot.val() ?? {};
    console.log('firebase.getUser', data);
    return data;
  } else {
    return null;
  }
};

/**
 * 取得所有使用者資料
 * @returns
 */
export const getUsers = async (): Promise<IUser[]> => {
  const snapshot = await get(ref(database, 'users'));
  if (snapshot.exists()) {
    const data = snapshot.val() ?? {};
    console.log('firebase.getUsers', data);
    return Object.values(data);
  } else {
    return [];
  }
};

/**
 * 移除使用者資料
 * @param uid
 */
export const removeUser = async (uid: string) => {
  console.log('firebase.removeUser', uid);
  await remove(ref(database, 'users/' + uid));
};

/**
 * 訂閱使用者資料
 * @param callback 資料變更時的回調
 */
export const subscribeToUsers = (callback: (users: IUser[]) => void): (() => void) => {
  const usersRef = ref(database, 'users');

  const unsubscribe = onValue(usersRef, snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val() ?? {};
      console.log('firebase.subscribeToUsers', data);
      callback(Object.values(data));
    } else {
      callback([]);
    }
  });

  // 取消訂閱
  return () => off(usersRef, 'value', unsubscribe);
};
