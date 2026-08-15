// ============================================================
// QUANTUMDIAGNOSE - COMPLETE SCRIPT.JS
// Email/Password Authentication Only
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

console.log("Firebase initialized successfully. Build v2");

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

const navItems = document.querySelectorAll(".nav-item");
const goButtons = document.querySelectorAll("[data-go]");
const pageTitle = document.getElementById("pageTitle");

const predictionCount = document.getElementById("predictionCount");
const latestDisease = document.getElementById("latestDisease");
const dashboardLatest = document.getElementById("dashboardLatest");

const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileMessage = document.getElementById("profileMessage");
const profileName = document.getElementById("profileName");
const profileGender = document.getElementById("profileGender");
const profileAge = document.getElementById("profileAge");
const profileHeight = document.getElementById("profileHeight");
const profileWeight = document.getElementById("profileWeight");

const searchInput = document.getElementById("search");
const symptomGrid = document.getElementById("symptomGrid");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clearBtn");
const predictBtn = document.getElementById("predictBtn");

const result = document.getElementById("result");
const disease = document.getElementById("disease");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceText = document.getElementById("confidenceText");
const topPredictions = document.getElementById("topPredictions");
const message = document.getElementById("message");

const historyList = document.getElementById("historyList");
const doctorList = document.getElementById("doctorList");

const quantumBtn = document.getElementById("quantumBtn");
const quantumResult = document.getElementById("quantumResult");

const metricAccuracy = document.getElementById("metricAccuracy");
const metricPrecision = document.getElementById("metricPrecision");
const metricRecall = document.getElementById("metricRecall");
const metricF1 = document.getElementById("metricF1");
const trainingSamples = document.getElementById("trainingSamples");
const testingSamples = document.getElementById("testingSamples");
const symptomTotal = document.getElementById("symptomTotal");
const diseaseTotal = document.getElementById("diseaseTotal");
const rfAccuracy = document.getElementById("rfAccuracy");

let authMode = "login";

function showAuthMessage(text, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = text;
    authMessage.style.color = isError ? "#d32f2f" : "#2e7d32";
}

function setAuthMode(mode) {
    authMode = mode;
    if (loginTab) loginTab.classList.toggle("active", mode === "login");
    if (signupTab) signupTab.classList.toggle("active", mode === "signup");
    if (authSubmit) authSubmit.textContent = mode === "login" ? "Login" : "Create Account";
    showAuthMessage("");
}

function showApp(user) {
    if (authScreen) authScreen.classList.add("hidden");
    if (app) app.classList.remove("hidden");
    if (userEmail) userEmail.textContent = user.email || "";
    if (welcomeName) welcomeName.textContent = user.email ? user.email.split("@")[0] : "Patient";
    loadHistory();
    loadDashboardStats();
}

function showAuthScreen() {
    if (app) app.classList.add("hidden");
    if (authScreen) authScreen.classList.remove("hidden");
    if (authEmail) authEmail.value = "";
    if (authPassword) authPassword.value = "";
    setAuthMode("login");
}

async function handleEmailAuthentication() {
    if (!authEmail || !authPassword) {
        console.error("Authentication input elements not found.");
        return;
    }

    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email) { showAuthMessage("Please enter your email address.", true); return; }
    if (!password) { showAuthMessage("Please enter your password.", true); return; }
    if (password.length < 6) { showAuthMessage("Password must contain at least 6 characters.", true); return; }

    if (authSubmit) {
        authSubmit.disabled = true;
        authSubmit.textContent = "Please wait...";
    }

    showAuthMessage("Processing...");

    try {
        if (authMode === "login") {
            await signInWithEmailAndPassword(auth, email, password);
            showAuthMessage("Login successful!");
            console.log("User logged in:", email);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            showAuthMessage("Account created successfully!");
            console.log("Account created:", userCredential.user.email);
        }
    } catch (error) {
        console.error("Firebase authentication error:", error);
        let errorMessage = "Authentication failed.";

        switch (error.code) {
            case "auth/invalid-email": errorMessage = "Please enter a valid email address."; break;
            case "auth/user-not-found": errorMessage = "No account found with this email."; break;
            case "auth/wrong-password": errorMessage = "Incorrect password."; break;
            case "auth/invalid-credential": errorMessage = "Invalid email or password."; break;
            case "auth/email-already-in-use": errorMessage = "This email is already registered. Please login."; break;
            case "auth/weak-password": errorMessage = "Password is too weak."; break;
            case "auth/too-many-requests": errorMessage = "Too many attempts. Please try again later."; break;
            case "auth/api-key-not-valid": errorMessage = "Firebase API key is invalid."; break;
            case "auth/network-request-failed": errorMessage = "Network error. Please check your internet connection."; break;
            default: errorMessage = error.message || "Authentication failed.";
        }

        showAuthMessage(errorMessage, true);
    } finally {
        if (authSubmit) {
            authSubmit.disabled = false;
            authSubmit.textContent = authMode === "login" ? "Login" : "Create Account";
        }
    }
}

