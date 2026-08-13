// ============================================================
// QUANTUMDIAGNOSE
// Firebase Authentication + Symptom Prediction
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
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


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
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");

// Symptom elements
const search = document.getElementById("search");
const symptomGrid = document.getElementById("symptomGrid");
const count = document.getElementById("count");

const clearBtn = document.getElementById("clearBtn");
const predictBtn = document.getElementById("predictBtn");

// Result elements
const result = document.getElementById("result");
const disease = document.getElementById("disease");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceText = document.getElementById("confidenceText");
const topPredictions = document.getElementById("topPredictions");
const message = document.getElementById("message");


// ============================================================
// AUTHENTICATION MODE
// ============================================================

let authMode = "login";


// ============================================================
// OPEN LOGIN MODAL
// ============================================================

function openLogin() {

    authMode = "login";

    authTitle.textContent = "Login";
    authSubmit.textContent = "Login";

    authEmail.value = "";
    authPassword.value = "";

    authMessage.textContent = "";
    authMessage.style.color = "";

    authModal.classList.remove("hidden");
}


// ============================================================
// OPEN SIGNUP MODAL
// ============================================================

function openSignup() {

    authMode = "signup";

    authTitle.textContent = "Create Account";
    authSubmit.textContent = "Sign Up";

    authEmail.value = "";
    authPassword.value = "";

    authMessage.textContent = "";
    authMessage.style.color = "";

    authModal.classList.remove("hidden");
}


// ============================================================
// CLOSE AUTH MODAL
// ============================================================

function closeAuthModal() {

    authModal.classList.add("hidden");

    authEmail.value = "";
    authPassword.value = "";

    authMessage.textContent = "";
}


// ============================================================
// LOGIN BUTTON
// ============================================================

if (loginBtn) {

    loginBtn.addEventListener("click", function () {

        openLogin();

    });

}


// ============================================================
// SIGNUP BUTTON
// ============================================================

if (signupBtn) {

    signupBtn.addEventListener("click", function () {

        openSignup();

    });

}


// ============================================================
// CLOSE BUTTON
// ============================================================

if (closeModal) {

    closeModal.addEventListener("click", function () {

        closeAuthModal();

    });

}


// ============================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

if (authModal) {

    authModal.addEventListener("click", function (event) {

        if (event.target === authModal) {

            closeAuthModal();

        }

    });

}


// ============================================================
// FIREBASE AUTHENTICATION
// ============================================================

if (authSubmit) {

    authSubmit.addEventListener("click", async function () {

        const email = authEmail.value.trim();
        const password = authPassword.value.trim();


        // --------------------------------------------------------
        // VALIDATION
        // --------------------------------------------------------

        if (!email) {

            authMessage.textContent = "Please enter your email.";
            authMessage.style.color = "red";

            return;
        }


        if (!password) {

            authMessage.textContent = "Please enter your password.";
            authMessage.style.color = "red";

            return;
        }


        if (password.length < 6) {

            authMessage.textContent =
                "Password must contain at least 6 characters.";

            authMessage.style.color = "red";

            return;
        }


        // --------------------------------------------------------
        // SHOW LOADING
        // --------------------------------------------------------

        authSubmit.disabled = true;
        authSubmit.textContent = "Please wait...";

        authMessage.textContent = "";


        try {

            // ====================================================
            // SIGN UP
            // ====================================================

            if (authMode === "signup") {

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "Account created:",
                    userCredential.user.uid
                );


                authMessage.textContent =
                    "Account created successfully!";

                authMessage.style.color = "green";


                // Close after short delay
                setTimeout(() => {

                    closeAuthModal();

                }, 1000);

            }


            // ====================================================
            // LOGIN
            // ====================================================

            else {

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "Login successful:",
                    userCredential.user.uid
                );


                authMessage.textContent =
                    "Login successful!";

                authMessage.style.color = "green";


                setTimeout(() => {

                    closeAuthModal();

                }, 700);

            }


        } catch (error) {

            console.error(
                "Firebase authentication error:",
                error
            );


            // ----------------------------------------------------
            // FRIENDLY ERROR MESSAGES
            // ----------------------------------------------------

            let errorMessage = "Something went wrong.";


            switch (error.code) {

                case "auth/email-already-in-use":

                    errorMessage =
                        "This email is already registered. Please login.";

                    break;


                case "auth/invalid-email":

                    errorMessage =
                        "Please enter a valid email address.";

                    break;


                case "auth/weak-password":

                    errorMessage =
                        "Password must contain at least 6 characters.";

                    break;


                case "auth/invalid-credential":

                    errorMessage =
                        "Incorrect email or password.";

                    break;


                case "auth/user-not-found":

                    errorMessage =
                        "No account found with this email.";

                    break;


                case "auth/wrong-password":

                    errorMessage =
                        "Incorrect password.";

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
                        error.message || "Authentication failed.";

                    break;
            }


            authMessage.textContent = errorMessage;
            authMessage.style.color = "red";


        } finally {

            authSubmit.disabled = false;

            if (authMode === "login") {

                authSubmit.textContent = "Login";

            } else {

                authSubmit.textContent = "Sign Up";

            }

        }

    });

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

        try {

            await signOut(auth);

            console.log("User logged out.");

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    });

}


