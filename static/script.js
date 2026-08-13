// ============================================================
// QuantumDiagnose - Complete script.js
// ============================================================

// ============================================================
// FIREBASE IMPORTS
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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
// GLOBAL VARIABLES
// ============================================================

let confirmationResult = null;
let recaptchaVerifier = null;


// ============================================================
// GET HTML ELEMENTS
// ============================================================

// Symptoms
const boxes = document.querySelectorAll(".symptom-input");

const count = document.getElementById("count");

const result = document.getElementById("result");

const disease = document.getElementById("disease");

const confidenceBar = document.getElementById("confidenceBar");

const confidenceText = document.getElementById("confidenceText");

const message = document.getElementById("message");

const topPredictions = document.getElementById("topPredictions");


// Search
const searchInput = document.getElementById("search");


// Buttons
const clearBtn = document.getElementById("clearBtn");

const predictBtn = document.getElementById("predictBtn");


// Authentication buttons
const loginBtn = document.getElementById("loginBtn");

const signupBtn = document.getElementById("signupBtn");

const logoutBtn = document.getElementById("logoutBtn");


// Email fields
const emailInput = document.getElementById("emailInput");

const passwordInput = document.getElementById("passwordInput");


// Phone fields
const phoneInput = document.getElementById("phoneInput");

const otpInput = document.getElementById("otpInput");

const sendOtpBtn = document.getElementById("sendOtpBtn");

const verifyOtpBtn = document.getElementById("verifyOtpBtn");


// Authentication message
const authMessage = document.getElementById("authMessage");


// ============================================================
// SYMPTOM COUNT
// ============================================================

function updateCount() {

    if (!count) return;

    const selected = document.querySelectorAll(
        ".symptom-input:checked"
    ).length;

    count.textContent = `${selected} symptoms selected`;
}


// ============================================================
// SYMPTOM CHECKBOX EVENTS
// ============================================================

boxes.forEach((box) => {

    box.addEventListener("change", updateCount);

});


// ============================================================
// INITIAL COUNT
// ============================================================

updateCount();


// ============================================================
// SYMPTOM SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchText =
            this.value.toLowerCase().trim();

        const allSymptoms =
            document.querySelectorAll(".symptom-item");

        allSymptoms.forEach((symptom) => {

            const name =
                symptom.dataset.name ||
                symptom.textContent.toLowerCase();

            if (
                name.toLowerCase().includes(searchText)
            ) {

                symptom.style.display = "";

            } else {

                symptom.style.display = "none";

            }

        });

    });

}


// ============================================================
// CLEAR BUTTON
// ============================================================

if (clearBtn) {

    clearBtn.addEventListener("click", function () {

        boxes.forEach((box) => {

            box.checked = false;

        });

        updateCount();

        if (result) {

            result.classList.add("hidden");

        }

        if (searchInput) {

            searchInput.value = "";

        }

        const allSymptoms =
            document.querySelectorAll(".symptom-item");

        allSymptoms.forEach((symptom) => {

            symptom.style.display = "";

        });

    });

}


// ============================================================
// SAVE PREDICTION TO FIRESTORE
// ============================================================

async function savePrediction(
    symptoms,
    prediction,
    confidence,
    topPredictions
) {

    const user = auth.currentUser;

    // Don't save if user isn't logged in
    if (!user) {

        console.log(
            "User not logged in. Prediction not saved."
        );

        return;

    }

    try {

        await addDoc(
            collection(db, "predictions"),
            {

                userId: user.uid,

                userEmail: user.email || null,

                phoneNumber:
                    user.phoneNumber || null,

                symptoms: symptoms,

                disease: prediction,

                confidence: confidence,

                topPredictions: topPredictions,

                createdAt: serverTimestamp()

            }
        );

        console.log(
            "Prediction saved successfully."
        );

    } catch (error) {

        console.error(
            "Error saving prediction:",
            error
        );

    }

}


