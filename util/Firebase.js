import * as firebase from 'firebase';
import '@firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD--h69RKzvckyXH509r85iIerHnlbasas',
  authDomain: 'arctic-pagoda-231405.firebaseapp.com',
  databaseURL: 'https://arctic-pagoda-231405.firebaseio.com',
  projectId: 'arctic-pagoda-231405',
  storageBucket: 'arctic-pagoda-231405.appspot.com',
  messagingSenderId: '748927560864',
  appId: '1:748927560864:web:998911366765011e66edc5',
  measurementId: 'G-V63PM61T3E',
};

export const firebaseApp = firebase.initializeApp(firebaseConfig);
