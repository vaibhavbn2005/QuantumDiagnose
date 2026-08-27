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
            "Logout failed: " +
            error.message
        );
    }
}


// ============================================================
// NAVIGATION
// ============================================================

const pageNames = {

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

function goToPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );
        });

    const target =
        $(pageId);

    if (target) {

        target.classList.add(
            "active-page"
        );
    }

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === pageId
            );
        });

    if ($("pageTitle")) {

        $("pageTitle").textContent =
            pageNames[pageId] ||
            "QuantumDiagnose";
    }

    if (pageId === "history") {

        renderHistory();
    }

    if (pageId === "doctors") {

        loadDoctors();
    }

    if (pageId === "performance") {

        loadPerformance();
    }

    if (pageId === "quantum") {

        renderQuantumPage();
    }

    if (pageId === "comparison") {

        renderComparisonPage();
    }
}


// ============================================================
// PROFILE
// ============================================================

async function saveProfile() {

    if (!currentUser) {

        return;
    }

    const name =
        $("profileName")?.value
            .trim();

    const gender =
        $("profileGender")?.value;

    const age =
        $("profileAge")?.value;

    const height =
        $("profileHeight")?.value;

    const weight =
        $("profileWeight")?.value;

    if (
        !name ||
        !gender ||
        !age ||
        !height ||
        !weight
    ) {

        setProfileMessage(
            "Please complete all required fields.",
            true
        );

        return;
    }

    const profile = {

        userId:
            currentUser.uid,

        email:
            currentUser.email || "",

        name,

        gender,

        age:
            Number(age),

        height:
            Number(height),

        weight:
            Number(weight),

        updatedAt:
            new Date().toISOString()
    };

    try {

        await setDoc(
            doc(
                db,
                "profiles",
                currentUser.uid
            ),
            profile,
            {
                merge: true
            }
        );

        currentProfile =
            profile;

        localStorage.setItem(
            "quantumdiagnose_profile_" +
            currentUser.uid,
            JSON.stringify(profile)
        );

        setProfileMessage(
            "✓ Profile saved successfully.",
            false
        );

        updateProfileStatus();

        updateWelcomeName();

    } catch (error) {

        console.error(
            "Profile save error:",
            error
        );

        setProfileMessage(
            "Could not save profile: " +
            error.message,
            true
        );
    }
}

async function loadProfile() {

    if (!currentUser) {
        return;
    }

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "profiles",
                    currentUser.uid
                )
            );

        if (snapshot.exists()) {

            currentProfile =
                snapshot.data();

        } else {

            const local =
                localStorage.getItem(
                    "quantumdiagnose_profile_" +
                    currentUser.uid
                );

            if (local) {

                currentProfile =
                    JSON.parse(local);
            }
        }

    } catch (error) {

        console.error(
            "Profile load error:",
            error
        );

        const local =
            localStorage.getItem(
                "quantumdiagnose_profile_" +
                currentUser.uid
            );

        if (local) {

            try {

                currentProfile =
                    JSON.parse(local);

            } catch {
                currentProfile = null;
            }
        }
    }

    populateProfile();

    updateProfileStatus();

    updateWelcomeName();
}

function populateProfile() {

    if (!currentProfile) {
        return;
    }

    if ($("profileName")) {

        $("profileName").value =
            currentProfile.name || "";
    }

    if ($("profileGender")) {

        $("profileGender").value =
            currentProfile.gender || "";
    }

    if ($("profileAge")) {

        $("profileAge").value =
            currentProfile.age || "";
    }

    if ($("profileHeight")) {

        $("profileHeight").value =
            currentProfile.height || "";
    }

    if ($("profileWeight")) {

        $("profileWeight").value =
            currentProfile.weight || "";
    }
}

function isProfileComplete() {

    if (!currentProfile) {
        return false;
    }

    return Boolean(
        currentProfile.name &&
        currentProfile.gender &&
        currentProfile.age &&
        currentProfile.height &&
        currentProfile.weight
    );
}

function updateProfileStatus() {

    const box =
        $("profileStatus");

    if (!box) {
        return;
    }

    if (isProfileComplete()) {

        box.className =
            "profile-status completed";

        box.innerHTML =
            "<span>✓ Profile completed</span>";

    } else {

        box.className =
            "profile-status";

        box.innerHTML =
            "<span>Profile not completed</span>";
    }
}

function updateWelcomeName() {

    let name =
        currentProfile?.name;

    if (!name) {

        name =
            currentUser?.email
                ?.split("@")[0] ||
            "Patient";
    }

    if ($("welcomeName")) {

        $("welcomeName").textContent =
            name;
    }

    if ($("topUserName")) {

        $("topUserName").textContent =
            name;
    }
}

function setProfileMessage(
    text,
    error = false
) {

    const element =
        $("profileMessage");

    if (!element) {
        return;
    }

    element.textContent =
        text;

    element.className =
        "status-message " +
        (error
            ? "error"
            : "success");
}


// ============================================================
// SYMPTOMS
// ============================================================

function getSymptomCheckboxes() {

    return document.querySelectorAll(
        "#symptomGrid input[type='checkbox']"
    );
}

function getSelectedSymptoms() {

    const selected = [];

    getSymptomCheckboxes()
        .forEach(box => {

            if (box.checked) {

                selected.push(
                    box.value
                );
            }
        });

    return selected;
}

function updateCount() {

    const selected =
        getSelectedSymptoms();

    if ($("count")) {

        $("count").textContent =
            selected.length;
    }
}

