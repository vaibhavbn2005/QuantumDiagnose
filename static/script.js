// ============================================================
// QUANTUMDIAGNOSE - COMPLETE SCRIPT.JS
// Email/Password Authentication Only
// Phone OTP Disabled
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
    onAuthStateChanged
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
    appId: "1:727641186346:web:958942c8d9f6906a69e353",
    measurementId: "G-YM0HMMVBFR"
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

console.log("Firebase initialized successfully.");


// ============================================================
// GET HTML ELEMENTS
// ============================================================

// Authentication buttons
const loginBtn =
    document.getElementById("loginBtn");

const signupBtn =
    document.getElementById("signupBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


// Authentication modal
const authModal =
    document.getElementById("authModal");

const closeModal =
    document.getElementById("closeModal");

const authTitle =
    document.getElementById("authTitle");


// Authentication tabs
const emailTab =
    document.getElementById("emailTab");


// Email authentication
const emailAuth =
    document.getElementById("emailAuth");

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const authSubmit =
    document.getElementById("authSubmit");


// Authentication message
const authMessage =
    document.getElementById("authMessage");


// Symptoms
const searchInput =
    document.getElementById("search");

const symptomGrid =
    document.getElementById("symptomGrid");

const count =
    document.getElementById("count");

const clearBtn =
    document.getElementById("clearBtn");

const predictBtn =
    document.getElementById("predictBtn");


// Result
const result =
    document.getElementById("result");

const disease =
    document.getElementById("disease");

const confidenceBar =
    document.getElementById("confidenceBar");

const confidenceText =
    document.getElementById("confidenceText");

const topPredictions =
    document.getElementById("topPredictions");

const message =
    document.getElementById("message");


// ============================================================
// AUTHENTICATION STATE
// ============================================================

let authMode = "login";


// ============================================================
// SHOW AUTH MESSAGE
// ============================================================

function showAuthMessage(
    text,
    isError = false
) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent = text;

    if (isError) {

        authMessage.style.color =
            "#d32f2f";

    } else {

        authMessage.style.color =
            "#2e7d32";
    }
}


// ============================================================
// OPEN AUTH MODAL
// ============================================================

function openAuthModal(mode) {

    authMode = mode;


    if (authTitle) {

        authTitle.textContent =
            mode === "login"
                ? "Login"
                : "Create Account";
    }


    if (authSubmit) {

        authSubmit.textContent =
            mode === "login"
                ? "Login"
                : "Create Account";
    }


    if (authModal) {

        authModal.classList.remove(
            "hidden"
        );
    }


    showEmailAuth();

    clearAuthInputs();

    showAuthMessage("");
}


// ============================================================
// CLOSE AUTH MODAL
// ============================================================

function closeAuthModal() {

    if (authModal) {

        authModal.classList.add(
            "hidden"
        );
    }

    showAuthMessage("");

    clearAuthInputs();
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
}


// ============================================================
// EMAIL AUTHENTICATION ONLY
// ============================================================

function showEmailAuth() {

    if (emailTab) {

        emailTab.classList.add(
            "active"
        );
    }


    if (emailAuth) {

        emailAuth.classList.remove(
            "hidden"
        );

        emailAuth.style.display =
            "";
    }


    // --------------------------------------------------------
    // PHONE AUTHENTICATION IS DISABLED
    // --------------------------------------------------------

    const phoneTab =
        document.getElementById(
            "phoneTab"
        );

    const phoneAuth =
        document.getElementById(
            "phoneAuth"
        );


    if (phoneTab) {

        phoneTab.classList.add(
            "hidden"
        );

        phoneTab.style.display =
            "none";
    }


    if (phoneAuth) {

        phoneAuth.classList.add(
            "hidden"
        );

        phoneAuth.style.display =
            "none";
    }


    showAuthMessage("");
}


// ============================================================
// EMAIL LOGIN / SIGN UP
// ============================================================