onAuthStateChanged(auth, function (user) {
    if (user) {
        console.log("Logged in user:", user.email);
        showApp(user);
    } else {
        console.log("No user logged in.");
        showAuthScreen();
    }
});

async function logoutUser() {
    try {
        await signOut(auth);
        alert("Logged out successfully.");
    } catch (error) {
        console.error("Logout error:", error);
        alert("Logout failed: " + error.message);
    }
}

function goToPage(pageId) {
    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.remove("active-page");
    });

    const target = document.getElementById(pageId);
    if (target) target.classList.add("active-page");

    navItems.forEach(function (item) {
        item.classList.toggle("active", item.dataset.page === pageId);
    });

    if (pageTitle) pageTitle.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);

    if (pageId === "doctors") loadDoctors();
    if (pageId === "performance") loadPerformance();
    if (pageId === "history") loadHistory();
}

navItems.forEach(function (item) {
    item.addEventListener("click", function () {
        goToPage(item.dataset.page);
    });
});

goButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        goToPage(btn.dataset.go);
    });
});

if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async function () {
        const user = auth.currentUser;
        if (!user) {
            if (profileMessage) profileMessage.textContent = "Please login first.";
            return;
        }

        const profileData = {
            userId: user.uid,
            name: profileName ? profileName.value.trim() : "",
            gender: profileGender ? profileGender.value : "",
            age: profileAge ? profileAge.value : "",
            height: profileHeight ? profileHeight.value : "",
            weight: profileWeight ? profileWeight.value : "",
            updatedAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "profiles"), profileData);
            if (profileMessage) profileMessage.textContent = "Profile saved.";
            if (welcomeName && profileData.name) welcomeName.textContent = profileData.name;
        } catch (error) {
            console.error("Profile save error:", error);
            if (profileMessage) profileMessage.textContent = "Could not save profile: " + error.message;
        }
    });
}

function getSymptomCheckboxes() {
    return document.querySelectorAll('#symptomGrid input[type="checkbox"]');
}

function updateCount() {
    const boxes = getSymptomCheckboxes();
    let selectedCount = 0;
    boxes.forEach(function (box) { if (box.checked) selectedCount++; });
    if (count) count.textContent = selectedCount;
}

function setupSymptomEvents() {
    const boxes = getSymptomCheckboxes();
    console.log("Found symptom checkboxes:", boxes.length);
    boxes.forEach(function (box) {
        box.addEventListener("change", updateCount);
    });
    updateCount();
}

if (searchInput) {
    searchInput.addEventListener("input", function (event) {
        const searchText = event.target.value.toLowerCase().trim();
        const symptoms = document.querySelectorAll("#symptomGrid .symptom");
        symptoms.forEach(function (symptom) {
            const name = (symptom.dataset.name || "").toLowerCase();
            symptom.style.display = name.includes(searchText) ? "" : "none";
        });
    });
}

if (clearBtn) {
    clearBtn.addEventListener("click", function () {
        getSymptomCheckboxes().forEach(function (box) { box.checked = false; });
        updateCount();
        if (result) result.classList.add("hidden");
        if (searchInput) searchInput.value = "";
        document.querySelectorAll("#symptomGrid .symptom").forEach(function (symptom) {
            symptom.style.display = "";
        });
    });
}

function getSelectedSymptoms() {
    const selected = [];
    getSymptomCheckboxes().forEach(function (box) {
        if (box.checked) selected.push(box.value);
    });
    return selected;
}

async function makePrediction() {
    const selectedSymptoms = getSelectedSymptoms();
    console.log("Selected symptoms:", selectedSymptoms);

    if (!auth.currentUser) {
        alert("Please login before making a prediction.");
        return;
    }

    if (selectedSymptoms.length === 0) {
        alert("Please select at least one symptom.");
        return;
    }

    if (predictBtn) {
        predictBtn.disabled = true;
        predictBtn.textContent = "Analyzing...";
    }

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symptoms: selectedSymptoms })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Prediction failed.");

        if (result) result.classList.remove("hidden");
        if (disease) disease.textContent = data.disease || "Unknown";

        const confidence = Number(data.confidence || 0);

        if (confidenceText) confidenceText.textContent = `Confidence: ${confidence}%`;
        if (confidenceBar) confidenceBar.style.width = `${confidence}%`;

        if (topPredictions) topPredictions.innerHTML = "";

        if (data.top_predictions && data.top_predictions.length && topPredictions) {
            data.top_predictions.forEach(function (item) {
                const div = document.createElement("div");
                div.className = "prediction-item";
                const diseaseName = document.createElement("span");
                diseaseName.textContent = item.disease;
                const confidenceValue = document.createElement("strong");
                confidenceValue.textContent = `${item.confidence}%`;
                div.appendChild(diseaseName);
                div.appendChild(confidenceValue);
                topPredictions.appendChild(div);
            });
        }

        if (message) message.textContent = data.message || "Educational ML prediction only.";

        await savePrediction(selectedSymptoms, data);

        if (latestDisease) latestDisease.textContent = data.disease || "—";
        if (dashboardLatest) dashboardLatest.textContent = `${data.disease} (${confidence}% confidence)`;

        if (result) result.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {
        console.error("Prediction error:", error);
        alert("Prediction failed: " + error.message);
    } finally {
        if (predictBtn) {
            predictBtn.disabled = false;
            predictBtn.textContent = "Analyze Symptoms";
        }
    }
}

