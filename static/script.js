// ============================================================
// QUANTUMDIAGNOSE - COMPLETE UPDATED SCRIPT.JS
// Email/Password Authentication
// Random Forest + Qiskit
// Patient Profile + History + PDF Report
// Phone authentication removed
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
    query,
    where,
    orderBy,
    limit,
    getDocs,
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

window.firebaseAuth = auth;
window.firebaseDB = db;

console.log("Firebase initialized successfully.");


// ============================================================
// HTML ELEMENTS
// ============================================================

// Authentication
const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");

const logoutBtn = document.getElementById("logoutBtn");

const userEmail = document.getElementById("userEmail");

const welcomeName = document.getElementById("welcomeName");


// Navigation
const navItems = document.querySelectorAll(".nav-item");

const goButtons = document.querySelectorAll("[data-go]");

const pageTitle = document.getElementById("pageTitle");


// Dashboard
const predictionCount =
    document.getElementById("predictionCount");

const latestDisease =
    document.getElementById("latestDisease");

const dashboardLatest =
    document.getElementById("dashboardLatest");


// Profile
const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const profileMessage =
    document.getElementById("profileMessage");

const profileName =
    document.getElementById("profileName");

const profileGender =
    document.getElementById("profileGender");

const profileAge =
    document.getElementById("profileAge");

const profileHeight =
    document.getElementById("profileHeight");

const profileWeight =
    document.getElementById("profileWeight");


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


// Prediction result
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


// History
const historyList =
    document.getElementById("historyList");


// Doctors
const doctorList =
    document.getElementById("doctorList");


// Quantum
const quantumBtn =
    document.getElementById("quantumBtn");

const quantumResult =
    document.getElementById("quantumResult");


// Performance
const metricAccuracy =
    document.getElementById("metricAccuracy");

const metricPrecision =
    document.getElementById("metricPrecision");

const metricRecall =
    document.getElementById("metricRecall");

const metricF1 =
    document.getElementById("metricF1");

const trainingSamples =
    document.getElementById("trainingSamples");

const testingSamples =
    document.getElementById("testingSamples");

const symptomTotal =
    document.getElementById("symptomTotal");

const diseaseTotal =
    document.getElementById("diseaseTotal");


// ============================================================
// GLOBAL STATE
// ============================================================

let authMode = "login";

let lastPrediction = null;

let lastPredictionTime = null;

let lastSelectedSymptoms = [];

let lastProfile = null;


// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(text, isError = false) {

    if (!authMessage) return;

    authMessage.textContent = text;

    authMessage.style.color =
        isError ? "#d32f2f" : "#2e7d32";
}


// ============================================================
// AUTH MODE
// ============================================================

function setAuthMode(mode) {

    authMode = mode;

    if (loginTab) {

        loginTab.classList.toggle(
            "active",
            mode === "login"
        );

    }

    if (signupTab) {

        signupTab.classList.toggle(
            "active",
            mode === "signup"
        );

    }

    if (authSubmit) {

        authSubmit.textContent =
            mode === "login"
                ? "Login"
                : "Create Account";

    }

    showAuthMessage("");
}


// ============================================================
// SHOW APP
// ============================================================

async function showApp(user) {

    if (authScreen) {

        authScreen.classList.add("hidden");

    }

    if (app) {

        app.classList.remove("hidden");

    }

    if (userEmail) {

        userEmail.textContent =
            user.email || "";

    }

    const profile =
        loadLocalProfile(user.uid);

    if (profile) {

        lastProfile = profile;

        fillProfileForm(profile);

        if (welcomeName) {

            welcomeName.textContent =
                profile.name;

        }

    } else {

        if (welcomeName) {

            welcomeName.textContent =
                user.email
                    ? user.email.split("@")[0]
                    : "Patient";

        }

    }

    await loadHistory();

    await loadDashboardStats();

}


// ============================================================
// SHOW AUTH SCREEN
// ============================================================

function showAuthScreen() {

    if (app) {

        app.classList.add("hidden");

    }

    if (authScreen) {

        authScreen.classList.remove("hidden");

    }

    if (authEmail) {

        authEmail.value = "";

    }

    if (authPassword) {

        authPassword.value = "";

    }

    setAuthMode("login");

}


// ============================================================
// AUTHENTICATION
// ============================================================

