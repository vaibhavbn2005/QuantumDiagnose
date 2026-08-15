// ============================================================
// QuantumDiagnose - Updated Complete script.js
// Features:
// - Email authentication
// - Phone OTP + reCAPTCHA
// - Patient profile
// - Saved profile after logout/login
// - Welcome back name
// - Mandatory profile before prediction
// - Random Forest prediction
// - Qiskit prediction display
// - Disease-related doctor recommendation
// - Prediction timestamp
// - Prediction history with date/time
// - Download Prediction Report as PDF
// - No toggle button
// ============================================================


// ============================================================
// FIREBASE IMPORTS
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    query,
    where,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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


// ============================================================
// HTML ELEMENTS
// ============================================================

// Authentication
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");
const authTitle = document.getElementById("authTitle");

const emailTab = document.getElementById("emailTab");
const phoneTab = document.getElementById("phoneTab");

const emailAuth = document.getElementById("emailAuth");
const phoneAuth = document.getElementById("phoneAuth");

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");

const phoneNumber = document.getElementById("phoneNumber");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const otpCode = document.getElementById("otpCode");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");

const recaptchaContainer =
    document.getElementById("recaptcha-container");

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

const specialistBox =
    document.getElementById("specialistBox");


// Patient profile
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

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const profileMessage =
    document.getElementById("profileMessage");


// Dashboard
const welcomeName =
    document.getElementById("welcomeName");

const latestDisease =
    document.getElementById("latestDisease");


// History
const historyList =
    document.getElementById("historyList");


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

const rfAccuracy =
    document.getElementById("rfAccuracy");


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let authMode = "login";

let authMethod = "email";

let confirmationResult = null;

let recaptchaVerifier = null;

let currentProfile = null;

let latestPrediction = null;

let latestPredictionTimestamp = null;


// ============================================================
// AUTH MESSAGE
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
// PROFILE MESSAGE
// ============================================================

function showProfileMessage(text, isError = false) {

    if (!profileMessage) {
        return;
    }

    profileMessage.textContent = text;

    profileMessage.style.color =
        isError
            ? "#d32f2f"
            : "#2e7d32";
}


// ============================================================
// OPEN AUTH MODAL
// ============================================================

function openAuthModal(mode) {

    authMode = mode;

    authMethod = "email";

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

    showEmailAuth();

    clearAuthInputs();

    showAuthMessage("");
}


// ============================================================
// CLOSE AUTH MODAL
// ============================================================

function closeAuthModal() {

    if (authModal) {
        authModal.classList.add("hidden");
    }

    showAuthMessage("");

    clearAuthInputs();

    if (recaptchaVerifier) {

        try {
            recaptchaVerifier.clear();
        } catch (error) {
            console.log(
                "reCAPTCHA clear error:",
                error
            );
        }

        recaptchaVerifier = null;
    }

    confirmationResult = null;
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

    if (phoneNumber) {
        phoneNumber.value = "";
    }

    if (otpCode) {
        otpCode.value = "";
    }
}


// ============================================================
// EMAIL AUTH TAB
// ============================================================

function showEmailAuth() {

    authMethod = "email";

    if (emailTab) {
        emailTab.classList.add("active");
    }

    if (phoneTab) {
        phoneTab.classList.remove("active");
    }

    if (emailAuth) {
        emailAuth.classList.remove("hidden");
    }

    if (phoneAuth) {
        phoneAuth.classList.add("hidden");
    }

    showAuthMessage("");
}


// ============================================================
// PHONE AUTH TAB
// ============================================================

function showPhoneAuth() {

    authMethod = "phone";

    if (phoneTab) {
        phoneTab.classList.add("active");
    }

    if (emailTab) {
        emailTab.classList.remove("active");
    }

    if (emailAuth) {
        emailAuth.classList.add("hidden");
    }

    if (phoneAuth) {
        phoneAuth.classList.remove("hidden");
    }

    showAuthMessage("");

    initializeRecaptcha();
}


// ============================================================
// INITIALIZE reCAPTCHA
// ============================================================

function initializeRecaptcha() {

    if (recaptchaVerifier) {
        return;
    }

    if (!recaptchaContainer) {
        return;
    }

    try {

        recaptchaVerifier =
            new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "normal",

                    callback: function () {
                        console.log(
                            "reCAPTCHA verified"
                        );
                    },

                    "expired-callback":
                        function () {

                            showAuthMessage(
                                "reCAPTCHA expired. Please verify again.",
                                true
                            );
                        }
                }
            );

        recaptchaVerifier
            .render()
            .then(function (widgetId) {

                console.log(
                    "reCAPTCHA rendered:",
                    widgetId
                );

            })
            .catch(function (error) {

                console.error(
                    "reCAPTCHA render error:",
                    error
                );

                showAuthMessage(
                    "Could not load reCAPTCHA.",
                    true
                );
            });

    } catch (error) {

        console.error(
            "reCAPTCHA initialization error:",
            error
        );

        showAuthMessage(
            "Could not initialize phone authentication.",
            true
        );
    }
}


// ============================================================
// EMAIL LOGIN / SIGN UP
// ============================================================

