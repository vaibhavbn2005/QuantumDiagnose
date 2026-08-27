// ============================================================
// QUANTUMDIAGNOSE
// PROFESSIONAL FRONTEND
// EMAIL/PASSWORD AUTHENTICATION & REPORT GENERATOR
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

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

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
    if (!value) return "—";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });
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

const authScreen = $("authScreen");
const app = $("app");
const loginTab = $("loginTab");
const signupTab = $("signupTab");
const authEmail = $("authEmail");
const authPassword = $("authPassword");
const authSubmit = $("authSubmit");
const authMessage = $("authMessage");
const logoutBtn = $("logoutBtn");
const forgotPasswordBtn = $("forgotPasswordBtn");
const predictBtn = $("predictBtn");


// ============================================================
// AUTH HANDLERS
// ============================================================

function showAuthMessage(text, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = text;
    authMessage.className = "auth-message " + (isError ? "error" : "success");
}

function setAuthMode(mode) {
    authMode = mode;
    loginTab?.classList.toggle("active", mode === "login");
    signupTab?.classList.toggle("active", mode === "signup");

    if (authSubmit) {
        authSubmit.textContent = mode === "login" ? "Login" : "Create Account";
    }
    showAuthMessage("");
}

async function handleAuthentication() {
    const email = authEmail?.value.trim();
    const password = authPassword?.value || "";

    if (!email) {
        showAuthMessage("Please enter your email address.", true);
        return;
    }

    if (!password) {
        showAuthMessage("Please enter your password.", true);
        return;
    }

    if (password.length < 6) {
        showAuthMessage("Password must contain at least 6 characters.", true);
        return;
    }

    authSubmit.disabled = true;
    authSubmit.textContent = "Please wait...";
    showAuthMessage("Processing...");

    try {
        if (authMode === "login") {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        console.error("Authentication error:", error);
        let message = "Authentication failed.";

        switch (error.code) {
            case "auth/invalid-email":
                message = "Please enter a valid email address.";
                break;
            case "auth/user-not-found":
                message = "No account found with this email.";
                break;
            case "auth/wrong-password":
                message = "Incorrect password.";
                break;
            case "auth/invalid-credential":
                message = "Invalid email or password.";
                break;
            case "auth/email-already-in-use":
                message = "This email is already registered. Please login.";
                break;
            case "auth/weak-password":
                message = "Password must contain at least 6 characters.";
                break;
            case "auth/too-many-requests":
                message = "Too many attempts. Please try again later.";
                break;
            case "auth/network-request-failed":
                message = "Network error. Check your internet connection.";
                break;
            default:
                message = error.message || message;
        }
        showAuthMessage(message, true);
    } finally {
        authSubmit.disabled = false;
        authSubmit.textContent = authMode === "login" ? "Login" : "Create Account";
    }
}

async function handleForgotPassword() {
    const email = authEmail?.value.trim();

    if (!email) {
        showAuthMessage("Enter your email address above, then click 'Forgot password?'.", true);
        return;
    }

    if (forgotPasswordBtn) forgotPasswordBtn.disabled = true;
    showAuthMessage("Sending reset email...");

    try {
        await sendPasswordResetEmail(auth, email);
        showAuthMessage("Password reset email sent. Please check your inbox (and Spam folder).", false);
    } catch (error) {
        console.error("Password reset error:", error);
        let message = "Could not send reset email.";
        switch (error.code) {
            case "auth/invalid-email":
                message = "Please enter a valid email address.";
                break;
            case "auth/user-not-found":
                message = "No account found with this email.";
                break;
            case "auth/too-many-requests":
                message = "Too many attempts. Please try again later.";
                break;
            default:
                message = error.message || message;
        }
        showAuthMessage(message, true);
    } finally {
        if (forgotPasswordBtn) forgotPasswordBtn.disabled = false;
    }
}


// ============================================================
// APP VIEW INITIALIZATION
// ============================================================

async function showApp(user) {
    currentUser = user;
    authScreen?.classList.add("hidden");
    app?.classList.remove("hidden");

    if ($("userEmail")) {
        $("userEmail").textContent = user.email || "User";
    }

    await loadProfile();
    await loadHistory();
    await loadDoctors();
    await loadPerformance();
    updateDashboard();
}

function showAuthScreen() {
    currentUser = null;
    currentProfile = null;
    currentResult = null;

    app?.classList.add("hidden");
    authScreen?.classList.remove("hidden");

    if (authEmail) authEmail.value = "";
    if (authPassword) authPassword.value = "";
    setAuthMode("login");
}

async function logoutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        alert("Logout failed: " + error.message);
    }
}


// ============================================================
// NAVIGATION
// ============================================================

const pageNames = {
    dashboard: "Dashboard",
    profile: "Patient Profile",
    prediction: "New Prediction",
    history: "Prediction History",
    doctors: "Recommended Doctors",
    quantum: "Quantum Analysis",
    comparison: "Model Comparison",
    performance: "Performance"
};

function goToPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const target = $(pageId);
    if (target) {
        target.classList.add("active-page");
    }

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.page === pageId);
    });

    if ($("pageTitle")) {
        $("pageTitle").textContent = pageNames[pageId] || "QuantumDiagnose";
    }

    if (pageId === "history") renderHistory();
    if (pageId === "doctors") loadDoctors();
    if (pageId === "performance") loadPerformance();
    if (pageId === "quantum") renderQuantumPage();
    if (pageId === "comparison") renderComparisonPage();
}


// ============================================================
// PROFILE MANAGEMENT
// ============================================================

async function saveProfile() {
    if (!currentUser) return;

    const name = $("profileName")?.value.trim();
    const gender = $("profileGender")?.value;
    const age = $("profileAge")?.value;
    const height = $("profileHeight")?.value;
    const weight = $("profileWeight")?.value;

    if (!name || !gender || !age || !height || !weight) {
        setProfileMessage("Please complete all required fields.", true);
        return;
    }

    const profile = {
        userId: currentUser.uid,
        email: currentUser.email || "",
        name,
        gender,
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        updatedAt: new Date().toISOString()
    };

    try {
        await setDoc(doc(db, "profiles", currentUser.uid), profile, { merge: true });
        currentProfile = profile;
        localStorage.setItem("quantumdiagnose_profile_" + currentUser.uid, JSON.stringify(profile));

        setProfileMessage("Profile saved successfully.", false);
        updateProfileStatus();
        updateWelcomeName();
    } catch (error) {
        console.error("Profile save error:", error);
        setProfileMessage("Could not save profile: " + error.message, true);
    }
}

async function loadProfile() {
    if (!currentUser) return;

    try {
        const snapshot = await getDoc(doc(db, "profiles", currentUser.uid));
        if (snapshot.exists()) {
            currentProfile = snapshot.data();
        } else {
            const local = localStorage.getItem("quantumdiagnose_profile_" + currentUser.uid);
            if (local) currentProfile = JSON.parse(local);
        }
    } catch (error) {
        console.error("Profile load error:", error);
        const local = localStorage.getItem("quantumdiagnose_profile_" + currentUser.uid);
        if (local) {
            try { currentProfile = JSON.parse(local); } catch { currentProfile = null; }
        }
    }

    populateProfile();
    updateProfileStatus();
    updateWelcomeName();
}

function populateProfile() {
    if (!currentProfile) return;
    if ($("profileName")) $("profileName").value = currentProfile.name || "";
    if ($("profileGender")) $("profileGender").value = currentProfile.gender || "";
    if ($("profileAge")) $("profileAge").value = currentProfile.age || "";
    if ($("profileHeight")) $("profileHeight").value = currentProfile.height || "";
    if ($("profileWeight")) $("profileWeight").value = currentProfile.weight || "";
}

function isProfileComplete() {
    if (!currentProfile) return false;
    return Boolean(
        currentProfile.name &&
        currentProfile.gender &&
        currentProfile.age &&
        currentProfile.height &&
        currentProfile.weight
    );
}

function updateProfileStatus() {
    const box = $("profileStatus");
    if (!box) return;

    if (isProfileComplete()) {
        box.className = "profile-status completed";
        box.innerHTML = "<span>Profile completed</span>";
    } else {
        box.className = "profile-status";
        box.innerHTML = "<span>Profile not completed</span>";
    }
}

function updateWelcomeName() {
    let name = currentProfile?.name || currentUser?.email?.split("@")[0] || "Patient";
    if ($("welcomeName")) $("welcomeName").textContent = name;
    if ($("topUserName")) $("topUserName").textContent = name;
}

function setProfileMessage(text, error = false) {
    const element = $("profileMessage");
    if (!element) return;
    element.textContent = text;
    element.className = "status-message " + (error ? "error" : "success");
}


// ============================================================
// SYMPTOM SELECTION & SEARCH
// ============================================================

function getSymptomCheckboxes() {
    return document.querySelectorAll("#symptomGrid input[type='checkbox']");
}

function getSelectedSymptoms() {
    const selected = [];
    getSymptomCheckboxes().forEach(box => {
        if (box.checked) selected.push(box.value);
    });
    return selected;
}

function updateCount() {
    const selected = getSelectedSymptoms();
    if ($("count")) {
        $("count").textContent = selected.length;
    }
}

function setupSymptoms() {
    getSymptomCheckboxes().forEach(box => {
        box.addEventListener("change", updateCount);
    });
    updateCount();
}

function searchSymptoms() {
    const text = $("search")?.value.toLowerCase().trim() || "";
    document.querySelectorAll("#symptomGrid .symptom").forEach(item => {
        const name = item.dataset.name || "";
        item.style.display = name.includes(text) ? "" : "none";
    });
}

function clearSymptoms() {
    getSymptomCheckboxes().forEach(box => {
        box.checked = false;
    });
    updateCount();

    if ($("search")) $("search").value = "";
    document.querySelectorAll("#symptomGrid .symptom").forEach(item => {
        item.style.display = "";
    });
    $("result")?.classList.add("hidden");
}


