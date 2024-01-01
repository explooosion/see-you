import firebase from 'firebase/compat/app';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

import { updateUser } from '@/services/user';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const database = getDatabase(app);

export const uiConfig = () => {
  return {
    signInFlow: 'popup', // 'redirect', // 'popup'
    signInSuccessUrl: '/home',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        customParameters: {
          prompt: 'select_account',
        },
      },
      //   firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      //   firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      //   firebase.auth.GithubAuthProvider.PROVIDER_ID,
      //   firebase.auth.EmailAuthProvider.PROVIDER_ID,
      //   firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    ],
    // Terms of service url/callback.
    // tosUrl: '/',
    // Privacy policy url/callback.
    // privacyPolicyUrl: function () {
    //   location.assign('<your-privacy-policy-url>');
    // },
    callbacks: {
      // signInSuccessWithAuthResult: function (authResult: any, redirectUrl: any) {
      //   console.log('signInSuccessWithAuthResult');
      //   redirectUrl.push('/home'); // Redirect to /home on successful sign in
      //   return false; // Prevent automatic redirect by FirebaseUI
      // },
      // uiShown: function () {
      //   // The widget is rendered.
      //   // Hide the loader.
      //   document.getElementById('loader')!.style.display = 'none';
      // },
      // signInFailure: function (error) {
      //   // For merge conflicts, the error.code will be
      //   // 'firebaseui/anonymous-upgrade-merge-conflict'.
      //   if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
      //     return Promise.resolve();
      //   }
      //   // The credential the user tried to sign in with.
      //   const cred = error.credential;
      //   // Copy data from anonymous user to permanent user and delete anonymous
      //   // user.
      //   // ...
      //   // Finish sign-in after data is copied.
      //   firebase.auth().signInWithCredential(cred);
      // },
    },
  };
};

auth.onAuthStateChanged(user => {
  if (user && user.uid) {
    console.log('firebase.config.tsx_onAuthStateChanged', user);
    updateUser(user);
  }
});