async function handleEmailAuthentication() {

    const email =
        authEmail
            ? authEmail.value.trim()
            : "";

    const password =
        authPassword
            ? authPassword.value
            : "";

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
        authSubmit.textContent = "Please wait...";
    }

    showAuthMessage("Processing...");

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

        setTimeout(
            closeAuthModal,
            700
        );

    } catch (error) {

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
// SEND PHONE OTP
// ============================================================

async function sendPhoneOTP() {

    const phone =
        phoneNumber
            ? phoneNumber.value.trim()
            : "";

    if (!phone) {

        showAuthMessage(
            "Please enter your phone number.",
            true
        );

        return;
    }

    if (!phone.startsWith("+")) {

        showAuthMessage(
            "Enter the phone number with country code, e.g. +919876543210.",
            true
        );

        return;
    }

    if (!recaptchaVerifier) {

        initializeRecaptcha();

        showAuthMessage(
            "Please complete the reCAPTCHA and click Send OTP again.",
            true
        );

        return;
    }

    if (sendOtpBtn) {
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = "Sending...";
    }

    showAuthMessage(
        "Sending OTP..."
    );

    try {

        confirmationResult =
            await signInWithPhoneNumber(
                auth,
                phone,
                recaptchaVerifier
            );

        showAuthMessage(
            "OTP sent successfully. Check your phone."
        );

        if (otpCode) {
            otpCode.focus();
        }

    } catch (error) {

        console.error(
            "Phone OTP error:",
            error
        );

        let errorMessage =
            "Could not send OTP.";

        switch (error.code) {

            case "auth/invalid-phone-number":
                errorMessage =
                    "Invalid phone number. Use format +91XXXXXXXXXX.";
                break;

            case "auth/operation-not-allowed":
                errorMessage =
                    "Phone authentication is not enabled in Firebase.";
                break;

            case "auth/too-many-requests":
                errorMessage =
                    "Too many requests. Please try again later.";
                break;

            case "auth/quota-exceeded":
                errorMessage =
                    "SMS quota exceeded.";
                break;

            case "auth/captcha-check-failed":
                errorMessage =
                    "reCAPTCHA verification failed.";
                break;

            default:
                errorMessage =
                    error.message ||
                    "Could not send OTP.";
        }

        showAuthMessage(
            errorMessage,
            true
        );

    } finally {

        if (sendOtpBtn) {

            sendOtpBtn.disabled = false;

            sendOtpBtn.textContent =
                "Send OTP";
        }
    }
}


// ============================================================
// VERIFY PHONE OTP
// ============================================================

async function verifyPhoneOTP() {

    const code =
        otpCode
            ? otpCode.value.trim()
            : "";

    if (!confirmationResult) {

        showAuthMessage(
            "Please click Send OTP first.",
            true
        );

        return;
    }

    if (!code) {

        showAuthMessage(
            "Please enter the OTP.",
            true
        );

        return;
    }

    if (code.length !== 6) {

        showAuthMessage(
            "OTP must contain 6 digits.",
            true
        );

        return;
    }

    if (verifyOtpBtn) {

        verifyOtpBtn.disabled = true;

        verifyOtpBtn.textContent =
            "Verifying...";
    }

    showAuthMessage(
        "Verifying OTP..."
    );

    try {

        await confirmationResult.confirm(
            code
        );

        showAuthMessage(
            "Phone verification successful!"
        );

        setTimeout(
            closeAuthModal,
            700
        );

    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );

        let errorMessage =
            "OTP verification failed.";

        switch (error.code) {

            case "auth/invalid-verification-code":
                errorMessage =
                    "Incorrect OTP.";
                break;

            case "auth/code-expired":
                errorMessage =
                    "OTP expired. Please request a new OTP.";
                break;

            default:
                errorMessage =
                    error.message ||
                    "OTP verification failed.";
        }

        showAuthMessage(
            errorMessage,
            true
        );

    } finally {

        if (verifyOtpBtn) {

            verifyOtpBtn.disabled = false;

            verifyOtpBtn.textContent =
                "Verify OTP";
        }
    }
}


// ============================================================
// GET PROFILE DATA
// ============================================================

function getProfileData() {

    return {

        name:
            profileName
                ? profileName.value.trim()
                : "",

        gender:
            profileGender
                ? profileGender.value
                : "",

        age:
            profileAge
                ? profileAge.value
                : "",

        height:
            profileHeight
                ? profileHeight.value
                : "",

        weight:
            profileWeight
                ? profileWeight.value
                : ""
    };
}


// ============================================================
// CHECK PROFILE
// ============================================================

function isProfileComplete() {

    const profile =
        getProfileData();

    return (
        profile.name !== "" &&
        profile.gender !== "" &&
        profile.age !== "" &&
        profile.height !== "" &&
        profile.weight !== ""
    );
}


// ============================================================
// SAVE PROFILE
// ============================================================

