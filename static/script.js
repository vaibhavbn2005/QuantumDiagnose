// ======================================================
// QUANTUMDIAGNOSE - FIREBASE AUTHENTICATION
// ======================================================


// ======================================================
// FIREBASE IMPORTS
// ======================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ======================================================
// FIREBASE CONFIGURATION
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


// ======================================================
// INITIALIZE FIREBASE AUTHENTICATION
// ======================================================

const auth = getAuth(app);


// ======================================================
// GET HTML ELEMENTS
// ======================================================

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const loginTab = document.getElementById("loginTab");

const signupTab = document.getElementById("signupTab");

const actionButton = document.getElementById("actionButton");

const message = document.getElementById("message");


// ======================================================
// CURRENT MODE
// ======================================================

let mode = "login";


// ======================================================
// SHOW MESSAGE
// ======================================================

function showMessage(text, success = false) {

    message.textContent = text;

    if (success) {

        message.classList.add("success");

    } else {

        message.classList.remove("success");

    }
}


// ======================================================
// CLEAR MESSAGE
// ======================================================

function clearMessage() {

    message.textContent = "";

    message.classList.remove("success");
}


// ======================================================
// LOGIN TAB
// ======================================================

loginTab.addEventListener("click", () => {

    mode = "login";

    loginTab.classList.add("active");

    signupTab.classList.remove("active");

    actionButton.textContent = "Login";

    passwordInput.autocomplete = "current-password";

    clearMessage();

});


// ======================================================
// SIGNUP TAB
// ======================================================

signupTab.addEventListener("click", () => {

    mode = "signup";

    signupTab.classList.add("active");

    loginTab.classList.remove("active");

    actionButton.textContent = "Create Account";

    passwordInput.autocomplete = "new-password";

    clearMessage();

});


// ======================================================
// MAIN BUTTON
// ======================================================

actionButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();

    const password = passwordInput.value;


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (email === "") {

        showMessage("Please enter your email.");

        return;
    }


    if (password === "") {

        showMessage("Please enter your password.");

        return;
    }


    if (password.length < 6) {

        showMessage(
            "Password must contain at least 6 characters."
        );

        return;
    }


    // Disable button during request

    actionButton.disabled = true;


    // ==================================================
    // LOGIN
    // ==================================================

    if (mode === "login") {

        try {

            showMessage("Logging in...", false);

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user = userCredential.user;


            console.log(
                "Login successful:",
                user.email
            );


            showMessage(
                "Login successful!",
                true
            );


            // --------------------------------------------------
            // GO TO DASHBOARD
            // --------------------------------------------------

            setTimeout(() => {

                window.location.href = "dashboard.html";

            }, 1000);


        } catch (error) {

            console.error(
                "Firebase Login Error:",
                error
            );


            // --------------------------------------------------
            // FIREBASE ERROR HANDLING
            // --------------------------------------------------

            if (
                error.code ===
                "auth/invalid-api-key"
            ) {

                showMessage(
                    "Firebase API key is invalid. Please check your Firebase configuration."
                );

            }

            else if (
                error.code ===
                "auth/invalid-credential"
            ) {

                showMessage(
                    "Invalid email or password."
                );

            }

            else if (
                error.code ===
                "auth/user-not-found"
            ) {

                showMessage(
                    "No account exists with this email."
                );

            }

            else if (
                error.code ===
                "auth/wrong-password"
            ) {

                showMessage(
                    "Incorrect password."
                );

            }

            else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                showMessage(
                    "Too many attempts. Please try again later."
                );

            }

            else if (
                error.code ===
                "auth/network-request-failed"
            ) {

                showMessage(
                    "Network error. Please check your internet connection."
                );

            }

            else {

                showMessage(
                    "Login failed: " + error.message
                );

            }

        }

    }


    // ==================================================
    // SIGN UP
    // ==================================================

    else {

        try {

            showMessage(
                "Creating your account...",
                false
            );


            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user = userCredential.user;


            console.log(
                "Account created:",
                user.email
            );


            showMessage(
                "Account created successfully!",
                true
            );


            // --------------------------------------------------
            // GO TO DASHBOARD
            // --------------------------------------------------

            setTimeout(() => {

                window.location.href = "dashboard.html";

            }, 1000);


        } catch (error) {

            console.error(
                "Firebase Signup Error:",
                error
            );


            // --------------------------------------------------
            // FIREBASE SIGNUP ERRORS
            // --------------------------------------------------

            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                showMessage(
                    "This email is already registered. Please login."
                );

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                showMessage(
                    "Please enter a valid email address."
                );

            }

            else if (
                error.code ===
                "auth/weak-password"
            ) {

                showMessage(
                    "Password is too weak. Use at least 6 characters."
                );

            }

            else if (
                error.code ===
                "auth/invalid-api-key"
            ) {

                showMessage(
                    "Firebase API key is invalid. Please check your Firebase configuration."
                );

            }

            else if (
                error.code ===
                "auth/network-request-failed"
            ) {

                showMessage(
                    "Network error. Please check your internet connection."
                );

            }

            else {

                showMessage(
                    "Signup failed: " + error.message
                );

            }

        }

    }


    // Re-enable button

    actionButton.disabled = false;

});


// ======================================================
// CHECK AUTHENTICATION STATE
// ======================================================

onAuthStateChanged(auth, (user) => {

    if (user) {

        console.log(
            "Currently logged in:",
            user.email
        );

    } else {

        console.log(
            "No user currently logged in."
        );

    }

});


// ======================================================
// LOGOUT FUNCTION
// ======================================================

window.logoutUser = async function () {

    try {

        await signOut(auth);

        console.log("User logged out.");

        window.location.href = "index.html";

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

    }

};


// ======================================================
// DEBUG INFORMATION
// ======================================================

console.log(
    "QuantumDiagnose Firebase initialized."
);

console.log(
    "Firebase Project:",
    firebaseConfig.projectId
);
