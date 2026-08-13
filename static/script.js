// ============================================================
// QuantumDiagnose - Complete script.js
// ============================================================

// ============================================================
// FIREBASE IMPORTS
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAPrulUfMubKieGuU5QxQVwSu8sDtKvTZE",
    authDomain: "quantumdiagnose.firebaseapp.com",
    projectId: "quantumdiagnose",
    storageBucket: "quantumdiagnose.firebasestorage.app",
    messagingSenderId: "727641186346",
    appId: "1:727641186346:web:c8eed6274fd1582169e353",
    measurementId: "G-DSDM1YM4WB"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


// ============================================================
// MAKE FIREBASE AVAILABLE FOR DEBUGGING
// ============================================================

window.firebaseAuth = auth;
window.firebaseDB = db;


// ============================================================
// GET HTML ELEMENTS
// ============================================================

// Authentication buttons
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Authentication modal
const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");
const authTitle = document.getElementById("authTitle");

// Authentication tabs
const emailTab = document.getElementById("emailTab");
const phoneTab = document.getElementById("phoneTab");

// Email authentication
const emailAuth = document.getElementById("emailAuth");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");

// Phone authentication
const phoneAuth = document.getElementById("phoneAuth");
const phoneNumber = document.getElementById("phoneNumber");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const otpCode = document.getElementById("otpCode");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const recaptchaContainer =
    document.getElementById("recaptcha-container");

// Authentication message
const authMessage = document.getElementById("authMessage");

// Symptoms
const searchInput = document.getElementById("search");
const symptomGrid = document.getElementById("symptomGrid");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clearBtn");
const predictBtn = document.getElementById("predictBtn");

// Result
const result = document.getElementById("result");
const disease = document.getElementById("disease");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceText = document.getElementById("confidenceText");
const topPredictions = document.getElementById("topPredictions");
const message = document.getElementById("message");


// ============================================================
// AUTHENTICATION STATE
// ============================================================

let authMode = "login";

let authMethod = "email";

let confirmationResult = null;

let recaptchaVerifier = null;


// ============================================================
// HELPER - SHOW MESSAGE
// ============================================================

function showAuthMessage(text, isError = false) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent = text;

    if (isError) {
        authMessage.style.color = "#d32f2f";
    } else {
        authMessage.style.color = "#2e7d32";
    }
}


// ============================================================
// OPEN AUTH MODAL
// ============================================================

function openAuthModal(mode) {

    authMode = mode;

    authMethod = "email";

    authTitle.textContent =
        mode === "login"
            ? "Login"
            : "Create Account";

    authSubmit.textContent =
        mode === "login"
            ? "Login"
            : "Create Account";

    authModal.classList.remove("hidden");

    showEmailAuth();

    clearAuthInputs();

    showAuthMessage("");
}


// ============================================================
// CLOSE AUTH MODAL
// ============================================================

function closeAuthModal() {

    authModal.classList.add("hidden");

    showAuthMessage("");

    clearAuthInputs();

    if (recaptchaVerifier) {

        try {
            recaptchaVerifier.clear();
        } catch (error) {
            console.log("reCAPTCHA clear error:", error);
        }

        recaptchaVerifier = null;
    }

    confirmationResult = null;
}


// ============================================================
// CLEAR AUTH INPUTS
// ============================================================

function clearAuthInputs() {

    if (authEmail) {
        authEmail.value = "";
    }

    if (authPassword) {
        authPassword.value = "";
    }

    if (phoneNumber) {
        phoneNumber.value = "";
    }

    if (otpCode) {
        otpCode.value = "";
    }
}


// ============================================================
// EMAIL TAB
// ============================================================

function showEmailAuth() {

    authMethod = "email";

    emailTab.classList.add("active");

    phoneTab.classList.remove("active");

    emailAuth.classList.remove("hidden");

    phoneAuth.classList.add("hidden");

    showAuthMessage("");
}


// ============================================================
// PHONE TAB
// ============================================================

function showPhoneAuth() {

    authMethod = "phone";

    phoneTab.classList.add("active");

    emailTab.classList.remove("active");

    emailAuth.classList.add("hidden");

    phoneAuth.classList.remove("hidden");

    showAuthMessage("");

    initializeRecaptcha();
}


// ============================================================
// INITIALIZE FIREBASE reCAPTCHA
// ============================================================