async function saveProfile() {

    const user =
        auth.currentUser;

    if (!user) {

        showProfileMessage(
            "Please login first.",
            true
        );

        return false;
    }

    const profile =
        getProfileData();

    if (!profile.name) {

        showProfileMessage(
            "Please enter your name.",
            true
        );

        return false;
    }

    if (!profile.gender) {

        showProfileMessage(
            "Please select your gender.",
            true
        );

        return false;
    }

    if (!profile.age) {

        showProfileMessage(
            "Please enter your age.",
            true
        );

        return false;
    }

    if (!profile.height) {

        showProfileMessage(
            "Please enter your height.",
            true
        );

        return false;
    }

    if (!profile.weight) {

        showProfileMessage(
            "Please enter your weight.",
            true
        );

        return false;
    }

    if (saveProfileBtn) {

        saveProfileBtn.disabled = true;

        saveProfileBtn.textContent =
            "Saving...";
    }

    try {

        const profileRef =
            doc(
                db,
                "profiles",
                user.uid
            );

        await setDoc(
            profileRef,
            {
                uid: user.uid,

                name: profile.name,

                gender: profile.gender,

                age: Number(profile.age),

                height: Number(profile.height),

                weight: Number(profile.weight),

                email:
                    user.email || "",

                phone:
                    user.phoneNumber || "",

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        currentProfile =
            profile;

        localStorage.setItem(
            "quantumDiagnoseProfile",
            JSON.stringify(profile)
        );

        updateWelcomeName(
            profile.name
        );

        showProfileMessage(
            "Profile saved successfully."
        );

        return true;

    } catch (error) {

        console.error(
            "Profile save error:",
            error
        );

        showProfileMessage(
            "Could not save profile: " +
            error.message,
            true
        );

        return false;

    } finally {

        if (saveProfileBtn) {

            saveProfileBtn.disabled = false;

            saveProfileBtn.textContent =
                "Save Profile";
        }
    }
}


// ============================================================
// LOAD PROFILE
// ============================================================

async function loadProfile(user) {

    if (!user) {
        return;
    }

    try {

        const profileRef =
            doc(
                db,
                "profiles",
                user.uid
            );

        const profileSnap =
            await getDoc(profileRef);

        if (profileSnap.exists()) {

            const data =
                profileSnap.data();

            currentProfile =
                data;

            fillProfileFields(
                data
            );

            updateWelcomeName(
                data.name
            );

            return;
        }

        // Fallback to localStorage
        const saved =
            localStorage.getItem(
                "quantumDiagnoseProfile"
            );

        if (saved) {

            const data =
                JSON.parse(saved);

            currentProfile =
                data;

            fillProfileFields(
                data
            );

            updateWelcomeName(
                data.name
            );
        }

    } catch (error) {

        console.error(
            "Profile load error:",
            error
        );
    }
}


// ============================================================
// FILL PROFILE FIELDS
// ============================================================

function fillProfileFields(data) {

    if (!data) {
        return;
    }

    if (profileName) {
        profileName.value =
            data.name || "";
    }

    if (profileGender) {
        profileGender.value =
            data.gender || "";
    }

    if (profileAge) {
        profileAge.value =
            data.age || "";
    }

    if (profileHeight) {
        profileHeight.value =
            data.height || "";
    }

    if (profileWeight) {
        profileWeight.value =
            data.weight || "";
    }
}


// ============================================================
// UPDATE WELCOME NAME
// ============================================================

function updateWelcomeName(name) {

    if (!welcomeName) {
        return;
    }

    if (name && name.trim()) {

        welcomeName.textContent =
            name.trim();

    } else {

        welcomeName.textContent =
            "Patient";
    }
}


// ============================================================
// MANDATORY PROFILE CHECK
// ============================================================

async function ensureProfileBeforePrediction() {

    const user =
        auth.currentUser;

    if (!user) {

        alert(
            "Please login before analyzing symptoms."
        );

        openAuthModal(
            "login"
        );

        return false;
    }

    await loadProfile(
        user
    );

    if (!isProfileComplete()) {

        alert(
            "Please complete and save your Patient Profile before prediction."
        );

        // Try to navigate to profile
        const profilePage =
            document.getElementById(
                "profile"
            );

        if (profilePage) {

            document
                .querySelectorAll(".page")
                .forEach(
                    page =>
                        page.classList.remove(
                            "active-page"
                        )
                );

            profilePage.classList.add(
                "active-page"
            );
        }

        return false;
    }

    return true;
}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (user) {

            console.log(
                "Logged in user:",
                user
            );

            if (loginBtn) {
                loginBtn.classList.add(
                    "hidden"
                );
            }

            if (signupBtn) {
                signupBtn.classList.add(
                    "hidden"
                );
            }

            if (logoutBtn) {
                logoutBtn.classList.remove(
                    "hidden"
                );
            }

            await loadProfile(
                user
            );

            await loadPredictionHistory();

        } else {

            console.log(
                "No user logged in."
            );

            if (loginBtn) {
                loginBtn.classList.remove(
                    "hidden"
                );
            }

            if (signupBtn) {
                signupBtn.classList.remove(
                    "hidden"
                );
            }

            if (logoutBtn) {
                logoutBtn.classList.add(
                    "hidden"
                );
            }

            updateWelcomeName(
                "Patient"
            );

            currentProfile = null;
        }
    }
);


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(
            auth
        );

        alert(
            "Logged out successfully."
        );

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
// SYMPTOMS
// ============================================================

function getSymptomCheckboxes() {

    return document.querySelectorAll(
        '#symptomGrid input[type="checkbox"]'
    );
}


// ============================================================
// UPDATE COUNT
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
                            symptom.textContent ||
                            ""
                        )
                        .toLowerCase();

                    symptom.style.display =
                        name.includes(
                            searchText
                        )
                            ? ""
                            : "none";
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

            getSymptomCheckboxes()
                .forEach(
                    box =>
                        box.checked = false
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
                    symptom =>
                        symptom.style.display = ""
                );
        }
    );
}