// ============================================================
// INFERENCE & PREDICTION EXECUTION
// ============================================================

async function makePrediction() {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    if (!isProfileComplete()) {
        alert("Please complete your Patient Profile before making a prediction.");
        goToPage("profile");
        return;
    }

    const selected = getSelectedSymptoms();
    if (selected.length === 0) {
        alert("Please select at least one symptom.");
        return;
    }

    predictBtn.disabled = true;
    predictBtn.innerHTML = `
        <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        Analyzing...
    `;

    try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + idToken
            },
            body: JSON.stringify({ symptoms: selected })
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw new Error(data.error || "Prediction failed.");
        }

        currentPredictionTime = new Date();
        currentResult = {
            ...data,
            selected_symptoms: selected,
            prediction_time: currentPredictionTime.toISOString(),
            patient: currentProfile
        };

        renderPrediction(currentResult);
        goToPage("prediction");

        setTimeout(() => {
            $("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);

    } catch (error) {
        console.error("Prediction error:", error);
        alert("Prediction failed: " + error.message);
    } finally {
        predictBtn.disabled = false;
        predictBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            Analyze Symptoms
        `;
    }
}


// ============================================================
// RENDER RESULT IN UI
// ============================================================

function renderPrediction(data) {
    $("result")?.classList.remove("hidden");

    const rf = Number(data.confidence ?? data.rf_confidence ?? 0);
    const quantum = Number(data.quantum_score ?? data.qiskit_score ?? 0);
    const difference = Number(data.score_difference ?? Math.abs(rf - quantum));
    const dateTime = formatDateTime(data.prediction_time);

    $("predictionDateTime").innerHTML = `
        <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Prediction date & time: ${escapeHTML(dateTime)}
    `;

    $("disease").textContent = formatDisease(data.disease);
    $("confidenceText").textContent = rf.toFixed(2) + "%";
    $("confidenceBar").style.width = Math.min(Math.max(rf, 0), 100) + "%";

    renderTopPredictions(data.top_predictions);

    $("quantumDisease").textContent = formatDisease(data.qiskit_disease);
    $("quantumScoreText").textContent = quantum.toFixed(2) + "%";
    $("quantumScoreBar").style.width = Math.min(Math.max(quantum, 0), 100) + "%";
    $("quantumQubits").textContent = data.qiskit_qubits ?? "—";
    $("quantumDepth").textContent = data.qiskit_depth ?? "—";
    $("quantumSignal").textContent = Number(data.quantum_signal || 0).toFixed(2) + "%";

    renderTopPredictions(data.qiskit_top_predictions, "quantumTopPredictions");

    if ($("hybridDisease")) {
        $("hybridDisease").textContent = formatDisease(data.hybrid_disease);
    }

    if ($("hybridConfidenceText")) {
        $("hybridConfidenceText").textContent =
            Number(data.hybrid_confidence || 0).toFixed(2) + "%";
    }

    const agreementLabel = data.model_agreement || getAgreement(difference);

    if ($("hybridAgreementBadge")) {
        $("hybridAgreementBadge").textContent = agreementLabel + " agreement";
        $("hybridAgreementBadge").className = "agreement-badge " + agreementLabel.toLowerCase();
    }

    $("comparisonRF").textContent = rf.toFixed(2) + "%";
    $("comparisonQuantum").textContent = quantum.toFixed(2) + "%";
    $("comparisonDifference").textContent = difference.toFixed(2) + "%";
    $("comparisonDisease").textContent = formatDisease(data.disease);

    renderAgreement(agreementLabel);
    renderDoctors(data.doctors || [], data.specialty);
    renderPredictionSummary(data.top_predictions);

    $("message").textContent = data.message || "Educational symptom-analysis result.";
    $("saveHistoryMessage").textContent = "";

    updateDashboard();
}

function renderTopPredictions(predictions, containerId = "topPredictions") {
    const container = $(containerId);
    if (!container) return;

    if (!Array.isArray(predictions) || predictions.length === 0) {
        container.innerHTML = "<p class='muted'>No predictions available.</p>";
        return;
    }

    container.innerHTML = predictions
        .slice(0, 5)
        .map(item => `
            <div class="prediction-row">
                <span>${escapeHTML(formatDisease(item.disease))}</span>
                <strong>${Number(item.confidence || 0).toFixed(2)}%</strong>
            </div>
        `)
        .join("");
}

function renderPredictionSummary(predictions) {
    const container = $("predictionSummary");
    if (!container) return;

    if (!Array.isArray(predictions)) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = predictions
        .slice(0, 5)
        .map(item => `
            <div class="prediction-row">
                <span>${escapeHTML(formatDisease(item.disease))}</span>
                <strong>${Number(item.confidence || 0).toFixed(2)}%</strong>
            </div>
        `)
        .join("");
}

function getAgreement(difference) {
    if (difference <= 5) return "High";
    if (difference <= 10) return "Moderate";
    return "Low";
}

function renderAgreement(agreement) {
    const badge = $("agreementBadge");
    if (!badge) return;

    badge.textContent = agreement + " agreement";
    badge.className = "agreement-badge " + agreement.toLowerCase();
}


// ============================================================
// DOCTOR DIRECTORY UI
// ============================================================

function doctorCard(doctor) {
    return `
        <div class="doctor-card">
            <div class="doctor-icon">
                <svg class="icon icon-lg" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>

            <h3>${escapeHTML(doctor.name || "Doctor")}</h3>

            <span class="doctor-specialty">
                ${escapeHTML(doctor.specialization || "General Physician")}
            </span>

            <p>
                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 10h6"/><path d="M12 7v6"/></svg>
                ${escapeHTML(doctor.hospital || "Medical Center")}
            </p>

            <p>
                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                ${escapeHTML(doctor.location || "Location unavailable")}
            </p>

            <p>
                <svg class="icon icon-sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Experience: ${escapeHTML(doctor.experience || "—")}
            </p>
        </div>
    `;
}

function renderDoctors(doctors, specialty) {
    const specialistBox = $("specialistBox");
    const container = $("recommendedDoctors");

    if (specialistBox) {
        specialistBox.innerHTML = `
            <strong>Recommended Specialty:</strong>
            <span>${escapeHTML(specialty || "General Physician")}</span>
        `;
    }

    if (!container) return;

    if (!Array.isArray(doctors) || doctors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No matching demonstration doctor found.
            </div>
        `;
        return;
    }

    container.innerHTML = doctors
        .slice(0, 3)
        .map(doctorCard)
        .join("");
}

async function loadDoctors() {
    const container = $("doctorList");
    if (!container) return;

    try {
        const response = await fetch("/doctors");
        const data = await response.json();
        const doctors = data.doctors || [];

        if (doctors.length === 0) {
            container.innerHTML = `<div class="empty-state">No doctors available.</div>`;
            return;
        }

        container.innerHTML = doctors.map(doctorCard).join("");
    } catch (error) {
        console.error("Doctor load error:", error);
        container.innerHTML = `<div class="empty-state">Unable to load doctor directory.</div>`;
    }
}


// ============================================================
// HISTORY SYSTEM
// ============================================================

async function saveCurrentHistory() {
    if (!currentUser) return;

    if (!currentResult) {
        alert("Please complete a prediction first.");
        return;
    }

    const saveButton = $("saveHistoryBtn");
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    const item = {
        userId: currentUser.uid,
        userEmail: currentUser.email || "",
        patient: currentResult.patient || null,
        symptoms: currentResult.selected_symptoms || [],
        disease: currentResult.disease || "",
        confidence: Number(currentResult.confidence || currentResult.rf_confidence || 0),
        topPredictions: currentResult.top_predictions || [],
        qiskitDisease: currentResult.qiskit_disease || "",
        qiskitTopPredictions: currentResult.qiskit_top_predictions || [],
        qiskitScore: Number(currentResult.qiskit_score || currentResult.quantum_score || 0),
        qiskitQubits: currentResult.qiskit_qubits || 0,
        qiskitDepth: currentResult.qiskit_depth || 0,
        quantumSignal: currentResult.quantum_signal || 0,
        scoreDifference: currentResult.score_difference || 0,
        modelAgreement: currentResult.model_agreement || "",
        hybridDisease: currentResult.hybrid_disease || "",
        hybridConfidence: Number(currentResult.hybrid_confidence || 0),
        specialty: currentResult.specialty || "",
        doctors: currentResult.doctors || [],
        predictionTime: currentResult.prediction_time || new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "predictions"), {
            ...item,
            createdAt: serverTimestamp()
        });

        historyItems.unshift(item);
        saveLocalHistory();

        $("saveHistoryMessage").textContent = "Saved to Prediction History";
        await loadHistory();
        updateDashboard();
    } catch (error) {
        console.error("History save error:", error);
        $("saveHistoryMessage").textContent = "Could not save history.";
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save to History
            `;
        }
    }
}

function historyStorageKey() {
    if (!currentUser) return null;
    return "quantumdiagnose_history_" + currentUser.uid;
}

function saveLocalHistory() {
    const key = historyStorageKey();
    if (!key) return;

    try {
        localStorage.setItem(key, JSON.stringify(historyItems.slice(0, 30)));
    } catch (error) {
        console.error("Local history save error:", error);
    }
}

function loadLocalHistory() {
    const key = historyStorageKey();
    if (!key) return [];

    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

async function loadHistory() {
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "predictions"),
            where("userId", "==", currentUser.uid)
        );

        const snapshot = await getDocs(q);
        const firestoreItems = [];

        snapshot.forEach(docSnap => {
            firestoreItems.push(docSnap.data());
        });

        firestoreItems.sort((a, b) => {
            return new Date(b.predictionTime || 0).getTime() - new Date(a.predictionTime || 0).getTime();
        });

        const local = loadLocalHistory();
        const combined = [...firestoreItems, ...local];
        const unique = [];
        const seen = new Set();

        combined.forEach(item => {
            const key = [
                item.predictionTime,
                item.disease,
                JSON.stringify(item.symptoms || [])
            ].join("|");

            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        });

        historyItems = unique
            .sort((a, b) => new Date(b.predictionTime || 0).getTime() - new Date(a.predictionTime || 0).getTime())
            .slice(0, 30);
    } catch (error) {
        console.error("History load error:", error);
        historyItems = loadLocalHistory();
    }

    renderHistory();
    updateDashboard();
}

function renderHistory() {
    const container = $("historyList");
    if (!container) return;

    if (!historyItems || historyItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg class="icon-xl" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
                </div>
                <strong>No prediction history</strong>
                <p>Your saved prediction reports will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = historyItems
        .map((item, index) => {
            const date = formatDateTime(item.predictionTime);
            const symptoms = (item.symptoms || []).map(formatDisease).join(", ");

            return `
                <div class="history-card">
                    <div class="history-main">
                        <div class="history-date">
                            <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            ${escapeHTML(date)}
                        </div>

                        <h3>${escapeHTML(formatDisease(item.disease))}</h3>
                        <p>Symptoms: ${escapeHTML(symptoms || "Not recorded")}</p>

                        <div class="history-scores">
                            <span>RF: ${Number(item.confidence || 0).toFixed(2)}%</span>
                            <span>Qiskit: ${Number(item.qiskitScore || 0).toFixed(2)}%</span>
                            <span>Agreement: ${escapeHTML(item.modelAgreement || "—")}</span>
                        </div>
                    </div>

                    <div class="history-actions">
                        <button
                            class="history-icon-btn"
                            type="button"
                            title="Email this report"
                            data-history-email-index="${index}">
                            <svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </button>

                        <button
                            class="history-download"
                            type="button"
                            data-history-index="${index}">
                            <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                            PDF
                        </button>
                    </div>
                </div>
            `;
        })
        .join("");

    container.querySelectorAll("[data-history-index]").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.historyIndex);
            const item = historyItems[index];
            if (item) downloadPDF(item);
        });
    });

    container.querySelectorAll("[data-history-email-index]").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.historyEmailIndex);
            const item = historyItems[index];
            if (item) openEmailModal(item);
        });
    });
}


// ============================================================
// DASHBOARD VIEW
// ============================================================

function updateDashboard() {
    if ($("predictionCount")) {
        $("predictionCount").textContent = historyItems.length;
    }

    const latest = currentResult || historyItems[0];

    if (!latest) {
        $("latestDisease").textContent = "—";
        $("latestConfidence").textContent = "—";
        $("latestDate").textContent = "—";

        $("dashboardLatest").innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg class="icon-xl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <strong>No prediction yet</strong>
                <p>Start a new symptom analysis.</p>
            </div>
        `;
        return;
    }

    const confidence = Number(latest.confidence || latest.rf_confidence || 0);
    const diseaseName = formatDisease(latest.disease);

    $("latestDisease").textContent = diseaseName;
    $("latestConfidence").textContent = confidence.toFixed(2) + "%";
    $("latestDate").textContent = formatDateTime(
        latest.prediction_time || latest.predictionTime
    );

    $("dashboardLatest").innerHTML = `
        <div class="comparison-values">
            <div>
                <span>Predicted Disease</span>
                <strong>${escapeHTML(diseaseName)}</strong>
            </div>

            <div>
                <span>Random Forest</span>
                <strong>${confidence.toFixed(2)}%</strong>
            </div>

            <div>
                <span>Qiskit</span>
                <strong>${Number(
                    latest.quantum_score || latest.qiskitScore || 0
                ).toFixed(2)}%</strong>
            </div>
        </div>

        <p class="muted" style="display:flex;align-items:center;gap:6px;">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${escapeHTML(
                formatDateTime(latest.prediction_time || latest.predictionTime)
            )}
        </p>
    `;
}