async function handleEmailAuthentication() {

    if (!authEmail || !authPassword) {

        console.error(
            "Authentication fields not found."
        );

        return;

    }

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


    if (authSubmit) {

        authSubmit.disabled = true;

        authSubmit.textContent =
            "Please wait...";

    }


    try {

        if (authMode === "login") {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        } else {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        }

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


            case "auth/network-request-failed":

                errorMessage =
                    "Network error. Check your internet connection.";

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

            authSubmit.disabled = false;

            authSubmit.textContent =
                authMode === "login"
                    ? "Login"
                    : "Create Account";

        }

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

            showApp(user);

        } else {

            showAuthScreen();

        }

    }
);


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(auth);

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
// NAVIGATION
// ============================================================

function goToPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(function (page) {

            page.classList.remove(
                "active-page"
            );

        });


    const target =
        document.getElementById(pageId);


    if (target) {

        target.classList.add(
            "active-page"
        );

    }


    navItems.forEach(function (item) {

        item.classList.toggle(
            "active",
            item.dataset.page === pageId
        );

    });


    if (pageTitle) {

        const titles = {

            dashboard:
                "Dashboard",

            profile:
                "Patient Profile",

            prediction:
                "New Prediction",

            history:
                "Prediction History",

            doctors:
                "Recommended Doctors",

            quantum:
                "Quantum Analysis",

            comparison:
                "Model Comparison",

            performance:
                "Performance"

        };


        pageTitle.textContent =
            titles[pageId] || pageId;

    }


    if (pageId === "history") {

        loadHistory();

    }


    if (pageId === "doctors") {

        loadDoctors();

    }


    if (pageId === "performance") {

        loadPerformance();

    }

}


navItems.forEach(function (item) {

    item.addEventListener(
        "click",
        function () {

            goToPage(
                item.dataset.page
            );

        }
    );

});


goButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            goToPage(
                button.dataset.go
            );

        }
    );

});


// ============================================================
// PATIENT PROFILE - LOCAL STORAGE
// ============================================================

function profileStorageKey(uid) {

    return (
        "quantumdiagnose_profile_" +
        uid
    );

}


function loadLocalProfile(uid) {

    try {

        const saved =
            localStorage.getItem(
                profileStorageKey(uid)
            );

        if (!saved) return null;

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Profile read error:",
            error
        );

        return null;

    }

}


function saveLocalProfile(profile) {

    try {

        localStorage.setItem(
            profileStorageKey(profile.userId),
            JSON.stringify(profile)
        );

    } catch (error) {

        console.error(
            "Profile storage error:",
            error
        );

    }

}


function fillProfileForm(profile) {

    if (!profile) return;


    if (profileName) {

        profileName.value =
            profile.name || "";

    }


    if (profileGender) {

        profileGender.value =
            profile.gender || "";

    }


    if (profileAge) {

        profileAge.value =
            profile.age || "";

    }


    if (profileHeight) {

        profileHeight.value =
            profile.height || "";

    }


    if (profileWeight) {

        profileWeight.value =
            profile.weight || "";

    }

}


// ============================================================
// SAVE PROFILE
// ============================================================

if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        async function () {

            const user =
                auth.currentUser;


            if (!user) {

                showProfileMessage(
                    "Please login first.",
                    true
                );

                return;

            }


            const name =
                profileName
                    ? profileName.value.trim()
                    : "";

            const gender =
                profileGender
                    ? profileGender.value
                    : "";

            const age =
                profileAge
                    ? profileAge.value.trim()
                    : "";

            const height =
                profileHeight
                    ? profileHeight.value.trim()
                    : "";

            const weight =
                profileWeight
                    ? profileWeight.value.trim()
                    : "";


            if (
                !name ||
                !gender ||
                !age ||
                !height ||
                !weight
            ) {

                showProfileMessage(
                    "Please complete all required profile fields.",
                    true
                );

                return;

            }


            const profile = {

                userId:
                    user.uid,

                name:
                    name,

                gender:
                    gender,

                age:
                    age,

                height:
                    height,

                weight:
                    weight,

                updatedAt:
                    new Date().toISOString()

            };


            lastProfile =
                profile;


            saveLocalProfile(
                profile
            );


            if (welcomeName) {

                welcomeName.textContent =
                    name;

            }


            showProfileMessage(
                "Patient profile saved successfully."
            );


            /*
             * Also try Firestore.
             * Local storage remains the primary
             * profile source so the application
             * continues working if Firestore
             * rules do not allow profile writes.
             */

            try {

                await addDoc(
                    collection(
                        db,
                        "profiles"
                    ),
                    {
                        ...profile,
                        updatedAt:
                            serverTimestamp()
                    }
                );

            } catch (error) {

                console.warn(
                    "Firestore profile save skipped:",
                    error.message
                );

            }

        }
    );

}


