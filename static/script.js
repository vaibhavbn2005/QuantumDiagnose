// ======================================================
// QUANTUMDIAGNOSE - FIREBASE AUTHENTICATION
// ======================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {
    apiKey: "AIzaSyAPrulUfMubKieGuU5QxQVwSu8sDtKvTZE",
    authDomain: "quantumdiagnose.firebaseapp.com",
    projectId: "quantumdiagnose",
    storageBucket: "quantumdiagnose.firebasestorage.app",
    messagingSenderId: "727641186346",
    appId: "1:727641186346:web:958942c8d9f6906a69e353",
    measurementId: "G-YM0HMMVBFR"
};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);


// ======================================================
// GET HTML ELEMENTS
// ======================================================

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const signupButton = document.getElementById("signupButton");

const logoutButton = document.getElementById("logoutButton");

const message = document.getElementById("message");

const userEmail = document.getElementById("userEmail");

const analyzeButton = document.getElementById("analyzeButton");
const symptomsInput = document.getElementById("symptoms");
const analysisResult = document.getElementById("analysisResult");


// ======================================================
// LOGIN / SIGNUP MODE
// ======================================================

let currentMode = "login";


// ======================================================
// SHOW LOGIN FORM
// ======================================================

function showLogin() {

    currentMode = "login";

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginButton.classList.remove("hidden");
    signupButton.classList.add("hidden");

    loginButton.textContent = "Login";

    message.textContent = "";
}


// ======================================================
// SHOW SIGNUP FORM
// ======================================================

function showSignup() {

    currentMode = "signup";

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupButton.classList.remove("hidden");
    loginButton.classList.add("hidden");

    signupButton.textContent = "Create Account";

    message.textContent = "";
}


// ======================================================
// LOGIN TAB
// ======================================================

loginTab.addEventListener("click", function () {

    showLogin();

});


// ======================================================
// SIGNUP TAB
// ======================================================

signupTab.addEventListener("click", function () {

    showSignup();

});


// ======================================================
// LOGIN
// ======================================================

loginButton.addEventListener("click", async function () {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {

        showMessage(
            "Please enter email and password.",
            "error"
        );

        return;
    }

    try {

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        showMessage(
            "Login successful!",
            "success"
        );

        // onAuthStateChanged will open dashboard

    } catch (error) {

        console.error(error);

        showMessage(
            getFirebaseError(error),
            "error"
        );

        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }

});


// ======================================================
// SIGN UP
// ======================================================

signupButton.addEventListener("click", async function () {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {

        showMessage(
            "Please enter email and password.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showMessage(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    try {

        signupButton.disabled = true;
        signupButton.textContent = "Creating Account...";

        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        showMessage(
            "Account created successfully!",
            "success"
        );

        // onAuthStateChanged will automatically
        // open the dashboard

    } catch (error) {

        console.error(error);

        showMessage(
            getFirebaseError(error),
            "error"
        );

        signupButton.disabled = false;
        signupButton.textContent = "Create Account";
    }

});


// ======================================================
// LOGOUT
// ======================================================

logoutButton.addEventListener("click", async function () {

    try {

        await signOut(auth);

        showMessage(
            "Logged out successfully.",
            "success"
        );

        showLogin();

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to logout.",
            "error"
        );

    }

});


// ======================================================
// FIREBASE AUTH STATE
// ======================================================

onAuthStateChanged(auth, function (user) {

    if (user) {

        console.log("User logged in:", user.email);

        // Hide authentication screen
        authSection.classList.add("hidden");

        // Show dashboard
        dashboardSection.classList.remove("hidden");

        // Display email
        userEmail.textContent = user.email;

    } else {

        console.log("No user logged in.");

        // Show authentication screen
        authSection.classList.remove("hidden");

        // Hide dashboard
        dashboardSection.classList.add("hidden");

    }

});


// ======================================================
// MESSAGE FUNCTION
// ======================================================

function showMessage(text, type) {

    message.textContent = text;

    message.className = "";

    if (type === "success") {

        message.classList.add("success-message");

    } else {

        message.classList.add("error-message");

    }

}


// ======================================================
// FIREBASE ERROR MESSAGES
// ======================================================

function getFirebaseError(error) {

    switch (error.code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/user-not-found":
            return "No account exists with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/email-already-in-use":
            return "An account already exists with this email.";

        case "auth/weak-password":
            return "Password must contain at least 6 characters.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            return error.message || "Authentication failed.";
    }

}


// ======================================================
// SYMPTOM ANALYSIS BUTTON
// ======================================================

analyzeButton.addEventListener("click", async function () {

    const symptoms = symptomsInput.value.trim();

    if (!symptoms) {

        analysisResult.classList.remove("hidden");

        analysisResult.textContent =
            "Please enter your symptoms first.";

        return;
    }


    analysisResult.classList.remove("hidden");

    analysisResult.innerHTML = `
        <h3>Analysis Started</h3>

        <p>
            Your symptoms have been received.
        </p>

        <p>
            <strong>Symptoms:</strong>
            ${escapeHTML(symptoms)}
        </p>

        <p class="disclaimer">
            This platform is for informational purposes only
            and does not replace professional medical advice.
        </p>
    `;

});


// ======================================================
// SECURITY: ESCAPE HTML
// ======================================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}