async function savePrediction(selectedSymptoms, data) {
    const user = auth.currentUser;
    if (!user) {
        console.log("User not logged in. Prediction not saved.");
        return;
    }

    try {
        await addDoc(collection(db, "predictions"), {
            userId: user.uid,
            userEmail: user.email || null,
            symptoms: selectedSymptoms,
            disease: data.disease || null,
            confidence: data.confidence || 0,
            topPredictions: data.top_predictions || [],
            createdAt: serverTimestamp()
        });
        console.log("Prediction saved to Firestore.");
    } catch (error) {
        console.error("Firestore save error:", error);
    }
}

async function loadHistory() {
    const user = auth.currentUser;
    if (!user || !historyList) return;

    try {
        const q = query(
            collection(db, "predictions"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            historyList.innerHTML = '<p class="muted">No predictions yet.</p>';
            if (predictionCount) predictionCount.textContent = "0";
            return;
        }

        historyList.innerHTML = "";
        let items = 0;

        snapshot.forEach(function (docSnap) {
            const entry = docSnap.data();
            items++;
            const div = document.createElement("div");
            div.className = "history-item";
            div.textContent = `${entry.disease || "Unknown"} — ${entry.confidence || 0}% confidence`;
            historyList.appendChild(div);
        });

        if (predictionCount) predictionCount.textContent = String(items);

    } catch (error) {
        console.error("History load error:", error);
        historyList.innerHTML = '<p class="muted">Could not load history.</p>';
    }
}

async function loadDashboardStats() {
    await loadHistory();
}

async function loadDoctors() {
    if (!doctorList) return;

    try {
        const response = await fetch("/doctors");
        const data = await response.json();

        doctorList.innerHTML = "";

        (data.doctors || []).forEach(function (doctor) {
            const card = document.createElement("div");
            card.className = "doctor-card";
            card.innerHTML = `
                <strong>${doctor.name}</strong>
                <span>${doctor.specialization}</span>
                <span>${doctor.hospital}, ${doctor.location}</span>
                <span>${doctor.experience} experience</span>
            `;
            doctorList.appendChild(card);
        });
    } catch (error) {
        console.error("Doctors load error:", error);
    }
}

async function loadPerformance() {
    try {
        const response = await fetch("/performance");
        const data = await response.json();

        if (metricAccuracy) metricAccuracy.textContent = `${data.accuracy}%`;
        if (metricPrecision) metricPrecision.textContent = `${data.precision}%`;
        if (metricRecall) metricRecall.textContent = `${data.recall}%`;
        if (metricF1) metricF1.textContent = `${data.f1}%`;

        if (trainingSamples) trainingSamples.textContent = data.training_samples;
        if (testingSamples) testingSamples.textContent = data.testing_samples;
        if (symptomTotal) symptomTotal.textContent = data.number_of_symptoms;
        if (diseaseTotal) diseaseTotal.textContent = data.number_of_diseases;
        if (rfAccuracy) rfAccuracy.textContent = `${data.accuracy}%`;

    } catch (error) {
        console.error("Performance load error:", error);
    }
}

if (quantumBtn) {
    quantumBtn.addEventListener("click", async function () {
        const selectedSymptoms = getSelectedSymptoms();

        if (selectedSymptoms.length === 0) {
            alert("Please select symptoms on the Prediction page first.");
            return;
        }

        quantumBtn.disabled = true;
        quantumBtn.textContent = "Running...";

        try {
            const response = await fetch("/quantum", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symptoms: selectedSymptoms })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Quantum analysis failed.");

            if (quantumResult) {
                quantumResult.innerHTML = `
                    <p><strong>Qubits used:</strong> ${data.qubits}</p>
                    <p><strong>Circuit depth:</strong> ${data.circuit_depth}</p>
                    <p><strong>Quantum score:</strong> ${data.quantum_score}%</p>
                    <p>${data.interpretation}</p>
                `;
            }
        } catch (error) {
            console.error("Quantum error:", error);
            if (quantumResult) quantumResult.textContent = "Quantum analysis failed: " + error.message;
        } finally {
            quantumBtn.disabled = false;
            quantumBtn.textContent = "Run Quantum Analysis";
        }
    });
}

if (loginTab) loginTab.addEventListener("click", function () { setAuthMode("login"); });
if (signupTab) signupTab.addEventListener("click", function () { setAuthMode("signup"); });
if (authSubmit) authSubmit.addEventListener("click", handleEmailAuthentication);

if (authPassword) {
    authPassword.addEventListener("keydown", function (event) {
        if (event.key === "Enter") handleEmailAuthentication();
    });
}

if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
if (predictBtn) predictBtn.addEventListener("click", makePrediction);

setupSymptomEvents();
setAuthMode("login");

console.log("QuantumDiagnose JavaScript loaded successfully - v2.");