function showProfileMessage(
    text,
    isError = false
) {

    if (!profileMessage) return;

    profileMessage.textContent =
        text;

    profileMessage.style.color =
        isError
            ? "#d32f2f"
            : "#2e7d32";

}


// ============================================================
// PROFILE CHECK
// ============================================================

function hasCompleteProfile() {

    const user =
        auth.currentUser;


    if (!user) return false;


    const profile =
        loadLocalProfile(user.uid);


    if (!profile) return false;


    return Boolean(

        profile.name &&
        profile.gender &&
        profile.age &&
        profile.height &&
        profile.weight

    );

}


// ============================================================
// SYMPTOMS
// ============================================================

function getSymptomCheckboxes() {

    return document.querySelectorAll(
        '#symptomGrid input[type="checkbox"]'
    );

}


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
// SEARCH
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
                            symptom.textContent ||
                            ""
                        )
                            .toLowerCase();


                    symptom.style.display =
                        name.includes(searchText)
                            ? ""
                            : "none";

                }
            );

        }
    );

}


// ============================================================
// CLEAR
// ============================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            getSymptomCheckboxes()
                .forEach(
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


            document
                .querySelectorAll(
                    "#symptomGrid .symptom"
                )
                .forEach(
                    function (symptom) {

                        symptom.style.display =
                            "";

                    }
                );

        }
    );

}


// ============================================================
// GET SELECTED SYMPTOMS
// ============================================================

function getSelectedSymptoms() {

    const selected = [];


    getSymptomCheckboxes()
        .forEach(
            function (box) {

                if (box.checked) {

                    selected.push(
                        box.value
                    );

                }

            }
        );


    return selected;

}


// ============================================================
// DATE / TIME
// ============================================================

function formatDateTime(date) {

    if (!date) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);

}


// ============================================================
// ADD PREDICTION DATE/TIME TO RESULT
// ============================================================

function showPredictionDateTime(date) {

    let element =
        document.getElementById(
            "predictionDateTime"
        );


    if (!element && result) {

        const header =
            result.querySelector(
                ".result-header"
            );


        if (header) {

            element =
                document.createElement(
                    "div"
                );

            element.id =
                "predictionDateTime";

            element.className =
                "prediction-date-time";

            header.appendChild(
                element
            );

        }

    }


    if (element) {

        element.textContent =
            "Prediction date & time: " +
            formatDateTime(date);

    }

}


// ============================================================
// MAKE PREDICTION
// ============================================================

