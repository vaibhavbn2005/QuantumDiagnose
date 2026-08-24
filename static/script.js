// ============================================================
// QuantumDiagnose - Updated Frontend
// Security Check + Forgot Password + One-Page PDF Report
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    addDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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

const $ = id => document.getElementById(id);

const authScreen = $("authScreen");
const app = $("app");

const loginTab = $("loginTab");
const signupTab = $("signupTab");

const authEmail = $("authEmail");
const authPassword = $("authPassword");

const authSubmit = $("authSubmit");
const authMessage = $("authMessage");

const logoutBtn = $("logoutBtn");
const userEmail = $("userEmail");
const welcomeName = $("welcomeName");

const themeToggle = $("themeToggle");

const profileName = $("profileName");
const profileGender = $("profileGender");
const profileAge = $("profileAge");
const profileHeight = $("profileHeight");
const profileWeight = $("profileWeight");

const saveProfileBtn = $("saveProfileBtn");
const profileMessage = $("profileMessage");

const symptomGrid = $("symptomGrid");
const searchInput = $("search");
const count = $("count");
const clearBtn = $("clearBtn");
const predictBtn = $("predictBtn");

const result = $("result");
const disease = $("disease");
const confidenceText = $("confidenceText");
const confidenceBar = $("confidenceBar");
const topPredictions = $("topPredictions");
const specialistBox = $("specialistBox");
const message = $("message");

const rfResultSummary = $("rfResultSummary");

const quantumPrediction = $("quantumPrediction");
const quantumScore = $("quantumScore");
const quantumScoreBar = $("quantumScoreBar");

const quantumQubits = $("quantumQubits");
const quantumDepth = $("quantumDepth");

const recommendedDoctorBox =
    $("recommendedDoctorBox");

const downloadReportBtn =
    $("downloadReportBtn");

const compareBtn =
    $("compareBtn");

const historyList =
    $("historyList");

const doctorList =
    $("doctorList");

let authMode = "login";

let currentUser = null;

let currentProfile = null;

let profileComplete = false;

let latestPrediction = null;

let predictionHistory = [];

let captchaAnswer = null;

// ============================================================
// THEME
// ============================================================

function applyTheme(dark) {

    document.body.classList.toggle(
        "dark",
        dark
    );

    if (themeToggle) {

        themeToggle.checked =
            dark;
    }

    localStorage.setItem(
        "quantumdiagnose_theme",
        dark
            ? "dark"
            : "light"
    );
}

applyTheme(
    localStorage.getItem(
        "quantumdiagnose_theme"
    ) === "dark"
);

themeToggle?.addEventListener(
    "change",
    () => {

        applyTheme(
            themeToggle.checked
        );

    }
);

// ============================================================
// SECURITY CHECK
// ============================================================

function createSecurityCheck() {

    const a =
        Math.floor(
            Math.random() * 9
        ) + 2;

    const b =
        Math.floor(
            Math.random() * 9
        ) + 1;

    captchaAnswer =
        a + b;

    const question =
        $("securityQuestion");

    const answer =
        $("securityAnswer");

    if (question) {

        question.textContent =
            `${a} + ${b} = ?`;
    }

    if (answer) {

        answer.value = "";
    }
}

function verifySecurityCheck() {

    const answer =
        Number(
            $("securityAnswer")?.value
        );

    if (
        !Number.isFinite(answer) ||
        answer !== captchaAnswer
    ) {

        showAuthMessage(
            "Security check failed. Please enter the correct answer.",
            true
        );

        createSecurityCheck();

        return false;
    }

    return true;
}

createSecurityCheck();

// ============================================================
// AUTH MODE
// ============================================================

function setAuthMode(mode) {

    authMode =
        mode;

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

    if (authPassword) {

        authPassword.autocomplete =
            mode === "login"
                ? "current-password"
                : "new-password";
    }

    showAuthMessage("");

    createSecurityCheck();
}

loginTab?.addEventListener(
    "click",
    () => setAuthMode("login")
);

signupTab?.addEventListener(
    "click",
    () => setAuthMode("signup")
);

// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(
    text,
    isError = false
) {

    if (!authMessage) return;

    authMessage.textContent =
        text;

    authMessage.style.color =
        isError
            ? "#d9363e"
            : "#16834b";
}

// ============================================================
// FORGOT PASSWORD
// ============================================================

function openForgotPassword() {

    const authForm =
        $("authForm");

    const forgotPanel =
        $("forgotPasswordPanel");

    if (authForm) {

        authForm.style.display =
            "none";
    }

    if (forgotPanel) {

        forgotPanel.style.display =
            "block";
    }

    const forgotEmail =
        $("forgotEmail");

    if (
        forgotEmail &&
        authEmail?.value
    ) {

        forgotEmail.value =
            authEmail.value.trim();
    }

    const forgotMessage =
        $("forgotMessage");

    if (forgotMessage) {

        forgotMessage.textContent =
            "";
    }
}