function setupSymptoms() {

    getSymptomCheckboxes()
        .forEach(box => {

            box.addEventListener(
                "change",
                updateCount
            );
        });

    updateCount();
}


// ============================================================
// SEARCH
// ============================================================

function searchSymptoms() {

    const text =
        $("search")?.value
            .toLowerCase()
            .trim() || "";

    document
        .querySelectorAll(
            "#symptomGrid .symptom"
        )
        .forEach(item => {

            const name =
                item.dataset.name ||
                "";

            item.style.display =
                name.includes(text)
                    ? ""
                    : "none";
        });
}


// ============================================================
// CLEAR
// ============================================================

function clearSymptoms() {

    getSymptomCheckboxes()
        .forEach(box => {

            box.checked =
                false;
        });

    updateCount();

    if ($("search")) {

        $("search").value =
            "";
    }

    document
        .querySelectorAll(
            "#symptomGrid .symptom"
        )
        .forEach(item => {

            item.style.display =
                "";
        });

    $("result")
        ?.classList.add(
            "hidden"
        );
}


// ============================================================
// PREDICTION
// ============================================================

async function makePrediction() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }

    if (!isProfileComplete()) {

        alert(
            "Please complete your Patient Profile before making a prediction."
        );

        goToPage("profile");

        return;
    }

    const selected =
        getSelectedSymptoms();

    if (selected.length === 0) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }

    predictBtn.disabled =
        true;

    predictBtn.textContent =
        "Analyzing...";

    try {

        // Get a fresh Firebase ID token so the server
        // can verify this request is really from a
        // logged-in user before running the prediction.

        const idToken =
            await currentUser.getIdToken();

        const response =
            await fetch(
                "/predict",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + idToken
                    },

                    body:
                        JSON.stringify({
                            symptoms:
                                selected
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok ||
            data.success === false) {

            throw new Error(
                data.error ||
                "Prediction failed."
            );
        }

        currentPredictionTime =
            new Date();

        currentResult = {

            ...data,

            selected_symptoms:
                selected,

            prediction_time:
                currentPredictionTime.toISOString(),

            patient:
                currentProfile
        };

        renderPrediction(
            currentResult
        );

        goToPage(
            "prediction"
        );

        setTimeout(() => {

            $("result")
                ?.scrollIntoView({
                    behavior:
                        "smooth",
                    block:
                        "start"
                });

        }, 100);

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

        predictBtn.disabled =
            false;

        predictBtn.textContent =
            "🧠 Analyze Symptoms";
    }
}


// ============================================================
// RENDER PREDICTION
// ============================================================

function renderPrediction(data) {

    $("result")
        ?.classList.remove(
            "hidden"
        );

    const rf =
        Number(
            data.confidence ??
            data.rf_confidence ??
            0
        );

    const quantum =
        Number(
            data.quantum_score ??
            data.qiskit_score ??
            0
        );

    const difference =
        Number(
            data.score_difference ??
            Math.abs(
                rf - quantum
            )
        );

    const dateTime =
        formatDateTime(
            data.prediction_time
        );

    $("predictionDateTime")
        .textContent =
        "🕒 Prediction date & time: " +
        dateTime;

    $("disease")
        .textContent =
        formatDisease(
            data.disease
        );

    $("confidenceText")
        .textContent =
        rf.toFixed(2) +
        "%";

    $("confidenceBar")
        .style.width =
        Math.min(
            Math.max(rf, 0),
            100
        ) +
        "%";


    // TOP PREDICTIONS

    renderTopPredictions(
        data.top_predictions
    );


    // QISKIT

    $("quantumDisease")
        .textContent =
        formatDisease(
            data.qiskit_disease
        );

    $("quantumScoreText")
        .textContent =
        quantum.toFixed(2) +
        "%";

    $("quantumScoreBar")
        .style.width =
        Math.min(
            Math.max(quantum, 0),
            100
        ) +
        "%";

    $("quantumQubits")
        .textContent =
        data.qiskit_qubits ??
        "—";

    $("quantumDepth")
        .textContent =
        data.qiskit_depth ??
        "—";

    $("quantumSignal")
        .textContent =
        Number(
            data.quantum_signal || 0
        ).toFixed(2) +
        "%";

    renderTopPredictions(
        data.qiskit_top_predictions,
        "quantumTopPredictions"
    );


    // HYBRID

    if ($("hybridDisease")) {

        $("hybridDisease")
            .textContent =
            formatDisease(
                data.hybrid_disease
            );
    }

    if ($("hybridConfidenceText")) {

        $("hybridConfidenceText")
            .textContent =
            Number(
                data.hybrid_confidence || 0
            ).toFixed(2) +
            "%";
    }

    const agreementLabel =
        data.model_agreement ||
        getAgreement(difference);

    if ($("hybridAgreementBadge")) {

        $("hybridAgreementBadge")
            .textContent =
            agreementLabel +
            " agreement";

        $("hybridAgreementBadge")
            .className =
            "agreement-badge " +
            agreementLabel.toLowerCase();
    }


    // COMPARISON

    $("comparisonRF")
        .textContent =
        rf.toFixed(2) +
        "%";

    $("comparisonQuantum")
        .textContent =
        quantum.toFixed(2) +
        "%";

    $("comparisonDifference")
        .textContent =
        difference.toFixed(2) +
        "%";

    $("comparisonDisease")
        .textContent =
        formatDisease(
            data.disease
        );

    renderAgreement(
        agreementLabel
    );


    // DOCTORS

    renderDoctors(
        data.doctors || [],
        data.specialty
    );


    // SUMMARY

    renderPredictionSummary(
        data.top_predictions
    );


    // MESSAGE

    $("message")
        .textContent =
        data.message ||
        "Educational symptom-analysis result.";


    // SAVE BUTTON

    $("saveHistoryMessage")
        .textContent =
        "";


    // DASHBOARD

    updateDashboard();
}