// ============================================================
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(auth, function (user) {

    if (user) {

        // ======================================================
        // USER IS LOGGED IN
        // ======================================================

        console.log(
            "Logged-in user:",
            user.email
        );


        // Hide Login and Signup
        if (loginBtn) {

            loginBtn.classList.add("hidden");

        }


        if (signupBtn) {

            signupBtn.classList.add("hidden");

        }


        // Show Logout
        if (logoutBtn) {

            logoutBtn.classList.remove("hidden");

        }


    } else {

        // ======================================================
        // USER IS LOGGED OUT
        // ======================================================

        console.log("No user logged in.");


        // Show Login
        if (loginBtn) {

            loginBtn.classList.remove("hidden");

        }


        // Show Signup
        if (signupBtn) {

            signupBtn.classList.remove("hidden");

        }


        // Hide Logout
        if (logoutBtn) {

            logoutBtn.classList.add("hidden");

        }

    }

});


// ============================================================
// SEARCH SYMPTOMS
// ============================================================

if (search) {

    search.addEventListener("input", function () {

        const searchText =
            search.value
                .trim()
                .toLowerCase();


        const symptoms =
            symptomGrid.querySelectorAll(".symptom");


        symptoms.forEach(function (symptom) {

            const name =
                symptom
                    .getAttribute("data-name")
                    .toLowerCase();


            if (name.includes(searchText)) {

                symptom.style.display = "";

            } else {

                symptom.style.display = "none";

            }

        });

    });

}


// ============================================================
// UPDATE SELECTED SYMPTOM COUNT
// ============================================================

function updateCount() {

    if (!symptomGrid || !count) {

        return;

    }


    const checked =
        symptomGrid.querySelectorAll(
            'input[type="checkbox"]:checked'
        );


    count.textContent = checked.length;

}


// ============================================================
// CHECKBOX CHANGE
// ============================================================

if (symptomGrid) {

    symptomGrid.addEventListener("change", function (event) {

        if (
            event.target &&
            event.target.type === "checkbox"
        ) {

            updateCount();

        }

    });

}


// ============================================================
// CLEAR SYMPTOMS
// ============================================================

if (clearBtn) {

    clearBtn.addEventListener("click", function () {

        const checkboxes =
            symptomGrid.querySelectorAll(
                'input[type="checkbox"]'
            );


        checkboxes.forEach(function (checkbox) {

            checkbox.checked = false;

        });


        updateCount();


        // Clear search
        if (search) {

            search.value = "";

        }


        // Show all symptoms
        const symptoms =
            symptomGrid.querySelectorAll(".symptom");


        symptoms.forEach(function (symptom) {

            symptom.style.display = "";

        });


        // Hide previous result
        if (result) {

            result.classList.add("hidden");

        }

    });

}


// ============================================================
// GET SELECTED SYMPTOMS
// ============================================================

