// ============================================================
// QuantumDiagnose - Firebase Configuration
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
// YOUR CURRENT FIREBASE CONFIG
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

console.log("Firebase initialized successfully.");


// ============================================================
// HTML ELEMENTS
// ============================================================

const loginBtn =
    document.getElementById("loginBtn");

const signupBtn =
    document.getElementById("signupBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const authModal =
    document.getElementById("authModal");

const closeModal =
    document.getElementById("closeModal");

const authTitle =
    document.getElementById("authTitle");

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const authSubmit =
    document.getElementById("authSubmit");

const authMessage =
    document.getElementById("authMessage");


// ============================================================
// AUTH MODE
// ============================================================

let authMode = "login";


// ============================================================
// SHOW MESSAGE
// ============================================================

function showAuthMessage(text, error = false) {

    if (!authMessage) return;

    authMessage.textContent = text;

    authMessage.style.color =
        error ? "#d32f2f" : "#2e7d32";
}


// ============================================================
// OPEN LOGIN / SIGNUP
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

    showAuthMessage("");

    if (authEmail) authEmail.value = "";
    if (authPassword) authPassword.value = "";
}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeAuthModal() {

    if (authModal) {
        authModal.classList.add("hidden");
    }

    showAuthMessage("");
}


// ============================================================
// LOGIN / SIGNUP
// ============================================================

async function handleAuthentication() {

    const email =
        authEmail.value.trim();

    const password =
        authPassword.value;

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

    showAuthMessage("Connecting to Firebase...");


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


        setTimeout(() => {

            closeAuthModal();

        }, 1000);


    } catch (error) {

        console.error(
            "Firebase authentication error:",
            error
        );

        let text = "Authentication failed.";

        switch (error.code) {

            case "auth/invalid-email":
                text = "Invalid email address.";
                break;

            case "auth/user-not-found":
                text = "No account found with this email.";
                break;

            case "auth/wrong-password":
                text = "Incorrect password.";
                break;

            case "auth/invalid-credential":
                text = "Invalid email or password.";
                break;

            case "auth/email-already-in-use":
                text = "This email is already registered. Please login.";
                break;

            case "auth/weak-password":
                text = "Password must contain at least 6 characters.";
                break;

            case "auth/too-many-requests":
                text = "Too many attempts. Please try again later.";
                break;

            case "auth/api-key-not-valid":
                text =
                    "Firebase API key is not valid. Check Firebase Project Settings.";
                break;

            default:
                text = error.message;
        }

        showAuthMessage(text, true);

    } finally {

        authSubmit.disabled = false;

        authSubmit.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";
    }
}


// ============================================================
// BUTTON EVENTS
// ============================================================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        () => openAuthModal("login")
    );
}


if (signupBtn) {

    signupBtn.addEventListener(
        "click",
        () => openAuthModal("signup")
    );
}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                console.log(
                    "Logged out successfully."
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}


if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeAuthModal
    );
}


if (authModal) {

    authModal.addEventListener(
        "click",
        event => {

            if (event.target === authModal) {

                closeAuthModal();
            }
        }
    );
}


if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        handleAuthentication
    );
}


if (authPassword) {

    authPassword.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                handleAuthentication();
            }
        }
    );
}


// ============================================================
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    user => {

        if (user) {

            console.log(
                "Logged in:",
                user.email
            );

            if (loginBtn)
                loginBtn.classList.add("hidden");

            if (signupBtn)
                signupBtn.classList.add("hidden");

            if (logoutBtn)
                logoutBtn.classList.remove("hidden");

        } else {

            console.log(
                "No user logged in."
            );

            if (loginBtn)
                loginBtn.classList.remove("hidden");

            if (signupBtn)
                signupBtn.classList.remove("hidden");

            if (logoutBtn)
                logoutBtn.classList.add("hidden");
        }
    }
);


// ============================================================
// SYMPTOM ANALYSIS
// ============================================================

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
// COUNT SYMPTOMS
// ============================================================

function updateCount() {

    if (!symptomGrid || !count)
        return;

    const boxes =
        symptomGrid.querySelectorAll(
            'input[type="checkbox"]'
        );

    let selected = 0;

    boxes.forEach(box => {

        if (box.checked)
            selected++;
    });

    count.textContent = selected;
}


// ============================================================
// SYMPTOM EVENTS
// ============================================================

if (symptomGrid) {

    symptomGrid
        .querySelectorAll(
            'input[type="checkbox"]'
        )
        .forEach(box => {

            box.addEventListener(
                "change",
                updateCount
            );
        });
}


// ============================================================
// SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        event => {

            const text =
                event.target.value
                    .toLowerCase()
                    .trim();

            document
                .querySelectorAll(".symptom")
                .forEach(item => {

                    const name =
                        item.dataset.name
                            .toLowerCase();

                    item.style.display =
                        name.includes(text)
                            ? ""
                            : "none";
                });
        }
    );
}


// ============================================================
// CLEAR
// ============================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    '#symptomGrid input[type="checkbox"]'
                )
                .forEach(box => {

                    box.checked = false;
                });

            updateCount();

            if (result)
                result.classList.add("hidden");

            if (searchInput)
                searchInput.value = "";

            document
                .querySelectorAll(".symptom")
                .forEach(item => {

                    item.style.display = "";
                });
        }
    );
}


// ============================================================
// PREDICTION
// ============================================================

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        async () => {

            const selectedSymptoms = [];

            document
                .querySelectorAll(
                    '#symptomGrid input[type="checkbox"]'
                )
                .forEach(box => {

                    if (box.checked) {

                        selectedSymptoms.push(
                            box.value
                        );
                    }
                });


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


                if (result)
                    result.classList.remove("hidden");


                if (disease)
                    disease.textContent =
                        data.disease || "Unknown";


                const confidence =
                    Number(
                        data.confidence || 0
                    );


                if (confidenceText)
                    confidenceText.textContent =
                        `Confidence: ${confidence}%`;


                if (confidenceBar)
                    confidenceBar.style.width =
                        `${confidence}%`;


                if (topPredictions) {

                    topPredictions.innerHTML = "";

                    if (
                        data.top_predictions &&
                        data.top_predictions.length
                    ) {

                        data.top_predictions.forEach(
                            item => {

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
                }


                if (message) {

                    message.textContent =
                        data.message ||
                        "Educational ML prediction only.";
                }


                // SAVE RESULT TO FIRESTORE

                const user =
                    auth.currentUser;


                if (user) {

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
                                    user.email,

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
                            "Prediction saved."
                        );

                    } catch (firestoreError) {

                        console.error(
                            "Firestore error:",
                            firestoreError
                        );
                    }
                }


                if (result) {

                    result.scrollIntoView({
                        behavior: "smooth"
                    });
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

                predictBtn.disabled = false;

                predictBtn.textContent =
                    "Predict Possible Disease";
            }
        }
    );
}


// ============================================================
// INITIALIZE
// ============================================================

updateCount();

console.log(
    "QuantumDiagnose loaded successfully."
);