function closeForgotPassword() {

    const authForm =
        $("authForm");

    const forgotPanel =
        $("forgotPasswordPanel");

    if (forgotPanel) {

        forgotPanel.style.display =
            "none";
    }

    if (authForm) {

        authForm.style.display =
            "";
    }

    const forgotMessage =
        $("forgotMessage");

    if (forgotMessage) {

        forgotMessage.textContent =
            "";
    }

    createSecurityCheck();
}

async function handleForgotPassword() {

    const email =
        $("forgotEmail")
            ?.value
            .trim();

    const forgotMessage =
        $("forgotMessage");

    if (!email) {

        if (forgotMessage) {

            forgotMessage.textContent =
                "Please enter your email address.";

            forgotMessage.style.color =
                "#d9363e";
        }

        return;
    }

    const button =
        $("resetPasswordBtn");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Sending...";
    }

    try {

        await sendPasswordResetEmail(
            auth,
            email
        );

        if (forgotMessage) {

            forgotMessage.textContent =
                "Password reset email sent. Please check your inbox.";

            forgotMessage.style.color =
                "#16834b";
        }

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        if (forgotMessage) {

            if (
                error?.code ===
                "auth/invalid-email"
            ) {

                forgotMessage.textContent =
                    "Please enter a valid email address.";

            } else {

                forgotMessage.textContent =
                    "Unable to send the reset email. Please check the email and try again.";
            }

            forgotMessage.style.color =
                "#d9363e";
        }

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Send Reset Link";
        }
    }
}

$("forgotPasswordLink")?.addEventListener(
    "click",
    openForgotPassword
);

$("backToLoginBtn")?.addEventListener(
    "click",
    closeForgotPassword
);

$("resetPasswordBtn")?.addEventListener(
    "click",
    handleForgotPassword
);

// ============================================================
// AUTHENTICATION
// ============================================================

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

authSubmit?.addEventListener(
    "click",
    handleAuthentication
);

async function handleAuthentication() {

    const email =
        authEmail?.value.trim();

    const password =
        authPassword?.value || "";

    if (!email) {

        return showAuthMessage(
            "Please enter your email address.",
            true
        );
    }

    if (!password) {

        return showAuthMessage(
            "Please enter your password.",
            true
        );
    }

    if (
        password.length <
        6
    ) {

        return showAuthMessage(
            "Password must contain at least 6 characters.",
            true
        );
    }

    if (
        !verifySecurityCheck()
    ) {

        return;
    }

    authSubmit.disabled =
        true;

    authSubmit.textContent =
        authMode === "login"
            ? "Logging in..."
            : "Creating account...";

    try {

        if (
            authMode ===
            "login"
        ) {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        } else {

            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            await createInitialProfile(
                credential.user
            );
        }

        showAuthMessage(
            authMode === "login"
                ? "Login successful!"
                : "Account created successfully!"
        );

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showAuthMessage(
            firebaseErrorMessage(
                error
            ),
            true
        );

        createSecurityCheck();

    } finally {

        authSubmit.disabled =
            false;

        authSubmit.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";
    }
}

function firebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";

    const messages = {

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/user-not-found":
            "No account found with this email.",

        "auth/wrong-password":
            "Incorrect password.",

        "auth/invalid-credential":
            "Invalid email or password.",

        "auth/email-already-in-use":
            "This email is already registered. Please login.",

        "auth/weak-password":
            "Password must contain at least 6 characters.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later.",

        "auth/network-request-failed":
            "Network error. Please check your internet connection.",

        "auth/operation-not-allowed":
            "Email/password authentication is not enabled in Firebase."

    };

    return (
        messages[code] ||
        error?.message ||
        "Authentication failed."
    );
}