async function makePrediction() {

    const selectedSymptoms =
        getSelectedSymptoms();


    if (!auth.currentUser) {

        alert(
            "Please login before making a prediction."
        );

        return;

    }


    /*
     * Patient profile is mandatory.
     */

    if (!hasCompleteProfile()) {

        alert(
            "Please complete and save your Patient Profile before making a prediction."
        );

        goToPage("profile");

        return;

    }


    if (
        selectedSymptoms.length === 0
    ) {

        alert(
            "Please select at least one symptom."
        );

        return;

    }


    if (predictBtn) {

        predictBtn.disabled = true;

        predictBtn.textContent =
            "Analyzing...";

    }


    const predictionDate =
        new Date();


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


        lastPrediction =
            data;

        lastPredictionTime =
            predictionDate;

        lastSelectedSymptoms =
            [...selectedSymptoms];


        displayPrediction(
            data,
            predictionDate
        );


        await savePrediction(
            selectedSymptoms,
            data,
            predictionDate
        );


        updateDashboardAfterPrediction(
            data,
            predictionDate
        );


        if (result) {

            result.scrollIntoView({
                behavior: "smooth",
                block: "start"
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

        if (predictBtn) {

            predictBtn.disabled = false;

            predictBtn.textContent =
                "Analyze Symptoms";

        }

    }

}


// ============================================================
// DISPLAY PREDICTION
// ============================================================

function displayPrediction(
    data,
    predictionDate
) {

    if (result) {

        result.classList.remove(
            "hidden"
        );

    }


    if (disease) {

        disease.textContent =
            data.disease ||
            data.rf_disease ||
            "Unknown";

    }


    const confidence =
        Number(
            data.confidence ??
            data.rf_confidence ??
            0
        );


    if (confidenceText) {

        confidenceText.textContent =
            confidence + "%";

    }


    if (confidenceBar) {

        confidenceBar.style.width =
            Math.max(
                0,
                Math.min(
                    100,
                    confidence
                )
            ) + "%";

    }


    showPredictionDateTime(
        predictionDate
    );


    displayTopPredictions(
        data.top_predictions
    );


    if (message) {

        message.textContent =
            data.message ||
            "Educational symptom-analysis result. This is not a medical diagnosis.";

    }


    displayQuantumResult(
        data
    );


    displayDoctorRecommendation(
        data
    );


    addReportButton();


    updateComparison(
        data
    );

}


// ============================================================
// TOP 5 PREDICTIONS
// ============================================================

function displayTopPredictions(
    predictions
) {

    if (!topPredictions) return;


    topPredictions.innerHTML =
        "";


    if (
        !Array.isArray(predictions) ||
        predictions.length === 0
    ) {

        topPredictions.textContent =
            "No additional predictions available.";

        return;

    }


    predictions.forEach(
        function (item, index) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "prediction-item";


            const name =
                document.createElement(
                    "span"
                );


            name.textContent =
                `${index + 1}. ${
                    item.disease ||
                    "Unknown"
                }`;


            const score =
                document.createElement(
                    "strong"
                );


            score.textContent =
                `${
                    Number(
                        item.confidence || 0
                    )
                }%`;


            row.appendChild(name);

            row.appendChild(score);


            topPredictions.appendChild(
                row
            );

        }
    );

}


// ============================================================
// QISKIT RESULT
// ============================================================

function displayQuantumResult(
    data
) {

    const score =
        Number(
            data.quantum_score ??
            data.qiskit_score ??
            0
        );


    const quantumText =
        document.getElementById(
            "quantumScore"
        );


    const quantumScoreText =
        document.getElementById(
            "quantumScoreText"
        );


    const quantumScoreBar =
        document.getElementById(
            "quantumScoreBar"
        );


    const quantumQubits =
        document.getElementById(
            "quantumQubits"
        );


    const quantumDepth =
        document.getElementById(
            "quantumDepth"
        );


    const quantumInterpretation =
        document.getElementById(
            "quantumInterpretation"
        );


    if (quantumText) {

        quantumText.textContent =
            score + "%";

    }


    if (quantumScoreText) {

        quantumScoreText.textContent =
            score + "%";

    }


    if (quantumScoreBar) {

        quantumScoreBar.style.width =
            Math.max(
                0,
                Math.min(
                    100,
                    score
                )
            ) + "%";

    }


    if (quantumQubits) {

        quantumQubits.textContent =
            data.qiskit_qubits ??
            "—";

    }


    if (quantumDepth) {

        quantumDepth.textContent =
            data.qiskit_depth ??
            "—";

    }


    if (quantumInterpretation) {

        quantumInterpretation.textContent =
            data.quantum_message ||
            data.message ||
            "Experimental Qiskit result.";

    }


    if (quantumResult) {

        quantumResult.innerHTML = `

            <p>
                <strong>Qubits used:</strong>
                ${data.qiskit_qubits ?? "—"}
            </p>

            <p>
                <strong>Circuit depth:</strong>
                ${data.qiskit_depth ?? "—"}
            </p>

            <p>
                <strong>Quantum score:</strong>
                ${score}%
            </p>

            <p>
                ${
                    data.quantum_message ||
                    "Experimental Qiskit score."
                }
            </p>

        `;

    }

}


// ============================================================
// DOCTOR RECOMMENDATION
// ============================================================

function displayDoctorRecommendation(
    data
) {

    const doctors =
        Array.isArray(data.doctors)
            ? data.doctors
            : [];


    let container =
        document.getElementById(
            "recommendedDoctors"
        );


    if (!container && result) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "recommendedDoctors";

        container.className =
            "doctor-list";


        result.appendChild(
            container
        );

    }


    if (!container) return;


    container.innerHTML =
        "";


    const specialty =
        data.specialty ||
        "Specialist";


    const heading =
        document.createElement(
            "h4"
        );


    heading.textContent =
        "Recommended: " +
        specialty;


    container.appendChild(
        heading
    );


    if (doctors.length === 0) {

        const text =
            document.createElement(
                "p"
            );

        text.textContent =
            "No specific doctor information available.";

        container.appendChild(
            text
        );

        return;

    }


    doctors.forEach(
        function (doctor) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "doctor-card";


            const name =
                document.createElement(
                    "h4"
                );


            name.textContent =
                doctor.name ||
                "Doctor";


            const specialization =
                document.createElement(
                    "p"
                );


            specialization.textContent =
                doctor.specialization ||
                specialty;


            const hospital =
                document.createElement(
                    "p"
                );


            hospital.textContent =
                doctor.hospital
                    ? `${doctor.hospital}${
                        doctor.location
                            ? ", " +
                              doctor.location
                            : ""
                    }`
                    : "";


            const experience =
                document.createElement(
                    "p"
                );


            if (doctor.experience) {

                experience.textContent =
                    "Experience: " +
                    doctor.experience;

            }


            card.appendChild(name);

            card.appendChild(
                specialization
            );

            if (hospital.textContent) {

                card.appendChild(
                    hospital
                );

            }


            if (experience.textContent) {

                card.appendChild(
                    experience
                );

            }


            container.appendChild(
                card
            );

        }
    );

}