// ============================================================
// DISEASE -> SPECIALIST
// ============================================================

function getSpecialistForDisease(
    diseaseName
) {

    const diseaseText =
        String(
            diseaseName || ""
        ).toLowerCase();

    const mapping = {

        arthritis:
            "Rheumatologist",

        "osteoarthritis":
            "Orthopedic Doctor",

        "rheumatoid arthritis":
            "Rheumatologist",

        migraine:
            "Neurologist",

        "migraine headache":
            "Neurologist",

        hypertension:
            "Cardiologist",

        "high blood pressure":
            "Cardiologist",

        diabetes:
            "Endocrinologist",

        "type 2 diabetes":
            "Endocrinologist",

        asthma:
            "Pulmonologist",

        bronchitis:
            "Pulmonologist",

        pneumonia:
            "Pulmonologist",

        tuberculosis:
            "Pulmonologist",

        "heart attack":
            "Cardiologist",

        "coronary artery disease":
            "Cardiologist",

        gastritis:
            "Gastroenterologist",

        "gerd":
            "Gastroenterologist",

        hepatitis:
            "Hepatologist",

        jaundice:
            "Gastroenterologist",

        "urinary tract infection":
            "Urologist",

        "kidney disease":
            "Nephrologist",

        "kidney stone":
            "Urologist",

        psoriasis:
            "Dermatologist",

        "fungal infection":
            "Dermatologist",

        eczema:
            "Dermatologist",

        acne:
            "Dermatologist",

        glaucoma:
            "Ophthalmologist",

        "conjunctivitis":
            "Ophthalmologist",

        dengue:
            "General Physician",

        malaria:
            "General Physician",

        typhoid:
            "General Physician",

        flu:
            "General Physician",

        "common cold":
            "General Physician"
    };

    for (
        const key in mapping
    ) {

        if (
            diseaseText.includes(
                key
            )
        ) {

            return mapping[key];
        }
    }

    return "General Physician";
}


// ============================================================
// SHOW DOCTOR RECOMMENDATION
// ============================================================

function showDoctorRecommendation(
    data
) {

    if (!specialistBox) {
        return;
    }

    const predictedDisease =
        data.disease ||
        "Unknown";

    const specialist =
        data.specialist ||
        data.specialist_name ||
        data.recommended_specialist ||
        getSpecialistForDisease(
            predictedDisease
        );

    const doctor =
        data.doctor ||
        data.recommended_doctor ||
        "";

    specialistBox.innerHTML = `
        <strong>Recommended Specialist</strong>
        <br>
        <span>
            ${escapeHtml(specialist)}
        </span>

        ${
            doctor
                ? `
                    <br><br>
                    <strong>Recommended Doctor</strong>
                    <br>
                    <span>
                        ${escapeHtml(doctor)}
                    </span>
                  `
                : ""
        }

        <br><br>

        <small>
            Recommendation is based on the predicted
            condition and is for educational demonstration.
        </small>
    `;
}


// ============================================================
// MAKE PREDICTION
// ============================================================

async function makePrediction() {

    const profileReady =
        await ensureProfileBeforePrediction();

    if (!profileReady) {
        return;
    }

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

                    body:
                        JSON.stringify(
                            {
                                symptoms:
                                    selectedSymptoms
                            }
                        )
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


        // --------------------------------------------------------
        // TIMESTAMP
        // --------------------------------------------------------

        const timestamp =
            new Date();

        latestPredictionTimestamp =
            timestamp;


        // --------------------------------------------------------
        // STORE LATEST PREDICTION
        // --------------------------------------------------------

        latestPrediction = {

            ...data,

            symptoms:
                selectedSymptoms,

            timestamp:
                timestamp,

            profile:
                currentProfile
        };


        // --------------------------------------------------------
        // SHOW RESULT
        // --------------------------------------------------------

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
                `${Math.max(
                    0,
                    Math.min(
                        100,
                        confidence
                    )
                )}%`;
        }


        // --------------------------------------------------------
        // TOP PREDICTIONS
        // --------------------------------------------------------

        if (topPredictions) {

            topPredictions.innerHTML =
                "";

            if (
                data.top_predictions &&
                data.top_predictions.length
            ) {

                data.top_predictions
                    .forEach(
                        function (item) {

                            const div =
                                document.createElement(
                                    "div"
                                );

                            div.className =
                                "prediction-item";

                            div.innerHTML = `
                                <span>
                                    ${escapeHtml(
                                        item.disease
                                    )}
                                </span>

                                <strong>
                                    ${Number(
                                        item.confidence || 0
                                    )}%
                                </strong>
                            `;

                            topPredictions.appendChild(
                                div
                            );
                        }
                    );
            }
        }


        // --------------------------------------------------------
        // MESSAGE
        // --------------------------------------------------------

        if (message) {

            message.textContent =
                data.message ||
                "Educational ML prediction only.";
        }


        // --------------------------------------------------------
        // DOCTOR RECOMMENDATION
        // --------------------------------------------------------

        showDoctorRecommendation(
            data
        );


        // --------------------------------------------------------
        // ADD TIMESTAMP + PDF BUTTON
        // --------------------------------------------------------

        addPredictionTools(
            latestPrediction
        );


        // --------------------------------------------------------
        // SAVE TO FIRESTORE
        // --------------------------------------------------------

        await savePrediction(
            selectedSymptoms,
            data,
            timestamp
        );


        // --------------------------------------------------------
        // REFRESH HISTORY
        // --------------------------------------------------------

        await loadPredictionHistory();


        // --------------------------------------------------------
        // UPDATE DASHBOARD
        // --------------------------------------------------------

        if (latestDisease) {

            latestDisease.textContent =
                data.disease ||
                "—";
        }


        // --------------------------------------------------------
        // SCROLL
        // --------------------------------------------------------

        if (result) {

            result.scrollIntoView(
                {
                    behavior: "smooth",
                    block: "start"
                }
            );
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
                "Predict Possible Disease";
        }
    }
}


