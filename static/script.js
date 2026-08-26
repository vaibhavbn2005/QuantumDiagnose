// ============================================================
// QUANTUMDIAGNOSE
// PROFESSIONAL FRONTEND
// EMAIL/PASSWORD AUTHENTICATION
// ============================================================

import {
    initializeApp
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE
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

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);

window.firebaseAuth = auth;
window.firebaseDB = db;


// ============================================================
// HELPERS
// ============================================================

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDisease(value) {

    return String(value || "—")
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


// ============================================================
// STATE
// ============================================================

let authMode = "login";

let currentUser = null;

let currentProfile = null;

let currentResult = null;

let currentPredictionTime = null;

let historyItems = [];

let emailReportSource = null;


// ============================================================
// AUTH ELEMENTS
// ============================================================

const authScreen =
    $("authScreen");

const app =
    $("app");

const loginTab =
    $("loginTab");

const signupTab =
    $("signupTab");

const authEmail =
    $("authEmail");

const authPassword =
    $("authPassword");

const authSubmit =
    $("authSubmit");

const authMessage =
    $("authMessage");

const logoutBtn =
    $("logoutBtn");

const forgotPasswordBtn =
    $("forgotPasswordBtn");


// ============================================================
// AUTH
// ============================================================

function showAuthMessage(
    text,
    isError = false
) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        text;

    authMessage.className =
        "auth-message " +
        (isError
            ? "error"
            : "success");
}

function setAuthMode(mode) {

    authMode = mode;

    loginTab?.classList.toggle(
        "active",
        mode === "login"
    );

    signupTab?.classList.toggle(
        "active",
        mode === "signup"
    );

    if (authSubmit) {

        authSubmit.textContent =
            mode === "login"
                ? "Login"
                : "Create Account";
    }

    showAuthMessage("");
}

async function handleAuthentication() {

    const email =
        authEmail?.value
            .trim();

    const password =
        authPassword?.value || "";

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

    authSubmit.disabled =
        true;

    authSubmit.textContent =
        "Please wait...";

    showAuthMessage(
        "Processing..."
    );

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
            "Authentication error:",
            error
        );

        let message =
            "Authentication failed.";

        switch (error.code) {

            case "auth/invalid-email":
                message =
                    "Please enter a valid email address.";
                break;

            case "auth/user-not-found":
                message =
                    "No account found with this email.";
                break;

            case "auth/wrong-password":
                message =
                    "Incorrect password.";
                break;

            case "auth/invalid-credential":
                message =
                    "Invalid email or password.";
                break;

            case "auth/email-already-in-use":
                message =
                    "This email is already registered. Please login.";
                break;

            case "auth/weak-password":
                message =
                    "Password must contain at least 6 characters.";
                break;

            case "auth/too-many-requests":
                message =
                    "Too many attempts. Please try again later.";
                break;

            case "auth/network-request-failed":
                message =
                    "Network error. Check your internet connection.";
                break;

            default:
                message =
                    error.message ||
                    message;
        }

        showAuthMessage(
            message,
            true
        );

    } finally {

        authSubmit.disabled =
            false;

        authSubmit.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";
    }
}


// ============================================================
// FORGOT PASSWORD
// ============================================================

async function handleForgotPassword() {

    const email =
        authEmail?.value
            .trim();

    if (!email) {

        showAuthMessage(
            "Enter your email address above, then click 'Forgot password?'.",
            true
        );

        return;
    }

    if (forgotPasswordBtn) {

        forgotPasswordBtn.disabled =
            true;
    }

    showAuthMessage(
        "Sending reset email..."
    );

    try {

        await sendPasswordResetEmail(
            auth,
            email
        );

        showAuthMessage(
            "✓ Password reset email sent. Please check your inbox (and Spam/Junk folder).",
            false
        );

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        let message =
            "Could not send reset email.";

        switch (error.code) {

            case "auth/invalid-email":
                message =
                    "Please enter a valid email address.";
                break;

            case "auth/user-not-found":
                message =
                    "No account found with this email.";
                break;

            case "auth/too-many-requests":
                message =
                    "Too many attempts. Please try again later.";
                break;

            default:
                message =
                    error.message ||
                    message;
        }

        showAuthMessage(
            message,
            true
        );

    } finally {

        if (forgotPasswordBtn) {

            forgotPasswordBtn.disabled =
                false;
        }
    }
}


// ============================================================
// SHOW APP
// ============================================================

async function showApp(user) {

    currentUser =
        user;

    authScreen?.classList.add(
        "hidden"
    );

    app?.classList.remove(
        "hidden"
    );

    if ($("userEmail")) {

        $("userEmail").textContent =
            user.email || "User";
    }

    await loadProfile();

    await loadHistory();

    await loadDoctors();

    await loadPerformance();

    updateDashboard();
}

function showAuthScreen() {

    currentUser =
        null;

    currentProfile =
        null;

    currentResult =
        null;

    app?.classList.add(
        "hidden"
    );

    authScreen?.classList.remove(
        "hidden"
    );

    if (authEmail) {
        authEmail.value = "";
    }

    if (authPassword) {
        authPassword.value = "";
    }

    setAuthMode("login");
}


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
            "Unable to log out. Please try again."
        );
    }
}


// ============================================================
// PROFILE
// ============================================================

async function loadProfile() {

    if (!currentUser) {
        return;
    }

    try {

        const profileRef =
            doc(
                db,
                "users",
                currentUser.uid
            );

        const profileSnap =
            await getDoc(
                profileRef
            );

        if (profileSnap.exists()) {

            currentProfile =
                profileSnap.data();

        } else {

            currentProfile = {

                email:
                    currentUser.email || "",

                name: "",

                age: "",

                gender: ""
            };
        }

        populateProfile();

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );
    }
}


// ============================================================
// POPULATE PROFILE
// ============================================================

function populateProfile() {

    if (!currentProfile) {
        return;
    }

    const name =
        $("profileName");

    const age =
        $("profileAge");

    const gender =
        $("profileGender");

    const email =
        $("profileEmail");

    if (name) {

        name.value =
            currentProfile.name || "";
    }

    if (age) {

        age.value =
            currentProfile.age || "";
    }

    if (gender) {

        gender.value =
            currentProfile.gender || "";
    }

    if (email) {

        email.value =
            currentUser?.email ||
            currentProfile.email ||
            "";
    }
}


// ============================================================
// SAVE PROFILE
// ============================================================

async function saveProfile() {

    if (!currentUser) {
        return;
    }

    const profile = {

        name:
            $("profileName")
                ?.value
                .trim() || "",

        age:
            $("profileAge")
                ?.value
                .trim() || "",

        gender:
            $("profileGender")
                ?.value || "",

        email:
            currentUser.email || "",

        updatedAt:
            serverTimestamp()
    };

    try {

        await setDoc(
            doc(
                db,
                "users",
                currentUser.uid
            ),
            profile,
            {
                merge: true
            }
        );

        currentProfile =
            {
                ...currentProfile,
                ...profile
            };

        const message =
            $("profileMessage");

        if (message) {

            message.textContent =
                "✓ Profile saved successfully.";

            message.className =
                "status-message success";
        }

    } catch (error) {

        console.error(
            "Profile save error:",
            error
        );

        const message =
            $("profileMessage");

        if (message) {

            message.textContent =
                "Unable to save profile.";

            message.className =
                "status-message error";
        }
    }
}


// ============================================================
// PAGE NAMES
// ============================================================

const pageNames = {

    dashboard: {
        title: "Dashboard",
        subtitle: "AI-assisted health analysis"
    },

    prediction: {
        // ONLY REQUESTED WEBSITE CHANGE
        title: "Hybrid Health Analysis",
        subtitle: "AI-assisted health analysis"
    },

    history: {
        title: "Prediction History",
        subtitle: "View your previous health analyses"
    },

    doctors: {
        title: "Doctor Directory",
        subtitle: "Find a suitable medical specialist"
    },

    quantum: {
        title: "Quantum Analysis",
        subtitle: "Experimental quantum health analysis"
    },

    comparison: {
        title: "Model Comparison",
        subtitle: "Compare classical and quantum models"
    },

    performance: {
        title: "Model Performance",
        subtitle: "AI model performance metrics"
    },

    profile: {
        title: "Profile",
        subtitle: "Manage your personal information"
    }
};


// ============================================================
// PAGE NAVIGATION
// ============================================================

function goToPage(
    page
) {

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            element => {

                element.classList.add(
                    "hidden"
                );
            }
        );

    const target =
        $("page-" + page);

    if (target) {

        target.classList.remove(
            "hidden"
        );
    }

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.page ===
                    page
                );
            }
        );

    const config =
        pageNames[page];

    if (config) {

        const title =
            $("pageTitle");

        const subtitle =
            $("pageSubtitle");

        if (title) {

            title.textContent =
                config.title;
        }

        if (subtitle) {

            subtitle.textContent =
                config.subtitle;
        }
    }

    if (page === "dashboard") {

        updateDashboard();
    }

    if (page === "history") {

        renderHistory();
    }

    if (page === "doctors") {

        renderDoctors();
    }

    if (page === "quantum") {

        renderQuantumPage();
    }

    if (page === "comparison") {

        renderModelComparison();
    }

    if (page === "performance") {

        renderPerformancePage();
    }
}


// ============================================================
// SYMPTOMS
// ============================================================

let allSymptoms = [];