// ============================================================
// PREDICT BUTTON
// ============================================================

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        async function () {

            const selectedSymptoms =
                Array.from(
                    document.querySelectorAll(
                        ".symptom-input:checked"
                    )
                ).map(
                    box => box.value
                );


            // ------------------------------------------------
            // No symptoms
            // ------------------------------------------------

            if (selectedSymptoms.length === 0) {

                alert(
                    "Please select at least one symptom."
                );

                return;

            }


            // ------------------------------------------------
            // Loading
            // ------------------------------------------------

            predictBtn.disabled = true;

            predictBtn.textContent =
                "Analyzing...";


            try {

                // --------------------------------------------
                // Send request to Flask
                // --------------------------------------------

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


                // --------------------------------------------
                // Error
                // --------------------------------------------

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Prediction failed."
                    );

                }


                // --------------------------------------------
                // Show result
                // --------------------------------------------

                if (disease) {

                    disease.textContent =
                        data.disease;

                }


                if (confidenceText) {

                    confidenceText.textContent =
                        `${data.confidence}% confidence`;

                }


                if (confidenceBar) {

                    confidenceBar.style.width =
                        `${data.confidence}%`;

                }


                if (message) {

                    message.textContent =
                        data.message ||
                        "Prediction completed.";

                }


                // --------------------------------------------
                // Top predictions
                // --------------------------------------------

                if (topPredictions) {

                    topPredictions.innerHTML = "";

                    if (
                        data.top_predictions &&
                        data.top_predictions.length
                    ) {

                        data.top_predictions.forEach(
                            (item, index) => {

                                const row =
                                    document.createElement(
                                        "div"
                                    );

                                row.className =
                                    "prediction-row";

                                row.innerHTML = `
                                    <div class="prediction-name">
                                        ${index + 1}.
                                        ${item.disease}
                                    </div>

                                    <div class="prediction-confidence">
                                        ${item.confidence}%
                                    </div>
                                `;

                                topPredictions.appendChild(
                                    row
                                );

                            }
                        );

                    }

                }


                // --------------------------------------------
                // Display result
                // --------------------------------------------

                if (result) {

                    result.classList.remove(
                        "hidden"
                    );

                    result.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }


                // --------------------------------------------
                // Save to Firestore
                // --------------------------------------------

                await savePrediction(

                    selectedSymptoms,

                    data.disease,

                    data.confidence,

                    data.top_predictions || []

                );


            } catch (error) {

                console.error(
                    "Prediction error:",
                    error
                );

                alert(
                    error.message ||
                    "Something went wrong while predicting."
                );

            } finally {

                predictBtn.disabled = false;

                predictBtn.textContent =
                    "Predict Possible Disease";

            }

        }
    );

}


// ============================================================
// FIREBASE AUTHENTICATION
// ============================================================


// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(text, isError = false) {

    if (!authMessage) return;

    authMessage.textContent = text;

    authMessage.style.display = "block";

    if (isError) {

        authMessage.style.color = "#dc2626";

    } else {

        authMessage.style.color = "#16a34a";

    }

}


// ============================================================
// EMAIL SIGN UP
// ============================================================

if (signupBtn) {

    signupBtn.addEventListener(
        "click",
        async function () {

            const email =
                emailInput?.value.trim();

            const password =
                passwordInput?.value;


            if (!email || !password) {

                showAuthMessage(
                    "Please enter email and password.",
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


            try {

                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                showAuthMessage(
                    "Account created successfully."
                );

            } catch (error) {

                console.error(
                    "Signup error:",
                    error
                );

                showAuthMessage(
                    error.message,
                    true
                );

            }

        }
    );

}


// ============================================================
// EMAIL LOGIN
// ============================================================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        async function () {

            const email =
                emailInput?.value.trim();

            const password =
                passwordInput?.value;


            if (!email || !password) {

                showAuthMessage(
                    "Please enter email and password.",
                    true
                );

                return;

            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                showAuthMessage(
                    "Login successful."
                );

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                showAuthMessage(
                    error.message,
                    true
                );

            }

        }
    );

}


// ============================================================
// CREATE RECAPTCHA
// ============================================================

function setupRecaptcha() {

    try {

        // Remove previous verifier
        if (recaptchaVerifier) {

            try {

                recaptchaVerifier.clear();

            } catch (e) {

                console.log(
                    "Previous reCAPTCHA cleared."
                );

            }

            recaptchaVerifier = null;

        }


        // Look for existing container
        let container =
            document.getElementById(
                "recaptcha-container"
            );


        // If container doesn't exist,
        // create it automatically
        if (!container) {

            container =
                document.createElement("div");

            container.id =
                "recaptcha-container";

            document.body.appendChild(
                container
            );

        }


        recaptchaVerifier =
            new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {

                    size: "normal",

                    callback: function () {

                        console.log(
                            "reCAPTCHA verified."
                        );

                    },

                    "expired-callback":
                        function () {

                            showAuthMessage(
                                "reCAPTCHA expired. Please verify again.",
                                true
                            );

                        }

                }
            );


        return recaptchaVerifier;


    } catch (error) {

        console.error(
            "reCAPTCHA setup error:",
            error
        );

        showAuthMessage(
            "Unable to initialize reCAPTCHA.",
            true
        );

        return null;

    }

}


// ============================================================
// SEND PHONE OTP
// ============================================================