async function createInitialProfile(
    user
) {

    const ref =
        doc(
            db,
            "patients",
            user.uid
        );

    const existing =
        await getDoc(ref);

    if (
        !existing.exists()
    ) {

        await setDoc(
            ref,
            {
                uid:
                    user.uid,

                email:
                    user.email || "",

                name:
                    "",

                gender:
                    "",

                age:
                    "",

                height:
                    "",

                weight:
                    "",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );
    }
}

logoutBtn?.addEventListener(
    "click",
    async () => {

        try {

            await signOut(
                auth
            );

        } catch (error) {

            console.error(
                error
            );
        }
    }
);
// ============================================================
// PROFILE
// ============================================================

function profileIsComplete(data) {

    return Boolean(

        data &&

        String(
            data.name || ""
        ).trim() &&

        String(
            data.gender || ""
        ).trim() &&

        String(
            data.age || ""
        ).trim() &&

        String(
            data.height || ""
        ).trim() &&

        String(
            data.weight || ""
        ).trim()

    );
}

async function loadProfile() {

    if (!currentUser) {
        return false;
    }

    try {

        const snap =
            await getDoc(
                doc(
                    db,
                    "patients",
                    currentUser.uid
                )
            );

        currentProfile =
            snap.exists()
                ? snap.data()
                : null;

        if (!currentProfile) {

            profileComplete =
                false;

            return false;
        }

        if (profileName) {
            profileName.value =
                currentProfile.name || "";
        }

        if (profileGender) {
            profileGender.value =
                currentProfile.gender || "";
        }

        if (profileAge) {
            profileAge.value =
                currentProfile.age || "";
        }

        if (profileHeight) {
            profileHeight.value =
                currentProfile.height || "";
        }

        if (profileWeight) {
            profileWeight.value =
                currentProfile.weight || "";
        }

        profileComplete =
            profileIsComplete(
                currentProfile
            );

        updateWelcomeName(
            currentProfile.name
        );

        return profileComplete;

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        profileComplete =
            false;

        return false;
    }
}

function updateWelcomeName(name) {

    if (welcomeName) {

        welcomeName.textContent =
            name?.trim() ||
            "Patient";
    }
}

saveProfileBtn?.addEventListener(
    "click",
    saveProfile
);

async function saveProfile() {

    if (!currentUser) {
        return;
    }

    const data = {

        uid:
            currentUser.uid,

        email:
            currentUser.email || "",

        name:
            profileName?.value.trim() || "",

        gender:
            profileGender?.value || "",

        age:
            profileAge?.value || "",

        height:
            profileHeight?.value || "",

        weight:
            profileWeight?.value || "",

        updatedAt:
            serverTimestamp()
    };

    if (
        !profileIsComplete(data)
    ) {

        if (profileMessage) {

            profileMessage.textContent =
                "Please complete all patient profile fields.";

            profileMessage.style.color =
                "#d9363e";
        }

        profileComplete =
            false;

        return;
    }

    try {

        await setDoc(

            doc(
                db,
                "patients",
                currentUser.uid
            ),

            data,

            {
                merge: true
            }

        );

        currentProfile = {
            ...(currentProfile || {}),
            ...data
        };

        profileComplete =
            true;

        updateWelcomeName(
            data.name
        );

        if (profileMessage) {

            profileMessage.textContent =
                "Profile saved successfully.";

            profileMessage.style.color =
                "#16834b";
        }

    } catch (error) {

        console.error(
            "Profile save error:",
            error
        );

        if (profileMessage) {

            profileMessage.textContent =
                "Unable to save profile. Please try again.";

            profileMessage.style.color =
                "#d9363e";
        }
    }
}


// ============================================================
// GENERAL HELPERS
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

function formatDisease(value) {

    if (!value) {
        return "Unknown";
    }

    return String(value)
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}

function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    let date;

    if (
        value instanceof Date
    ) {

        date =
            value;

    } else if (
        value?.toDate &&
        typeof value.toDate ===
            "function"
    ) {

        date =
            value.toDate();

    } else {

        date =
            new Date(value);
    }

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function showMessage(
    text,
    type = "info"
) {

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        `message ${type}`;
}


// ============================================================
// API HELPER
// ============================================================

async function apiFetch(
    url,
    options = {}
) {

    try {

        const response =
            await fetch(
                url,
                {
                    ...options,
                    headers: {
                        "Content-Type":
                            "application/json",
                        ...(options.headers || {})
                    }
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        let data;

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            data = {
                message:
                    text
            };
        }

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                data?.message ||
                `Request failed: ${response.status}`
            );
        }

        return data;

    } catch (error) {

        console.error(
            "API error:",
            error
        );

        throw error;
    }
}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(
    pageId
) {

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(page => {

            page.classList.remove(
                "active"
            );

        });

    const page =
        $(pageId);

    if (page) {

        page.classList.add(
            "active"
        );
    }

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(link => {

            link.classList.toggle(
                "active",
                link.dataset.page ===
                    pageId
            );

        });
}

document
    .querySelectorAll(
        "[data-page]"
    )
    .forEach(link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const target =
                    link.dataset.page;

                if (target) {

                    showPage(
                        target
                    );
                }
            }
        );

    });


// ============================================================
// SYMPTOM DATA
// ============================================================

let symptoms = [];

async function loadSymptoms() {

    try {

        const data =
            await apiFetch(
                "/symptoms"
            );

        symptoms =
            Array.isArray(
                data
            )
                ? data
                : Array.isArray(
                    data.symptoms
                )
                    ? data.symptoms
                    : [];

        renderSymptoms(
            symptoms
        );

    } catch (error) {

        console.error(
            "Could not load symptoms:",
            error
        );

        if (symptomGrid) {

            symptomGrid.innerHTML =
                `<p class="muted">
                    Could not load symptoms.
                </p>`;
        }
    }
}