function initializeRecaptcha() {

    if (recaptchaVerifier) {
        return;
    }

    try {

        recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
                size: "normal",

                callback: function () {
                    console.log("reCAPTCHA verified");
                },

                "expired-callback": function () {
                    showAuthMessage(
                        "reCAPTCHA expired. Please verify again.",
                        true
                    );
                }
            }
        );

        recaptchaVerifier.render()
            .then(function (widgetId) {

                console.log(
                    "reCAPTCHA rendered:",
                    widgetId
                );

            })
            .catch(function (error) {

                console.error(
                    "reCAPTCHA render error:",
                    error
                );

                showAuthMessage(
                    "Could not load reCAPTCHA. Please refresh the page.",
                    true
                );
            });

    } catch (error) {

        console.error(
            "reCAPTCHA initialization error:",
            error
        );

        showAuthMessage(
            "Could not initialize phone authentication.",
            true
        );
    }
}


// ============================================================
// EMAIL LOGIN / SIGN UP
// ============================================================

async function handleEmailAuthentication() {

    const email = authEmail.value.trim();

    const password = authPassword.value;

    if (!email) {

        showAuthMessage(
            "Please enter your email address.",
            true
        );

        return;
    }

    if (!password) {

        showAuthMessage(
            "Please enter your password.",
            true
        );

        return;
    }

    if (password.length < 6) {

        showAuthMessage(
            "Password must contain at least 6 characters.",
            true
        );

        return;
    }

    authSubmit.disabled = true;

    authSubmit.textContent = "Please wait...";

    showAuthMessage("Processing...");


    try {

        if (authMode === "login") {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            showAuthMessage(
                "Login successful!"
            );

        } else {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            showAuthMessage(
                "Account created successfully!"
            );
        }


        setTimeout(function () {

            closeAuthModal();

        }, 800);


    } catch (error) {

        console.error(
            "Email authentication error:",
            error
        );

        let errorMessage =
            "Authentication failed.";

        switch (error.code) {

            case "auth/invalid-email":

                errorMessage =
                    "Please enter a valid email address.";

                break;

            case "auth/user-not-found":

                errorMessage =
                    "No account found with this email.";

                break;

            case "auth/wrong-password":

                errorMessage =
                    "Incorrect password.";

                break;

            case "auth/invalid-credential":

                errorMessage =
                    "Invalid email or password.";

                break;

            case "auth/email-already-in-use":

                errorMessage =
                    "This email is already registered. Please login.";

                break;

            case "auth/weak-password":

                errorMessage =
                    "Password is too weak.";

                break;

            case "auth/too-many-requests":

                errorMessage =
                    "Too many attempts. Please try again later.";

                break;

            default:

                errorMessage =
                    error.message;
        }

        showAuthMessage(
            errorMessage,
            true
        );

    } finally {

        authSubmit.disabled = false;

        authSubmit.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";
    }
}


// ============================================================
// SEND PHONE OTP
// ============================================================

async function sendPhoneOTP() {

    const phone = phoneNumber.value.trim();

    if (!phone) {

        showAuthMessage(
            "Please enter your phone number.",
            true
        );

        return;
    }

    if (!phone.startsWith("+")) {

        showAuthMessage(
            "Enter the phone number with country code, e.g. +919876543210.",
            true
        );

        return;
    }

    if (!recaptchaVerifier) {

        initializeRecaptcha();

        showAuthMessage(
            "Please complete the reCAPTCHA and click Send OTP again.",
            true
        );

        return;
    }


    sendOtpBtn.disabled = true;

    sendOtpBtn.textContent = "Sending...";

    showAuthMessage(
        "Sending OTP..."
    );


    try {

        confirmationResult =
            await signInWithPhoneNumber(
                auth,
                phone,
                recaptchaVerifier
            );

        showAuthMessage(
            "OTP sent successfully. Check your phone."
        );

        otpCode.focus();


    } catch (error) {

        console.error(
            "Phone OTP error:",
            error
        );

        let errorMessage =
            "Could not send OTP.";

        switch (error.code) {

            case "auth/invalid-phone-number":

                errorMessage =
                    "Invalid phone number. Use format +91XXXXXXXXXX.";

                break;

            case "auth/operation-not-allowed":

                errorMessage =
                    "Phone authentication is not enabled in Firebase.";

                break;

            case "auth/too-many-requests":

                errorMessage =
                    "Too many requests. Please try again later.";

                break;

            case "auth/quota-exceeded":

                errorMessage =
                    "SMS quota exceeded. Please try again later.";

                break;

            case "auth/captcha-check-failed":

                errorMessage =
                    "reCAPTCHA verification failed. Please try again.";

                break;

            default:

                errorMessage =
                    error.message;
        }

        showAuthMessage(
            errorMessage,
            true
        );

    } finally {

        sendOtpBtn.disabled = false;

        sendOtpBtn.textContent = "Send OTP";
    }
}


// ============================================================
// VERIFY PHONE OTP
// ============================================================

