// ============================================================
// QUANTUMDIAGNOSE - COMPLETE JAVASCRIPT
// Firebase Authentication + Symptom Prediction
// ============================================================


// ============================================================
// 1. FIREBASE IMPORTS
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


// ============================================================
// 2. FIREBASE CONFIGURATION
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
// 3. INITIALIZE FIREBASE
// ============================================================

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);


// ============================================================
// 4. GET HTML ELEMENTS
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
const boxes = [
    ...document.querySelectorAll(".symptom input")
];

const count = document.getElementById("count");

const search = document.getElementById("search");

const clearBtn = document.getElementById("clearBtn");

const predictBtn = document.getElementById("predictBtn");


// Prediction result elements
const result = document.getElementById("result");

const disease = document.getElementById("disease");

const confidenceBar =
    document.getElementById("confidenceBar");

const confidenceText =
    document.getElementById("confidenceText");

const message =
    document.getElementById("message");

const topPredictions =
    document.getElementById("topPredictions");


// ============================================================
// 5. AUTHENTICATION MODE
// ============================================================

// true  = Sign Up
// false = Login

let isSignupMode = false;


// ============================================================
// 6. OPEN AUTHENTICATION MODAL
// ============================================================

function openAuthModal(signupMode) {

    isSignupMode = signupMode;

    // Clear previous values
    authEmail.value = "";
    authPassword.value = "";

    authMessage.textContent = "";

    authMessage.style.color = "";


    if (isSignupMode) {

        authTitle.textContent = "Create Account";

        authSubmit.textContent = "Sign Up";

    } else {

        authTitle.textContent = "Login";

        authSubmit.textContent = "Login";
    }


    authModal.classList.remove("hidden");
}


// ============================================================
// 7. CLOSE AUTHENTICATION MODAL
// ============================================================

function closeAuthModal() {

    authModal.classList.add("hidden");

    authEmail.value = "";
    authPassword.value = "";

    authMessage.textContent = "";
}


// ============================================================
// 8. LOGIN BUTTON
// ============================================================

if (loginBtn) {

    loginBtn.addEventListener("click", function () {

        openAuthModal(false);

    });
}


// ============================================================
// 9. SIGN UP BUTTON
// ============================================================

if (signupBtn) {

    signupBtn.addEventListener("click", function () {

        openAuthModal(true);

    });
}


// ============================================================
// 10. CLOSE BUTTON
// ============================================================

if (closeModal) {

    closeModal.addEventListener("click", function () {

        closeAuthModal();

    });
}


// ============================================================
// 11. CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

if (authModal) {

    authModal.addEventListener("click", function (event) {

        if (event.target === authModal) {

            closeAuthModal();

        }

    });
}


// ============================================================
// 12. FIREBASE ERROR MESSAGE
// ============================================================

function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/email-already-in-use":
            return "This email is already registered. Please login.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/api-key-not-valid":
            return "Firebase API key is invalid. Please check the Firebase configuration.";

        case "auth/operation-not-allowed":
            return "Email/Password authentication is not enabled in Firebase.";

        default:
            return error.message || "Authentication failed.";
    }
}


// ============================================================
// 13. LOGIN / SIGNUP
// ============================================================

if (authSubmit) {

    authSubmit.addEventListener("click", async function () {

        const email = authEmail.value.trim();

        const password = authPassword.value;


        // Validate email
        if (!email) {

            authMessage.textContent =
                "Please enter your email.";

            authMessage.style.color = "red";

            return;
        }


        // Validate password
        if (!password) {

            authMessage.textContent =
                "Please enter your password.";

            authMessage.style.color = "red";

            return;
        }


        // Firebase requires at least 6 characters
        if (password.length < 6) {

            authMessage.textContent =
                "Password must be at least 6 characters.";

            authMessage.style.color = "red";

            return;
        }


        // Disable button while processing
        authSubmit.disabled = true;

        authSubmit.textContent =
            isSignupMode ? "Creating Account..." : "Logging in...";


        try {

            if (isSignupMode) {

                // ====================================================
                // CREATE ACCOUNT
                // ====================================================

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "Account created:",
                    userCredential.user.email
                );


                authMessage.textContent =
                    "Account created successfully!";

                authMessage.style.color = "green";


                // Close modal after short delay
                setTimeout(() => {

                    closeAuthModal();

                }, 1000);


            } else {

                // ====================================================
                // LOGIN
                // ====================================================

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "Logged in:",
                    userCredential.user.email
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


            authMessage.textContent =
                getFirebaseErrorMessage(error);

            authMessage.style.color = "red";

        } finally {

            authSubmit.disabled = false;

            authSubmit.textContent =
                isSignupMode ? "Sign Up" : "Login";
        }

    });
}


// ============================================================
// 14. LOGOUT
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

            alert(
                "Logout failed: " +
                getFirebaseErrorMessage(error)
            );

        }

    });
}