// ============================================================
// PERFORMANCE & QUANTUM PAGES
// ============================================================

async function loadPerformance() {
    try {
        const response = await fetch("/performance");
        const data = await response.json();

        if ($("metricAccuracy")) $("metricAccuracy").textContent = Number(data.accuracy || 0).toFixed(2) + "%";
        if ($("metricPrecision")) $("metricPrecision").textContent = Number(data.precision || 0).toFixed(2) + "%";
        if ($("metricRecall")) $("metricRecall").textContent = Number(data.recall || 0).toFixed(2) + "%";
        if ($("metricF1")) $("metricF1").textContent = Number(data.f1 || 0).toFixed(2) + "%";

        $("trainingSamples").textContent = data.training_samples ?? "—";
        $("testingSamples").textContent = data.testing_samples ?? "—";
        $("symptomTotal").textContent = data.number_of_symptoms ?? "—";
        $("diseaseTotal").textContent = data.number_of_diseases ?? "—";
    } catch (error) {
        console.error("Performance error:", error);
    }
}

function renderQuantumPage() {
    const container = $("quantumResult");
    if (!container) return;

    if (!currentResult) {
        container.innerHTML = `
            <strong>No analysis available.</strong>
            <p>Complete a prediction first. The Qiskit analysis will then appear here.</p>
        `;
        return;
    }

    const score = Number(
        currentResult.quantum_score || currentResult.qiskit_score || 0
    );

    container.innerHTML = `
        <div class="comparison-values">
            <div>
                <span>Predicted Disease</span>
                <strong>${escapeHTML(formatDisease(currentResult.qiskit_disease))}</strong>
            </div>

            <div>
                <span>Qubits Used</span>
                <strong>${currentResult.qiskit_qubits ?? "—"}</strong>
            </div>

            <div>
                <span>Circuit Depth</span>
                <strong>${currentResult.qiskit_depth ?? "—"}</strong>
            </div>
        </div>

        <div class="comparison-values">
            <div>
                <span>Qiskit Confidence</span>
                <strong>${score.toFixed(2)}%</strong>
            </div>

            <div>
                <span>Quantum Signal</span>
                <strong>${Number(currentResult.quantum_signal || 0).toFixed(2)}%</strong>
            </div>
        </div>

        <div class="result-warning">
            <strong>
                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Experimental Component
            </strong>
            <p>
                This quantum score is an educational demonstration and is not a clinically validated probability.
            </p>
        </div>
    `;
}