async function verifyPhoneOTP() {

    const code = otpCode.value.trim();

    if (!confirmationResult) {

        showAuthMessage(
            "Please click Send OTP first.",
            true
        );

        return;
    }

    if (!code) {

        showAuthMessage(
            "Please enter the OTP.",
            true
        );

        return;
    }

    if (code.length !== 6) {

        showAuthMessage(
            "OTP must contain 6 digits.",
            true
        );

        return;
    }


    verifyOtpBtn.disabled = true;

    verifyOtpBtn.textContent = "Verifying...";

    showAuthMessage(
        "Verifying OTP..."
    );


    try {

        await confirmationResult.confirm(code);

        showAuthMessage(
            "Phone verification successful!"
        );


        setTimeout(function () {

            closeAuthModal();

        }, 800);


    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );

        let errorMessage =
            "OTP verification failed.";

        switch (error.code) {

            case "auth/invalid-verification-code":

                errorMessage =
                    "Incorrect OTP. Please check the code.";

                break;

            case "auth/code-expired":

                errorMessage =
                    "OTP expired. Please request a new OTP.";

                break;

            default:

                errorMessage =
                    error.message;
        }

        showAuthMessage(
            errorMessage,
            true
        );

    } finally {

        verifyOtpBtn.disabled = false;

        verifyOtpBtn.textContent = "Verify OTP";
    }
}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "Logged in user:",
                user
            );

            loginBtn.classList.add("hidden");

            signupBtn.classList.add("hidden");

            logoutBtn.classList.remove("hidden");

        } else {

            console.log(
                "No user logged in."
            );

            loginBtn.classList.remove("hidden");

            signupBtn.classList.remove("hidden");

            logoutBtn.classList.add("hidden");
        }
    }
);


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(auth);

        alert("Logged out successfully.");

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Logout failed: " +
            error.message
        );
    }
}


// ============================================================
// SYMPTOM CHECKBOXES
// ============================================================

function getSymptomCheckboxes() {

    return document.querySelectorAll(
        '#symptomGrid input[type="checkbox"]'
    );
}


// ============================================================
// UPDATE SYMPTOM COUNT
// ============================================================

function updateCount() {

    const boxes =
        getSymptomCheckboxes();

    let selectedCount = 0;

    boxes.forEach(function (box) {

        if (box.checked) {

            selectedCount++;
        }
    });

    count.textContent =
        selectedCount;
}


// ============================================================
// SYMPTOM CHECKBOX EVENTS
// ============================================================

function setupSymptomEvents() {

    const boxes =
        getSymptomCheckboxes();

    console.log(
        "Found symptom checkboxes:",
        boxes.length
    );


    boxes.forEach(function (box) {

        box.addEventListener(
            "change",
            function () {

                updateCount();

            }
        );

    });


    updateCount();
}


// ============================================================
// SEARCH SYMPTOMS
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function (event) {

            const searchText =
                event.target.value
                    .toLowerCase()
                    .trim();

            const symptoms =
                document.querySelectorAll(
                    "#symptomGrid .symptom"
                );


            symptoms.forEach(function (symptom) {

                const name =
                    symptom.dataset.name
                        .toLowerCase();

                if (
                    name.includes(searchText)
                ) {

                    symptom.style.display = "";

                } else {

                    symptom.style.display = "none";
                }

            });

        }
    );
}


// ============================================================
// CLEAR SYMPTOMS
// ============================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            const boxes =
                getSymptomCheckboxes();

            boxes.forEach(function (box) {

                box.checked = false;

            });

            updateCount();

            if (result) {

                result.classList.add(
                    "hidden"
                );
            }

            if (searchInput) {

                searchInput.value = "";

            }

            const symptoms =
                document.querySelectorAll(
                    "#symptomGrid .symptom"
                );

            symptoms.forEach(function (symptom) {

                symptom.style.display = "";

            });

        }
    );
}


// ============================================================
// PREDICTION
// ============================================================