function setupSymptoms() {

    const symptomContainer =
        $("symptomList");

    if (!symptomContainer) {
        return;
    }

    const inputs =
        symptomContainer
            .querySelectorAll(
                "input[type='checkbox']"
            );

    allSymptoms =
        Array.from(
            inputs
        ).map(
            input => ({
                element: input,
                text:
                    input.value ||
                    input.dataset.symptom ||
                    input.parentElement
                        ?.textContent
                        ?.trim() ||
                    ""
            })
        );

    inputs.forEach(
        input => {

            input.addEventListener(
                "change",
                updateSelectedSymptoms
            );
        }
    );

    updateSelectedSymptoms();
}


// ============================================================
// SEARCH SYMPTOMS
// ============================================================

function searchSymptoms(
    event
) {

    const searchValue =
        event.target.value
            .trim()
            .toLowerCase();

    allSymptoms.forEach(
        item => {

            const row =
                item.element
                    .closest(
                        "label, .symptom-item"
                    );

            if (!row) {
                return;
            }

            const text =
                item.text
                    .toLowerCase();

            row.style.display =
                text.includes(
                    searchValue
                )
                    ? ""
                    : "none";
        }
    );
}


// ============================================================
// SELECTED SYMPTOMS
// ============================================================

function getSelectedSymptoms() {

    const container =
        $("symptomList");

    if (!container) {
        return [];
    }

    return Array.from(
        container.querySelectorAll(
            "input[type='checkbox']:checked"
        )
    ).map(
        input =>
            input.value ||
            input.dataset.symptom ||
            input.parentElement
                ?.textContent
                ?.trim() ||
            ""
    );
}

function updateSelectedSymptoms() {

    const selected =
        getSelectedSymptoms();

    const count =
        $("symptomCount");

    if (count) {

        count.textContent =
            `${selected.length} selected`;
    }
}


// ============================================================
// CLEAR SYMPTOMS
// ============================================================

function clearSymptoms() {

    document
        .querySelectorAll(
            "#symptomList input[type='checkbox']"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    false;
            }
        );

    updateSelectedSymptoms();

    const search =
        $("search");

    if (search) {
        search.value = "";
    }

    allSymptoms.forEach(
        item => {

            const row =
                item.element
                    .closest(
                        "label, .symptom-item"
                    );

            if (row) {

                row.style.display =
                    "";
            }
        }
    );
}


// ============================================================
// PATIENT INFORMATION
// ============================================================

function getPatientInformation() {

    return {

        name:
            currentProfile?.name ||
            $("profileName")
                ?.value
                ?.trim() ||
            "",

        age:
            currentProfile?.age ||
            $("profileAge")
                ?.value
                ?.trim() ||
            "",

        gender:
            currentProfile?.gender ||
            $("profileGender")
                ?.value ||
            "",

        email:
            currentUser?.email ||
            ""
    };
}


// ============================================================
// PREDICTION
// ============================================================

async function makePrediction() {

    const symptoms =
        getSelectedSymptoms();

    if (
        !symptoms ||
        symptoms.length === 0
    ) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }

    const predictButton =
        $("predictBtn");

    if (predictButton) {

        predictButton.disabled =
            true;

        predictButton.textContent =
            "Analyzing...";
    }

    const patient =
        getPatientInformation();

    try {

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
                                symptoms,

                            patient:
                                patient
                        })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                "Prediction failed."
            );
        }

        currentPredictionTime =
            data.prediction_time ||
            data.predictionTime ||
            new Date().toISOString();

        currentResult = {

            ...data,

            patient:
                patient,

            selected_symptoms:
                data.selected_symptoms ||
                symptoms,

            prediction_time:
                currentPredictionTime
        };

        renderPrediction(
            currentResult
        );

        goToPage(
            "prediction"
        );

    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        alert(
            error.message ||
            "Unable to complete prediction."
        );

    } finally {

        if (predictButton) {

            predictButton.disabled =
                false;

            predictButton.textContent =
                "Analyze Symptoms";
        }
    }
}


// ============================================================
// RENDER PREDICTION
// ============================================================

function renderPrediction(
    result
) {

    if (!result) {
        return;
    }

    const rfDisease =
        result.disease ||
        result.rf_disease ||
        result.random_forest_disease ||
        "—";

    const rfConfidence =
        Number(
            result.confidence ??
            result.rf_confidence ??
            result.random_forest_confidence ??
            0
        );

    const qiskitDisease =
        result.qiskit_disease ||
        result.qiskitDisease ||
        result.quantum_disease ||
        "—";

    const qiskitConfidence =
        Number(
            result.qiskit_confidence ??
            result.qiskitConfidence ??
            0
        );

    const finalDisease =
        result.hybrid_disease ||
        result.hybridDisease ||
        result.final_prediction ||
        result.finalPrediction ||
        rfDisease;

    const finalConfidence =
        Number(
            result.hybrid_confidence ??
            result.hybridConfidence ??
            result.final_confidence ??
            result.finalConfidence ??
            rfConfidence
        );

    const quantumScore =
        Number(
            result.quantum_score ??
            result.qiskit_score ??
            result.qiskitScore ??
            0
        );

    const quantumSignal =
        Number(
            result.quantum_signal ??
            result.quantumSignal ??
            0
        );

    const qubits =
        result.qiskit_qubits ??
        result.qiskitQubits ??
        result.qubits ??
        "—";

    const circuitDepth =
        result.qiskit_depth ??
        result.qiskitDepth ??
        result.circuit_depth ??
        result.depth ??
        "—";

    // Random Forest

    if ($("rfDisease")) {

        $("rfDisease").textContent =
            formatDisease(
                rfDisease
            );
    }

    if ($("rfConfidence")) {

        $("rfConfidence").textContent =
            `${rfConfidence.toFixed(2)}%`;
    }

    // Qiskit

    if ($("qiskitDisease")) {

        $("qiskitDisease").textContent =
            formatDisease(
                qiskitDisease
            );
    }

    if ($("qiskitConfidence")) {

        $("qiskitConfidence").textContent =
            `${qiskitConfidence.toFixed(2)}%`;
    }

    if ($("quantumScore")) {

        $("quantumScore").textContent =
            `${quantumScore.toFixed(2)}%`;
    }

    if ($("quantumSignal")) {

        $("quantumSignal").textContent =
            `${quantumSignal.toFixed(2)}%`;
    }

    if ($("qiskitQubits")) {

        $("qiskitQubits").textContent =
            qubits;
    }

    if ($("qiskitDepth")) {

        $("qiskitDepth").textContent =
            circuitDepth;
    }

    // Final prediction

    if ($("hybridDisease")) {

        $("hybridDisease").textContent =
            formatDisease(
                finalDisease
            );
    }

    if ($("hybridConfidence")) {

        $("hybridConfidence").textContent =
            `${finalConfidence.toFixed(2)}%`;
    }

    if ($("finalDisease")) {

        $("finalDisease").textContent =
            formatDisease(
                finalDisease
            );
    }

    if ($("finalConfidence")) {

        $("finalConfidence").textContent =
            `${finalConfidence.toFixed(2)}%`;
    }

    // Prediction date/time

    if ($("predictionDateTime")) {

        $("predictionDateTime").textContent =
            formatDateTime(
                currentPredictionTime
            );
    }

    // Selected symptoms

    renderSelectedSymptoms(
        result.selected_symptoms ||
        getSelectedSymptoms()
    );

    // Top predictions

    renderTopPredictions(
        result.top_predictions ||
        result.topPredictions ||
        []
    );

    // Specialist

    renderSpecialist(
        result
    );
}


// ============================================================
// RENDER SELECTED SYMPTOMS
// ============================================================

function renderSelectedSymptoms(
    symptoms
) {

    const container =
        $("selectedSymptoms");

    if (!container) {
        return;
    }

    if (
        !Array.isArray(symptoms) ||
        symptoms.length === 0
    ) {

        container.innerHTML =
            "<span>None selected</span>";

        return;
    }

    container.innerHTML =
        symptoms
            .map(
                symptom =>
                    `<span class="symptom-tag">${escapeHTML(
                        formatDisease(symptom)
                    )}</span>`
            )
            .join("");
}


// ============================================================
// TOP PREDICTIONS
// ============================================================