// ============================================================
// ADD TIMESTAMP + DOWNLOAD BUTTON
// ============================================================

function addPredictionTools(
    prediction
) {

    if (!result || !prediction) {
        return;
    }

    let tools =
        document.getElementById(
            "predictionTools"
        );

    if (!tools) {

        tools =
            document.createElement(
                "div"
            );

        tools.id =
            "predictionTools";

        tools.className =
            "prediction-tools";

        result.appendChild(
            tools
        );
    }

    const timestamp =
        prediction.timestamp instanceof Date
            ? prediction.timestamp
            : new Date();

    tools.innerHTML = `

        <div class="prediction-timestamp">

            📅

            <span>
                Prediction Date & Time:
            </span>

            <strong>
                ${formatDateTime(timestamp)}
            </strong>

        </div>

        <div class="report-actions">

            <button
                id="downloadReportBtn"
                class="download-report"
                type="button"
            >
                📄 Download Report
            </button>

        </div>
    `;


    const downloadButton =
        document.getElementById(
            "downloadReportBtn"
        );

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            function () {

                downloadPredictionPDF(
                    prediction
                );
            }
        );
    }
}


// ============================================================
// SAVE PREDICTION
// ============================================================

async function savePrediction(
    selectedSymptoms,
    data,
    timestamp
) {

    const user =
        auth.currentUser;

    if (!user) {
        return;
    }

    try {

        const profile =
            currentProfile ||
            getProfileData();


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

                phoneNumber:
                    user.phoneNumber || null,

                patientName:
                    profile.name || null,

                patientGender:
                    profile.gender || null,

                patientAge:
                    profile.age || null,

                patientHeight:
                    profile.height || null,

                patientWeight:
                    profile.weight || null,

                symptoms:
                    selectedSymptoms,

                disease:
                    data.disease || null,

                confidence:
                    Number(
                        data.confidence || 0
                    ),

                topPredictions:
                    data.top_predictions ||
                    [],

                quantumDisease:
                    data.quantum_disease ||
                    data.quantum_prediction ||
                    data.qiskit_disease ||
                    null,

                quantumScore:
                    data.quantum_score ||
                    data.experimental_score ||
                    data.qiskit_score ||
                    null,

                specialist:
                    data.specialist ||
                    data.recommended_specialist ||
                    getSpecialistForDisease(
                        data.disease
                    ),

                createdAt:
                    serverTimestamp(),

                clientTimestamp:
                    timestamp.toISOString()
            }
        );

        console.log(
            "Prediction saved successfully."
        );

    } catch (error) {

        console.error(
            "Firestore save error:",
            error
        );
    }
}


// ============================================================
// LOAD PREDICTION HISTORY
// ============================================================