function renderComparisonPage() {
    if (!currentResult) return;

    const rf = Number(currentResult.confidence || currentResult.rf_confidence || 0);
    const quantum = Number(currentResult.quantum_score || currentResult.qiskit_score || 0);
    const difference = Number(currentResult.score_difference || Math.abs(rf - quantum));

    $("comparisonDiseasePage").textContent = formatDisease(currentResult.disease);
    $("comparisonRFPage").textContent = rf.toFixed(2) + "%";
    $("comparisonQuantumDiseasePage").textContent = formatDisease(
        currentResult.qiskit_disease || currentResult.disease
    );
    $("comparisonQuantumPage").textContent = quantum.toFixed(2) + "%";

    $("agreementPage").textContent = `${
        currentResult.model_agreement || getAgreement(difference)
    } agreement • ${difference.toFixed(2)}% score difference`;
}


// ============================================================
// PDF REPORT GENERATION (SINGLE PAGE CLINICAL LAYOUT)
// ============================================================

function downloadPDF(source) {
    if (!source) {
        alert("No prediction report is available.");
        return;
    }

    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) {
        alert("PDF generator could not be loaded. Please refresh the page.");
        return;
    }

    const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait"
    });

    const patient = source.patient || currentProfile || {};
    const predictionTime =
        source.prediction_time || source.predictionTime || new Date().toISOString();

    const rf = Number(source.confidence || source.rf_confidence || 0);
    const quantum = Number(
        source.quantum_score || source.qiskit_score || source.qiskitScore || 0
    );
    const disease = formatDisease(source.disease);
    const hybridDisease = formatDisease(
        source.hybrid_disease || source.hybridDisease || source.disease
    );
    const hybridConfidence = Number(
        source.hybrid_confidence || source.hybridConfidence || 0
    );
    const symptoms = (source.selected_symptoms || source.symptoms || [])
        .map(formatDisease)
        .join(", ");

    const MARGIN = 14;
    const PAGE_WIDTH = 210;
    const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 182 mm

    // Clinical Color Palette
    const PRIMARY = [49, 91, 234];       // Medical Blue
    const INK = [24, 34, 56];            // Deep Slate
    const MUTED = [104, 116, 138];       // Muted Text
    const BORDER = [225, 231, 240];      // Light Gray Border
    const BG_LIGHT = [247, 249, 252];    // Card Fill
    const PURPLE_BG = [247, 244, 255];   // Quantum Card Fill
    const PURPLE_BORDER = [220, 209, 250];
    const PURPLE_TXT = [101, 72, 189];
    const NOTICE_BG = [255, 248, 232];   // Alert Fill
    const NOTICE_BORDER = [244, 226, 181];
    const NOTICE_TEXT = [117, 90, 29];

    let y = 14;

    // --- 1. HEADER ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...PRIMARY);
    doc.text("QuantumDiagnose", MARGIN, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("CONFIDENTIAL PATIENT SUMMARY", MARGIN + CONTENT_WIDTH, y - 1, { align: "right" });
    doc.text("Quantum-Assisted ML Disease Prediction Report", MARGIN + CONTENT_WIDTH, y + 3.5, { align: "right" });

    y += 6;
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 6;

    // --- 2. PATIENT & SYMPTOMS CARD ---
    doc.setFillColor(...BG_LIGHT);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 22, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Patient:", MARGIN + 4, y + 5);
    doc.text("Selected Symptoms:", MARGIN + 4, y + 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    const patientStr = `${patient.name || "—"}  •  ${patient.gender || "—"}  •  Age ${patient.age || "—"}`;
    doc.text(patientStr, MARGIN + 18, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Height: ${patient.height ? patient.height + " cm" : "—"}   Weight: ${patient.weight ? patient.weight + " kg" : "—"}   Email: ${source.userEmail || currentUser?.email || "—"}`, MARGIN + 18, y + 9.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(symptoms || "Not recorded", MARGIN + 34, y + 14);

    y += 26;

    // --- 3. FINAL PREDICTED DISEASE CARD ---
    doc.setFillColor(...BG_LIGHT);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 17, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Final Predicted Disease", MARGIN + 4, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text(hybridDisease, MARGIN + 4, y + 12.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text(`${hybridConfidence.toFixed(2)}% confidence`, MARGIN + CONTENT_WIDTH - 4.5, y + 10, { align: "right" });

    y += 21;

    // --- 4. RANDOM FOREST CARD ---
    doc.setFillColor(...BG_LIGHT);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 17, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Random Forest", MARGIN + 4, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(disease, MARGIN + 4, y + 12.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text(`${rf.toFixed(2)}% confidence`, MARGIN + CONTENT_WIDTH - 4.5, y + 10, { align: "right" });

    y += 21;

    // --- 5. QISKIT QUANTUM CARD ---
    doc.setFillColor(...PURPLE_BG);
    doc.setDrawColor(...PURPLE_BORDER);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 17, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...PURPLE_TXT);
    doc.text("Qiskit Experimental Prediction", MARGIN + 4, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(formatDisease(source.qiskit_disease || source.qiskitDisease || disease), MARGIN + 4, y + 12.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PURPLE_TXT);
    doc.text(`${quantum.toFixed(2)}%`, MARGIN + CONTENT_WIDTH - 4.5, y + 8, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...PURPLE_TXT);
    doc.text(`Quantum signal: ${Number(source.quantum_signal || source.quantumSignal || 0).toFixed(2)}%`, MARGIN + CONTENT_WIDTH - 4.5, y + 12.5, { align: "right" });

    y += 21;

    // --- 6. TOP EVALUATIONS TABLE ---
    const topList = (source.top_predictions || []).slice(0, 3);
    if (topList.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text("TOP EVALUATIONS", MARGIN, y);
        y += 2;
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
        y += 4;

        topList.forEach(item => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.8);
            doc.setTextColor(...INK);
            doc.text(formatDisease(item.disease), MARGIN + 2, y);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(...PRIMARY);
            doc.text(`${Number(item.confidence || 0).toFixed(2)}%`, MARGIN + CONTENT_WIDTH - 2, y, { align: "right" });

            y += 1.8;
            doc.setDrawColor(...BORDER);
            doc.line(MARGIN + 2, y, MARGIN + CONTENT_WIDTH - 2, y);
            y += 3.8;
        });
        y += 1;
    }

    // --- 7. RECOMMENDED DOCTOR ---
    const doctors = source.doctors || [];
    const docInfo = doctors.length ? doctors[0] : null;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("RECOMMENDED DOCTOR", MARGIN, y);
    y += 2;
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 4.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(docInfo ? `${docInfo.name}  •  ${docInfo.specialization}` : `Specialty: ${source.specialty || "General Physician"}`, MARGIN + 2, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(docInfo ? `${docInfo.hospital}, ${docInfo.location}  (Experience: ${docInfo.experience || "—"})` : "Consult a certified medical provider.", MARGIN + 2, y + 4.2);

    y += 11;

    // --- 8. SHORTENED NOTICE ---
    doc.setFillColor(...NOTICE_BG);
    doc.setDrawColor(...NOTICE_BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 9, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...NOTICE_TEXT);
    doc.text("Important: Educational research prototype. Not a substitute for professional medical advice.", MARGIN + 4, y + 5.5);

    y += 14;

    // --- 9. FOOTER (BOTTOM-LEFT ALIGNED) ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Generated ${formatDateTime(predictionTime)} • QuantumDiagnose Educational Project`, MARGIN, y);

    const safeDisease = disease.replace(/[^a-z0-9]/gi, "_");
    doc.save(`QuantumDiagnose_Report_${safeDisease}.pdf`);
}

function downloadCurrentReport() {
    if (!currentResult) {
        alert("Please complete a prediction first.");
        return;
    }
    downloadPDF(currentResult);
}


// ============================================================
// EMAIL MODAL SYSTEM
// ============================================================

const emailModalOverlay = $("emailModalOverlay");
const emailModalInput = $("emailModalInput");
const emailModalSend = $("emailModalSend");
const emailModalMessage = $("emailModalMessage");
const emailModalClose = $("emailModalClose");

function setEmailModalMessage(text, error = false) {
    if (!emailModalMessage) return;
    emailModalMessage.textContent = text;
    emailModalMessage.className = "status-message " + (error ? "error" : "success");
}

function openEmailModal(source) {
    if (!source) {
        alert("Please complete a prediction first.");
        return;
    }

    emailReportSource = source;
    setEmailModalMessage("");

    if (emailModalInput) {
        emailModalInput.value = currentUser?.email || source.userEmail || "";
    }

    emailModalOverlay?.classList.remove("hidden");
    emailModalInput?.focus();
}

function closeEmailModal() {
    emailModalOverlay?.classList.add("hidden");
    emailReportSource = null;
}

async function sendEmailReport() {
    if (!emailReportSource) {
        setEmailModalMessage("No prediction report is available.", true);
        return;
    }

    const toEmail = emailModalInput?.value.trim();
    if (!toEmail || !toEmail.includes("@")) {
        setEmailModalMessage("Please enter a valid email address.", true);
        return;
    }

    const source = emailReportSource;
    const payload = {
        to_email: toEmail,
        patient: source.patient || currentProfile || {},
        disease: source.disease,
        confidence: source.confidence ?? source.rf_confidence,
        quantum_score: source.quantum_score ?? source.qiskit_score ?? source.qiskitScore,
        qiskit_disease: source.qiskit_disease ?? source.qiskitDisease,
        hybrid_disease: source.hybrid_disease ?? source.hybridDisease,
        hybrid_confidence: source.hybrid_confidence ?? source.hybridConfidence,
        quantum_signal: source.quantum_signal ?? source.quantumSignal,
        qiskit_qubits: source.qiskit_qubits ?? source.qiskitQubits,
        qiskit_depth: source.qiskit_depth ?? source.qiskitDepth,
        specialty: source.specialty,
        doctors: source.doctors || [],
        top_predictions: source.top_predictions || source.topPredictions || [],
        qiskit_top_predictions: source.qiskit_top_predictions || source.qiskitTopPredictions || [],
        selected_symptoms: source.selected_symptoms || source.symptoms || [],
        prediction_time: source.prediction_time || source.predictionTime,
        prediction_time_display: formatDateTime(source.prediction_time || source.predictionTime)
    };

    if (emailModalSend) {
        emailModalSend.disabled = true;
        emailModalSend.textContent = "Sending...";
    }

    setEmailModalMessage("Sending report...");

    try {
        const idToken = currentUser ? await currentUser.getIdToken() : null;
        const headers = { "Content-Type": "application/json" };
        if (idToken) headers.Authorization = "Bearer " + idToken;

        const response = await fetch("/send-report", {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || data.success === false) {
            throw new Error(data.error || "Could not send the report.");
        }

        setEmailModalMessage("Report sent to " + toEmail);
        setTimeout(closeEmailModal, 1400);
    } catch (error) {
        console.error("Email report error:", error);
        setEmailModalMessage(error.message || "Could not send the report.", true);
    } finally {
        if (emailModalSend) {
            emailModalSend.disabled = false;
            emailModalSend.textContent = "Send Report";
        }
    }
}


// ============================================================
// EVENT LISTENERS
// ============================================================

loginTab?.addEventListener("click", () => setAuthMode("login"));
signupTab?.addEventListener("click", () => setAuthMode("signup"));
authSubmit?.addEventListener("click", handleAuthentication);

authPassword?.addEventListener("keydown", event => {
    if (event.key === "Enter") handleAuthentication();
});

forgotPasswordBtn?.addEventListener("click", handleForgotPassword);
logoutBtn?.addEventListener("click", logoutUser);

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
        goToPage(item.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        goToPage(button.dataset.go);
    });
});