function renderTopPredictions(
    predictions
) {

    const container =
        $("topPredictions");

    if (!container) {
        return;
    }

    if (
        !Array.isArray(predictions) ||
        predictions.length === 0
    ) {

        container.innerHTML =
            "<p>No additional predictions available.</p>";

        return;
    }

    container.innerHTML =
        predictions
            .slice(
                0,
                5
            )
            .map(
                (item, index) => {

                    const disease =
                        item.disease ||
                        item.name ||
                        item.label ||
                        "—";

                    const confidence =
                        Number(
                            item.confidence ??
                            item.probability ??
                            item.score ??
                            0
                        );

                    return `
                        <div class="prediction-row">

                            <div class="prediction-rank">
                                ${index + 1}
                            </div>

                            <div class="prediction-name">
                                ${escapeHTML(
                                    formatDisease(
                                        disease
                                    )
                                )}
                            </div>

                            <div class="prediction-confidence">
                                ${confidence.toFixed(2)}%
                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


// ============================================================
// SPECIALIST
// ============================================================

function renderSpecialist(
    result
) {

    const specialty =
        result.specialty ||
        result.recommended_specialty ||
        "General Physician";

    if ($("recommendedSpecialty")) {

        $("recommendedSpecialty")
            .textContent =
            specialty;
    }

    const doctorContainer =
        $("recommendedDoctors");

    if (
        !doctorContainer
    ) {
        return;
    }

    const doctors =
        result.doctors ||
        result.recommended_doctors ||
        [];

    if (
        !Array.isArray(doctors) ||
        doctors.length === 0
    ) {

        doctorContainer.innerHTML =
            `
            <div class="doctor-card">
                <div class="doctor-details">
                    <h4>Recommended Specialist</h4>
                    <p>${escapeHTML(
                        specialty
                    )}</p>
                </div>
            </div>
            `;

        return;
    }

    doctorContainer.innerHTML =
        doctors
            .slice(
                0,
                3
            )
            .map(
                doctor => {

                    const name =
                        doctor.name ||
                        "Doctor";

                    const doctorSpecialty =
                        doctor.specialty ||
                        doctor.specialization ||
                        specialty;

                    return `
                        <div class="doctor-card">

                            <div class="doctor-avatar">
                                👨‍⚕️
                            </div>

                            <div class="doctor-details">

                                <h4>
                                    ${escapeHTML(
                                        name
                                    )}
                                </h4>

                                <p>
                                    ${escapeHTML(
                                        doctorSpecialty
                                    )}
                                </p>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}
// ============================================================
// SAVE CURRENT PREDICTION
// ============================================================

async function saveCurrentPrediction() {

    if (!currentUser) {

        alert(
            "Please login before saving a prediction."
        );

        return;
    }

    if (!currentResult) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    const symptoms =
        currentResult.selected_symptoms ||
        getSelectedSymptoms();

    const predictionTime =
        currentResult.prediction_time ||
        currentPredictionTime ||
        new Date().toISOString();

    const finalDisease =
        currentResult.hybrid_disease ||
        currentResult.hybridDisease ||
        currentResult.final_prediction ||
        currentResult.finalPrediction ||
        currentResult.disease ||
        "Unknown";

    const finalConfidence =
        Number(
            currentResult.hybrid_confidence ??
            currentResult.hybridConfidence ??
            currentResult.final_confidence ??
            currentResult.finalConfidence ??
            currentResult.confidence ??
            0
        );

    const rfDisease =
        currentResult.disease ||
        currentResult.rf_disease ||
        currentResult.random_forest_disease ||
        "Unknown";

    const rfConfidence =
        Number(
            currentResult.confidence ??
            currentResult.rf_confidence ??
            currentResult.random_forest_confidence ??
            0
        );

    const qiskitDisease =
        currentResult.qiskit_disease ||
        currentResult.qiskitDisease ||
        currentResult.quantum_disease ||
        "";

    const qiskitConfidence =
        Number(
            currentResult.qiskit_confidence ??
            currentResult.qiskitConfidence ??
            0
        );

    const quantumScore =
        Number(
            currentResult.quantum_score ??
            currentResult.qiskit_score ??
            currentResult.qiskitScore ??
            0
        );

    const quantumSignal =
        Number(
            currentResult.quantum_signal ??
            currentResult.quantumSignal ??
            0
        );

    const qubits =
        currentResult.qiskit_qubits ??
        currentResult.qiskitQubits ??
        currentResult.qubits ??
        "";

    const circuitDepth =
        currentResult.qiskit_depth ??
        currentResult.qiskitDepth ??
        currentResult.circuit_depth ??
        currentResult.depth ??
        "";

    const agreement =
        currentResult.agreement ||
        currentResult.model_agreement ||
        currentResult.modelAgreement ||
        "";

    const record = {

        userId:
            currentUser.uid,

        patient:
            currentResult.patient ||
            getPatientInformation(),

        symptoms:
            symptoms,

        selected_symptoms:
            symptoms,

        randomForest: {

            disease:
                rfDisease,

            confidence:
                rfConfidence
        },

        rfDisease:
            rfDisease,

        rfConfidence:
            rfConfidence,

        qiskit: {

            disease:
                qiskitDisease,

            confidence:
                qiskitConfidence,

            quantumScore:
                quantumScore,

            quantumSignal:
                quantumSignal,

            qubits:
                qubits,

            circuitDepth:
                circuitDepth
        },

        qiskitDisease:
            qiskitDisease,

        qiskitConfidence:
            qiskitConfidence,

        qiskitScore:
            quantumScore,

        quantumScore:
            quantumScore,

        quantumSignal:
            quantumSignal,

        qiskitQubits:
            qubits,

        qiskitDepth:
            circuitDepth,

        finalPrediction:
            finalDisease,

        final_prediction:
            finalDisease,

        finalConfidence:
            finalConfidence,

        final_confidence:
            finalConfidence,

        hybridDisease:
            finalDisease,

        hybrid_disease:
            finalDisease,

        hybridConfidence:
            finalConfidence,

        hybrid_confidence:
            finalConfidence,

        agreement:
            agreement,

        predictionTime:
            predictionTime,

        prediction_time:
            predictionTime,

        createdAt:
            predictionTime
    };

    try {

        const saveButton =
            $("saveHistoryBtn");

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";
        }

        // ----------------------------------------------------
        // SAVE TO FIRESTORE
        // ----------------------------------------------------

        await addDoc(
            collection(
                db,
                "predictionHistory"
            ),
            {
                ...record,

                serverCreatedAt:
                    serverTimestamp()
            }
        );

        // ----------------------------------------------------
        // ALSO KEEP A LOCAL COPY.
        // This does not replace Firestore.
        // It provides a fallback for history rendering.
        // ----------------------------------------------------

        historyItems.unshift(
            record
        );

        localStorage.setItem(
            "quantumDiagnoseHistory_" +
            currentUser.uid,
            JSON.stringify(
                historyItems
            )
        );

        renderHistory();

        updateDashboard();

        alert(
            "Prediction saved successfully."
        );

    } catch (error) {

        console.error(
            "Save prediction error:",
            error
        );

        alert(
            "Unable to save prediction. Please try again."
        );

    } finally {

        const saveButton =
            $("saveHistoryBtn");

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Prediction";
        }
    }
}


// ============================================================
// LOAD LOCAL HISTORY
// ============================================================

function loadLocalHistory() {

    if (!currentUser) {

        historyItems = [];

        return;
    }

    try {

        const key =
            "quantumDiagnoseHistory_" +
            currentUser.uid;

        const stored =
            localStorage.getItem(
                key
            );

        if (!stored) {

            historyItems = [];

            return;
        }

        const parsed =
            JSON.parse(
                stored
            );

        historyItems =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.warn(
            "Unable to load local history.",
            error
        );

        historyItems = [];
    }
}


// ============================================================
// LOAD HISTORY FROM FIRESTORE
// ============================================================

async function loadHistory() {

    if (!currentUser) {

        historyItems = [];

        return;
    }

    loadLocalHistory();

    try {

        const historyRef =
            collection(
                db,
                "predictionHistory"
            );

        const historyQuery =
            query(
                historyRef,
                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );

        const snapshot =
            await getDocs(
                historyQuery
            );

        const firestoreItems =
            [];

        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();

                firestoreItems.push(
                    {
                        id:
                            documentSnapshot.id,

                        ...data
                    }
                );
            }
        );

        // ----------------------------------------------------
        // SORT BY THE SAVED PREDICTION TIME.
        // This fixes the history date/time display.
        // ----------------------------------------------------

        firestoreItems.sort(
            (
                a,
                b
            ) => {

                const timeA =
                    getStoredPredictionTime(
                        a
                    );

                const timeB =
                    getStoredPredictionTime(
                        b
                    );

                return (
                    new Date(
                        timeB || 0
                    ).getTime() -
                    new Date(
                        timeA || 0
                    ).getTime()
                );
            }
        );

        if (
            firestoreItems.length > 0
        ) {

            historyItems =
                firestoreItems;

            localStorage.setItem(
                "quantumDiagnoseHistory_" +
                currentUser.uid,
                JSON.stringify(
                    historyItems
                )
            );
        }

        renderHistory();

        updateDashboard();

    } catch (error) {

        console.warn(
            "Firestore history loading failed. Using local history.",
            error
        );

        renderHistory();

        updateDashboard();
    }
}


// ============================================================
// GET STORED PREDICTION TIME
// ============================================================

function getStoredPredictionTime(
    item
) {

    if (!item) {
        return "";
    }

    return (
        item.predictionTime ||
        item.prediction_time ||
        item.createdAt ||
        item.created_at ||
        item.timestamp ||
        item.dateTime ||
        ""
    );
}


// ============================================================
// FORMAT HISTORY DATE/TIME
// ============================================================

function formatHistoryDateTime(
    item
) {

    const storedTime =
        getStoredPredictionTime(
            item
        );

    if (!storedTime) {

        return "Date and time unavailable";
    }

    // Firestore Timestamp support

    if (
        typeof storedTime ===
        "object" &&
        typeof storedTime.toDate ===
        "function"
    ) {

        return formatDateTime(
            storedTime.toDate()
        );
    }

    // Firestore timestamp object

    if (
        typeof storedTime ===
        "object" &&
        storedTime.seconds
    ) {

        return formatDateTime(
            new Date(
                Number(
                    storedTime.seconds
                ) * 1000
            )
        );
    }

    return formatDateTime(
        storedTime
    );
}


// ============================================================
// RENDER HISTORY
// ============================================================