// ============================================================
// 15. AUTHENTICATION STATE
// ============================================================

onAuthStateChanged(auth, function (user) {

    if (user) {

        // ========================================================
        // USER IS LOGGED IN
        // ========================================================

        console.log(
            "Current user:",
            user.email
        );


        if (loginBtn) {

            loginBtn.classList.add("hidden");

        }


        if (signupBtn) {

            signupBtn.classList.add("hidden");

        }


        if (logoutBtn) {

            logoutBtn.classList.remove("hidden");

        }


    } else {

        // ========================================================
        // USER IS LOGGED OUT
        // ========================================================

        console.log("No user is logged in.");


        if (loginBtn) {

            loginBtn.classList.remove("hidden");

        }


        if (signupBtn) {

            signupBtn.classList.remove("hidden");

        }


        if (logoutBtn) {

            logoutBtn.classList.add("hidden");

        }

    }

});


// ============================================================
// 16. UPDATE SYMPTOM COUNT
// ============================================================

function updateCount() {

    const selectedCount =
        boxes.filter(
            box => box.checked
        ).length;


    if (count) {

        count.textContent = selectedCount;

    }

}


// Add change event to every symptom checkbox

boxes.forEach(function (box) {

    box.addEventListener(
        "change",
        updateCount
    );

});


// ============================================================
// 17. SEARCH SYMPTOMS
// ============================================================

if (search) {

    search.addEventListener(
        "input",
        function (event) {

            const query =
                event.target.value
                    .toLowerCase()
                    .trim();


            document
                .querySelectorAll(".symptom")
                .forEach(function (element) {

                    const name =
                        element.dataset.name
                            .toLowerCase();


                    if (name.includes(query)) {

                        element.style.display = "";

                    } else {

                        element.style.display = "none";

                    }

                });

        }
    );

}


// ============================================================
// 18. CLEAR ALL SYMPTOMS
// ============================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            boxes.forEach(function (box) {

                box.checked = false;

            });


            updateCount();


            if (result) {

                result.classList.add("hidden");

            }


            if (search) {

                search.value = "";

            }


            document
                .querySelectorAll(".symptom")
                .forEach(function (element) {

                    element.style.display = "";

                });

        }
    );

}


// ============================================================
// 19. PREDICT DISEASE
// ============================================================

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        async function () {

            // Get selected symptoms

            const selectedSymptoms =
                boxes
                    .filter(
                        box => box.checked
                    )
                    .map(
                        box => box.value
                    );


            // Check if user selected anything

            if (!selectedSymptoms.length) {

                alert(
                    "Please select at least one symptom."
                );

                return;

            }


            // Disable button

            predictBtn.disabled = true;

            predictBtn.textContent =
                "Analyzing...";


            try {

                // ==================================================
                // SEND DATA TO FLASK BACKEND
                // ==================================================

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


                // Convert response to JSON

                const data =
                    await response.json();


                // Check backend error

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Prediction failed."
                    );

                }


                // ==================================================
                // DISPLAY MAIN PREDICTION
                // ==================================================

                if (disease) {

                    disease.textContent =
                        data.disease
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, c =>
                                c.toUpperCase()
                            );

                }


                // ==================================================
                // DISPLAY CONFIDENCE
                // ==================================================

                if (confidenceBar) {

                    confidenceBar.style.width =
                        `${data.confidence}%`;

                }


                if (confidenceText) {

                    confidenceText.textContent =
                        `Model confidence: ${data.confidence}%`;

                }


                // ==================================================
                // DISPLAY TOP PREDICTIONS
                // ==================================================

                if (topPredictions) {

                    topPredictions.innerHTML =
                        data.top_predictions
                            .map(function (item) {

                                const formattedDisease =
                                    item.disease
                                        .replaceAll("_", " ")
                                        .replace(/\b\w/g, c =>
                                            c.toUpperCase()
                                        );


                                return `
                                    <div class="top-item">
                                        <span>
                                            ${formattedDisease}
                                        </span>

                                        <strong>
                                            ${item.confidence}%
                                        </strong>
                                    </div>
                                `;

                            })
                            .join("");

                }


                // ==================================================
                // DISPLAY DISCLAIMER
                // ==================================================

                if (message) {

                    message.textContent =
                        data.message ||
                        "This is an educational ML prediction and should not be used as a medical diagnosis.";

                }


                // ==================================================
                // SHOW RESULT
                // ==================================================

                if (result) {

                    result.classList.remove("hidden");


                    result.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }


            } catch (error) {

                console.error(
                    "Prediction error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to get prediction."
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
// 20. INITIALIZE
// ============================================================

updateCount();

console.log(
    "QuantumDiagnose JavaScript loaded successfully."
);

console.log(
    "Firebase initialized successfully."
);
