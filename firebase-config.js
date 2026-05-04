// Firebase Configuration
// 구글 파이어베이스 콘솔(https://console.firebase.google.com/)에서 프로젝트 생성 후 
// 앱을 추가하면 아래 설정값을 받을 수 있습니다.

const firebaseConfig = {
    apiKey: "AIzaSyA9ruVZcxPrD0PIEdgJ2O4CO18nK6OhsiE",
    authDomain: "dongyang-b37a6.firebaseapp.com",
    projectId: "dongyang-b37a6",
    storageBucket: "dongyang-b37a6.firebasestorage.app",
    messagingSenderId: "960514301901",
    appId: "1:960514301901:web:2c875aed1e033fe9206e84"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log("Firebase initialized");