async function loadPredictionHistory() {

    const user =
        auth.currentUser;

    if (!user || !historyList) {
        return;
    }

    historyList.innerHTML =
        `<p class="muted">Loading history...</p>`;

    try {

        const predictionsRef =
            collection(
                db,
                "predictions"
            );

        const q =
            query(
                predictionsRef,

                where(
                    "userId",
                    "==",
                    user.uid
                ),

                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(q);

        historyList.innerHTML = "";

        if (snapshot.empty) {

            historyList.innerHTML =
                `<p class="muted">
                    No predictions yet.
                </p>`;

            return;
        }


        snapshot.forEach(
            function (docSnap) {

                const data =
                    docSnap.data();

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "history-item";


                const timestamp =
                    getPredictionDate(
                        data
                    );


                const symptoms =
                    Array.isArray(
                        data.symptoms
                    )
                        ? data.symptoms.join(
                            ", "
                        )
                        : "—";


                item.innerHTML = `

                    <div>

                        <div class="history-disease">
                            ${escapeHtml(
                                data.disease ||
                                "Unknown"
                            )}
                        </div>

                        <div class="history-symptoms">
                            ${escapeHtml(
                                symptoms
                            )}
                        </div>

                    </div>


                    <div>

                        <div class="history-date">
                            ${formatDateTime(
                                timestamp
                            )}
                        </div>

                        <small class="muted">
                            Prediction Date & Time
                        </small>

                    </div>


                    <div class="history-confidence">

                        ${
                            data.confidence !==
                            undefined
                                ? Number(
                                    data.confidence
                                ) + "%"
                                : "—"
                        }

                    </div>
                `;


                historyList.appendChild(
                    item
                );
            }
        );

    } catch (error) {

        console.error(
            "History loading error:",
            error
        );

        // If Firestore needs an index,
        // try a simpler query.

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
                        user.uid
                    )
                );

            const snapshot =
                await getDocs(
                    fallbackQuery
                );

            historyList.innerHTML =
                "";

            const records = [];

            snapshot.forEach(
                snap => {

                    records.push(
                        {
                            id:
                                snap.id,

                            ...snap.data()
                        }
                    );
                }
            );

            records.sort(
                function (a, b) {

                    return (
                        getPredictionDate(b)
                            .getTime() -

                        getPredictionDate(a)
                            .getTime()
                    );
                }
            );

            records.forEach(
                function (data) {

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "history-item";

                    const timestamp =
                        getPredictionDate(
                            data
                        );

                    const symptoms =
                        Array.isArray(
                            data.symptoms
                        )
                            ? data.symptoms.join(
                                ", "
                            )
                            : "—";

                    item.innerHTML = `

                        <div>

                            <div class="history-disease">
                                ${escapeHtml(
                                    data.disease ||
                                    "Unknown"
                                )}
                            </div>

                            <div class="history-symptoms">
                                ${escapeHtml(
                                    symptoms
                                )}
                            </div>

                        </div>

                        <div>

                            <div class="history-date">
                                ${formatDateTime(
                                    timestamp
                                )}
                            </div>

                            <small class="muted">
                                Prediction Date & Time
                            </small>

                        </div>

                        <div class="history-confidence">
                            ${
                                data.confidence !==
                                undefined
                                    ? Number(
                                        data.confidence
                                    ) + "%"
                                    : "—"
                            }
                        </div>
                    `;

                    historyList.appendChild(
                        item
                    );
                }
            );

            if (!records.length) {

                historyList.innerHTML =
                    `<p class="muted">
                        No predictions yet.
                    </p>`;
            }

        } catch (fallbackError) {

            console.error(
                "History fallback error:",
                fallbackError
            );

            historyList.innerHTML =
                `<p class="muted">
                    Unable to load prediction history.
                </p>`;
        }
    }
}


// ============================================================
// GET PREDICTION DATE
// ============================================================

function getPredictionDate(
    data
) {

    if (
        data.createdAt &&
        typeof data.createdAt.toDate ===
            "function"
    ) {

        return data.createdAt.toDate();
    }

    if (
        data.clientTimestamp
    ) {

        const date =
            new Date(
                data.clientTimestamp
            );

        if (!isNaN(
            date.getTime()
        )) {

            return date;
        }
    }

    return new Date();
}


// ============================================================
// FORMAT DATE + TIME
// ============================================================

function formatDateTime(
    date
) {

    const d =
        date instanceof Date
            ? date
            : new Date(date);

    if (
        isNaN(
            d.getTime()
        )
    ) {
        return "Date unavailable";
    }

    return d.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    );
}


// ============================================================
// LOAD jsPDF
// ============================================================

let jsPDFPromise = null;