function getSelectedSymptoms() {

    if (!symptomGrid) {

        return [];

    }


    const checked =
        symptomGrid.querySelectorAll(
            'input[type="checkbox"]:checked'
        );


    return Array.from(checked).map(function (checkbox) {

        return checkbox.value;

    });

}


// ============================================================
// PREDICT
// ============================================================

if (predictBtn) {

    predictBtn.addEventListener("click", async function () {

        const selectedSymptoms =
            getSelectedSymptoms();


        // --------------------------------------------------------
        // CHECK LOGIN
        // --------------------------------------------------------

        if (!auth.currentUser) {

            alert(
                "Please login or sign up before making a prediction."
            );

            openLogin();

            return;

        }


        // --------------------------------------------------------
        // CHECK SYMPTOMS
        // --------------------------------------------------------

        if (selectedSymptoms.length === 0) {

            alert(
                "Please select at least one symptom."
            );

            return;

        }


        // --------------------------------------------------------
        // LOADING
        // --------------------------------------------------------

        predictBtn.disabled = true;
        predictBtn.textContent = "Analyzing...";


        if (result) {

            result.classList.add("hidden");

        }


        try {

            // ====================================================
            // SEND DATA TO FLASK
            // ====================================================

            const response =
                await fetch("/predict", {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        symptoms:
                            selectedSymptoms

                    })

                });


            // ====================================================
            // READ RESPONSE
            // ====================================================

            const data =
                await response.json();


            // ====================================================
            // ERROR
            // ====================================================

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Prediction failed."
                );

            }


            // ====================================================
            // DISPLAY RESULT
            // ====================================================

            displayPrediction(data);


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

    });

}


// ============================================================
// DISPLAY PREDICTION
// ============================================================

function displayPrediction(data) {

    // ----------------------------------------------------------
    // DISEASE
    // ----------------------------------------------------------

    if (disease) {

        disease.textContent =
            formatDiseaseName(data.disease);

    }


    // ----------------------------------------------------------
    // CONFIDENCE
    // ----------------------------------------------------------

    const confidence =
        Number(data.confidence) || 0;


    if (confidenceText) {

        confidenceText.textContent =
            `Model confidence: ${confidence}%`;

    }


    if (confidenceBar) {

        confidenceBar.style.width =
            `${Math.min(confidence, 100)}%`;

    }


    // ----------------------------------------------------------
    // TOP PREDICTIONS
    // ----------------------------------------------------------

    if (topPredictions) {

        topPredictions.innerHTML = "";


        if (
            data.top_predictions &&
            data.top_predictions.length > 0
        ) {

            data.top_predictions.forEach(
                function (prediction, index) {

                    const item =
                        document.createElement("div");


                    item.className =
                        "prediction-item";


                    const diseaseName =
                        formatDiseaseName(
                            prediction.disease
                        );


                    const predictionConfidence =
                        Number(
                            prediction.confidence
                        ) || 0;


                    item.innerHTML = `
                        <div>
                            <strong>
                                ${index + 1}. ${diseaseName}
                            </strong>
                        </div>

                        <div>
                            ${predictionConfidence}%
                        </div>
                    `;


                    topPredictions.appendChild(item);

                }
            );

        }

    }


    // ----------------------------------------------------------
    // MESSAGE
    // ----------------------------------------------------------

    if (message) {

        message.textContent =
            data.message ||
            "This is an educational ML prediction and should not be used as a medical diagnosis.";

    }


    // ----------------------------------------------------------
    // SHOW RESULT
    // ----------------------------------------------------------

    if (result) {

        result.classList.remove("hidden");


        // Scroll smoothly to result
        setTimeout(function () {

            result.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        }, 100);

    }

}


// ============================================================
// FORMAT DISEASE NAME
// ============================================================

function formatDiseaseName(name) {

    if (!name) {

        return "Unknown";

    }


    return String(name)
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, function (letter) {

            return letter.toUpperCase();

        });

}


// ============================================================
// INITIAL COUNT
// ============================================================

updateCount();


// ============================================================
// APPLICATION STARTED
// ============================================================

console.log(
    "QuantumDiagnose JavaScript loaded successfully."
);

console.log(
    "Firebase initialized successfully."
);