function renderSymptoms(
    items
) {

    if (!symptomGrid) {
        return;
    }

    symptomGrid.innerHTML = "";

    items.forEach(
        (symptom, index) => {

            const name =
                typeof symptom ===
                    "string"
                    ? symptom
                    : symptom.name ||
                      symptom.symptom ||
                      "";

            if (!name) {
                return;
            }

            const id =
                `symptom_${index}`;

            const wrapper =
                document.createElement(
                    "label"
                );

            wrapper.className =
                "symptom-item";

            wrapper.innerHTML = `
                <input
                    type="checkbox"
                    id="${id}"
                    value="${escapeHtml(name)}"
                >

                <span>
                    ${escapeHtml(name)}
                </span>
            `;

            symptomGrid.appendChild(
                wrapper
            );
        }
    );

    updateCount();
}

function getSelectedSymptoms() {

    if (!symptomGrid) {
        return [];
    }

    return Array.from(
        symptomGrid.querySelectorAll(
            'input[type="checkbox"]:checked'
        )
    )
        .map(
            checkbox =>
                checkbox.value
        );
}

function updateCount() {

    const selected =
        getSelectedSymptoms();

    if (count) {

        count.textContent =
            `${selected.length} selected`;
    }
}

symptomGrid?.addEventListener(
    "change",
    updateCount
);

searchInput?.addEventListener(
    "input",
    () => {

        const search =
            searchInput.value
                .trim()
                .toLowerCase();

        const filtered =
            symptoms.filter(
                symptom => {

                    const name =
                        typeof symptom ===
                            "string"
                            ? symptom
                            : symptom.name ||
                              symptom.symptom ||
                              "";

                    return name
                        .toLowerCase()
                        .includes(search);
                }
            );

        renderSymptoms(
            filtered
        );
    }
);

clearBtn?.addEventListener(
    "click",
    () => {

        symptomGrid
            ?.querySelectorAll(
                'input[type="checkbox"]'
            )
            .forEach(
                checkbox => {
                    checkbox.checked =
                        false;
                }
            );

        updateCount();

        if (searchInput) {
            searchInput.value =
                "";
        }

        renderSymptoms(
            symptoms
        );
    }
);


// ============================================================
// PREDICTION
// ============================================================

predictBtn?.addEventListener(
    "click",
    runPrediction
);

async function runPrediction() {

    if (!currentUser) {

        showMessage(
            "Please login first.",
            "error"
        );

        return;
    }

    if (!profileComplete) {

        showMessage(
            "Please complete and save your patient profile before prediction.",
            "error"
        );

        showPage(
            "profilePage"
        );

        return;
    }

    const selectedSymptoms =
        getSelectedSymptoms();

    if (
        selectedSymptoms.length ===
        0
    ) {

        showMessage(
            "Please select at least one symptom.",
            "error"
        );

        return;
    }

    predictBtn.disabled =
        true;

    predictBtn.textContent =
        "Analyzing...";

    showMessage(
        "Running Random Forest and Qiskit analysis...",
        "info"
    );

    try {

        const prediction =
            await apiFetch(
                "/predict",
                {
                    method: "POST",

                    body: JSON.stringify({

                        symptoms:
                            selectedSymptoms,

                        patient:
                            currentProfile
                    })
                }
            );

        latestPrediction =
            prediction;

        displayPrediction(
            prediction,
            selectedSymptoms
        );

        await savePredictionHistory(
            prediction,
            selectedSymptoms
        );

        showMessage(
            "Prediction completed successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        showMessage(
            error.message ||
            "Prediction failed. Please try again.",
            "error"
        );

    } finally {

        predictBtn.disabled =
            false;

        predictBtn.textContent =
            "Analyze";
    }
}
// ============================================================
// DISPLAY PREDICTION
// ============================================================

function displayPrediction(
    data,
    selectedSymptoms = []
) {

    if (!data) {
        return;
    }

    const predictedDisease =
        formatDisease(
            data.disease ||
            data.prediction ||
            data.predicted_disease ||
            "Unknown"
        );

    const confidence =
        Number(
            data.confidence ||
            data.rf_confidence ||
            0
        );

    const quantumValue =
        Number(
            data.quantum_score ||
            data.qiskit_score ||
            data.qiskitScore ||
            0
        );

    if (disease) {

        disease.textContent =
            predictedDisease;
    }

    if (confidenceText) {

        confidenceText.textContent =
            `${confidence.toFixed(2)}%`;
    }

    if (confidenceBar) {

        confidenceBar.style.width =
            `${Math.min(
                Math.max(confidence, 0),
                100
            )}%`;
    }

    if (rfResultSummary) {

        rfResultSummary.textContent =
            `Random Forest predicts ${predictedDisease} with ${confidence.toFixed(2)}% confidence.`;
    }

    if (quantumPrediction) {

        quantumPrediction.textContent =
            predictedDisease;
    }

    if (quantumScore) {

        quantumScore.textContent =
            `${quantumValue.toFixed(2)}%`;
    }

    if (quantumScoreBar) {

        quantumScoreBar.style.width =
            `${Math.min(
                Math.max(quantumValue, 0),
                100
            )}%`;
    }

    if (quantumQubits) {

        quantumQubits.textContent =
            data.qiskit_qubits ??
            data.qiskitQubits ??
            data.qubits ??
            "—";
    }

    if (quantumDepth) {

        quantumDepth.textContent =
            data.qiskit_depth ??
            data.qiskitDepth ??
            data.depth ??
            "—";
    }

    renderTopPredictions(
        data.top_predictions ||
        data.topPredictions ||
        []
    );

    renderSpecialist(
        data.specialty ||
        data.specialist ||
        ""
    );

    renderRecommendedDoctor(
        data
    );

    if (result) {

        result.style.display =
            "block";
    }

    latestPrediction = {

        ...data,

        disease:
            data.disease ||
            data.prediction ||
            data.predicted_disease ||
            predictedDisease,

        confidence,

        quantum_score:
            quantumValue,

        selected_symptoms:
            selectedSymptoms,

        prediction_time:
            new Date().toISOString(),

        patient:
            currentProfile,

        userEmail:
            currentUser?.email || ""
    };

    window.scrollTo({
        top: result
            ? result.offsetTop - 20
            : 0,

        behavior: "smooth"
    });
}