function loadJsPDF() {

    if (window.jspdf) {
        return Promise.resolve(
            window.jspdf
        );
    }

    if (jsPDFPromise) {
        return jsPDFPromise;
    }

    jsPDFPromise =
        new Promise(
            function (resolve, reject) {

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

                script.onload =
                    function () {

                        if (
                            window.jspdf
                        ) {

                            resolve(
                                window.jspdf
                            );

                        } else {

                            reject(
                                new Error(
                                    "jsPDF could not be loaded."
                                )
                            );
                        }
                    };

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

    return jsPDFPromise;
}


// ============================================================
// DOWNLOAD PDF REPORT
// ============================================================

async function downloadPredictionPDF(
    prediction
) {

    if (!prediction) {

        alert(
            "No prediction available for the report."
        );

        return;
    }

    try {

        const jspdf =
            await loadJsPDF();

        const jsPDF =
            jspdf.jsPDF;

        const pdf =
            new jsPDF();


        const profile =
            prediction.profile ||
            currentProfile ||
            getProfileData();


        const user =
            auth.currentUser;


        const patientName =
            profile.name ||
            "Patient";

        const email =
            user?.email ||
            "Not provided";

        const phone =
            user?.phoneNumber ||
            "Not provided";


        const predictionDate =
            prediction.timestamp instanceof Date
                ? prediction.timestamp
                : new Date();


        const diseaseName =
            prediction.disease ||
            "Unknown";


        const confidence =
            Number(
                prediction.confidence ||
                0
            );


        const symptoms =
            Array.isArray(
                prediction.symptoms
            )
                ? prediction.symptoms
                : [];


        const specialist =
            prediction.specialist ||
            prediction.recommended_specialist ||
            getSpecialistForDisease(
                diseaseName
            );


        const quantumDisease =
            prediction.quantum_disease ||
            prediction.quantum_prediction ||
            prediction.qiskit_disease ||
            "Not available";


        const quantumScore =
            prediction.quantum_score ||
            prediction.experimental_score ||
            prediction.qiskit_score ||
            "Not available";


        // --------------------------------------------------------
        // PDF HEADER
        // --------------------------------------------------------

        pdf.setFontSize(22);

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "QuantumDiagnose",
            20,
            22
        );


        pdf.setFontSize(11);

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            "Intelligent Symptom Analysis Platform",
            20,
            30
        );


        pdf.setDrawColor(
            49,
            91,
            234
        );

        pdf.line(
            20,
            35,
            190,
            35
        );


        let y = 48;


        // --------------------------------------------------------
        // REPORT TITLE
        // --------------------------------------------------------

        pdf.setFontSize(16);

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "Prediction Report",
            20,
            y
        );

        y += 12;


        // --------------------------------------------------------
        // PATIENT INFORMATION
        // --------------------------------------------------------

        pdf.setFontSize(13);

        pdf.text(
            "Patient Information",
            20,
            y
        );

        y += 9;

        pdf.setFontSize(10);

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            `Name: ${patientName}`,
            20,
            y
        );

        y += 7;

        pdf.text(
            `Email: ${email}`,
            20,
            y
        );

        y += 7;

        pdf.text(
            `Phone: ${phone}`,
            20,
            y
        );

        y += 7;

        if (profile.gender) {

            pdf.text(
                `Gender: ${profile.gender}`,
                20,
                y
            );

            y += 7;
        }

        if (profile.age) {

            pdf.text(
                `Age: ${profile.age}`,
                20,
                y
            );

            y += 7;
        }


        // --------------------------------------------------------
        // TIMESTAMP
        // --------------------------------------------------------

        y += 4;

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "Prediction Date & Time",
            20,
            y
        );

        y += 7;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            formatDateTime(
                predictionDate
            ),
            20,
            y
        );

        y += 12;


        // --------------------------------------------------------
        // SYMPTOMS
        // --------------------------------------------------------

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "Symptoms Selected",
            20,
            y
        );

        y += 7;

        pdf.setFont(
            "helvetica",
            "normal"
        );


        if (symptoms.length) {

            symptoms.forEach(
                function (symptom) {

                    const lines =
                        pdf.splitTextToSize(
                            "• " +
                            symptom,
                            165
                        );

                    pdf.text(
                        lines,
                        25,
                        y
                    );

                    y +=
                        6 *
                        lines.length;
                }
            );

        } else {

            pdf.text(
                "No symptoms recorded.",
                25,
                y
            );

            y += 7;
        }


        y += 5;


        // --------------------------------------------------------
        // RANDOM FOREST RESULT
        // --------------------------------------------------------

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "Random Forest Prediction",
            20,
            y
        );

        y += 8;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            `Disease: ${diseaseName}`,
            20,
            y
        );

        y += 7;

        pdf.text(
            `Confidence: ${confidence}%`,
            20,
            y
        );

        y += 12;


        // --------------------------------------------------------
        // QISKIT RESULT
        // --------------------------------------------------------

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "Qiskit Experimental Analysis",
            20,
            y
        );

        y += 8;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            `Disease: ${quantumDisease}`,
            20,
            y
        );

        y += 7;

        pdf.text(
            `Experimental Score: ${quantumScore}`,
            20,
            y
        );

        y += 12;


        // --------------------------------------------------------
        // DOCTOR RECOMMENDATION
        // --------------------------------------------------------

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "Recommended Specialist",
            20,
            y
        );

        y += 8;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            specialist,
            20,
            y
        );

        y += 15;


        // --------------------------------------------------------
        // DISCLAIMER
        // --------------------------------------------------------

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "Disclaimer",
            20,
            y
        );

        y += 7;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        const disclaimer =
            "This report is generated by an educational prediction system and is not a substitute for professional medical diagnosis or advice.";

        const disclaimerLines =
            pdf.splitTextToSize(
                disclaimer,
                165
            );

        pdf.text(
            disclaimerLines,
            20,
            y
        );

        y +=
            6 *
            disclaimerLines.length;


        // --------------------------------------------------------
        // FOOTER
        // --------------------------------------------------------

        pdf.setFontSize(9);

        pdf.setTextColor(
            100,
            100,
            100
        );

        pdf.text(
            "Generated by QuantumDiagnose",
            20,
            285
        );


        // --------------------------------------------------------
        // SAVE
        // --------------------------------------------------------

        const safeName =
            patientName
                .replace(
                    /[^a-z0-9]/gi,
                    "_"
                )
                .toLowerCase();

        pdf.save(
            `QuantumDiagnose_Report_${safeName}.pdf`
        );

    } catch (error) {

        console.error(
            "PDF generation error:",
            error
        );

        alert(
            "Could not generate the PDF report. Please try again."
        );
    }
}


// ============================================================
// QUANTUM ANALYSIS
// ============================================================