// ============================================================
// SAVE PREDICTION TO FIRESTORE
// ============================================================

async function savePrediction(
    selectedSymptoms,
    data,
    predictionDate
) {

    const user =
        auth.currentUser;


    if (!user) return;


    const predictionData = {

        userId:
            user.uid,

        userEmail:
            user.email || null,

        symptoms:
            selectedSymptoms,

        disease:
            data.disease ||
            data.rf_disease ||
            null,

        confidence:
            data.confidence ??
            data.rf_confidence ??
            0,

        rfConfidence:
            data.rf_confidence ??
            data.confidence ??
            0,

        qiskitScore:
            data.qiskit_score ??
            data.quantum_score ??
            0,

        qiskitQubits:
            data.qiskit_qubits ??
            null,

        qiskitDepth:
            data.qiskit_depth ??
            null,

        modelAgreement:
            data.model_agreement ||
            null,

        specialty:
            data.specialty ||
            null,

        topPredictions:
            data.top_predictions ||
            [],

        createdAt:
            serverTimestamp(),

        predictionDate:
            predictionDate.toISOString()

    };


    try {

        await addDoc(
            collection(
                db,
                "predictions"
            ),
            predictionData
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
// HISTORY
// ============================================================

async function loadHistory() {

    const user =
        auth.currentUser;


    if (
        !user ||
        !historyList
    ) {

        return;

    }


    try {

        const q =
            query(
                collection(
                    db,
                    "predictions"
                ),

                where(
                    "userId",
                    "==",
                    user.uid
                ),

                orderBy(
                    "createdAt",
                    "desc"
                ),

                limit(20)
            );


        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {

            historyList.innerHTML =
                '<p class="muted">No predictions yet.</p>';

            if (predictionCount) {

                predictionCount.textContent =
                    "0";

            }

            return;

        }


        historyList.innerHTML =
            "";


        let items = 0;


        snapshot.forEach(
            function (docSnap) {

                const entry =
                    docSnap.data();


                items++;


                const item =
                    createHistoryItem(
                        entry
                    );


                historyList.appendChild(
                    item
                );

            }
        );


        if (predictionCount) {

            predictionCount.textContent =
                String(items);

        }


    } catch (error) {

        console.error(
            "History load error:",
            error
        );


        /*
         * Firestore may require an index for
         * where + orderBy.
         *
         * Fall back to a simpler query.
         */

        try {

            const fallbackQuery =
                query(
                    collection(
                        db,
                        "predictions"
                    ),

                    where(
                        "userId",
                        "==",
                        auth.currentUser.uid
                    ),

                    limit(20)
                );


            const fallbackSnapshot =
                await getDocs(
                    fallbackQuery
                );


            if (
                fallbackSnapshot.empty
            ) {

                historyList.innerHTML =
                    '<p class="muted">No predictions yet.</p>';

                return;

            }


            const records = [];


            fallbackSnapshot.forEach(
                function (docSnap) {

                    records.push(
                        docSnap.data()
                    );

                }
            );


            records.sort(
                function (a, b) {

                    return (
                        getEntryDate(b) -
                        getEntryDate(a)
                    );

                }
            );


            historyList.innerHTML =
                "";


            records.forEach(
                function (entry) {

                    historyList.appendChild(
                        createHistoryItem(
                            entry
                        )
                    );

                }
            );


            if (predictionCount) {

                predictionCount.textContent =
                    String(records.length);

            }


        } catch (fallbackError) {

            console.error(
                "History fallback error:",
                fallbackError
            );


            historyList.innerHTML =
                '<p class="muted">Could not load prediction history.</p>';

        }

    }

}


// ============================================================
// HISTORY DATE
// ============================================================

function getEntryDate(entry) {

    if (
        entry.predictionDate
    ) {

        const date =
            new Date(
                entry.predictionDate
            );


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date;

        }

    }


    if (
        entry.createdAt &&
        typeof entry.createdAt.toDate ===
            "function"
    ) {

        return entry.createdAt.toDate();

    }


    return new Date();

}


// ============================================================
// CREATE HISTORY ITEM
// ============================================================

function createHistoryItem(
    entry
) {

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "history-item";


    const date =
        getEntryDate(entry);


    const diseaseName =
        entry.disease ||
        "Unknown";


    const confidence =
        Number(
            entry.confidence || 0
        );


    const top =
        Array.isArray(
            entry.topPredictions
        )
            ? entry.topPredictions
            : [];


    div.innerHTML = `

        <div class="history-item-top">

            <div>

                <h3>
                    ${escapeHtml(
                        diseaseName
                    )}
                </h3>

                <div class="history-date-time">

                    Prediction date & time:
                    ${escapeHtml(
                        formatDateTime(date)
                    )}

                </div>

            </div>

            <strong>
                ${confidence}%
            </strong>

        </div>


        <div class="history-symptoms">

            <strong>
                Symptoms:
            </strong>

            ${escapeHtml(
                (
                    entry.symptoms || []
                ).join(", ")
            )}

        </div>


        ${
            top.length
                ? `
                    <div class="history-symptoms">

                        <strong>
                            Top prediction:
                        </strong>

                        ${escapeHtml(
                            top[0].disease ||
                            ""
                        )}
                        -
                        ${Number(
                            top[0].confidence || 0
                        )}%

                    </div>
                  `
                : ""
        }

    `;


    return div;

}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboardStats() {

    await loadHistory();

}


function updateDashboardAfterPrediction(
    data,
    date
) {

    const predictedDisease =
        data.disease ||
        data.rf_disease ||
        "Unknown";


    const confidence =
        Number(
            data.confidence ??
            data.rf_confidence ??
            0
        );


    if (latestDisease) {

        latestDisease.textContent =
            predictedDisease;

    }


    if (dashboardLatest) {

        dashboardLatest.innerHTML = `

            <strong>
                ${escapeHtml(
                    predictedDisease
                )}
            </strong>

            <br>

            Confidence:
            ${confidence}%

            <br>

            <small>
                ${escapeHtml(
                    formatDateTime(date)
                )}
            </small>

        `;

    }

}


// ============================================================
// DOCTORS
// ============================================================

async function loadDoctors() {

    if (!doctorList) return;


    try {

        const response =
            await fetch(
                "/doctors"
            );


        const data =
            await response.json();


        doctorList.innerHTML =
            "";


        const doctors =
            Array.isArray(
                data.doctors
            )
                ? data.doctors
                : [];


        if (doctors.length === 0) {

            doctorList.innerHTML =
                "<p>No doctors available.</p>";

            return;

        }


        doctors.forEach(
            function (doctor) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "doctor-card";


                const name =
                    document.createElement(
                        "h4"
                    );


                name.textContent =
                    doctor.name ||
                    "Doctor";


                const specialization =
                    document.createElement(
                        "p"
                    );


                specialization.textContent =
                    doctor.specialization ||
                    "";


                const hospital =
                    document.createElement(
                        "p"
                    );


                hospital.textContent =
                    doctor.hospital
                        ? `${doctor.hospital}${
                            doctor.location
                                ? ", " +
                                  doctor.location
                                : ""
                        }`
                        : "";


                const experience =
                    document.createElement(
                        "p"
                    );


                experience.textContent =
                    doctor.experience
                        ? "Experience: " +
                          doctor.experience
                        : "";


                card.appendChild(name);

                card.appendChild(
                    specialization
                );

                if (hospital.textContent) {

                    card.appendChild(
                        hospital
                    );

                }


                if (experience.textContent) {

                    card.appendChild(
                        experience
                    );

                }


                doctorList.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "Doctors load error:",
            error
        );


        doctorList.innerHTML =
            "<p>Could not load doctors.</p>";

    }

}


// ============================================================
// PERFORMANCE
// ============================================================

async function loadPerformance() {

    try {

        const response =
            await fetch(
                "/performance"
            );


        const data =
            await response.json();


        if (metricAccuracy) {

            metricAccuracy.textContent =
                `${data.accuracy ?? 0}%`;

        }


        if (metricPrecision) {

            metricPrecision.textContent =
                `${data.precision ?? 0}%`;

        }


        if (metricRecall) {

            metricRecall.textContent =
                `${data.recall ?? 0}%`;

        }


        if (metricF1) {

            metricF1.textContent =
                `${data.f1 ?? 0}%`;

        }


        if (trainingSamples) {

            trainingSamples.textContent =
                data.training_samples ??
                "—";

        }


        if (testingSamples) {

            testingSamples.textContent =
                data.testing_samples ??
                "—";

        }


        if (symptomTotal) {

            symptomTotal.textContent =
                data.number_of_symptoms ??
                "—";

        }


        if (diseaseTotal) {

            diseaseTotal.textContent =
                data.number_of_diseases ??
                "—";

        }


    } catch (error) {

        console.error(
            "Performance load error:",
            error
        );

    }

}


// ============================================================
// QUANTUM PAGE BUTTON
// ============================================================

if (quantumBtn) {

    quantumBtn.addEventListener(
        "click",
        async function () {

            const selectedSymptoms =
                getSelectedSymptoms();


            if (
                selectedSymptoms.length ===
                0
            ) {

                alert(
                    "Please select symptoms on the Prediction page first."
                );

                return;

            }


            quantumBtn.disabled =
                true;


            quantumBtn.textContent =
                "Running...";


            try {

                /*
                 * The current backend performs
                 * Qiskit analysis as part of
                 * /predict, so call /predict
                 * here as well.
                 */

                const response =
                    await fetch(
                        "/predict",
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
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
                        "Quantum analysis failed."
                    );

                }


                displayQuantumResult(
                    data
                );


            } catch (error) {

                console.error(
                    "Quantum error:",
                    error
                );


                if (quantumResult) {

                    quantumResult.textContent =
                        "Quantum analysis failed: " +
                        error.message;

                }

            } finally {

                quantumBtn.disabled =
                    false;

                quantumBtn.textContent =
                    "Run Quantum Analysis";

            }

        }
    );

}


// ============================================================
// MODEL COMPARISON
// ============================================================

function updateComparison(data) {

    const comparisonRF =
        document.getElementById(
            "comparisonRF"
        );


    const comparisonQuantum =
        document.getElementById(
            "comparisonQuantum"
        );


    const comparisonDisease =
        document.getElementById(
            "comparisonDisease"
        );


    if (comparisonRF) {

        comparisonRF.textContent =
            `${Number(
                data.rf_confidence ??
                data.confidence ??
                0
            )}%`;

    }


    if (comparisonQuantum) {

        comparisonQuantum.textContent =
            `${Number(
                data.qiskit_score ??
                data.quantum_score ??
                0
            )}%`;

    }


    if (comparisonDisease) {

        comparisonDisease.textContent =
            data.disease ||
            data.rf_disease ||
            "—";

    }

}


// ============================================================
// DOWNLOAD REPORT PDF
// ============================================================

function addReportButton() {

    if (!result) return;


    let button =
        document.getElementById(
            "downloadReportBtn"
        );


    if (button) return;


    button =
        document.createElement(
            "button"
        );


    button.id =
        "downloadReportBtn";


    button.className =
        "primary download-report";


    button.type =
        "button";


    button.textContent =
        "Download Report PDF";


    button.addEventListener(
        "click",
        downloadReportPDF
    );


    result.appendChild(
        button
    );

}


// ============================================================
// PDF REPORT
// ============================================================

async function downloadReportPDF() {

    if (!lastPrediction) {

        alert(
            "Please make a prediction first."
        );

        return;

    }


    const button =
        document.getElementById(
            "downloadReportBtn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Preparing PDF...";

    }


    try {

        /*
         * Load jsPDF only when needed.
         * This keeps the normal application
         * lightweight.
         */

        if (!window.jspdf) {

            await loadScript(
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
            );

        }


        const jsPDF =
            window.jspdf.jsPDF;


        const doc =
            new jsPDF();


        const profile =
            lastProfile ||
            loadLocalProfile(
                auth.currentUser?.uid
            );


        const prediction =
            lastPrediction;


        const date =
            lastPredictionTime ||
            new Date();


        let y =
            20;


        function line(
            text,
            size = 11,
            bold = false
        ) {

            doc.setFontSize(
                size
            );

            doc.setFont(
                "helvetica",
                bold
                    ? "bold"
                    : "normal"
            );


            const lines =
                doc.splitTextToSize(
                    String(text),
                    170
                );


            doc.text(
                lines,
                20,
                y
            );


            y +=
                (lines.length * 6) +
                4;


            if (y > 275) {

                doc.addPage();

                y = 20;

            }

        }


        line(
            "QuantumDiagnose",
            20,
            true
        );


        line(
            "Health Prediction Report",
            14,
            true
        );


        y += 4;


        line(
            "Patient Information",
            14,
            true
        );


        line(
            `Name: ${
                profile?.name ||
                "—"
            }`
        );


        line(
            `Gender: ${
                profile?.gender ||
                "—"
            }`
        );


        line(
            `Age: ${
                profile?.age ||
                "—"
            }`
        );


        line(
            `Height: ${
                profile?.height ||
                "—"
            } cm`
        );


        line(
            `Weight: ${
                profile?.weight ||
                "—"
            } kg`
        );


        y += 4;


        line(
            "Prediction Details",
            14,
            true
        );


        line(
            `Prediction Date & Time: ${
                formatDateTime(date)
            }`
        );


        line(
            `Random Forest Prediction: ${
                prediction.disease ||
                prediction.rf_disease ||
                "Unknown"
            }`
        );


        line(
            `Random Forest Confidence: ${
                prediction.confidence ??
                prediction.rf_confidence ??
                0
            }%`
        );


        line(
            `Qiskit Score: ${
                prediction.qiskit_score ??
                prediction.quantum_score ??
                0
            }%`
        );


        line(
            `Qiskit Qubits: ${
                prediction.qiskit_qubits ??
                "—"
            }`
        );


        line(
            `Circuit Depth: ${
                prediction.qiskit_depth ??
                "—"
            }`
        );


        line(
            `Model Agreement: ${
                prediction.model_agreement ||
                "—"
            }`
        );


        y += 4;


        line(
            "Selected Symptoms",
            14,
            true
        );


        line(
            (
                lastSelectedSymptoms || []
            ).join(", ") ||
            "—"
        );


        y += 4;


        line(
            "Top Predictions",
            14,
            true
        );


        if (
            Array.isArray(
                prediction.top_predictions
            )
        ) {

            prediction.top_predictions
                .slice(0, 5)
                .forEach(
                    function (item, index) {

                        line(
                            `${index + 1}. ${
                                item.disease
                            } - ${
                                item.confidence
                            }%`
                        );

                    }
                );

        }


        y += 4;


        line(
            "Doctor Recommendation",
            14,
            true
        );


        line(
            `Specialty: ${
                prediction.specialty ||
                "—"
            }`
        );


        if (
            Array.isArray(
                prediction.doctors
            )
        ) {

            prediction.doctors
                .slice(0, 5)
                .forEach(
                    function (doctor) {

                        line(
                            `${doctor.name || "Doctor"} - ${
                                doctor.specialization || ""
                            }`
                        );

                    }
                );

        }


        y += 5;


        line(
            "Educational project only. This report does not constitute a medical diagnosis.",
            9,
            false
        );


        doc.save(
            "QuantumDiagnose_Report.pdf"
        );


    } catch (error) {

        console.error(
            "PDF generation error:",
            error
        );


        alert(
            "Could not generate PDF. " +
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Download Report PDF";

        }

    }

}


// ============================================================
// LOAD EXTERNAL SCRIPT
// ============================================================

function loadScript(src) {

    return new Promise(
        function (resolve, reject) {

            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );


            if (existing) {

                if (window.jspdf) {

                    resolve();

                } else {

                    existing.addEventListener(
                        "load",
                        resolve
                    );

                    existing.addEventListener(
                        "error",
                        reject
                    );

                }

                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;


            script.onload =
                resolve;


            script.onerror =
                function () {

                    reject(
                        new Error(
                            "Could not load PDF library."
                        )
                    );

                };


            document.head.appendChild(
                script
            );

        }
    );

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// EVENT LISTENERS
// ============================================================

if (loginTab) {

    loginTab.addEventListener(
        "click",
        function () {

            setAuthMode(
                "login"
            );

        }
    );

}


if (signupTab) {

    signupTab.addEventListener(
        "click",
        function () {

            setAuthMode(
                "signup"
            );

        }
    );

}


if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        handleEmailAuthentication
    );

}


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


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logoutUser
    );

}


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

setAuthMode("login");

console.log(
    "QuantumDiagnose updated script.js loaded successfully."
);