// ============================================================
// TOP PREDICTIONS
// ============================================================

function renderTopPredictions(
    predictions,
    containerId = "topPredictions"
) {

    const container =
        $(containerId);

    if (!container) {
        return;
    }

    if (
        !Array.isArray(predictions) ||
        predictions.length === 0
    ) {

        container.innerHTML =
            "<p class='muted'>No predictions available.</p>";

        return;
    }

    container.innerHTML =
        predictions
            .slice(0, 5)
            .map(item => {

                return `
                    <div class="prediction-row">

                        <span>
                            ${escapeHTML(
                                formatDisease(
                                    item.disease
                                )
                            )}
                        </span>

                        <strong>
                            ${Number(
                                item.confidence || 0
                            ).toFixed(2)}%
                        </strong>

                    </div>
                `;

            })
            .join("");
}

function renderPredictionSummary(
    predictions
) {

    const container =
        $("predictionSummary");

    if (!container) {
        return;
    }

    if (
        !Array.isArray(predictions)
    ) {

        container.innerHTML =
            "";

        return;
    }

    container.innerHTML =
        predictions
            .slice(0, 5)
            .map(item => {

                return `
                    <div class="prediction-row">

                        <span>
                            ${escapeHTML(
                                formatDisease(
                                    item.disease
                                )
                            )}
                        </span>

                        <strong>
                            ${Number(
                                item.confidence || 0
                            ).toFixed(2)}%
                        </strong>

                    </div>
                `;

            })
            .join("");
}


// ============================================================
// AGREEMENT
// ============================================================

function getAgreement(
    difference
) {

    if (difference <= 5) {
        return "High";
    }

    if (difference <= 10) {
        return "Moderate";
    }

    return "Low";
}

function renderAgreement(
    agreement
) {

    const badge =
        $("agreementBadge");

    if (!badge) {
        return;
    }

    badge.textContent =
        agreement +
        " agreement";

    badge.className =
        "agreement-badge " +
        agreement.toLowerCase();
}


// ============================================================
// DOCTORS
// ============================================================

function doctorCard(
    doctor
) {

    return `
        <div class="doctor-card">

            <div class="doctor-icon">
                👨‍⚕️
            </div>

            <h3>
                ${escapeHTML(
                    doctor.name ||
                    "Doctor"
                )}
            </h3>

            <span class="doctor-specialty">
                ${escapeHTML(
                    doctor.specialization ||
                    "General Physician"
                )}
            </span>

            <p>
                🏥
                ${escapeHTML(
                    doctor.hospital ||
                    ""
                )}
            </p>

            <p>
                📍
                ${escapeHTML(
                    doctor.location ||
                    "Location unavailable"
                )}
            </p>

            <p>
                ⭐ Experience:
                ${escapeHTML(
                    doctor.experience ||
                    "—"
                )}
            </p>

        </div>
    `;
}