async function makePrediction() {

    const boxes =
        getSymptomCheckboxes();

    const selectedSymptoms = [];


    boxes.forEach(function (box) {

        if (box.checked) {

            selectedSymptoms.push(
                box.value
            );

        }

    });


    console.log(
        "Selected symptoms:",
        selectedSymptoms
    );


    if (selectedSymptoms.length === 0) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }


    predictBtn.disabled = true;

    predictBtn.textContent =
        "Analyzing...";


    try {

        const response =
            await fetch(
                "/predict",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        symptoms:
                            selectedSymptoms
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Prediction failed."
            );
        }


        // ====================================================
        // SHOW RESULT
        // ====================================================

        result.classList.remove(
            "hidden"
        );


        disease.textContent =
            data.disease || "Unknown";


        const confidence =
            Number(
                data.confidence || 0
            );


        confidenceText.textContent =
            `Confidence: ${confidence}%`;


        confidenceBar.style.width =
            `${confidence}%`;


        // ====================================================
        // TOP PREDICTIONS
        // ====================================================

        topPredictions.innerHTML = "";


        if (
            data.top_predictions &&
            data.top_predictions.length
        ) {

            data.top_predictions.forEach(
                function (item) {

                    const div =
                        document.createElement(
                            "div"
                        );

                    div.className =
                        "prediction-item";


                    div.innerHTML = `
                        <span>
                            ${item.disease}
                        </span>
                        <strong>
                            ${item.confidence}%
                        </strong>
                    `;


                    topPredictions.appendChild(
                        div
                    );

                }
            );
        }


        message.textContent =
            data.message ||
            "Educational ML prediction only.";


        // ====================================================
        // SAVE TO FIRESTORE
        // ====================================================

        await savePrediction(
            selectedSymptoms,
            data
        );


        // Scroll to result
        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        alert(
            "Prediction failed: " +
            error.message
        );

    } finally {

        predictBtn.disabled = false;

        predictBtn.textContent =
            "Predict Possible Disease";
    }
}


// ============================================================
// SAVE PREDICTION TO FIRESTORE
// ============================================================

async function savePrediction(
    selectedSymptoms,
    data
) {

    const user =
        auth.currentUser;


    // Don't save if user isn't logged in
    if (!user) {

        console.log(
            "User not logged in. Prediction not saved."
        );

        return;
    }


    try {

        await addDoc(
            collection(
                db,
                "predictions"
            ),
            {

                userId:
                    user.uid,

                userEmail:
                    user.email || null,

                phoneNumber:
                    user.phoneNumber || null,

                symptoms:
                    selectedSymptoms,

                disease:
                    data.disease,

                confidence:
                    data.confidence,

                topPredictions:
                    data.top_predictions || [],

                createdAt:
                    serverTimestamp()
            }
        );


        console.log(
            "Prediction saved to Firestore."
        );


    } catch (error) {

        console.error(
            "Firestore save error:",
            error
        );
    }
}


// ============================================================
// LOGIN BUTTON
// ============================================================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        function () {

            console.log(
                "Login button clicked"
            );

            openAuthModal("login");

        }
    );
}


// ============================================================
// SIGN UP BUTTON
// ============================================================

if (signupBtn) {

    signupBtn.addEventListener(
        "click",
        function () {

            console.log(
                "Sign Up button clicked"
            );

            openAuthModal("signup");

        }
    );
}


// ============================================================
// LOGOUT BUTTON
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logoutUser
    );
}


// ============================================================
// CLOSE MODAL
// ============================================================

if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeAuthModal
    );
}


// ============================================================
// CLICK OUTSIDE MODAL
// ============================================================

if (authModal) {

    authModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === authModal
            ) {

                closeAuthModal();

            }

        }
    );
}


// ============================================================
// EMAIL TAB BUTTON
// ============================================================

if (emailTab) {

    emailTab.addEventListener(
        "click",
        showEmailAuth
    );
}


// ============================================================
// PHONE TAB BUTTON
// ============================================================

if (phoneTab) {

    phoneTab.addEventListener(
        "click",
        showPhoneAuth
    );
}


// ============================================================
// EMAIL SUBMIT
// ============================================================

if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        handleEmailAuthentication
    );
}


// ============================================================
// SEND OTP BUTTON
// ============================================================

if (sendOtpBtn) {

    sendOtpBtn.addEventListener(
        "click",
        sendPhoneOTP
    );
}


// ============================================================
// VERIFY OTP BUTTON
// ============================================================

if (verifyOtpBtn) {

    verifyOtpBtn.addEventListener(
        "click",
        verifyPhoneOTP
    );
}


// ============================================================
// ENTER KEY - EMAIL
// ============================================================

if (authPassword) {

    authPassword.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                handleEmailAuthentication();

            }

        }
    );
}


// ============================================================
// ENTER KEY - OTP
// ============================================================

if (otpCode) {

    otpCode.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                verifyPhoneOTP();

            }

        }
    );
}


// ============================================================
// PREDICT BUTTON
// ============================================================

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        makePrediction
    );
}


// ============================================================
// INITIALIZE SYMPTOMS
// ============================================================

setupSymptomEvents();


// ============================================================
// FINAL DEBUG MESSAGE
// ============================================================

console.log(
    "QuantumDiagnose JavaScript loaded successfully."
);

console.log(
    "Firebase initialized successfully."
);
