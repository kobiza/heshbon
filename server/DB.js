// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
var firebase = require("firebase");

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");

// TODO: Replace the following with your app's Firebase project configuration
var firebaseConfig = {
    apiKey: "AIzaSyA4emxQpGmx794Joaf3GrSTTSR-7gqUk10",
    authDomain: "abcd-aa6b5.firebaseapp.com",
    databaseURL: "https://abcd-aa6b5.firebaseio.com",
    projectId: "abcd-aa6b5",
    storageBucket: "abcd-aa6b5.appspot.com",
    messagingSenderId: "316375328458",
    appId: "1:316375328458:web:2baeed2074016b6323f633",
    measurementId: "G-J861XLY0ZV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.database().ref('/projects/').set({project1: {name: 'project 1'}})
    // .then(resolve)
    // .catch(reject);