// ============================================================
// TOP PREDICTIONS
// ============================================================

function renderTopPredictions(
    predictions
) {

    if (!topPredictions) {
        return;
    }

    if (
        !Array.isArray(
            predictions
        ) ||
        predictions.length === 0
    ) {

        topPredictions.innerHTML =
            `<p class="muted">
                No additional predictions available.
            </p>`;

        return;
    }

    topPredictions.innerHTML =
        predictions
            .slice(0, 5)
            .map(
                item => {

                    const name =
                        formatDisease(
                            item.disease ||
                            item.name ||
                            "Unknown"
                        );

                    const score =
                        Number(
                            item.confidence ||
                            item.score ||
                            0
                        );

                    return `
                        <div class="prediction-item">

                            <span>
                                ${escapeHtml(name)}
                            </span>

                            <strong>
                                ${score.toFixed(2)}%
                            </strong>

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
    specialty
) {

    if (!specialistBox) {
        return;
    }

    specialistBox.textContent =
        specialty ||
        "General Physician";
}


// ============================================================
// RECOMMENDED DOCTOR
// ============================================================

function renderRecommendedDoctor(
    data
) {

    if (!recommendedDoctorBox) {
        return;
    }

    const doctors =
        Array.isArray(
            data.doctors
        )
            ? data.doctors
            : [];

    if (
        doctors.length ===
        0
    ) {

        recommendedDoctorBox.innerHTML = `
            <div class="doctor-recommendation">

                <h3>
                    👨‍⚕️ Doctor Recommendation
                </h3>

                <p>
                    Recommended Specialty:
                    <strong>
                        ${escapeHtml(
                            data.specialty ||
                            data.specialist ||
                            "General Physician"
                        )}
                    </strong>
                </p>

            </div>
        `;

        return;
    }

    const doctor =
        doctors[0];

    recommendedDoctorBox.innerHTML = `

        <div class="doctor-recommendation">

            <h3>
                👨‍⚕️ Recommended Doctor
            </h3>

            <p>
                <strong>
                    ${escapeHtml(
                        doctor.name ||
                        "Doctor"
                    )}
                </strong>
            </p>

            <p>
                🩺
                ${escapeHtml(
                    doctor.specialization ||
                    data.specialty ||
                    "General Physician"
                )}
            </p>

            <p>
                🏥
                ${escapeHtml(
                    doctor.hospital ||
                    "—"
                )}
            </p>

            <p>
                📍
                ${escapeHtml(
                    doctor.location ||
                    "—"
                )}
            </p>

            <p>
                Experience:
                ${escapeHtml(
                    doctor.experience ||
                    "—"
                )}
            </p>

        </div>
    `;
}


// ============================================================
// SAVE PREDICTION HISTORY
// ============================================================

async function savePredictionHistory(
    prediction,
    selectedSymptoms
) {

    if (!currentUser) {
        return;
    }

    const predictionTime =
        new Date();

    const historyData = {

        uid:
            currentUser.uid,

        email:
            currentUser.email || "",

        patient:
            currentProfile || {},

        disease:
            prediction.disease ||
            prediction.prediction ||
            prediction.predicted_disease ||
            "Unknown",

        confidence:
            Number(
                prediction.confidence ||
                prediction.rf_confidence ||
                0
            ),

        quantum_score:
            Number(
                prediction.quantum_score ||
                prediction.qiskit_score ||
                prediction.qiskitScore ||
                0
            ),

        qiskit_qubits:
            prediction.qiskit_qubits ??
            prediction.qiskitQubits ??
            prediction.qubits ??
            null,

        qiskit_depth:
            prediction.qiskit_depth ??
            prediction.qiskitDepth ??
            prediction.depth ??
            null,

        specialty:
            prediction.specialty ||
            prediction.specialist ||
            "General Physician",

        selected_symptoms:
            selectedSymptoms || [],

        prediction_time:
            predictionTime.toISOString(),

        createdAt:
            serverTimestamp()
    };

    try {

        await addDoc(
            collection(
                db,
                "predictionHistory"
            ),
            historyData
        );

        latestPrediction = {

            ...prediction,

            ...historyData,

            prediction_time:
                predictionTime.toISOString()
        };

        await loadPredictionHistory();

    } catch (error) {

        console.error(
            "History save error:",
            error
        );

        /*
         * Prediction itself is still successful.
         * History failure should not block the user.
         */
    }
}


// ============================================================
// LOAD PREDICTION HISTORY
// ============================================================

async function loadPredictionHistory() {

    if (
        !currentUser ||
        !historyList
    ) {
        return;
    }

    historyList.innerHTML =
        `<p class="muted">
            Loading history...
        </p>`;

    try {

        const historyQuery =
            query(
                collection(
                    db,
                    "predictionHistory"
                ),
                where(
                    "uid",
                    "==",
                    currentUser.uid
                )
            );

        const snapshot =
            await getDocs(
                historyQuery
            );

        predictionHistory =
            snapshot.docs
                .map(
                    item => ({
                        id:
                            item.id,

                        ...item.data()
                    })
                )
                .sort(
                    (
                        a,
                        b
                    ) => {

                        const dateA =
                            new Date(
                                a.prediction_time ||
                                0
                            ).getTime();

                        const dateB =
                            new Date(
                                b.prediction_time ||
                                0
                            ).getTime();

                        return dateB -
                            dateA;
                    }
                );

        renderHistory();

    } catch (error) {

        console.error(
            "History loading error:",
            error
        );

        historyList.innerHTML =
            `<p class="muted">
                Could not load prediction history.
            </p>`;
    }
}


// ============================================================
// RENDER HISTORY
// ============================================================

function renderHistory() {

    if (!historyList) {
        return;
    }

    if (
        !predictionHistory.length
    ) {

        historyList.innerHTML =
            `<p class="muted">
                No prediction history yet.
            </p>`;

        return;
    }

    historyList.innerHTML =
        predictionHistory
            .map(
                item => {

                    const itemDisease =
                        formatDisease(
                            item.disease ||
                            "Unknown"
                        );

                    const itemConfidence =
                        Number(
                            item.confidence ||
                            0
                        );

                    const itemQuantum =
                        Number(
                            item.quantum_score ||
                            0
                        );

                    const symptomsText =
                        Array.isArray(
                            item.selected_symptoms
                        )
                            ? item.selected_symptoms
                                .map(
                                    formatDisease
                                )
                                .join(
                                    ", "
                                )
                            : "—";

                    return `

                        <div
                            class="history-card"
                            data-history-id="${escapeHtml(
                                item.id
                            )}"
                        >

                            <div
                                class="history-header"
                            >

                                <h3>
                                    ${escapeHtml(
                                        itemDisease
                                    )}
                                </h3>

                                <span>
                                    ${formatDateTime(
                                        item.prediction_time
                                    )}
                                </span>

                            </div>

                            <div
                                class="history-details"
                            >

                                <p>
                                    <strong>
                                        Random Forest:
                                    </strong>
                                    ${itemConfidence.toFixed(2)}%
                                </p>

                                <p>
                                    <strong>
                                        Qiskit:
                                    </strong>
                                    ${itemQuantum.toFixed(2)}%
                                </p>

                                <p>
                                    <strong>
                                        Specialty:
                                    </strong>
                                    ${escapeHtml(
                                        item.specialty ||
                                        "General Physician"
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Symptoms:
                                    </strong>
                                    ${escapeHtml(
                                        symptomsText
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
// DOCTORS
// ============================================================

async function loadDoctors(
    specialty = ""
) {

    if (!doctorList) {
        return;
    }

    doctorList.innerHTML =
        `<p class="muted">
            Loading doctors...
        </p>`;

    try {

        const endpoint =
            specialty
                ? `/doctors?specialty=${encodeURIComponent(
                    specialty
                )}`
                : "/doctors";

        const data =
            await apiFetch(
                endpoint
            );

        const doctors =
            Array.isArray(
                data.doctors
            )
                ? data.doctors
                : Array.isArray(
                    data
                )
                    ? data
                    : [];

        if (
            !doctors.length
        ) {

            doctorList.innerHTML =
                `<p class="muted">
                    No doctors available.
                </p>`;

            return;
        }

        doctorList.innerHTML =
            doctors
                .map(
                    doctor => `

                        <div
                            class="doctor-card"
                        >

                            <div
                                class="doctor-avatar"
                            >
                                👨‍⚕️
                            </div>

                            <div
                                class="doctor-info"
                            >

                                <h3>
                                    ${escapeHtml(
                                        doctor.name ||
                                        "Doctor"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        doctor.specialization ||
                                        specialty ||
                                        "General Physician"
                                    )}
                                </p>

                                <p>
                                    🏥
                                    ${escapeHtml(
                                        doctor.hospital ||
                                        "—"
                                    )}
                                </p>

                                <p>
                                    📍
                                    ${escapeHtml(
                                        doctor.location ||
                                        "—"
                                    )}
                                </p>

                                <p>
                                    Experience:
                                    ${escapeHtml(
                                        doctor.experience ||
                                        "—"
                                    )}
                                </p>

                            </div>

                        </div>

                    `
                )
                .join("");

    } catch (error) {

        console.error(
            "Doctor loading error:",
            error
        );

        doctorList.innerHTML =
            `<p class="muted">
                Could not load doctors.
            </p>`;
    }
}


// ============================================================
// ONE-PAGE PDF REPORT
// ============================================================

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
            "PDF generator could not be loaded. Please refresh the page."
        );

        return;
    }

    const doc =
        new jsPDF({
            orientation:
                "portrait",

            unit:
                "mm",

            format:
                "a4"
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

    const predictedDisease =
        formatDisease(
            source.disease ||
            source.prediction ||
            source.predicted_disease ||
            "Unknown"
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
            .join(
                ", "
            );

    const pageWidth =
        210;

    const left =
        15;

    const right =
        15;

    const contentWidth =
        pageWidth -
        left -
        right;

    let y =
        14;

    function addText(
        text,
        size = 8,
        bold = false,
        gap = 2.5
    ) {

        doc.setFont(
            "helvetica",
            bold
                ? "bold"
                : "normal"
        );

        doc.setFontSize(
            size
        );

        doc.setTextColor(
            30,
            35,
            45
        );

        const lines =
            doc.splitTextToSize(
                String(text),
                contentWidth
            );

        doc.text(
            lines,
            left,
            y
        );

        y +=
            lines.length *
            (
                size <= 8
                    ? 3.5
                    : 4
            ) +
            gap;
    }

    function addSection(
        title
    ) {

        y += 1;

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            10.5
        );

        doc.setTextColor(
            25,
            45,
            80
        );

        doc.text(
            title,
            left,
            y
        );

        y += 5;
    }

    // HEADER

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(
        19
    );

    doc.setTextColor(
        25,
        45,
        80
    );

    doc.text(
        "QuantumDiagnose",
        left,
        y
    );

    y += 5.5;

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(
        8
    );

    doc.setTextColor(
        90,
        100,
        115
    );

    doc.text(
        "AI-Assisted Symptom Analysis Report",
        left,
        y
    );

    y += 5;

    doc.setDrawColor(
        190,
        195,
        205
    );

    doc.line(
        left,
        y,
        pageWidth -
            right,
        y
    );

    y += 6;

    // PATIENT

    addSection(
        "Patient Information"
    );

    addText(
        `Name: ${patient.name || "—"}`
    );

    addText(
        `Email: ${
            source.userEmail ||
            currentUser?.email ||
            "—"
        }`
    );

    addText(
        `Gender: ${
            patient.gender ||
            "—"
        }    Age: ${
            patient.age ||
            "—"
        }`
    );

    addText(
        `Height: ${
            patient.height
                ? patient.height + " cm"
                : "—"
        }    Weight: ${
            patient.weight
                ? patient.weight + " kg"
                : "—"
        }`
    );

    addText(
        `Prediction Date & Time: ${
            formatDateTime(
                predictionTime
            )
        }`
    );

    // SYMPTOMS

    addSection(
        "Selected Symptoms"
    );

    addText(
        symptoms ||
        "No symptoms recorded.",
        7.8,
        false,
        2
    );

    // RANDOM FOREST

    addSection(
        "Random Forest Result"
    );

    addText(
        `Predicted Disease: ${
            predictedDisease
        }`,
        8.5,
        true
    );

    addText(
        `Confidence: ${
            rf.toFixed(2)
        }%`
    );

    const top =
        Array.isArray(
            source.top_predictions
        )
            ? source.top_predictions
                .slice(
                    0,
                    5
                )
            : [];

    if (top.length) {

        addText(
            "Top Predictions: " +
            top
                .map(
                    item =>
                        `${
                            formatDisease(
                                item.disease ||
                                item.name ||
                                "Unknown"
                            )
                        }: ${
                            Number(
                                item.confidence ||
                                item.score ||
                                0
                            ).toFixed(2)
                        }%`
                )
                .join(
                    " • "
                ),
            7.5
        );
    }

    // QISKIT

    addSection(
        "Qiskit Experimental Analysis"
    );

    addText(
        `Experimental Score: ${
            quantum.toFixed(2)
        }%`
    );

    addText(
        `Qubits: ${
            source.qiskit_qubits ??
            source.qiskitQubits ??
            source.qubits ??
            "—"
        }    Circuit Depth: ${
            source.qiskit_depth ??
            source.qiskitDepth ??
            source.depth ??
            "—"
        }`
    );

    addText(
        `Quantum Signal: ${
            Number(
                source.quantum_signal ||
                source.quantumSignal ||
                0
            ).toFixed(2)
        }%`
    );

    // DOCTOR

    addSection(
        "Doctor Recommendation"
    );

    addText(
        `Specialty: ${
            source.specialty ||
            source.specialist ||
            "General Physician"
        }`
    );

    const doctors =
        Array.isArray(
            source.doctors
        )
            ? source.doctors
            : [];

    if (
        doctors.length
    ) {

        const doctor =
            doctors[0];

        addText(
            `Doctor: ${
                doctor.name ||
                "—"
            }`
        );

        addText(
            `Hospital: ${
                doctor.hospital ||
                "—"
            }`
        );

        addText(
            `Location: ${
                doctor.location ||
                "—"
            }`
        );

        addText(
            `Experience: ${
                doctor.experience ||
                "—"
            }`
        );
    }

    // NOTICE

    addSection(
        "Important Notice"
    );

    addText(
        "QuantumDiagnose is an educational and research demonstration. " +
        "The Random Forest prediction is generated from the project dataset. " +
        "The Qiskit score is experimental and is not a clinically validated probability. " +
        "This report should not be considered a medical diagnosis or a substitute for professional medical advice.",
        7,
        false,
        1
    );

    // FOOTER

    doc.setDrawColor(
        200,
        205,
        215
    );

    doc.line(
        left,
        278,
        pageWidth -
            right,
        278
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(
        6.8
    );

    doc.setTextColor(
        105,
        105,
        105
    );

    doc.text(
        "QuantumDiagnose • Educational Project",
        left,
        284
    );

    doc.text(
        `Generated: ${
            formatDateTime(
                new Date()
            )
        }`,
        left,
        288
    );

    const safeDisease =
        predictedDisease
            .replace(
                /[^a-z0-9]/gi,
                "_"
            );

    doc.save(
        `QuantumDiagnose_Report_${safeDisease}.pdf`
    );
}


// ============================================================
// CURRENT REPORT DOWNLOAD
// ============================================================

function downloadCurrentReport() {

    if (!latestPrediction) {

        alert(
            "Please make a prediction first."
        );

        return;
    }

    downloadPDF(
        latestPrediction
    );
}

downloadReportBtn?.addEventListener(
    "click",
    downloadCurrentReport
);


// ============================================================
// INITIAL AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        currentUser =
            user || null;

        if (!user) {

            if (authScreen) {

                authScreen.style.display =
                    "flex";
            }

            if (app) {

                app.style.display =
                    "none";
            }

            profileComplete =
                false;

            currentProfile =
                null;

            latestPrediction =
                null;

            predictionHistory =
                [];

            createSecurityCheck();

            return;
        }

        if (authScreen) {

            authScreen.style.display =
                "none";
        }

        if (app) {

            app.style.display =
                "block";
        }

        if (userEmail) {

            userEmail.textContent =
                user.email || "";
        }

        const complete =
            await loadProfile();

        profileComplete =
            complete;

        await loadPredictionHistory();

        await loadDoctors();

        if (complete) {

            updateWelcomeName(
                currentProfile?.name
            );

        } else {

            updateWelcomeName(
                "Patient"
            );
        }

        await loadSymptoms();

        showPage(
            complete
                ? "dashboardPage"
                : "profilePage"
        );
    }
);


// ============================================================
// COMPARE BUTTON
// ============================================================

compareBtn?.addEventListener(
    "click",
    () => {

        if (!latestPrediction) {

            alert(
                "Please make a prediction first."
            );

            return;
        }

        showPage(
            "comparisonPage"
        );

        renderComparison(
            latestPrediction
        );
    }
);


// ============================================================
// COMPARISON
// ============================================================

function renderComparison(
    data
) {

    const container =
        $("comparisonContent");

    if (!container) {
        return;
    }

    const diseaseName =
        formatDisease(
            data.disease ||
            data.prediction ||
            data.predicted_disease ||
            "Unknown"
        );

    const rf =
        Number(
            data.confidence ||
            data.rf_confidence ||
            0
        );

    const quantum =
        Number(
            data.quantum_score ||
            data.qiskit_score ||
            0
        );

    container.innerHTML = `

        <div class="comparison-card">

            <h3>
                Random Forest
            </h3>

            <p>
                Prediction:
                <strong>
                    ${escapeHtml(
                        diseaseName
                    )}
                </strong>
            </p>

            <p>
                Confidence:
                <strong>
                    ${rf.toFixed(2)}%
                </strong>
            </p>

        </div>

        <div class="comparison-card">

            <h3>
                Qiskit
            </h3>

            <p>
                Prediction:
                <strong>
                    ${escapeHtml(
                        diseaseName
                    )}
                </strong>
            </p>

            <p>
                Experimental Score:
                <strong>
                    ${quantum.toFixed(2)}%
                </strong>
            </p>

        </div>

    `;
}


// ============================================================
// STARTUP
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createSecurityCheck();

        if (
            typeof loadSymptoms ===
            "function"
        ) {

            loadSymptoms();
        }
    }
);