if (quantumBtn) {

    quantumBtn.addEventListener(
        "click",
        async function () {

            const boxes =
                getSymptomCheckboxes();

            const selectedSymptoms =
                [];

            boxes.forEach(
                function (box) {

                    if (box.checked) {

                        selectedSymptoms.push(
                            box.value
                        );
                    }
                }
            );


            if (
                selectedSymptoms.length === 0
            ) {

                alert(
                    "Please select symptoms first."
                );

                return;
            }


            quantumBtn.disabled =
                true;

            quantumBtn.textContent =
                "Running...";


            if (quantumResult) {

                quantumResult.innerHTML =
                    "Running experimental quantum analysis...";
            }


            try {

                const response =
                    await fetch(
                        "/quantum_predict",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    {
                                        symptoms:
                                            selectedSymptoms
                                    }
                                )
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


                const quantumDisease =
                    data.disease ||
                    data.quantum_disease ||
                    data.prediction ||
                    "Unknown";


                const score =
                    data.experimental_score ??
                    data.quantum_score ??
                    data.score ??
                    "—";


                if (quantumResult) {

                    quantumResult.innerHTML = `

                        <div class="quantum-result-inner">

                            <h3>
                                Qiskit Result
                            </h3>

                            <div class="quantum-metrics">

                                <div class="quantum-metric">

                                    <span>
                                        Disease
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            quantumDisease
                                        )}
                                    </strong>

                                </div>

                                <div class="quantum-metric">

                                    <span>
                                        Experimental Score
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            String(score)
                                        )}
                                    </strong>

                                </div>

                                <div class="quantum-metric">

                                    <span>
                                        Status
                                    </span>

                                    <strong>
                                        Experimental
                                    </strong>

                                </div>

                            </div>

                        </div>
                    `;
                }

            } catch (error) {

                console.error(
                    "Quantum analysis error:",
                    error
                );

                if (quantumResult) {

                    quantumResult.innerHTML = `
                        <div class="error-box">
                            Quantum analysis failed:
                            ${escapeHtml(
                                error.message
                            )}
                        </div>
                    `;
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
// PERFORMANCE
// ============================================================

async function loadPerformance() {

    try {

        const response =
            await fetch(
                "/performance"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();


        const accuracy =
            data.accuracy ??
            data.test_accuracy ??
            data.rf_accuracy;


        const precision =
            data.precision;


        const recall =
            data.recall;


        const f1 =
            data.f1 ??
            data.f1_score;


        if (metricAccuracy) {

            metricAccuracy.textContent =
                formatMetric(
                    accuracy
                );
        }


        if (metricPrecision) {

            metricPrecision.textContent =
                formatMetric(
                    precision
                );
        }


        if (metricRecall) {

            metricRecall.textContent =
                formatMetric(
                    recall
                );
        }


        if (metricF1) {

            metricF1.textContent =
                formatMetric(
                    f1
                );
        }


        if (rfAccuracy) {

            rfAccuracy.textContent =
                formatMetric(
                    accuracy
                );
        }

    } catch (error) {

        console.log(
            "Performance endpoint unavailable:",
            error
        );
    }
}


// ============================================================
// FORMAT METRIC
// ============================================================

function formatMetric(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number =
        Number(value);

    if (isNaN(number)) {
        return String(value);
    }

    if (number <= 1) {

        return (
            number * 100
        ).toFixed(1) + "%";
    }

    return (
        number
    ).toFixed(1) + "%";
}


// ============================================================
// BUTTON EVENTS
// ============================================================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        function () {

            openAuthModal(
                "login"
            );
        }
    );
}


if (signupBtn) {

    signupBtn.addEventListener(
        "click",
        function () {

            openAuthModal(
                "signup"
            );
        }
    );
}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logoutUser
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
        function (event) {

            if (
                event.target ===
                authModal
            ) {

                closeAuthModal();
            }
        }
    );
}


if (emailTab) {

    emailTab.addEventListener(
        "click",
        showEmailAuth
    );
}


if (phoneTab) {

    phoneTab.addEventListener(
        "click",
        showPhoneAuth
    );
}


if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        handleEmailAuthentication
    );
}


if (sendOtpBtn) {

    sendOtpBtn.addEventListener(
        "click",
        sendPhoneOTP
    );
}


if (verifyOtpBtn) {

    verifyOtpBtn.addEventListener(
        "click",
        verifyPhoneOTP
    );
}


if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        saveProfile
    );
}


if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        makePrediction
    );
}


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


if (otpCode) {

    otpCode.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                verifyPhoneOTP();
            }
        }
    );
}


// ============================================================
// NAVIGATION
// ============================================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const pageName =
                        button.dataset.page;

                    if (!pageName) {
                        return;
                    }

                    document
                        .querySelectorAll(
                            ".page"
                        )
                        .forEach(
                            page =>
                                page.classList.remove(
                                    "active-page"
                                )
                        );


                    const target =
                        document.getElementById(
                            pageName
                        );

                    if (target) {

                        target.classList.add(
                            "active-page"
                        );
                    }


                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    if (
                        pageName ===
                        "history"
                    ) {

                        loadPredictionHistory();
                    }


                    if (
                        pageName ===
                        "performance"
                    ) {

                        loadPerformance();
                    }
                }
            );
        }
    );


// ============================================================
// QUICK ACTIONS
// ============================================================

document
    .querySelectorAll(
        "[data-go]"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const pageName =
                        button.dataset.go;

                    const target =
                        document.getElementById(
                            pageName
                        );

                    if (!target) {
                        return;
                    }

                    document
                        .querySelectorAll(
                            ".page"
                        )
                        .forEach(
                            page =>
                                page.classList.remove(
                                    "active-page"
                                )
                        );

                    target.classList.add(
                        "active-page"
                    );


                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item.dataset.page ===
                                        pageName
                                );
                            }
                        );
                }
            );
        }
    );


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// ============================================================
// INITIALIZE
// ============================================================

setupSymptomEvents();

loadPerformance();

console.log(
    "QuantumDiagnose JavaScript loaded successfully."
);

console.log(
    "Firebase initialized successfully."
);