function renderDoctors(
    doctors,
    specialty
) {

    const specialistBox =
        $("specialistBox");

    const container =
        $("recommendedDoctors");

    if (specialistBox) {

        specialistBox.innerHTML = `
            <strong>
                Recommended Specialty:
            </strong>

            <span>
                ${escapeHTML(
                    specialty ||
                    "General Physician"
                )}
            </span>
        `;
    }

    if (!container) {
        return;
    }

    if (
        !Array.isArray(doctors) ||
        doctors.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                No matching demonstration doctor found.
            </div>
        `;

        return;
    }

    container.innerHTML =
        doctors
            .slice(0, 3)
            .map(
                doctorCard
            )
            .join("");
}

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

        const data =
            await response.json();

        const doctors =
            data.doctors || [];

        if (doctors.length === 0) {

            container.innerHTML =
                `<div class="empty-state">
                    No doctors available.
                </div>`;

            return;
        }

        container.innerHTML =
            doctors
                .map(
                    doctorCard
                )
                .join("");

    } catch (error) {

        console.error(
            "Doctor load error:",
            error
        );

        container.innerHTML =
            `<div class="empty-state">
                Unable to load doctor directory.
            </div>`;
    }
}


// ============================================================
// SAVE HISTORY
// ============================================================

async function saveCurrentHistory() {

    if (!currentUser) {
        return;
    }

    if (!currentResult) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    const saveButton =
        $("saveHistoryBtn");

    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";
    }

    const item = {

        userId:
            currentUser.uid,

        userEmail:
            currentUser.email || "",

        patient:
            currentResult.patient || null,

        symptoms:
            currentResult.selected_symptoms || [],

        disease:
            currentResult.disease || "",

        confidence:
            Number(
                currentResult.confidence ||
                currentResult.rf_confidence ||
                0
            ),

        topPredictions:
            currentResult.top_predictions || [],

        qiskitDisease:
            currentResult.qiskit_disease || "",

        qiskitTopPredictions:
            currentResult.qiskit_top_predictions || [],

        qiskitScore:
            Number(
                currentResult.qiskit_score ||
                currentResult.quantum_score ||
                0
            ),

        qiskitQubits:
            currentResult.qiskit_qubits || 0,

        qiskitDepth:
            currentResult.qiskit_depth || 0,

        quantumSignal:
            currentResult.quantum_signal || 0,

        scoreDifference:
            currentResult.score_difference || 0,

        modelAgreement:
            currentResult.model_agreement || "",

        hybridDisease:
            currentResult.hybrid_disease || "",

        hybridConfidence:
            Number(
                currentResult.hybrid_confidence || 0
            ),

        specialty:
            currentResult.specialty || "",

        doctors:
            currentResult.doctors || [],

        predictionTime:
            currentResult.prediction_time ||
            new Date().toISOString()
    };

    try {

        await addDoc(
            collection(
                db,
                "predictions"
            ),
            {
                ...item,
                createdAt:
                    serverTimestamp()
            }
        );

        historyItems.unshift(
            item
        );

        saveLocalHistory();

        $("saveHistoryMessage")
            .textContent =
            "✓ Saved to Prediction History";

        await loadHistory();

        updateDashboard();

    } catch (error) {

        console.error(
            "History save error:",
            error
        );

        $("saveHistoryMessage")
            .textContent =
            "Could not save history.";

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 Save to History";
        }
    }
}


// ============================================================
// HISTORY
// ============================================================

function historyStorageKey() {

    if (!currentUser) {
        return null;
    }

    return (
        "quantumdiagnose_history_" +
        currentUser.uid
    );
}

function saveLocalHistory() {

    const key =
        historyStorageKey();

    if (!key) {
        return;
    }

    try {

        localStorage.setItem(
            key,
            JSON.stringify(
                historyItems.slice(
                    0,
                    30
                )
            )
        );

    } catch (error) {

        console.error(
            "Local history save error:",
            error
        );
    }
}

function loadLocalHistory() {

    const key =
        historyStorageKey();

    if (!key) {
        return [];
    }

    try {

        const raw =
            localStorage.getItem(
                key
            );

        if (!raw) {
            return [];
        }

        const data =
            JSON.parse(raw);

        return Array.isArray(data)
            ? data
            : [];

    } catch {

        return [];
    }
}

async function loadHistory() {

    if (!currentUser) {
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
                    currentUser.uid
                )
            );

        const snapshot =
            await getDocs(q);

        const firestoreItems = [];

        snapshot.forEach(
            docSnap => {

                firestoreItems.push(
                    docSnap.data()
                );
            }
        );

        firestoreItems.sort(
            (a, b) => {

                return (
                    new Date(
                        b.predictionTime ||
                        0
                    ).getTime()
                    -
                    new Date(
                        a.predictionTime ||
                        0
                    ).getTime()
                );
            }
        );

        const local =
            loadLocalHistory();

        const combined = [
            ...firestoreItems,
            ...local
        ];

        const unique = [];

        const seen = new Set();

        combined.forEach(item => {

            const key =
                [
                    item.predictionTime,
                    item.disease,
                    JSON.stringify(
                        item.symptoms || []
                    )
                ].join("|");

            if (!seen.has(key)) {

                seen.add(key);

                unique.push(item);
            }
        });

        historyItems =
            unique
                .sort(
                    (a, b) => {

                        return (
                            new Date(
                                b.predictionTime ||
                                0
                            ).getTime()
                            -
                            new Date(
                                a.predictionTime ||
                                0
                            ).getTime()
                        );
                    }
                )
                .slice(
                    0,
                    30
                );

    } catch (error) {

        console.error(
            "History load error:",
            error
        );

        historyItems =
            loadLocalHistory();
    }

    renderHistory();

    updateDashboard();
}

function renderHistory() {

    const container =
        $("historyList");

    if (!container) {
        return;
    }

    if (
        !historyItems ||
        historyItems.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <strong>
                    No prediction history
                </strong>

                <p>
                    Your saved prediction reports will appear here.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        historyItems
            .map(
                (item, index) => {

                    const date =
                        formatDateTime(
                            item.predictionTime
                        );

                    const symptoms =
                        (item.symptoms || [])
                            .map(
                                formatDisease
                            )
                            .join(", ");

                    return `
                        <div class="history-card">

                            <div class="history-main">

                                <div class="history-date">
                                    🕒 ${escapeHTML(date)}
                                </div>

                                <h3>
                                    ${escapeHTML(
                                        formatDisease(
                                            item.disease
                                        )
                                    )}
                                </h3>

                                <p>
                                    Symptoms:
                                    ${escapeHTML(
                                        symptoms ||
                                        "Not recorded"
                                    )}
                                </p>

                                <div class="history-scores">

                                    <span>
                                        RF:
                                        ${Number(
                                            item.confidence || 0
                                        ).toFixed(2)}%
                                    </span>

                                    <span>
                                        Qiskit:
                                        ${Number(
                                            item.qiskitScore || 0
                                        ).toFixed(2)}%
                                    </span>

                                    <span>
                                        Agreement:
                                        ${escapeHTML(
                                            item.modelAgreement ||
                                            "—"
                                        )}
                                    </span>

                                </div>

                            </div>


                            <div class="history-actions">

                                <button
                                    class="history-icon-btn"
                                    type="button"
                                    title="Email this report"
                                    data-history-email-index="${index}">

                                    📧

                                </button>

                                <button
                                    class="history-download"
                                    type="button"
                                    data-history-index="${index}">

                                    📄 PDF

                                </button>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");

    container
        .querySelectorAll(
            "[data-history-index]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.historyIndex
                        );

                    const item =
                        historyItems[index];

                    if (item) {

                        downloadPDF(
                            item
                        );
                    }
                }
            );
        });

    container
        .querySelectorAll(
            "[data-history-email-index]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.historyEmailIndex
                        );

                    const item =
                        historyItems[index];

                    if (item) {

                        openEmailModal(
                            item
                        );
                    }
                }
            );
        });
}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    if ($("predictionCount")) {

        $("predictionCount")
            .textContent =
            historyItems.length;
    }

    const latest =
        currentResult ||
        historyItems[0];

    if (!latest) {

        $("latestDisease")
            .textContent =
            "—";

        $("latestConfidence")
            .textContent =
            "—";

        $("latestDate")
            .textContent =
            "—";

        $("dashboardLatest")
            .innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        🧠
                    </div>

                    <strong>
                        No prediction yet
                    </strong>

                    <p>
                        Start a new symptom analysis.
                    </p>

                </div>
            `;

        return;
    }

    const confidence =
        Number(
            latest.confidence ||
            latest.rf_confidence ||
            0
        );

    const diseaseName =
        formatDisease(
            latest.disease
        );

    $("latestDisease")
        .textContent =
        diseaseName;

    $("latestConfidence")
        .textContent =
        confidence.toFixed(2) +
        "%";

    $("latestDate")
        .textContent =
        formatDateTime(
            latest.prediction_time ||
            latest.predictionTime
        );

    $("dashboardLatest")
        .innerHTML = `

            <div class="comparison-values">

                <div>

                    <span>
                        Predicted Disease
                    </span>

                    <strong>
                        ${escapeHTML(
                            diseaseName
                        )}
                    </strong>

                </div>

                <div>

                    <span>
                        Random Forest
                    </span>

                    <strong>
                        ${confidence.toFixed(2)}%
                    </strong>

                </div>

                <div>

                    <span>
                        Qiskit
                    </span>

                    <strong>
                        ${Number(
                            latest.quantum_score ||
                            latest.qiskitScore ||
                            0
                        ).toFixed(2)}%
                    </strong>

                </div>

            </div>

            <p class="muted">

                🕒
                ${escapeHTML(
                    formatDateTime(
                        latest.prediction_time ||
                        latest.predictionTime
                    )
                )}

            </p>
        `;
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

        if ($("metricAccuracy")) {

            $("metricAccuracy")
                .textContent =
                Number(
                    data.accuracy || 0
                ).toFixed(2) +
                "%";
        }

        if ($("metricPrecision")) {

            $("metricPrecision")
                .textContent =
                Number(
                    data.precision || 0
                ).toFixed(2) +
                "%";
        }

        if ($("metricRecall")) {

            $("metricRecall")
                .textContent =
                Number(
                    data.recall || 0
                ).toFixed(2) +
                "%";
        }

        if ($("metricF1")) {

            $("metricF1")
                .textContent =
                Number(
                    data.f1 || 0
                ).toFixed(2) +
                "%";
        }

        $("trainingSamples")
            .textContent =
            data.training_samples ??
            "—";

        $("testingSamples")
            .textContent =
            data.testing_samples ??
            "—";

        $("symptomTotal")
            .textContent =
            data.number_of_symptoms ??
            "—";

        $("diseaseTotal")
            .textContent =
            data.number_of_diseases ??
            "—";

    } catch (error) {

        console.error(
            "Performance error:",
            error
        );
    }
}


// ============================================================
// QUANTUM PAGE
// ============================================================

function renderQuantumPage() {

    const container =
        $("quantumResult");

    if (!container) {
        return;
    }

    if (!currentResult) {

        container.innerHTML = `
            <strong>
                No analysis available.
            </strong>

            <p>
                Complete a prediction first. The Qiskit
                analysis will then appear here.
            </p>
        `;

        return;
    }

    const score =
        Number(
            currentResult.quantum_score ||
            currentResult.qiskit_score ||
            0
        );

    container.innerHTML = `

        <div class="comparison-values">

            <div>

                <span>
                    Predicted Disease
                </span>

                <strong>
                    ${escapeHTML(
                        formatDisease(
                            currentResult.qiskit_disease
                        )
                    )}
                </strong>

            </div>

            <div>

                <span>
                    Qubits Used
                </span>

                <strong>
                    ${currentResult.qiskit_qubits ?? "—"}
                </strong>

            </div>

            <div>

                <span>
                    Circuit Depth
                </span>

                <strong>
                    ${currentResult.qiskit_depth ?? "—"}
                </strong>

            </div>

        </div>

        <div class="comparison-values">

            <div>

                <span>
                    Qiskit Confidence
                </span>

                <strong>
                    ${score.toFixed(2)}%
                </strong>

            </div>

            <div>

                <span>
                    Quantum Signal
                </span>

                <strong>
                    ${Number(
                        currentResult.quantum_signal || 0
                    ).toFixed(2)}%
                </strong>

            </div>

        </div>

        <div class="result-warning">

            <strong>
                ⚠ Experimental Component
            </strong>

            <p>
                This quantum score is an educational
                demonstration and is not a clinically
                validated probability.
            </p>

        </div>
    `;
}


// ============================================================
// COMPARISON PAGE
// ============================================================

function renderComparisonPage() {

    if (!currentResult) {
        return;
    }

    const rf =
        Number(
            currentResult.confidence ||
            currentResult.rf_confidence ||
            0
        );

    const quantum =
        Number(
            currentResult.quantum_score ||
            currentResult.qiskit_score ||
            0
        );

    const difference =
        Number(
            currentResult.score_difference ||
            Math.abs(
                rf - quantum
            )
        );

    $("comparisonDiseasePage")
        .textContent =
        formatDisease(
            currentResult.disease
        );

    $("comparisonRFPage")
        .textContent =
        rf.toFixed(2) +
        "%";

    $("comparisonQuantumDiseasePage")
        .textContent =
        formatDisease(
            currentResult.qiskit_disease ||
            currentResult.disease
        );

    $("comparisonQuantumPage")
        .textContent =
        quantum.toFixed(2) +
        "%";

    $("agreementPage")
        .textContent =
        `${
            currentResult.model_agreement ||
            getAgreement(difference)
        } agreement • ${
            difference.toFixed(2)
        }% score difference`;
}


// ============================================================
// PDF REPORT (COMPACT SINGLE PAGE)
// ============================================================
// Note: jsPDF's built-in fonts can only render plain text
// (no color emoji), so this report uses clean typography and
// simple bullet points instead of emoji, and is deliberately
// laid out to fit on a single A4 page regardless of how many
// symptoms or predictions are included.

function downloadPDF(
    source
) {

    if (!source) {

        alert(
            "No prediction report is available."
        );

        return;
    }

    const jsPDF =
        window.jspdf?.jsPDF;

    if (!jsPDF) {

        alert(
            "PDF generator could not be loaded. Please refresh the page and try again."
        );

        return;
    }

    const doc =
        new jsPDF({
            unit: "mm",
            format: "a4"
        });

    const patient =
        source.patient ||
        currentProfile ||
        {};

    const predictionTime =
        source.prediction_time ||
        source.predictionTime ||
        new Date().toISOString();

    const rf =
        Number(
            source.confidence ||
            source.rf_confidence ||
            0
        );

    const quantum =
        Number(
            source.quantum_score ||
            source.qiskit_score ||
            source.qiskitScore ||
            0
        );

    const disease =
        formatDisease(
            source.disease
        );

    const qiskitDisease =
        formatDisease(
            source.qiskit_disease ||
            source.qiskitDisease
        );

    const hybridDisease =
        formatDisease(
            source.hybrid_disease ||
            source.hybridDisease ||
            source.disease
        );

    const hybridConfidence =
        Number(
            source.hybrid_confidence ||
            source.hybridConfidence ||
            0
        );

    const symptoms =
        (
            source.selected_symptoms ||
            source.symptoms ||
            []
        )
            .map(
                formatDisease
            )
            .join(", ");

    // --------------------------------------------------------
    // LAYOUT CONSTANTS
    // --------------------------------------------------------
    // A single, compact, left-aligned "medical report" layout.
    // Every section uses the same heading style and consistent
    // spacing so the whole thing reads as one clean page. The
    // footer is placed just below the last block of content
    // instead of being pinned to the physical bottom of the
    // page, so short reports don't end with a large empty gap.

    const MARGIN = 16;
    const PAGE_WIDTH = 210;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    const PRIMARY = [49, 91, 234];
    const INK = [24, 34, 56];
    const MUTED = [104, 116, 138];
    const RULE = [222, 229, 240];
    const NOTICE_BG = [255, 248, 232];
    const NOTICE_BORDER = [244, 226, 181];
    const NOTICE_TEXT = [117, 90, 29];

    let y = 16;

    function sectionHeading(text) {

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PRIMARY);
        doc.text(text.toUpperCase(), MARGIN, y);

        y += 2.2;

        doc.setDrawColor(...RULE);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);

        y += 5.4;

        doc.setTextColor(...INK);
    }

    function bodyLine(text, options = {}) {

        doc.setFont(
            "helvetica",
            options.bold ? "bold" : "normal"
        );

        doc.setFontSize(options.size || 8.6);
        doc.setTextColor(...(options.color || INK));
        doc.text(text, MARGIN, y);

        y += options.gap || 4.6;
    }

    function wrappedBlock(text, options = {}) {

        doc.setFont("helvetica", "normal");
        doc.setFontSize(options.size || 8.6);
        doc.setTextColor(...INK);

        const wrapped =
            doc.splitTextToSize(
                text,
                CONTENT_WIDTH
            );

        doc.text(wrapped, MARGIN, y);

        y += wrapped.length * (options.lineHeight || 4.2);
    }

    function sectionGap(amount = 5.4) {

        y += amount;
    }


    // ------------------------------------------------------
    // HEADER
    // ------------------------------------------------------

    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.setTextColor(...PRIMARY);
    doc.text("QuantumDiagnose", MARGIN, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(
        "AI-Assisted Symptom Analysis Report",
        MARGIN,
        y
    );

    y += 4;

    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);

    y += 8;

    doc.setTextColor(...INK);


    // ------------------------------------------------------
    // PATIENT INFORMATION
    // ------------------------------------------------------

    sectionHeading("Patient Information");

    bodyLine(
        `Name: ${patient.name || "-"}     Email: ${source.userEmail || currentUser?.email || "-"}`
    );

    bodyLine(
        `Gender: ${patient.gender || "-"}     Age: ${patient.age || "-"}     Height: ${patient.height ? patient.height + " cm" : "-"}     Weight: ${patient.weight ? patient.weight + " kg" : "-"}`
    );

    bodyLine(
        `Date & Time: ${formatDateTime(predictionTime)}`
    );

    sectionGap();


    // ------------------------------------------------------
    // SELECTED SYMPTOMS
    // ------------------------------------------------------

    sectionHeading("Selected Symptoms");

    wrappedBlock(
        symptoms || "No symptoms recorded."
    );

    sectionGap();


    // ------------------------------------------------------
    // RANDOM FOREST RESULT
    // ------------------------------------------------------

    sectionHeading("Random Forest Result");

    bodyLine(
        `Predicted Disease: ${disease}     Confidence: ${rf.toFixed(2)}%`
    );

    bodyLine("Top Predictions:", { bold: true, gap: 4.4 });

    const topList =
        (source.top_predictions || []).slice(0, 3);

    if (topList.length === 0) {

        bodyLine("-  No additional predictions recorded.");

    } else {

        topList.forEach(item => {

            bodyLine(
                `-  ${formatDisease(item.disease)}: ${Number(item.confidence || 0).toFixed(2)}%`
            );
        });
    }

    sectionGap();


    // ------------------------------------------------------
    // QISKIT RESULT
    // ------------------------------------------------------

    sectionHeading("Qiskit Result");

    bodyLine(
        `Predicted Disease: ${qiskitDisease}     Confidence: ${quantum.toFixed(2)}%`
    );

    bodyLine(
        `Quantum Signal: ${Number(source.quantum_signal || source.quantumSignal || 0).toFixed(2)}%     Qubits Used: ${source.qiskit_qubits ?? source.qiskitQubits ?? "-"}     Circuit Depth: ${source.qiskit_depth ?? source.qiskitDepth ?? "-"}`
    );

    sectionGap();


    // ------------------------------------------------------
    // HYBRID PREDICTION
    // ------------------------------------------------------

    sectionHeading("Hybrid Prediction");

    bodyLine(
        `Disease: ${hybridDisease}     Confidence: ${hybridConfidence.toFixed(2)}%     Agreement: ${source.model_agreement || source.modelAgreement || "-"}`
    );

    sectionGap();


    // ------------------------------------------------------
    // DOCTOR RECOMMENDATION
    // ------------------------------------------------------

    sectionHeading("Doctor Recommendation");

    bodyLine(
        `Recommended Specialty: ${source.specialty || "General Physician"}`
    );

    const doctors = source.doctors || [];

    if (doctors.length) {

        const doctor = doctors[0];

        bodyLine(
            `Doctor: ${doctor.name || "-"}     Experience: ${doctor.experience || "-"}`
        );

        bodyLine(
            `Hospital: ${doctor.hospital || "-"}, ${doctor.location || "-"}`
        );
    }

    sectionGap(6);


    // ------------------------------------------------------
    // IMPORTANT NOTICE (kept as a highlighted box)
    // ------------------------------------------------------

    const disclaimer =
        "QuantumDiagnose is an educational and research demonstration. The Random Forest prediction is generated " +
        "from the project dataset. The Qiskit score is experimental and is not a clinically validated probability. " +
        "This report is not a medical diagnosis or a substitute for professional medical advice. Please consult a " +
        "licensed physician for health concerns.";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.6);

    const disclaimerLines =
        doc.splitTextToSize(
            disclaimer,
            CONTENT_WIDTH - 8
        );

    const noticeBoxHeight =
        disclaimerLines.length * 3.6 + 10;

    doc.setFillColor(...NOTICE_BG);
    doc.setDrawColor(...NOTICE_BORDER);
    doc.setLineWidth(0.35);
    doc.roundedRect(
        MARGIN,
        y,
        CONTENT_WIDTH,
        noticeBoxHeight,
        2,
        2,
        "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.6);
    doc.setTextColor(...NOTICE_TEXT);
    doc.text("Important Notice", MARGIN + 4.5, y + 5.4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.6);
    doc.text(disclaimerLines, MARGIN + 4.5, y + 9.8);

    y += noticeBoxHeight;

    doc.setTextColor(...INK);


    // ------------------------------------------------------
    // FOOTER
    // ------------------------------------------------------
    // Sits just below the report content, left-aligned to the
    // main content edge, rather than forced to the physical
    // bottom of the page (which would leave a large empty gap
    // on shorter reports).

    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.setTextColor(...MUTED);

    doc.text(
        "QuantumDiagnose \u2022 Educational Project",
        MARGIN,
        y
    );

    doc.text(
        "Generated: " + formatDateTime(new Date()),
        MARGIN,
        y + 4
    );

    const safeDisease =
        disease.replace(/[^a-z0-9]/gi, "_");

    doc.save(
        "QuantumDiagnose_Report_" + safeDisease + ".pdf"
    );
}


// ============================================================
// CURRENT REPORT DOWNLOAD
// ============================================================

function downloadCurrentReport() {

    if (!currentResult) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    downloadPDF(
        currentResult
    );
}


// ============================================================
// EMAIL REPORT MODAL
// ============================================================

const emailModalOverlay =
    $("emailModalOverlay");

const emailModalInput =
    $("emailModalInput");

const emailModalSend =
    $("emailModalSend");

const emailModalMessage =
    $("emailModalMessage");

const emailModalClose =
    $("emailModalClose");

function setEmailModalMessage(
    text,
    error = false
) {

    if (!emailModalMessage) {
        return;
    }

    emailModalMessage.textContent =
        text;

    emailModalMessage.className =
        "status-message " +
        (error
            ? "error"
            : "success");
}

function openEmailModal(source) {

    if (!source) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    emailReportSource =
        source;

    setEmailModalMessage("");

    if (emailModalInput) {

        emailModalInput.value =
            currentUser?.email ||
            source.userEmail ||
            "";
    }

    emailModalOverlay
        ?.classList.remove(
            "hidden"
        );

    emailModalInput
        ?.focus();
}

function closeEmailModal() {

    emailModalOverlay
        ?.classList.add(
            "hidden"
        );

    emailReportSource =
        null;
}

async function sendEmailReport() {

    if (!emailReportSource) {

        setEmailModalMessage(
            "No prediction report is available.",
            true
        );

        return;
    }

    const toEmail =
        emailModalInput?.value
            .trim();

    if (
        !toEmail ||
        !toEmail.includes("@")
    ) {

        setEmailModalMessage(
            "Please enter a valid email address.",
            true
        );

        return;
    }

    const source =
        emailReportSource;

    const payload = {

        to_email:
            toEmail,

        patient:
            source.patient ||
            currentProfile ||
            {},

        disease:
            source.disease,

        confidence:
            source.confidence ??
            source.rf_confidence,

        quantum_score:
            source.quantum_score ??
            source.qiskit_score ??
            source.qiskitScore,

        qiskit_disease:
            source.qiskit_disease ??
            source.qiskitDisease,

        hybrid_disease:
            source.hybrid_disease ??
            source.hybridDisease,

        hybrid_confidence:
            source.hybrid_confidence ??
            source.hybridConfidence,

        quantum_signal:
            source.quantum_signal ??
            source.quantumSignal,

        qiskit_qubits:
            source.qiskit_qubits ??
            source.qiskitQubits,

        qiskit_depth:
            source.qiskit_depth ??
            source.qiskitDepth,

        specialty:
            source.specialty,

        doctors:
            source.doctors || [],

        top_predictions:
            source.top_predictions ||
            source.topPredictions ||
            [],

        qiskit_top_predictions:
            source.qiskit_top_predictions ||
            source.qiskitTopPredictions ||
            [],

        selected_symptoms:
            source.selected_symptoms ||
            source.symptoms ||
            [],

        prediction_time:
            source.prediction_time ||
            source.predictionTime
    };

    if (emailModalSend) {

        emailModalSend.disabled =
            true;

        emailModalSend.textContent =
            "Sending...";
    }

    setEmailModalMessage(
        "Sending report..."
    );

    try {

        const idToken =
            currentUser
                ? await currentUser.getIdToken()
                : null;

        const headers = {
            "Content-Type":
                "application/json"
        };

        if (idToken) {

            headers.Authorization =
                "Bearer " + idToken;
        }

        const response =
            await fetch(
                "/send-report",
                {
                    method:
                        "POST",
                    headers,
                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            data.success === false
        ) {

            throw new Error(
                data.error ||
                "Could not send the report."
            );
        }

        setEmailModalMessage(
            "✓ Report sent to " +
            toEmail
        );

        setTimeout(
            closeEmailModal,
            1400
        );

    } catch (error) {

        console.error(
            "Email report error:",
            error
        );

        setEmailModalMessage(
            error.message ||
            "Could not send the report.",
            true
        );

    } finally {

        if (emailModalSend) {

            emailModalSend.disabled =
                false;

            emailModalSend.textContent =
                "Send Report";
        }
    }
}


// ============================================================
// EVENT LISTENERS
// ============================================================

loginTab?.addEventListener(
    "click",
    () => {

        setAuthMode(
            "login"
        );
    }
);

signupTab?.addEventListener(
    "click",
    () => {

        setAuthMode(
            "signup"
        );
    }
);

authSubmit?.addEventListener(
    "click",
    handleAuthentication
);

authPassword?.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            handleAuthentication();
        }
    }
);

forgotPasswordBtn?.addEventListener(
    "click",
    handleForgotPassword
);

logoutBtn?.addEventListener(
    "click",
    logoutUser
);


document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(item => {

        item.addEventListener(
            "click",
            () => {

                goToPage(
                    item.dataset.page
                );
            }
        );
    });


document
    .querySelectorAll(
        "[data-go]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                goToPage(
                    button.dataset.go
                );
            }
        );
    });


$("saveProfileBtn")
    ?.addEventListener(
        "click",
        saveProfile
    );


$("search")
    ?.addEventListener(
        "input",
        searchSymptoms
    );


$("clearBtn")
    ?.addEventListener(
        "click",
        clearSymptoms
    );


$("predictBtn")
    ?.addEventListener(
        "click",
        makePrediction
    );


$("saveHistoryBtn")
    ?.addEventListener(
        "click",
        saveCurrentHistory
    );


$("downloadReportBtn")
    ?.addEventListener(
        "click",
        downloadCurrentReport
    );


$("downloadReportBtn2")
    ?.addEventListener(
        "click",
        downloadCurrentReport
    );


$("emailReportBtn")
    ?.addEventListener(
        "click",
        () => openEmailModal(currentResult)
    );


$("emailReportBtn2")
    ?.addEventListener(
        "click",
        () => openEmailModal(currentResult)
    );


emailModalClose
    ?.addEventListener(
        "click",
        closeEmailModal
    );


emailModalSend
    ?.addEventListener(
        "click",
        sendEmailReport
    );


emailModalOverlay
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                emailModalOverlay
            ) {

                closeEmailModal();
            }
        }
    );


emailModalInput
    ?.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                sendEmailReport();
            }
        }
    );


$("quantumBtn")
    ?.addEventListener(
        "click",
        renderQuantumPage
    );


// ============================================================
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        if (user) {

            await showApp(
                user
            );

        } else {

            showAuthScreen();
        }
    }
);


// ============================================================
// INITIALIZE
// ============================================================

setupSymptoms();

setAuthMode(
    "login"
);

console.log(
    "QuantumDiagnose loaded successfully."
);