async function handleEmailAuthentication() {

    if (!authEmail || !authPassword) {

        console.error(
            "Authentication input elements not found."
        );

        return;
    }


    const email =
        authEmail.value.trim();

    const password =
        authPassword.value;


    // --------------------------------------------------------
    // VALIDATE EMAIL
    // --------------------------------------------------------

    if (!email) {

        showAuthMessage(
            "Please enter your email address.",
            true
        );

        return;
    }


    // --------------------------------------------------------
    // VALIDATE PASSWORD
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // DISABLE BUTTON
    // --------------------------------------------------------

    if (authSubmit) {

        authSubmit.disabled =
            true;

        authSubmit.textContent =
            "Please wait...";
    }


    showAuthMessage(
        "Processing..."
    );


    try {

        // ====================================================
        // LOGIN
        // ====================================================

        if (authMode === "login") {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            showAuthMessage(
                "Login successful!"
            );


            console.log(
                "User logged in:",
                email
            );


        }

        // ====================================================
        // SIGN UP
        // ====================================================

        else {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            showAuthMessage(
                "Account created successfully!"
            );


            console.log(
                "Account created:",
                user.email
            );
        }


        // ----------------------------------------------------
        // CLOSE MODAL
        // ----------------------------------------------------

        setTimeout(
            function () {

                closeAuthModal();

            },
            800
        );


    } catch (error) {

        console.error(
            "Firebase authentication error:",
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


            case "auth/api-key-not-valid":

                errorMessage =
                    "Firebase API key is invalid. Please check the Firebase configuration.";

                break;


            case "auth/network-request-failed":

                errorMessage =
                    "Network error. Please check your internet connection.";

                break;


            default:

                errorMessage =
                    error.message ||
                    "Authentication failed.";
        }


        showAuthMessage(
            errorMessage,
            true
        );


    } finally {

        if (authSubmit) {

            authSubmit.disabled =
                false;

            authSubmit.textContent =
                authMode === "login"
                    ? "Login"
                    : "Create Account";
        }
    }
}


// ============================================================
// AUTHENTICATION STATE
// ============================================================

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "Logged in user:",
                user.email
            );


            // ------------------------------------------------
            // LOGGED IN
            // ------------------------------------------------

            if (loginBtn) {

                loginBtn.classList.add(
                    "hidden"
                );
            }


            if (signupBtn) {

                signupBtn.classList.add(
                    "hidden"
                );
            }


            if (logoutBtn) {

                logoutBtn.classList.remove(
                    "hidden"
                );
            }


        } else {

            console.log(
                "No user logged in."
            );


            // ------------------------------------------------
            // LOGGED OUT
            // ------------------------------------------------

            if (loginBtn) {

                loginBtn.classList.remove(
                    "hidden"
                );
            }


            if (signupBtn) {

                signupBtn.classList.remove(
                    "hidden"
                );
            }


            if (logoutBtn) {

                logoutBtn.classList.add(
                    "hidden"
                );
            }
        }
    }
);


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(auth);

        alert(
            "Logged out successfully."
        );


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
// GET SYMPTOM CHECKBOXES
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


    let selectedCount =
        0;


    boxes.forEach(
        function (box) {

            if (box.checked) {

                selectedCount++;
            }
        }
    );


    if (count) {

        count.textContent =
            selectedCount;
    }
}


// ============================================================
// SETUP SYMPTOM EVENTS
// ============================================================

function setupSymptomEvents() {

    const boxes =
        getSymptomCheckboxes();


    console.log(
        "Found symptom checkboxes:",
        boxes.length
    );


    boxes.forEach(
        function (box) {

            box.addEventListener(
                "change",
                function () {

                    updateCount();

                }
            );
        }
    );


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


            symptoms.forEach(
                function (symptom) {

                    const name =
                        (
                            symptom.dataset.name ||
                            ""
                        ).toLowerCase();


                    if (
                        name.includes(
                            searchText
                        )
                    ) {

                        symptom.style.display =
                            "";

                    } else {

                        symptom.style.display =
                            "none";
                    }
                }
            );
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


            boxes.forEach(
                function (box) {

                    box.checked =
                        false;
                }
            );


            updateCount();


            if (result) {

                result.classList.add(
                    "hidden"
                );
            }


            if (searchInput) {

                searchInput.value =
                    "";
            }


            const symptoms =
                document.querySelectorAll(
                    "#symptomGrid .symptom"
                );


            symptoms.forEach(
                function (symptom) {

                    symptom.style.display =
                        "";
                }
            );
        }
    );
}


// ============================================================
// PREDICTION
// ============================================================

