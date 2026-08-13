// ============================================================
// QuantumDiagnose - Email Authentication + ML Prediction
// Phone OTP completely removed
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
// OPTIONAL DEBUG ACCESS
// ============================================================

window.firebaseAuth = auth;
window.firebaseDB = db;


// ============================================================
// HTML ELEMENTS
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


// Email authentication

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const authSubmit =
    document.getElementById("authSubmit");

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

function showAuthMessage(text, isError = false) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent = text;

    authMessage.style.color =
        isError
            ? "#d32f2f"
            : "#2e7d32";
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

    showAuthMessage("");
}


// ============================================================
// OPEN LOGIN / SIGNUP MODAL
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

        authModal.classList.remove("hidden");
    }

    clearAuthInputs();

    if (authEmail) {
        authEmail.focus();
    }
}


// ============================================================
// CLOSE AUTH MODAL
// ============================================================

function closeAuthModal() {

    if (authModal) {

        authModal.classList.add("hidden");
    }

    clearAuthInputs();
}


// ============================================================
// EMAIL LOGIN / SIGNUP
// ============================================================

async function handleEmailAuthentication() {

    const email =
        authEmail.value.trim();

    const password =
        authPassword.value;


    // -------------------------
    // Validation
    // -------------------------

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


    // Disable button

    authSubmit.disabled = true;

    authSubmit.textContent =
        "Please wait...";


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

        }

        // ====================================================
        // SIGN UP
        // ====================================================

        else {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            showAuthMessage(
                "Account created successfully!"
            );
        }


        // Close modal

        setTimeout(
            function () {

                closeAuthModal();

            },
            800
        );


    }

    catch (error) {

        console.error(
            "Authentication error:",
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


            case "auth/network-request-failed":

                errorMessage =
                    "Network error. Please check your internet connection.";

                break;


            case "auth/operation-not-allowed":

                errorMessage =
                    "Email/Password authentication is not enabled in Firebase.";

                break;


            default:

                errorMessage =
                    error.message;
        }


        showAuthMessage(
            errorMessage,
            true
        );


    }

    finally {

        authSubmit.disabled = false;

        authSubmit.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";
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
                "Logged in:",
                user.email
            );


            // Hide login

            if (loginBtn) {

                loginBtn.classList.add(
                    "hidden"
                );
            }


            // Hide signup

            if (signupBtn) {

                signupBtn.classList.add(
                    "hidden"
                );
            }


            // Show logout

            if (logoutBtn) {

                logoutBtn.classList.remove(
                    "hidden"
                );
            }

        }

        else {

            console.log(
                "No user logged in."
            );


            // Show login

            if (loginBtn) {

                loginBtn.classList.remove(
                    "hidden"
                );
            }


            // Show signup

            if (signupBtn) {

                signupBtn.classList.remove(
                    "hidden"
                );
            }


            // Hide logout

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

    }

    catch (error) {

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

    let selectedCount = 0;


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
// SYMPTOM EVENTS
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
                updateCount
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

                    }

                    else {

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

                    box.checked = false;
                }
            );


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
// MAKE PREDICTION
// ============================================================

async function makePrediction() {

    const boxes =
        getSymptomCheckboxes();


    const selectedSymptoms = [];


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


    // No symptoms

    if (
        selectedSymptoms.length === 0
    ) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }


    // Disable prediction button

    predictBtn.disabled = true;

    predictBtn.textContent =
        "Analyzing...";


    try {

        // ====================================================
        // SEND TO FLASK BACKEND
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
                data.confidence || 0
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

            topPredictions.innerHTML = "";
        }


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


                    const name =
                        document.createElement(
                            "span"
                        );

                    name.textContent =
                        item.disease;


                    const percentage =
                        document.createElement(
                            "strong"
                        );

                    percentage.textContent =
                        `${item.confidence}%`;


                    div.appendChild(name);

                    div.appendChild(
                        percentage
                    );


                    if (topPredictions) {

                        topPredictions.appendChild(
                            div
                        );
                    }
                }
            );
        }


        // ====================================================
        // MESSAGE
        // ====================================================

        if (message) {

            message.textContent =
                data.message ||
                "Educational ML prediction only.";
        }


        // ====================================================
        // SAVE TO FIRESTORE
        // ====================================================

        await savePrediction(
            selectedSymptoms,
            data
        );


        // Scroll to result

        if (result) {

            result.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }


    }

    catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        alert(
            "Prediction failed: " +
            error.message
        );
    }


    finally {

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


    // Don't save when not logged in

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

    }

    catch (error) {

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
                event.target === authModal
            ) {

                closeAuthModal();
            }
        }
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
                event.key === "Enter"
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
// INITIALIZE
// ============================================================

setupSymptomEvents();

console.log(
    "QuantumDiagnose JavaScript loaded successfully."
);

console.log(
    "Firebase initialized successfully."
);

console.log(
    "Phone OTP authentication is disabled."
);