if (sendOtpBtn) {

    sendOtpBtn.addEventListener(
        "click",
        async function () {

            const phone =
                phoneInput?.value.trim();


            // -----------------------------------------------
            // Check phone number
            // -----------------------------------------------

            if (!phone) {

                showAuthMessage(
                    "Please enter your phone number.",
                    true
                );

                return;

            }


            // -----------------------------------------------
            // Phone format
            // -----------------------------------------------

            if (!phone.startsWith("+")) {

                showAuthMessage(
                    "Enter phone number with country code. Example: +919876543210",
                    true
                );

                return;

            }


            sendOtpBtn.disabled = true;

            sendOtpBtn.textContent =
                "Sending OTP...";


            try {

                // -------------------------------------------
                // Setup reCAPTCHA
                // -------------------------------------------

                const verifier =
                    setupRecaptcha();


                if (!verifier) {

                    throw new Error(
                        "reCAPTCHA could not be initialized."
                    );

                }


                // -------------------------------------------
                // Send OTP
                // -------------------------------------------

                confirmationResult =
                    await signInWithPhoneNumber(
                        auth,
                        phone,
                        verifier
                    );


                showAuthMessage(
                    "OTP sent successfully. Check your phone."
                );


                // Enable OTP button
                if (verifyOtpBtn) {

                    verifyOtpBtn.disabled = false;

                }


            } catch (error) {

                console.error(
                    "OTP error:",
                    error
                );


                let errorMessage =
                    error.message;


                // Firebase-specific messages
                if (
                    error.code ===
                    "auth/invalid-phone-number"
                ) {

                    errorMessage =
                        "Invalid phone number. Use international format, e.g. +919876543210.";

                }

                else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    errorMessage =
                        "Too many requests. Please try again later.";

                }

                else if (
                    error.code ===
                    "auth/quota-exceeded"
                ) {

                    errorMessage =
                        "SMS quota exceeded. Please try again later.";

                }

                else if (
                    error.code ===
                    "auth/operation-not-allowed"
                ) {

                    errorMessage =
                        "Phone authentication is not enabled in Firebase.";

                }

                showAuthMessage(
                    errorMessage,
                    true
                );


                // Reset reCAPTCHA
                if (recaptchaVerifier) {

                    try {

                        recaptchaVerifier.clear();

                    } catch (e) {

                        console.log(e);

                    }

                    recaptchaVerifier = null;

                }

            } finally {

                sendOtpBtn.disabled = false;

                sendOtpBtn.textContent =
                    "Send OTP";

            }

        }
    );

}


// ============================================================
// VERIFY PHONE OTP
// ============================================================

if (verifyOtpBtn) {

    verifyOtpBtn.addEventListener(
        "click",
        async function () {

            const otp =
                otpInput?.value.trim();


            if (!confirmationResult) {

                showAuthMessage(
                    "Please click Send OTP first.",
                    true
                );

                return;

            }


            if (!otp) {

                showAuthMessage(
                    "Please enter the OTP.",
                    true
                );

                return;

            }


            verifyOtpBtn.disabled = true;

            verifyOtpBtn.textContent =
                "Verifying...";


            try {

                const result =
                    await confirmationResult.confirm(
                        otp
                    );


                const user =
                    result.user;


                console.log(
                    "Phone login successful:",
                    user
                );


                showAuthMessage(
                    "Phone login successful."
                );


                if (otpInput) {

                    otpInput.value = "";

                }


                confirmationResult = null;


            } catch (error) {

                console.error(
                    "OTP verification error:",
                    error
                );


                let errorMessage =
                    error.message;


                if (
                    error.code ===
                    "auth/invalid-verification-code"
                ) {

                    errorMessage =
                        "Invalid OTP. Please check the OTP and try again.";

                }

                else if (
                    error.code ===
                    "auth/code-expired"
                ) {

                    errorMessage =
                        "OTP expired. Please request a new OTP.";

                }


                showAuthMessage(
                    errorMessage,
                    true
                );


            } finally {

                verifyOtpBtn.disabled = false;

                verifyOtpBtn.textContent =
                    "Verify OTP";

            }

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            try {

                await signOut(auth);

                showAuthMessage(
                    "Logged out successfully."
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                showAuthMessage(
                    error.message,
                    true
                );

            }

        }
    );

}


// ============================================================
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "User logged in:",
                user.uid
            );


            console.log(
                "Email:",
                user.email
            );


            console.log(
                "Phone:",
                user.phoneNumber
            );


            // Change login button
            if (loginBtn) {

                loginBtn.textContent =
                    "Logged In";

            }


            if (logoutBtn) {

                logoutBtn.style.display =
                    "inline-block";

            }


        } else {

            console.log(
                "No user logged in."
            );


            if (logoutBtn) {

                logoutBtn.style.display =
                    "none";

            }

        }

    }
);


// ============================================================
// SYSTEM STATUS
// ============================================================

const statusLink =
    document.getElementById(
        "systemStatus"
    );


if (statusLink) {

    statusLink.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            try {

                const response =
                    await fetch("/health");


                const data =
                    await response.json();


                if (
                    data.status === "ok"
                ) {

                    alert(
                        "System is online."
                    );

                } else {

                    alert(
                        "System status unavailable."
                    );

                }

            } catch (error) {

                alert(
                    "Unable to connect to server."
                );

            }

        }
    );

}


// ============================================================
// INITIAL MESSAGE
// ============================================================

console.log(
    "QuantumDiagnose JavaScript loaded successfully."
);

console.log(
    "Firebase Authentication initialized."
);

console.log(
    "Firestore initialized."
);