async function makePrediction() {

    const boxes =
        getSymptomCheckboxes();


    const selectedSymptoms =
        [];


    boxes.forEach(
        function (box) {

            if (box.checked) {

                selectedSymptoms.push(
                    box.value
                );
            }
        }
    );


    console.log(
        "Selected symptoms:",
        selectedSymptoms
    );


    // --------------------------------------------------------
    // CHECK LOGIN
    // --------------------------------------------------------

    if (!auth.currentUser) {

        alert(
            "Please login before making a prediction."
        );

        openAuthModal(
            "login"
        );

        return;
    }


    // --------------------------------------------------------
    // CHECK SYMPTOMS
    // --------------------------------------------------------

    if (
        selectedSymptoms.length ===
        0
    ) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }


    // --------------------------------------------------------
    // DISABLE PREDICTION BUTTON
    // --------------------------------------------------------

    if (predictBtn) {

        predictBtn.disabled =
            true;

        predictBtn.textContent =
            "Analyzing...";
    }


    try {

        // ====================================================
        // CALL FLASK /predict API
        // ====================================================

        const response =
            await fetch(
                "/predict",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(
                        {
                            symptoms:
                                selectedSymptoms
                        }
                    )
                }
            );


        const data =
            await response.json();


        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Prediction failed."
            );
        }


        // ====================================================
        // SHOW RESULT
        // ====================================================

        if (result) {

            result.classList.remove(
                "hidden"
            );
        }


        if (disease) {

            disease.textContent =
                data.disease ||
                "Unknown";
        }


        const confidence =
            Number(
                data.confidence ||
                0
            );


        if (confidenceText) {

            confidenceText.textContent =
                `Confidence: ${confidence}%`;
        }


        if (confidenceBar) {

            confidenceBar.style.width =
                `${confidence}%`;
        }


        // ====================================================
        // TOP PREDICTIONS
        // ====================================================

        if (topPredictions) {

            topPredictions.innerHTML =
                "";
        }


        if (
            data.top_predictions &&
            data.top_predictions.length &&
            topPredictions
        ) {

            data.top_predictions.forEach(
                function (item) {

                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "prediction-item";


                    const diseaseName =
                        document.createElement(
                            "span"
                        );


                    diseaseName.textContent =
                        item.disease;


                    const confidenceValue =
                        document.createElement(
                            "strong"
                        );


                    confidenceValue.textContent =
                        `${item.confidence}%`;


                    div.appendChild(
                        diseaseName
                    );


                    div.appendChild(
                        confidenceValue
                    );


                    topPredictions.appendChild(
                        div
                    );
                }
            );
        }


        // ====================================================
        // RESULT MESSAGE
        // ====================================================

        if (message) {

            message.textContent =
                data.message ||
                "Educational ML prediction only.";
        }


        // ====================================================
        // SAVE PREDICTION
        // ====================================================

        await savePrediction(
            selectedSymptoms,
            data
        );


        // ====================================================
        // SCROLL TO RESULT
        // ====================================================

        if (result) {

            result.scrollIntoView(
                {
                    behavior: "smooth",
                    block: "start"
                }
            );
        }


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

        if (predictBtn) {

            predictBtn.disabled =
                false;

            predictBtn.textContent =
                "Predict Possible Disease";
        }
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


    // --------------------------------------------------------
    // USER MUST BE LOGGED IN
    // --------------------------------------------------------

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
                    user.email ||
                    null,

                symptoms:
                    selectedSymptoms,

                disease:
                    data.disease ||
                    null,

                confidence:
                    data.confidence ||
                    0,

                topPredictions:
                    data.top_predictions ||
                    [],

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


            openAuthModal(
                "login"
            );
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


            openAuthModal(
                "signup"
            );
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
                event.target ===
                authModal
            ) {

                closeAuthModal();
            }
        }
    );
}


// ============================================================
// EMAIL TAB
// ============================================================

if (emailTab) {

    emailTab.addEventListener(
        "click",
        showEmailAuth
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
// ENTER KEY - EMAIL
// ============================================================

if (authPassword) {

    authPassword.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                handleEmailAuthentication();
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
// INITIALIZE EMAIL AUTH UI
// ============================================================

showEmailAuth();


// ============================================================
// FINAL DEBUG MESSAGE
// ============================================================

console.log(
    "QuantumDiagnose JavaScript loaded successfully."
);

console.log(
    "Email/password authentication enabled."
);

console.log(
    "Phone OTP authentication disabled."
);