function renderHistory() {

    const container =
        $("historyList");

    if (!container) {
        return;
    }

    if (
        !Array.isArray(
            historyItems
        ) ||
        historyItems.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No Prediction History
                </h3>

                <p>
                    Your saved predictions
                    will appear here.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        historyItems
            .map(
                (
                    item,
                    index
                ) => {

                    const finalDisease =
                        item.finalPrediction ||
                        item.final_prediction ||
                        item.hybridDisease ||
                        item.hybrid_disease ||
                        item.disease ||
                        "Unknown";

                    const finalConfidence =
                        Number(
                            item.finalConfidence ??
                            item.final_confidence ??
                            item.hybridConfidence ??
                            item.hybrid_confidence ??
                            item.confidence ??
                            0
                        );

                    const rfDisease =
                        item.rfDisease ||
                        item.rf_disease ||
                        item.randomForest?.disease ||
                        item.disease ||
                        "Unknown";

                    const rfConfidence =
                        Number(
                            item.rfConfidence ??
                            item.rf_confidence ??
                            item.randomForest?.confidence ??
                            item.confidence ??
                            0
                        );

                    const qiskitDisease =
                        item.qiskitDisease ||
                        item.qiskit_disease ||
                        item.qiskit?.disease ||
                        "";

                    const qiskitConfidence =
                        Number(
                            item.qiskitConfidence ??
                            item.qiskit_confidence ??
                            item.qiskit?.confidence ??
                            0
                        );

                    const agreement =
                        item.agreement ||
                        item.modelAgreement ||
                        item.model_agreement ||
                        "";

                    const symptoms =
                        item.selected_symptoms ||
                        item.symptoms ||
                        [];

                    const dateTime =
                        formatHistoryDateTime(
                            item
                        );

                    return `
                        <div
                            class="history-card"
                            data-index="${index}"
                        >

                            <div
                                class="history-card-header"
                            >

                                <div>

                                    <span
                                        class="history-label"
                                    >
                                        Final Prediction
                                    </span>

                                    <h3>
                                        ${escapeHTML(
                                            formatDisease(
                                                finalDisease
                                            )
                                        )}
                                    </h3>

                                </div>

                                <div
                                    class="history-confidence"
                                >
                                    ${finalConfidence.toFixed(2)}%
                                </div>

                            </div>

                            <div
                                class="history-date"
                            >

                                🕒

                                ${escapeHTML(
                                    dateTime
                                )}

                            </div>

                            <div
                                class="history-models"
                            >

                                <div
                                    class="history-model"
                                >

                                    <span>
                                        Random Forest
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            formatDisease(
                                                rfDisease
                                            )
                                        )}
                                    </strong>

                                    <small>
                                        ${rfConfidence.toFixed(2)}%
                                    </small>

                                </div>

                                <div
                                    class="history-model"
                                >

                                    <span>
                                        Qiskit
                                    </span>

                                    <strong>
                                        ${
                                            qiskitDisease
                                                ? escapeHTML(
                                                    formatDisease(
                                                        qiskitDisease
                                                    )
                                                )
                                                : "Experimental"
                                        }
                                    </strong>

                                    <small>
                                        ${
                                            qiskitDisease
                                                ? qiskitConfidence.toFixed(2) + "%"
                                                : "Quantum Analysis"
                                        }
                                    </small>

                                </div>

                            </div>

                            ${
                                agreement
                                    ? `
                                        <div
                                            class="history-agreement"
                                        >
                                            Agreement:
                                            <strong>
                                                ${escapeHTML(
                                                    agreement
                                                )}
                                            </strong>
                                        </div>
                                    `
                                    : ""
                            }

                            ${
                                Array.isArray(
                                    symptoms
                                ) &&
                                symptoms.length > 0
                                    ? `
                                        <div
                                            class="history-symptoms"
                                        >

                                            <span>
                                                Symptoms:
                                            </span>

                                            <div
                                                class="symptom-tags"
                                            >

                                                ${symptoms
                                                    .slice(
                                                        0,
                                                        10
                                                    )
                                                    .map(
                                                        symptom =>
                                                            `
                                                            <span
                                                                class="symptom-tag"
                                                            >
                                                                ${escapeHTML(
                                                                    formatDisease(
                                                                        symptom
                                                                    )
                                                                )}
                                                            </span>
                                                            `
                                                    )
                                                    .join(
                                                        ""
                                                    )}

                                            </div>

                                        </div>
                                    `
                                    : ""
                            }

                        </div>
                    `;
                }
            )
            .join("");
}


// ============================================================
// DELETE HISTORY ITEM
// ============================================================

async function deleteHistoryItem(
    index
) {

    if (
        index < 0 ||
        index >= historyItems.length
    ) {

        return;
    }

    const item =
        historyItems[index];

    const confirmed =
        window.confirm(
            "Delete this prediction from your history?"
        );

    if (!confirmed) {
        return;
    }

    try {

        // If the Firestore document ID exists,
        // delete it through the existing backend/API
        // only when such functionality is available.

        if (
            item.id &&
            typeof window.deletePredictionHistory ===
            "function"
        ) {

            await window.deletePredictionHistory(
                item.id
            );
        }

        historyItems.splice(
            index,
            1
        );

        if (currentUser) {

            localStorage.setItem(
                "quantumDiagnoseHistory_" +
                currentUser.uid,
                JSON.stringify(
                    historyItems
                )
            );
        }

        renderHistory();

        updateDashboard();

    } catch (error) {

        console.error(
            "Delete history error:",
            error
        );

        alert(
            "Unable to delete this prediction."
        );
    }
}


// ============================================================
// DOCTORS
// ============================================================

let doctors = [];

async function loadDoctors() {

    const container =
        $("doctorList");

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(
                "/doctors"
            );

        if (!response.ok) {

            throw new Error(
                "Doctor request failed."
            );
        }

        const data =
            await response.json();

        doctors =
            Array.isArray(
                data
            )
                ? data
                : (
                    Array.isArray(
                        data.doctors
                    )
                        ? data.doctors
                        : []
                );

        renderDoctors();

    } catch (error) {

        console.warn(
            "Doctor API unavailable:",
            error
        );

        // Keep the existing page usable.
        renderDoctors();
    }
}


// ============================================================
// RENDER DOCTORS
// ============================================================