$("saveProfileBtn")?.addEventListener("click", saveProfile);
$("search")?.addEventListener("input", searchSymptoms);
$("clearBtn")?.addEventListener("click", clearSymptoms);
$("predictBtn")?.addEventListener("click", makePrediction);
$("saveHistoryBtn")?.addEventListener("click", saveCurrentHistory);
$("downloadReportBtn")?.addEventListener("click", downloadCurrentReport);
$("downloadReportBtn2")?.addEventListener("click", downloadCurrentReport);
$("emailReportBtn")?.addEventListener("click", () => openEmailModal(currentResult));
$("emailReportBtn2")?.addEventListener("click", () => openEmailModal(currentResult));
emailModalClose?.addEventListener("click", closeEmailModal);
emailModalSend?.addEventListener("click", sendEmailReport);

emailModalOverlay?.addEventListener("click", event => {
    if (event.target === emailModalOverlay) closeEmailModal();
});

emailModalInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") sendEmailReport();
});

$("quantumBtn")?.addEventListener("click", renderQuantumPage);


// ============================================================
// AUTH STATE LISTENER & INIT
// ============================================================

onAuthStateChanged(auth, async user => {
    if (user) {
        await showApp(user);
    } else {
        showAuthScreen();
    }
});

setupSymptoms();
setAuthMode("login");
console.log("QuantumDiagnose loaded successfully.");