function renderDoctors(
    doctorList = doctors
) {

    const container =
        $("doctorList");

    if (!container) {
        return;
    }

    if (
        !Array.isArray(
            doctorList
        ) ||
        doctorList.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <h3>
                    Doctor information unavailable
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        doctorList
            .map(
                doctor => {

                    const name =
                        doctor.name ||
                        "Doctor";

                    const specialty =
                        doctor.specialty ||
                        doctor.specialization ||
                        "General Physician";

                    const hospital =
                        doctor.hospital ||
                        doctor.clinic ||
                        "";

                    const experience =
                        doctor.experience ||
                        doctor.experience_years ||
                        "";

                    return `
                        <div
                            class="doctor-card"
                        >

                            <div
                                class="doctor-avatar"
                            >
                                👨‍⚕️
                            </div>

                            <div
                                class="doctor-details"
                            >

                                <h3>
                                    ${escapeHTML(
                                        name
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        specialty
                                    )}
                                </p>

                                ${
                                    hospital
                                        ? `
                                            <small>
                                                ${escapeHTML(
                                                    hospital
                                                )}
                                            </small>
                                        `
                                        : ""
                                }

                                ${
                                    experience
                                        ? `
                                            <small>
                                                Experience:
                                                ${escapeHTML(
                                                    String(
                                                        experience
                                                    )
                                                )}
                                            </small>
                                        `
                                        : ""
                                }

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


// ============================================================
// DOCTOR SEARCH
// ============================================================

function searchDoctors(
    value
) {

    const queryText =
        String(
            value || ""
        )
            .trim()
            .toLowerCase();

    if (!queryText) {

        renderDoctors(
            doctors
        );

        return;
    }

    const filtered =
        doctors.filter(
            doctor => {

                const searchable =
                    [
                        doctor.name,
                        doctor.specialty,
                        doctor.specialization,
                        doctor.hospital,
                        doctor.clinic
                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(
                    queryText
                );
            }
        );

    renderDoctors(
        filtered
    );
}


// ============================================================
// PERFORMANCE
// ============================================================

let performanceData =
    null;

async function loadPerformance() {

    try {

        const response =
            await fetch(
                "/model-performance"
            );

        if (!response.ok) {
            return;
        }

        performanceData =
            await response.json();

        renderPerformancePage();

    } catch (error) {

        console.warn(
            "Performance endpoint unavailable:",
            error
        );
    }
}


// ============================================================
// RENDER PERFORMANCE PAGE
// ============================================================

function renderPerformancePage() {

    if (!performanceData) {
        return;
    }

    const mappings = {

        rfAccuracy:
            performanceData.random_forest_accuracy ??
            performanceData.rf_accuracy,

        qiskitAccuracy:
            performanceData.qiskit_accuracy ??
            performanceData.quantum_accuracy,

        hybridAccuracy:
            performanceData.hybrid_accuracy ??
            performanceData.final_accuracy,

        rfPrecision:
            performanceData.rf_precision ??
            performanceData.random_forest_precision,

        rfRecall:
            performanceData.rf_recall ??
            performanceData.random_forest_recall,

        rfF1:
            performanceData.rf_f1 ??
            performanceData.random_forest_f1,

        qiskitPrecision:
            performanceData.qiskit_precision ??
            performanceData.quantum_precision,

        qiskitRecall:
            performanceData.qiskit_recall ??
            performanceData.quantum_recall,

        qiskitF1:
            performanceData.qiskit_f1 ??
            performanceData.quantum_f1
    };

    Object.entries(
        mappings
    ).forEach(
        (
            [id, value]
        ) => {

            const element =
                $(id);

            if (
                element &&
                value !== undefined &&
                value !== null
            ) {

                element.textContent =
                    `${Number(
                        value
                    ).toFixed(2)}%`;
            }
        }
    );
}


// ============================================================
// MODEL COMPARISON
// ============================================================

let comparisonData =
    null;

async function loadModelComparison() {

    try {

        const response =
            await fetch(
                "/model-comparison"
            );

        if (!response.ok) {
            return;
        }

        comparisonData =
            await response.json();

        renderModelComparison();

    } catch (error) {

        console.warn(
            "Model comparison unavailable:",
            error
        );
    }
}


// ============================================================
// RENDER MODEL COMPARISON
// ============================================================

function renderModelComparison() {

    if (!comparisonData) {
        return;
    }

    const values = {

        rfAccuracy:
            comparisonData.random_forest_accuracy ??
            comparisonData.rf_accuracy,

        qiskitAccuracy:
            comparisonData.qiskit_accuracy ??
            comparisonData.quantum_accuracy,

        hybridAccuracy:
            comparisonData.hybrid_accuracy ??
            comparisonData.final_accuracy,

        modelAgreement:
            comparisonData.agreement_percentage ??
            comparisonData.model_agreement
    };

    Object.entries(
        values
    ).forEach(
        (
            [id, value]
        ) => {

            const element =
                $(id);

            if (
                element &&
                value !== undefined &&
                value !== null
            ) {

                element.textContent =
                    `${Number(
                        value
                    ).toFixed(2)}%`;
            }
        }
    );
}


// ============================================================
// QUANTUM PAGE
// ============================================================

function renderQuantumPage() {

    if (!currentResult) {
        return;
    }

    const quantumScore =
        currentResult.quantum_score ??
        currentResult.qiskit_score ??
        currentResult.qiskitScore ??
        0;

    const quantumSignal =
        currentResult.quantum_signal ??
        currentResult.quantumSignal ??
        0;

    const qubits =
        currentResult.qiskit_qubits ??
        currentResult.qiskitQubits ??
        currentResult.qubits ??
        "—";

    const depth =
        currentResult.qiskit_depth ??
        currentResult.qiskitDepth ??
        currentResult.circuit_depth ??
        currentResult.depth ??
        "—";

    if ($("quantumPageScore")) {

        $("quantumPageScore").textContent =
            `${Number(
                quantumScore
            ).toFixed(2)}%`;
    }

    if ($("quantumPageSignal")) {

        $("quantumPageSignal").textContent =
            `${Number(
                quantumSignal
            ).toFixed(2)}%`;
    }

    if ($("quantumPageQubits")) {

        $("quantumPageQubits").textContent =
            qubits;
    }

    if ($("quantumPageDepth")) {

        $("quantumPageDepth").textContent =
            depth;
    }
}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    const total =
        historyItems.length;

    const totalElement =
        $("totalPredictions");

    if (totalElement) {

        totalElement.textContent =
            total;
    }

    const latest =
        historyItems[0];

    if (!latest) {

        if ($("latestPrediction")) {

            $("latestPrediction")
                .textContent =
                "No predictions yet";
        }

        if ($("latestConfidence")) {

            $("latestConfidence")
                .textContent =
                "—";
        }

        if ($("latestPredictionTime")) {

            $("latestPredictionTime")
                .textContent =
                "—";
        }

        return;
    }

    const disease =
        latest.finalPrediction ||
        latest.final_prediction ||
        latest.hybridDisease ||
        latest.hybrid_disease ||
        latest.disease ||
        "Unknown";

    const confidence =
        Number(
            latest.finalConfidence ??
            latest.final_confidence ??
            latest.hybridConfidence ??
            latest.hybrid_confidence ??
            latest.confidence ??
            0
        );

    if ($("latestPrediction")) {

        $("latestPrediction")
            .textContent =
            formatDisease(
                disease
            );
    }

    if ($("latestConfidence")) {

        $("latestConfidence")
            .textContent =
            `${confidence.toFixed(2)}%`;
    }

    if ($("latestPredictionTime")) {

        $("latestPredictionTime")
            .textContent =
            formatHistoryDateTime(
                latest
            );
    }
}


// ============================================================
// END PART 2
// ============================================================
// ============================================================
// PDF REPORT
// ============================================================

async function downloadPDF() {

    if (!currentResult) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    const button =
        $("downloadReportBtn");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Generating...";
    }

    try {

        const patient =
            currentResult.patient ||
            getPatientInformation();

        const symptoms =
            currentResult.selected_symptoms ||
            currentResult.symptoms ||
            getSelectedSymptoms();

        const rfDisease =
            currentResult.disease ||
            currentResult.rf_disease ||
            currentResult.random_forest_disease ||
            "Unknown";

        const rfConfidence =
            Number(
                currentResult.confidence ??
                currentResult.rf_confidence ??
                currentResult.random_forest_confidence ??
                0
            );

        const topPredictions =
            currentResult.top_predictions ||
            currentResult.topPredictions ||
            [];

        const qiskitDisease =
            currentResult.qiskit_disease ||
            currentResult.qiskitDisease ||
            currentResult.quantum_disease ||
            "Experimental";

        const qiskitConfidence =
            Number(
                currentResult.qiskit_confidence ??
                currentResult.qiskitConfidence ??
                0
            );

        const quantumScore =
            Number(
                currentResult.quantum_score ??
                currentResult.qiskit_score ??
                currentResult.qiskitScore ??
                0
            );

        const quantumSignal =
            Number(
                currentResult.quantum_signal ??
                currentResult.quantumSignal ??
                0
            );

        const qubits =
            currentResult.qiskit_qubits ??
            currentResult.qiskitQubits ??
            currentResult.qubits ??
            "—";

        const circuitDepth =
            currentResult.qiskit_depth ??
            currentResult.qiskitDepth ??
            currentResult.circuit_depth ??
            currentResult.depth ??
            "—";

        const finalDisease =
            currentResult.hybrid_disease ||
            currentResult.hybridDisease ||
            currentResult.final_prediction ||
            currentResult.finalPrediction ||
            rfDisease;

        const finalConfidence =
            Number(
                currentResult.hybrid_confidence ??
                currentResult.hybridConfidence ??
                currentResult.final_confidence ??
                currentResult.finalConfidence ??
                rfConfidence
            );

        const agreement =
            currentResult.agreement ||
            currentResult.model_agreement ||
            currentResult.modelAgreement ||
            (
                formatDisease(
                    rfDisease
                ).toLowerCase() ===
                formatDisease(
                    finalDisease
                ).toLowerCase()
                    ? "Models Agree"
                    : "Models Differ"
            );

        const specialist =
            currentResult.specialty ||
            currentResult.recommended_specialty ||
            "General Physician";

        const generatedDate =
            currentResult.prediction_time ||
            currentPredictionTime ||
            new Date().toISOString();

        // ----------------------------------------------------
        // CREATE PDF
        // ----------------------------------------------------

        const jsPDFClass =
            window.jspdf?.jsPDF;

        if (!jsPDFClass) {

            throw new Error(
                "jsPDF library is not available."
            );
        }

        const pdf =
            new jsPDFClass(
                {
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4"
                }
            );

        const pageWidth =
            pdf.internal.pageSize.getWidth();

        const pageHeight =
            pdf.internal.pageSize.getHeight();

        // Compact professional margins

        const marginLeft =
            14;

        const marginRight =
            14;

        const contentWidth =
            pageWidth -
            marginLeft -
            marginRight;

        let y =
            14;

        // ----------------------------------------------------
        // COLORS
        // ----------------------------------------------------

        const primary =
            [31, 78, 121];

        const dark =
            [35, 45, 55];

        const muted =
            [95, 105, 115];

        const light =
            [244, 247, 250];

        const border =
            [215, 222, 230];

        const notice =
            [255, 248, 225];

        // ----------------------------------------------------
        // HELPER FUNCTIONS
        // ----------------------------------------------------

        function setFont(
            size,
            style = "normal",
            color = dark
        ) {

            pdf.setFont(
                "helvetica",
                style
            );

            pdf.setFontSize(
                size
            );

            pdf.setTextColor(
                color[0],
                color[1],
                color[2]
            );
        }

        function drawSectionHeading(
            title
        ) {

            setFont(
                9.5,
                "bold",
                primary
            );

            pdf.text(
                title,
                marginLeft,
                y
            );

            y += 4.5;

            pdf.setDrawColor(
                ...border
            );

            pdf.setLineWidth(
                0.25
            );

            pdf.line(
                marginLeft,
                y,
                pageWidth -
                    marginRight,
                y
            );

            y += 4;
        }

        function drawWrapped(
            text,
            x,
            maxWidth,
            fontSize = 8.2,
            lineHeight = 3.6,
            style = "normal",
            color = dark
        ) {

            setFont(
                fontSize,
                style,
                color
            );

            const lines =
                pdf.splitTextToSize(
                    String(
                        text ??
                        ""
                    ),
                    maxWidth
                );

            pdf.text(
                lines,
                x,
                y,
                {
                    baseline:
                        "top"
                }
            );

            y +=
                lines.length *
                lineHeight;

            return lines.length;
        }

        function drawLabelValue(
            label,
            value,
            x,
            width
        ) {

            setFont(
                7.6,
                "bold",
                muted
            );

            pdf.text(
                label,
                x,
                y
            );

            setFont(
                8.3,
                "normal",
                dark
            );

            const labelWidth =
                pdf.getTextWidth(
                    label
                );

            const lines =
                pdf.splitTextToSize(
                    String(
                        value ??
                        "—"
                    ),
                    width -
                        labelWidth -
                        2
                );

            pdf.text(
                lines,
                x +
                    labelWidth +
                    2,
                y
            );

            y +=
                Math.max(
                    4,
                    lines.length *
                        3.5
                );
        }

        function drawResultBox(
            title,
            disease,
            confidence
        ) {

            const boxHeight =
                17;

            pdf.setFillColor(
                ...light
            );

            pdf.setDrawColor(
                ...border
            );

            pdf.roundedRect(
                marginLeft,
                y,
                contentWidth,
                boxHeight,
                2,
                2,
                "FD"
            );

            setFont(
                7.4,
                "bold",
                muted
            );

            pdf.text(
                title,
                marginLeft + 4,
                y + 5
            );

            setFont(
                11,
                "bold",
                dark
            );

            pdf.text(
                formatDisease(
                    disease
                ),
                marginLeft + 4,
                y + 11
            );

            setFont(
                9.5,
                "bold",
                primary
            );

            pdf.text(
                `${Number(
                    confidence
                ).toFixed(2)}%`,
                pageWidth -
                    marginRight -
                    4,
                y + 10,
                {
                    align:
                        "right"
                }
            );

            y +=
                boxHeight +
                4;
        }

        // ----------------------------------------------------
        // HEADER
        // ----------------------------------------------------

        setFont(
            18,
            "bold",
            primary
        );

        pdf.text(
            "QuantumDiagnose",
            marginLeft,
            y
        );

        y += 6;

        setFont(
            8.5,
            "normal",
            muted
        );

        pdf.text(
            "AI-Assisted Symptom Analysis Report",
            marginLeft,
            y
        );

        y += 5;

        pdf.setDrawColor(
            ...primary
        );

        pdf.setLineWidth(
            0.7
        );

        pdf.line(
            marginLeft,
            y,
            pageWidth -
                marginRight,
            y
        );

        y += 6;

        // ----------------------------------------------------
        // PATIENT INFORMATION
        // ----------------------------------------------------

        drawSectionHeading(
            "Patient Information"
        );

        const columnWidth =
            contentWidth /
            3;

        const patientY =
            y;

        setFont(
            7.4,
            "bold",
            muted
        );

        pdf.text(
            "Name",
            marginLeft,
            patientY
        );

        pdf.text(
            "Age",
            marginLeft +
                columnWidth,
            patientY
        );

        pdf.text(
            "Gender",
            marginLeft +
                columnWidth * 2,
            patientY
        );

        setFont(
            8.3,
            "normal",
            dark
        );

        pdf.text(
            String(
                patient.name ||
                "—"
            ),
            marginLeft,
            patientY + 4
        );

        pdf.text(
            String(
                patient.age ||
                "—"
            ),
            marginLeft +
                columnWidth,
            patientY + 4
        );

        pdf.text(
            String(
                patient.gender ||
                "—"
            ),
            marginLeft +
                columnWidth * 2,
            patientY + 4
        );

        y += 11;

        // ----------------------------------------------------
        // SELECTED SYMPTOMS
        // ----------------------------------------------------

        drawSectionHeading(
            "Selected Symptoms"
        );

        const symptomText =
            Array.isArray(
                symptoms
            )
                ? symptoms
                    .map(
                        symptom =>
                            formatDisease(
                                symptom
                            )
                    )
                    .join(
                        ", "
                    )
                : String(
                    symptoms ||
                    "None"
                );

        drawWrapped(
            symptomText ||
                "None",
            marginLeft,
            contentWidth,
            8,
            3.5,
            "normal",
            dark
        );

        y += 2;

        // ----------------------------------------------------
        // RANDOM FOREST RESULT
        // ----------------------------------------------------

        drawSectionHeading(
            "Random Forest Result"
        );

        drawResultBox(
            "Random Forest Prediction",
            rfDisease,
            rfConfidence
        );

        // ----------------------------------------------------
        // TOP PREDICTIONS
        // ----------------------------------------------------

        drawSectionHeading(
            "Top Predictions"
        );

        if (
            Array.isArray(
                topPredictions
            ) &&
            topPredictions.length > 0
        ) {

            const rows =
                topPredictions
                    .slice(
                        0,
                        3
                    );

            rows.forEach(
                (
                    item,
                    index
                ) => {

                    const disease =
                        item.disease ||
                        item.name ||
                        item.label ||
                        "Unknown";

                    const confidence =
                        Number(
                            item.confidence ??
                            item.probability ??
                            item.score ??
                            0
                        );

                    setFont(
                        7.8,
                        "normal",
                        dark
                    );

                    pdf.text(
                        `${index + 1}.`,
                        marginLeft,
                        y
                    );

                    pdf.text(
                        formatDisease(
                            disease
                        ),
                        marginLeft + 6,
                        y
                    );

                    setFont(
                        7.8,
                        "bold",
                        primary
                    );

                    pdf.text(
                        `${confidence.toFixed(
                            2
                        )}%`,
                        pageWidth -
                            marginRight,
                        y,
                        {
                            align:
                                "right"
                        }
                    );

                    y += 4;
                }
            );

        } else {

            setFont(
                8,
                "normal",
                muted
            );

            pdf.text(
                "No additional predictions available.",
                marginLeft,
                y
            );

            y += 4;
        }

        y += 1;

        // ----------------------------------------------------
        // QISKIT RESULT
        // ----------------------------------------------------

        drawSectionHeading(
            "Qiskit Result"
        );

        const quantumText =
            `Quantum Score: ${Number(
                quantumScore
            ).toFixed(
                2
            )}%   |   Quantum Signal: ${Number(
                quantumSignal
            ).toFixed(
                2
            )}%   |   Qubits: ${qubits}   |   Circuit Depth: ${circuitDepth}`;

        drawWrapped(
            quantumText,
            marginLeft,
            contentWidth,
            8,
            3.5
        );

        y += 1;

        // ----------------------------------------------------
        // HYBRID PREDICTION
        // ----------------------------------------------------

        drawSectionHeading(
            "Hybrid Prediction"
        );

        drawResultBox(
            "Final Prediction",
            finalDisease,
            finalConfidence
        );

        setFont(
            7.8,
            "normal",
            dark
        );

        pdf.text(
            "Model Agreement:",
            marginLeft,
            y
        );

        setFont(
            7.8,
            "bold",
            primary
        );

        pdf.text(
            String(
                agreement
            ),
            marginLeft + 29,
            y
        );

        y += 5;

        // ----------------------------------------------------
        // DOCTOR RECOMMENDATION
        // ----------------------------------------------------

        drawSectionHeading(
            "Doctor Recommendation"
        );

        drawWrapped(
            `Recommended specialist: ${specialist}`,
            marginLeft,
            contentWidth,
            8.2,
            3.6,
            "normal",
            dark
        );

        y += 2;

        // ----------------------------------------------------
        // IMPORTANT NOTICE
        // ----------------------------------------------------

        const noticeText =
            "Important Notice: This report is generated for educational and research purposes only. It is not a medical diagnosis and should not replace professional medical advice, examination, or treatment.";

        const noticeLines =
            pdf.splitTextToSize(
                noticeText,
                contentWidth - 8
            );

        const noticeHeight =
            Math.max(
                20,
                noticeLines.length *
                    3.6 +
                    8
            );

        pdf.setFillColor(
            ...notice
        );

        pdf.setDrawColor(
            235,
            205,
            125
        );

        pdf.roundedRect(
            marginLeft,
            y,
            contentWidth,
            noticeHeight,
            2,
            2,
            "FD"
        );

        setFont(
            8,
            "bold",
            [120, 90, 20]
        );

        pdf.text(
            "Important Notice",
            marginLeft + 4,
            y + 5
        );

        setFont(
            7.2,
            "normal",
            [85, 75, 50]
        );

        pdf.text(
            noticeLines,
            marginLeft + 4,
            y + 9
        );

        y +=
            noticeHeight +
            5;

        // ----------------------------------------------------
        // FOOTER
        // ----------------------------------------------------

        setFont(
            6.5,
            "normal",
            muted
        );

        pdf.text(
            `QuantumDiagnose • Educational Project Generated: ${formatDateTime(
                generatedDate
            )}`,
            marginLeft,
            pageHeight - 8
        );

        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------

        const safeName =
            String(
                patient.name ||
                "Patient"
            )
                .replace(
                    /[^a-z0-9]/gi,
                    "_"
                );

        pdf.save(
            `QuantumDiagnose_Report_${safeName}.pdf`
        );

    } catch (error) {

        console.error(
            "PDF generation error:",
            error
        );

        alert(
            "Unable to generate the PDF report. Please try again."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Download Report";
        }
    }
}


// ============================================================
// EMAIL REPORT
// ============================================================

async function sendEmailReport() {

    if (!currentResult) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    const email =
        currentUser?.email ||
        currentResult.patient?.email ||
        $("patientEmail")
            ?.value
            ?.trim();

    if (!email) {

        alert(
            "Please provide an email address."
        );

        return;
    }

    const button =
        $("emailReportBtn");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Sending...";
    }

    try {

        const response =
            await fetch(
                "/send-report",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            ...currentResult,

                            email:
                                email,

                            // Keep the backend compatible
                            // with the existing prediction object.

                            final_prediction:
                                currentResult.hybrid_disease ||
                                currentResult.hybridDisease ||
                                currentResult.final_prediction ||
                                currentResult.finalPrediction ||
                                currentResult.disease,

                            final_confidence:
                                currentResult.hybrid_confidence ??
                                currentResult.hybridConfidence ??
                                currentResult.final_confidence ??
                                currentResult.finalConfidence ??
                                currentResult.confidence,

                            random_forest_disease:
                                currentResult.disease ||
                                currentResult.rf_disease ||
                                currentResult.random_forest_disease,

                            random_forest_confidence:
                                currentResult.confidence ??
                                currentResult.rf_confidence ??
                                currentResult.random_forest_confidence,

                            qiskit_score:
                                currentResult.quantum_score ??
                                currentResult.qiskit_score ??
                                currentResult.qiskitScore ??
                                0,

                            quantum_signal:
                                currentResult.quantum_signal ??
                                currentResult.quantumSignal ??
                                0,

                            qiskit_qubits:
                                currentResult.qiskit_qubits ??
                                currentResult.qiskitQubits ??
                                currentResult.qubits ??
                                "—",

                            qiskit_depth:
                                currentResult.qiskit_depth ??
                                currentResult.qiskitDepth ??
                                currentResult.circuit_depth ??
                                currentResult.depth ??
                                "—"
                        })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                "Unable to send report."
            );
        }

        alert(
            "Report sent successfully to " +
            email +
            "."
        );

    } catch (error) {

        console.error(
            "Email report error:",
            error
        );

        alert(
            error.message ||
            "Unable to send the report."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Email Report";
        }
    }
}


// ============================================================
// END PART 3
// ============================================================
// ============================================================
// PART 4/4 — UI, NAVIGATION, HELPERS & INITIALIZATION
// ============================================================


// ============================================================
// ELEMENT HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
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
// FORMAT DISEASE / SYMPTOM TEXT
// ============================================================

function formatDisease(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


// ============================================================
// FORMAT DATE & TIME
// ============================================================

function formatDateTime(
    value
) {

    if (!value) {
        return "—";
    }

    let date;

    // Firestore Timestamp

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        date =
            value.toDate();

    } else if (
        typeof value === "object" &&
        value.seconds
    ) {

        date =
            new Date(
                Number(
                    value.seconds
                ) * 1000
            );

    } else {

        date =
            new Date(
                value
            );
    }

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );
    }

    return date.toLocaleString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",

            hour12:
                true
        }
    );
}


// ============================================================
// PATIENT INFORMATION
// ============================================================

function getPatientInformation() {

    const patient = {};

    const nameElement =
        $("patientName");

    const ageElement =
        $("patientAge");

    const genderElement =
        $("patientGender");

    const emailElement =
        $("patientEmail");

    if (nameElement) {

        patient.name =
            nameElement.value?.trim() ||
            nameElement.textContent?.trim() ||
            "";
    }

    if (ageElement) {

        patient.age =
            ageElement.value?.trim() ||
            ageElement.textContent?.trim() ||
            "";
    }

    if (genderElement) {

        patient.gender =
            genderElement.value?.trim() ||
            genderElement.textContent?.trim() ||
            "";
    }

    if (emailElement) {

        patient.email =
            emailElement.value?.trim() ||
            emailElement.textContent?.trim() ||
            "";
    }

    return patient;
}


// ============================================================
// GET SELECTED SYMPTOMS
// ============================================================

function getSelectedSymptoms() {

    const selected = [];

    // Existing checkbox structure

    document
        .querySelectorAll(
            'input[type="checkbox"]:checked'
        )
        .forEach(
            checkbox => {

                const value =
                    checkbox.value ||
                    checkbox.dataset.symptom ||
                    checkbox
                        .nextElementSibling
                        ?.textContent
                        ?.trim();

                if (
                    value &&
                    !selected.includes(
                        value
                    )
                ) {

                    selected.push(
                        value
                    );
                }
            }
        );

    // Existing symptom buttons/cards

    document
        .querySelectorAll(
            ".symptom.selected, .symptom-card.selected, .selected-symptom"
        )
        .forEach(
            element => {

                const value =
                    element.dataset.symptom ||
                    element.textContent
                        ?.trim();

                if (
                    value &&
                    !selected.includes(
                        value
                    )
                ) {

                    selected.push(
                        value
                    );
                }
            }
        );

    return selected;
}


// ============================================================
// PREDICTION TIME
// ============================================================

let currentPredictionTime =
    null;


// ============================================================
// CURRENT RESULT
// ============================================================

let currentResult =
    null;


// ============================================================
// CURRENT USER
// ============================================================

let currentUser =
    null;


// ============================================================
// HISTORY
// ============================================================

let historyItems =
    [];


// ============================================================
// NAVIGATION MAP
// ============================================================

// IMPORTANT:
// The sidebar item "New Prediction" remains unchanged.
// Only the right-side page heading is changed to:
// "Hybrid Health Analysis"

const pageTitles = {

    prediction: {

        title:
            "Hybrid Health Analysis",

        subtitle:
            "AI-assisted health analysis"
    },

    newPrediction: {

        title:
            "Hybrid Health Analysis",

        subtitle:
            "AI-assisted health analysis"
    },

    history: {

        title:
            "Prediction History",

        subtitle:
            "View your previous health analyses"
    },

    dashboard: {

        title:
            "Dashboard",

        subtitle:
            "AI-assisted health analysis"
    },

    doctors: {

        title:
            "Specialist Doctors",

        subtitle:
            "Find the appropriate healthcare specialist"
    },

    performance: {

        title:
            "Model Performance",

        subtitle:
            "AI and quantum model performance"
    },

    quantum: {

        title:
            "Quantum Analysis",

        subtitle:
            "Experimental quantum analysis"
    }
};


// ============================================================
// UPDATE PAGE HEADING
// ============================================================

function updatePageHeading(
    page
) {

    const config =
        pageTitles[
            page
        ] ||
        pageTitles.prediction;

    const heading =
        $("pageTitle") ||
        $("mainHeading") ||
        $("pageHeading");

    const subtitle =
        $("pageSubtitle") ||
        $("mainSubtitle");

    if (heading) {

        heading.textContent =
            config.title;
    }

    if (subtitle) {

        subtitle.textContent =
            config.subtitle;
    }
}


// ============================================================
// NAVIGATION
// ============================================================

function showPage(
    page
) {

    // --------------------------------------------------------
    // Update heading first
    // --------------------------------------------------------

    updatePageHeading(
        page
    );

    // --------------------------------------------------------
    // Existing page sections
    // --------------------------------------------------------

    const pages =
        document.querySelectorAll(
            "[data-page]"
        );

    pages.forEach(
        element => {

            const elementPage =
                element.dataset.page;

            if (
                elementPage === page
            ) {

                element.classList.add(
                    "active"
                );

                element.style.display =
                    "";

            } else {

                element.classList.remove(
                    "active"
                );

                // Do not force display:none
                // when the existing CSS controls it.
            }
        }
    );

    // --------------------------------------------------------
    // Common ID-based pages
    // --------------------------------------------------------

    const pageIds = {

        prediction: [
            "predictionPage",
            "newPredictionPage",
            "prediction-section"
        ],

        history: [
            "historyPage",
            "history-section"
        ],

        dashboard: [
            "dashboardPage",
            "dashboard-section"
        ],

        doctors: [
            "doctorsPage",
            "doctors-section"
        ],

        performance: [
            "performancePage",
            "performance-section"
        ],

        quantum: [
            "quantumPage",
            "quantum-section"
        ]
    };

    Object.entries(
        pageIds
    ).forEach(
        (
            [pageName, ids]
        ) => {

            ids.forEach(
                id => {

                    const element =
                        $(id);

                    if (!element) {
                        return;
                    }

                    if (
                        pageName === page
                    ) {

                        element.classList.add(
                            "active"
                        );

                    } else {

                        element.classList.remove(
                            "active"
                        );
                    }
                }
            );
        }
    );

    // --------------------------------------------------------
    // Page-specific loading
    // --------------------------------------------------------

    if (
        page === "history"
    ) {

        loadHistory();
    }

    if (
        page === "doctors"
    ) {

        loadDoctors();
    }

    if (
        page === "performance"
    ) {

        loadPerformance();

        loadModelComparison();
    }

    if (
        page === "quantum"
    ) {

        renderQuantumPage();
    }

    if (
        page === "dashboard"
    ) {

        updateDashboard();
    }
}


// ============================================================
// SIDEBAR NAVIGATION
// ============================================================

function setupNavigation() {

    // Existing sidebar remains unchanged.
    // We only attach navigation behavior.

    document
        .querySelectorAll(
            "[data-page], [data-nav]"
        )
        .forEach(
            element => {

                if (
                    element.dataset.navigationBound ===
                    "true"
                ) {

                    return;
                }

                element.dataset.navigationBound =
                    "true";

                element.addEventListener(
                    "click",
                    event => {

                        const target =
                            element.dataset.page ||
                            element.dataset.nav;

                        if (!target) {
                            return;
                        }

                        event.preventDefault();

                        showPage(
                            target
                        );
                    }
                );
            }
        );
}


// ============================================================
// SYMPTOM SELECTION
// ============================================================

function setupSymptomSelection() {

    document
        .querySelectorAll(
            ".symptom-card, .symptom-item, .symptom"
        )
        .forEach(
            element => {

                if (
                    element.dataset.symptomBound ===
                    "true"
                ) {

                    return;
                }

                element.dataset.symptomBound =
                    "true";

                element.addEventListener(
                    "click",
                    () => {

                        // Preserve existing checkbox behavior

                        const checkbox =
                            element.querySelector(
                                'input[type="checkbox"]'
                            );

                        if (checkbox) {

                            checkbox.checked =
                                !checkbox.checked;

                            element.classList.toggle(
                                "selected",
                                checkbox.checked
                            );

                        } else {

                            element.classList.toggle(
                                "selected"
                            );
                        }
                    }
                );
            }
        );
}


// ============================================================
// SEARCH INPUT
// ============================================================

function setupSearch() {

    const search =
        $("doctorSearch");

    if (!search) {
        return;
    }

    search.addEventListener(
        "input",
        event => {

            searchDoctors(
                event.target.value
            );
        }
    );
}


// ============================================================
// BUTTON EVENTS
// ============================================================

function setupButtons() {

    const pdfButton =
        $("downloadReportBtn");

    if (
        pdfButton &&
        pdfButton.dataset.bound !==
        "true"
    ) {

        pdfButton.dataset.bound =
            "true";

        pdfButton.addEventListener(
            "click",
            downloadPDF
        );
    }

    const emailButton =
        $("emailReportBtn");

    if (
        emailButton &&
        emailButton.dataset.bound !==
        "true"
    ) {

        emailButton.dataset.bound =
            "true";

        emailButton.addEventListener(
            "click",
            sendEmailReport
        );
    }

    const saveButton =
        $("saveHistoryBtn");

    if (
        saveButton &&
        saveButton.dataset.bound !==
        "true"
    ) {

        saveButton.dataset.bound =
            "true";

        saveButton.addEventListener(
            "click",
            saveCurrentPrediction
        );
    }
}


// ============================================================
// UPDATE PREDICTION RESULT UI
// ============================================================

function renderPredictionResult(
    result
) {

    if (!result) {
        return;
    }

    currentResult =
        result;

    currentPredictionTime =
        result.prediction_time ||
        result.predictionTime ||
        new Date().toISOString();

    const rfDisease =
        result.disease ||
        result.rf_disease ||
        result.random_forest_disease ||
        "Unknown";

    const rfConfidence =
        Number(
            result.confidence ??
            result.rf_confidence ??
            result.random_forest_confidence ??
            0
        );

    const finalDisease =
        result.hybrid_disease ||
        result.hybridDisease ||
        result.final_prediction ||
        result.finalPrediction ||
        rfDisease;

    const finalConfidence =
        Number(
            result.hybrid_confidence ??
            result.hybridConfidence ??
            result.final_confidence ??
            result.finalConfidence ??
            rfConfidence
        );

    const agreement =
        result.agreement ||
        result.model_agreement ||
        result.modelAgreement ||
        (
            formatDisease(
                rfDisease
            ).toLowerCase() ===
            formatDisease(
                finalDisease
            ).toLowerCase()
                ? "Models Agree"
                : "Models Differ"
        );

    // --------------------------------------------------------
    // Random Forest
    // --------------------------------------------------------

    const rfDiseaseElement =
        $("rfDisease") ||
        $("randomForestDisease");

    if (rfDiseaseElement) {

        rfDiseaseElement.textContent =
            formatDisease(
                rfDisease
            );
    }

    const rfConfidenceElement =
        $("rfConfidence") ||
        $("randomForestConfidence");

    if (rfConfidenceElement) {

        rfConfidenceElement.textContent =
            `${rfConfidence.toFixed(
                2
            )}%`;
    }

    // --------------------------------------------------------
    // Final Prediction
    // --------------------------------------------------------

    const finalDiseaseElement =
        $("finalDisease") ||
        $("hybridDisease") ||
        $("hybridPrediction");

    if (finalDiseaseElement) {

        finalDiseaseElement.textContent =
            formatDisease(
                finalDisease
            );
    }

    const finalConfidenceElement =
        $("finalConfidence") ||
        $("hybridConfidence");

    if (finalConfidenceElement) {

        finalConfidenceElement.textContent =
            `${finalConfidence.toFixed(
                2
            )}%`;
    }

    // --------------------------------------------------------
    // Agreement
    // --------------------------------------------------------

    const agreementElement =
        $("agreement") ||
        $("modelAgreement");

    if (agreementElement) {

        agreementElement.textContent =
            agreement;
    }

    // --------------------------------------------------------
    // Qiskit
    // --------------------------------------------------------

    const quantumScore =
        Number(
            result.quantum_score ??
            result.qiskit_score ??
            result.qiskitScore ??
            0
        );

    const quantumSignal =
        Number(
            result.quantum_signal ??
            result.quantumSignal ??
            0
        );

    const qubits =
        result.qiskit_qubits ??
        result.qiskitQubits ??
        result.qubits ??
        "—";

    const depth =
        result.qiskit_depth ??
        result.qiskitDepth ??
        result.circuit_depth ??
        result.depth ??
        "—";

    const scoreElement =
        $("quantumScore") ||
        $("qiskitScore");

    if (scoreElement) {

        scoreElement.textContent =
            `${quantumScore.toFixed(
                2
            )}%`;
    }

    const signalElement =
        $("quantumSignal");

    if (signalElement) {

        signalElement.textContent =
            `${quantumSignal.toFixed(
                2
            )}%`;
    }

    const qubitsElement =
        $("qiskitQubits");

    if (qubitsElement) {

        qubitsElement.textContent =
            qubits;
    }

    const depthElement =
        $("qiskitDepth");

    if (depthElement) {

        depthElement.textContent =
            depth;
    }

    renderQuantumPage();
}


// ============================================================
// PREDICTION API
// ============================================================

async function runPrediction() {

    const symptoms =
        getSelectedSymptoms();

    if (
        symptoms.length === 0
    ) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }

    const patient =
        getPatientInformation();

    const button =
        $("predictBtn") ||
        $("predictionBtn") ||
        $("analyzeBtn");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Analyzing...";
    }

    try {

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
                                symptoms,

                            patient:
                                patient
                        })
                }
            );

        if (!response.ok) {

            throw new Error(
                `Prediction request failed: ${response.status}`
            );
        }

        const result =
            await response.json();

        // ----------------------------------------------------
        // Store result
        // ----------------------------------------------------

        currentPredictionTime =
            new Date().toISOString();

        currentResult = {

            ...result,

            patient:
                result.patient ||
                patient,

            selected_symptoms:
                result.selected_symptoms ||
                symptoms,

            prediction_time:
                result.prediction_time ||
                currentPredictionTime
        };

        // ----------------------------------------------------
        // Render result
        // ----------------------------------------------------

        renderPredictionResult(
            currentResult
        );

        // ----------------------------------------------------
        // Show result section if available
        // ----------------------------------------------------

        const resultSection =
            $("predictionResult") ||
            $("resultSection") ||
            $("results");

        if (resultSection) {

            resultSection.classList.add(
                "active"
            );

            resultSection.style.display =
                "";
        }

        // ----------------------------------------------------
        // Scroll to result
        // ----------------------------------------------------

        if (
            resultSection &&
            typeof resultSection.scrollIntoView ===
            "function"
        ) {

            resultSection.scrollIntoView(
                {
                    behavior:
                        "smooth",

                    block:
                        "start"
                }
            );
        }

    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        alert(
            error.message ||
            "Unable to complete prediction."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Analyze Symptoms";
        }
    }
}


// ============================================================
// LOGIN / AUTH STATE
// ============================================================

function handleAuthState(
    user
) {

    currentUser =
        user || null;

    if (!currentUser) {

        historyItems =
            [];

        updateDashboard();

        return;
    }

    loadLocalHistory();

    loadHistory();

    updateDashboard();
}


// ============================================================
// AUTH UI
// ============================================================

function updateAuthUI() {

    const loggedInElements =
        document.querySelectorAll(
            "[data-auth='logged-in']"
        );

    const loggedOutElements =
        document.querySelectorAll(
            "[data-auth='logged-out']"
        );

    loggedInElements.forEach(
        element => {

            element.style.display =
                currentUser
                    ? ""
                    : "none";
        }
    );

    loggedOutElements.forEach(
        element => {

            element.style.display =
                currentUser
                    ? "none"
                    : "";
        }
    );

    const userEmail =
        $("userEmail");

    if (
        userEmail &&
        currentUser
    ) {

        userEmail.textContent =
            currentUser.email ||
            "";
    }
}


// ============================================================
// INITIALIZE APPLICATION
// ============================================================

function initializeQuantumDiagnose() {

    console.log(
        "QuantumDiagnose initialized."
    );

    setupNavigation();

    setupSymptomSelection();

    setupSearch();

    setupButtons();

    // --------------------------------------------------------
    // Prediction button
    // --------------------------------------------------------

    const predictionButton =
        $("predictBtn") ||
        $("predictionBtn") ||
        $("analyzeBtn");

    if (
        predictionButton &&
        predictionButton.dataset.bound !==
        "true"
    ) {

        predictionButton.dataset.bound =
            "true";

        predictionButton.addEventListener(
            "click",
            runPrediction
        );
    }

    // --------------------------------------------------------
    // Initial heading
    // --------------------------------------------------------

    updatePageHeading(
        "prediction"
    );

    // --------------------------------------------------------
    // Existing local history
    // --------------------------------------------------------

    if (currentUser) {

        loadLocalHistory();

        loadHistory();
    }

    updateDashboard();

    updateAuthUI();
}


// ============================================================
// DOM READY
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeQuantumDiagnose
    );

} else {

    initializeQuantumDiagnose();
}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================
//
// These assignments allow the existing HTML onclick handlers
// to continue working without changing the HTML.
// ============================================================

window.downloadPDF =
    downloadPDF;

window.sendEmailReport =
    sendEmailReport;

window.saveCurrentPrediction =
    saveCurrentPrediction;

window.loadHistory =
    loadHistory;

window.deleteHistoryItem =
    deleteHistoryItem;

window.searchDoctors =
    searchDoctors;

window.showPage =
    showPage;

window.runPrediction =
    runPrediction;

window.renderPredictionResult =
    renderPredictionResult;

window.handleAuthState =
    handleAuthState;

window.updateAuthUI =
    updateAuthUI;


// ============================================================
// IMPORTANT:
// NO DARK/LIGHT TOGGLE HAS BEEN ADDED.
// NO SIDEBAR REDESIGN HAS BEEN ADDED.
// NO OTHER WEBSITE FUNCTIONALITY IS CHANGED.
// ============================================================


// ============================================================
// END OF SCRIPT.JS
// ============================================================
