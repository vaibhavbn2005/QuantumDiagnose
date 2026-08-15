// ============================================================
// QUANTUMDIAGNOSE - COMPLETE SCRIPT
// ============================================================

// ============================================================
// FIREBASE
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
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    query,
    orderBy,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyAPrulUfMubKieGuU5QxQVwSu8sDtKvTZE",

    authDomain:
        "quantumdiagnose.firebaseapp.com",

    projectId:
        "quantumdiagnose",

    storageBucket:
        "quantumdiagnose.firebasestorage.app",

    messagingSenderId:
        "727641186346",

    appId:
        "1:727641186346:web:958942c8d9f6906a69e353",

    measurementId:
        "G-YM0HMMVBFR"
};


// ============================================================
// INITIALIZE
// ============================================================

const appFirebase =
    initializeApp(firebaseConfig);

const auth =
    getAuth(appFirebase);

const db =
    getFirestore(appFirebase);


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;

let currentProfile = null;

let currentResult = null;

let currentPage = "dashboard";

let authMode = "login";

let authMethod = "email";

let confirmationResult = null;

let recaptchaVerifier = null;

let captchaAnswer = null;


// ============================================================
// SHORTCUT
// ============================================================

const $ = (id) =>
    document.getElementById(id);


// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(
    message,
    error = false
) {

    const element =
        $("authMessage");

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        error
            ? "auth-message error"
            : "auth-message success";
}


// ============================================================
// CAPTCHA
// ============================================================

function generateCaptcha() {

    const a =
        Math.floor(
            Math.random() * 9
        ) + 1;

    const b =
        Math.floor(
            Math.random() * 9
        ) + 1;

    captchaAnswer =
        a + b;

    $("captchaQuestion")
        .textContent =
        `${a} + ${b} = ?`;

    $("captchaAnswer")
        .value = "";
}


function verifyCaptcha() {

    const answer =
        Number(
            $("captchaAnswer").value
        );

    return (
        answer ===
        captchaAnswer
    );
}


// ============================================================
// AUTH TABS
// ============================================================

function setAuthMode(mode) {

    authMode = mode;

    $("loginTab")
        .classList.toggle(
            "active",
            mode === "login"
        );

    $("signupTab")
        .classList.toggle(
            "active",
            mode === "signup"
        );

    $("authSubmit")
        .textContent =
        mode === "login"
            ? "Login"
            : "Create Account";

    showAuthMessage("");

    generateCaptcha();
}


// ============================================================
// AUTH METHOD
// ============================================================

function showEmailMethod() {

    authMethod = "email";

    $("emailAuth")
        .classList.remove("hidden");

    $("phoneAuth")
        .classList.add("hidden");

    $("emailTab")
        .classList.add("active");

    $("phoneTab")
        .classList.remove("active");

    showAuthMessage("");

    generateCaptcha();
}


function showPhoneMethod() {

    authMethod = "phone";

    $("emailAuth")
        .classList.add("hidden");

    $("phoneAuth")
        .classList.remove("hidden");

    $("emailTab")
        .classList.remove("active");

    $("phoneTab")
        .classList.add("active");

    showAuthMessage("");

    initializePhoneRecaptcha();
}


// ============================================================
// EMAIL AUTHENTICATION
// ============================================================

async function handleEmailAuth() {

    const email =
        $("authEmail")
            .value
            .trim();

    const password =
        $("authPassword")
            .value;


    if (!email) {

        showAuthMessage(
            "Please enter your email.",
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


    if (!verifyCaptcha()) {

        showAuthMessage(
            "Incorrect CAPTCHA answer.",
            true
        );

        generateCaptcha();

        return;
    }


    const button =
        $("authSubmit");

    button.disabled = true;

    button.textContent =
        "Please wait...";


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

    } catch (error) {

        console.error(error);

        let message =
            "Authentication failed.";

        switch (error.code) {

            case "auth/invalid-email":
                message =
                    "Please enter a valid email.";
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

            default:
                message =
                    error.message;
        }

        showAuthMessage(
            message,
            true
        );

        generateCaptcha();

    } finally {

        button.disabled = false;

        button.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";
    }
}


// ============================================================
// PHONE RECAPTCHA
// ============================================================

function initializePhoneRecaptcha() {

    if (recaptchaVerifier) {
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

                        showAuthMessage(
                            "reCAPTCHA verified."
                        );

                    },

                    "expired-callback":
                        function () {

                            showAuthMessage(
                                "reCAPTCHA expired.",
                                true
                            );
                        }
                }
            );


        recaptchaVerifier.render();

    } catch (error) {

        console.error(
            "reCAPTCHA error:",
            error
        );

    }
}


// ============================================================
// PHONE OTP
// ============================================================

async function sendOTP() {

    const phone =
        $("phoneNumber")
            .value
            .trim();


    if (!phone) {

        showAuthMessage(
            "Enter your phone number.",
            true
        );

        return;
    }


    if (!phone.startsWith("+")) {

        showAuthMessage(
            "Use country code, for example +91XXXXXXXXXX.",
            true
        );

        return;
    }


    if (!recaptchaVerifier) {

        initializePhoneRecaptcha();

        showAuthMessage(
            "Complete the reCAPTCHA and click Send OTP again.",
            true
        );

        return;
    }


    try {

        confirmationResult =
            await signInWithPhoneNumber(
                auth,
                phone,
                recaptchaVerifier
            );

        showAuthMessage(
            "OTP sent successfully."
        );

    } catch (error) {

        console.error(error);

        showAuthMessage(
            error.message,
            true
        );
    }
}


// ============================================================
// VERIFY OTP
// ============================================================

async function verifyOTP() {

    const code =
        $("otpCode")
            .value
            .trim();


    if (!confirmationResult) {

        showAuthMessage(
            "Send OTP first.",
            true
        );

        return;
    }


    if (code.length !== 6) {

        showAuthMessage(
            "Enter the 6-digit OTP.",
            true
        );

        return;
    }


    try {

        await confirmationResult.confirm(
            code
        );

        showAuthMessage(
            "Phone authentication successful!"
        );

    } catch (error) {

        console.error(error);

        showAuthMessage(
            error.message,
            true
        );
    }
}


// ============================================================
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            currentUser =
                user;

            $("authScreen")
                .classList
                .add("hidden");

            $("app")
                .classList
                .remove("hidden");

            $("userEmail")
                .textContent =
                user.email ||
                user.phoneNumber ||
                "User";

            await initializeUser();

        } else {

            currentUser = null;

            currentProfile = null;

            $("authScreen")
                .classList
                .remove("hidden");

            $("app")
                .classList
                .add("hidden");
        }
    }
);


// ============================================================
// USER INITIALIZATION
// ============================================================

async function initializeUser() {

    const profile =
        await loadProfile();

    await loadHistory();

    await loadDoctors();

    await loadPerformance();


    if (profile) {

        currentProfile =
            profile;

        fillProfileForm(
            profile
        );

        updateWelcome(
            profile.name
        );

        showPage(
            "dashboard"
        );

    } else {

        currentProfile =
            null;

        showPage(
            "profile"
        );

        $("profileMessage")
            .textContent =
            "Please complete your Patient Profile before starting a prediction.";
    }
}


// ============================================================
// PROFILE
// ============================================================

async function loadProfile() {

    if (!currentUser) {
        return null;
    }


    try {

        const reference =
            doc(
                db,
                "users",
                currentUser.uid
            );

        const snapshot =
            await getDoc(
                reference
            );


        if (
            snapshot.exists()
        ) {

            return snapshot.data();

        }

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showProfileMessage(
            "Could not load profile. Check Firestore rules.",
            true
        );
    }


    return null;
}


// ============================================================
// SAVE PROFILE
// ============================================================

async function saveProfile() {

    if (!currentUser) {
        return;
    }


    const name =
        $("profileName")
            .value
            .trim();

    const gender =
        $("profileGender")
            .value;

    const age =
        Number(
            $("profileAge")
                .value
        );

    const height =
        Number(
            $("profileHeight")
                .value
        );

    const weight =
        Number(
            $("profileWeight")
                .value
        );


    if (
        !name ||
        !gender ||
        !age ||
        !height ||
        !weight
    ) {

        showProfileMessage(
            "Please complete all required fields.",
            true
        );

        return;
    }


    if (
        age < 1 ||
        age > 120
    ) {

        showProfileMessage(
            "Please enter a valid age.",
            true
        );

        return;
    }


    const profile = {

        name,

        gender,

        age,

        height,

        weight,

        email:
            currentUser.email || "",

        phone:
            currentUser.phoneNumber || "",

        updatedAt:
            serverTimestamp()
    };


    const button =
        $("saveProfileBtn");

    button.disabled = true;

    button.textContent =
        "Saving...";


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


        currentProfile = {
            ...profile,
            updatedAt: null
        };


        fillProfileForm(
            currentProfile
        );

        updateWelcome(
            name
        );


        showProfileMessage(
            "Profile saved successfully."
        );


        setTimeout(
            () => {

                showPage(
                    "dashboard"
                );

            },
            800
        );


    } catch (error) {

        console.error(
            "Profile save error:",
            error
        );

        showProfileMessage(
            "Profile could not be saved. Check Firestore rules.",
            true
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Save Profile";
    }
}


// ============================================================
// PROFILE FORM
// ============================================================

function fillProfileForm(
    profile
) {

    if (!profile) {
        return;
    }

    $("profileName")
        .value =
        profile.name || "";

    $("profileGender")
        .value =
        profile.gender || "";

    $("profileAge")
        .value =
        profile.age || "";

    $("profileHeight")
        .value =
        profile.height || "";

    $("profileWeight")
        .value =
        profile.weight || "";


    $("profileStatusBadge")
        .textContent =
        "✓ Profile completed";

    $("profileStatusBadge")
        .classList
        .add("completed");
}


// ============================================================
// PROFILE MESSAGE
// ============================================================

function showProfileMessage(
    message,
    error = false
) {

    const element =
        $("profileMessage");

    element.textContent =
        message;

    element.className =
        error
            ? "status-message error"
            : "status-message success";
}


// ============================================================
// WELCOME
// ============================================================

function updateWelcome(
    name
) {

    $("welcomeName")
        .textContent =
        name || "Patient";

    $("topUserName")
        .textContent =
        name || "Patient";

    $("welcomeText")
        .textContent =
        "Your patient profile is saved. You can now start a new symptom analysis.";
}


// ============================================================
// NAVIGATION
// ============================================================

const pageTitles = {

    dashboard:
        "Dashboard",

    profile:
        "Patient Profile",

    prediction:
        "New Prediction",

    history:
        "Prediction History",

    doctors:
        "Doctor Recommendations",

    comparison:
        "Model Comparison",

    performance:
        "Performance"
};


function showPage(
    page
) {

    // Patient profile is mandatory

    if (
        page === "prediction" &&
        !currentProfile
    ) {

        showProfileMessage(
            "Complete your Patient Profile first.",
            true
        );

        page = "profile";
    }


    currentPage =
        page;


    document
        .querySelectorAll(".page")
        .forEach(
            element => {

                element.classList
                    .remove(
                        "active-page"
                    );
            }
        );


    const selectedPage =
        $(page);

    if (selectedPage) {

        selectedPage.classList
            .add(
                "active-page"
            );
    }


    document
        .querySelectorAll(".nav-item")
        .forEach(
            button => {

                button.classList
                    .toggle(
                        "active",
                        button.dataset.page === page
                    );
            }
        );


    $("pageTitle")
        .textContent =
        pageTitles[page] ||
        "Dashboard";
}


// ============================================================
// NAVIGATION EVENTS
// ============================================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );

                }
            );
        }
    );


document
    .querySelectorAll(
        "[data-go]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.go
                    );

                }
            );
        }
    );


// ============================================================
// SYMPTOMS
// ============================================================

function getSymptomBoxes() {

    return document.querySelectorAll(
        '#symptomGrid input[type="checkbox"]'
    );
}


function updateCount() {

    const boxes =
        getSymptomBoxes();

    let selected = 0;

    boxes.forEach(
        box => {

            if (box.checked) {
                selected++;
            }

        }
    );


    $("count")
        .textContent =
        selected;
}


getSymptomBoxes()
    .forEach(
        box => {

            box.addEventListener(
                "change",
                updateCount
            );

        }
    );


// ============================================================
// SEARCH
// ============================================================

$("search")
    .addEventListener(
        "input",
        event => {

            const text =
                event.target
                    .value
                    .toLowerCase()
                    .trim();


            document
                .querySelectorAll(
                    ".symptom"
                )
                .forEach(
                    symptom => {

                        const name =
                            symptom.dataset.name
                                .toLowerCase();


                        symptom.style.display =
                            name.includes(text)
                                ? ""
                                : "none";
                    }
                );
        }
    );


// ============================================================
// CLEAR
// ============================================================

$("clearBtn")
    .addEventListener(
        "click",
        () => {

            getSymptomBoxes()
                .forEach(
                    box => {

                        box.checked =
                            false;

                    }
                );


            $("search")
                .value = "";


            document
                .querySelectorAll(
                    ".symptom"
                )
                .forEach(
                    symptom => {

                        symptom.style.display =
                            "";

                    }
                );


            updateCount();

            $("result")
                .classList
                .add("hidden");
        }
    );


// ============================================================
// PREDICTION
// ============================================================

async function analyzeSymptoms() {

    if (!currentProfile) {

        showPage(
            "profile"
        );

        showProfileMessage(
            "Patient Profile is mandatory before prediction.",
            true
        );

        return;
    }


    const selectedSymptoms = [];


    getSymptomBoxes()
        .forEach(
            box => {

                if (box.checked) {

                    selectedSymptoms
                        .push(
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


    const button =
        $("predictBtn");

    button.disabled = true;

    button.textContent =
        "Analyzing Random Forest + Qiskit...";


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
                                selectedSymptoms
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Prediction failed."
            );
        }


        currentResult =
            data;


        renderResult(
            data
        );


        showPage(
            "prediction"
        );


        $("result")
            .classList
            .remove("hidden");


        $("result")
            .scrollIntoView({
                behavior:
                    "smooth"
            });


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        alert(
            error.message
        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            "🔍 Analyze Symptoms";
    }
}


// ============================================================
// RENDER RESULT
// ============================================================

function renderResult(
    data
) {

    const rfScore =
        Number(
            data.rf_confidence || 0
        );

    const qScore =
        Number(
            data.qiskit_score || 0
        );


    $("disease")
        .textContent =
        data.rf_disease ||
        data.disease ||
        "—";


    $("qiskitDisease")
        .textContent =
        data.qiskit_disease ||
        data.disease ||
        "—";


    $("confidenceText")
        .textContent =
        rfScore.toFixed(2) +
        "%";


    $("confidenceBar")
        .style.width =
        Math.min(
            Math.max(
                rfScore,
                0
            ),
            100
        ) + "%";


    $("qiskitScore")
        .textContent =
        qScore.toFixed(2) +
        "%";


    $("qiskitScoreBar")
        .style.width =
        Math.min(
            Math.max(
                qScore,
                0
            ),
            100
        ) + "%";


    $("qiskitQubits")
        .textContent =
        data.qiskit_qubits ??
        "—";


    $("qiskitDepth")
        .textContent =
        data.qiskit_depth ??
        "—";


    $("quantumMessage")
        .textContent =
        data.quantum_message ||
        "Experimental Qiskit score.";


    $("comparisonRF")
        .textContent =
        rfScore.toFixed(2) +
        "%";


    $("comparisonQuantum")
        .textContent =
        qScore.toFixed(2) +
        "%";


    $("scoreDifference")
        .textContent =
        Number(
            data.score_difference || 0
        ).toFixed(2) +
        "%";


    $("comparisonDisease")
        .textContent =
        data.disease ||
        "—";


    $("agreementBadge")
        .textContent =
        data.model_agreement ||
        "—";


    renderAgreement(
        data.model_agreement
    );


    renderTopPredictions(
        data.top_predictions
    );


    renderDoctors(
        data.doctors || [],
        data.specialty
    );


    // Comparison page

    $("pageRFDisease")
        .textContent =
        data.rf_disease ||
        data.disease ||
        "—";


    $("pageRFScore")
        .textContent =
        rfScore.toFixed(2) +
        "%";


    $("pageQuantumDisease")
        .textContent =
        data.qiskit_disease ||
        data.disease ||
        "—";


    $("pageQuantumScore")
        .textContent =
        qScore.toFixed(2) +
        "%";


    $("pageAgreement")
        .textContent =
        `${data.model_agreement} agreement • ` +
        `${Number(data.score_difference || 0).toFixed(2)}% score difference`;


    $("dashboardLatest")
        .innerHTML = `
            <strong>
                ${escapeHTML(
                    data.disease || "—"
                )}
            </strong>

            <br>

            Random Forest:
            ${rfScore.toFixed(2)}%

            <br>

            Qiskit:
            ${qScore.toFixed(2)}%
        `;
}


// ============================================================
// AGREEMENT
// ============================================================

function renderAgreement(
    agreement
) {

    const badge =
        $("agreementBadge");

    badge.className =
        "agreement-badge";


    if (
        agreement === "High"
    ) {

        badge.classList
            .add("high");

    } else if (
        agreement === "Moderate"
    ) {

        badge.classList
            .add("moderate");

    } else {

        badge.classList
            .add("low");
    }
}


// ============================================================
// TOP PREDICTIONS
// ============================================================

function renderTopPredictions(
    predictions
) {

    const container =
        $("topPredictions");

    if (
        !Array.isArray(
            predictions
        ) ||
        predictions.length === 0
    ) {

        container.innerHTML =
            "<p>No predictions available.</p>";

        return;
    }


    container.innerHTML =
        predictions
            .map(
                prediction => `

                    <div class="prediction-row">

                        <span>
                            ${escapeHTML(
                                prediction.disease
                            )}
                        </span>

                        <strong>
                            ${Number(
                                prediction.confidence
                            ).toFixed(2)}%
                        </strong>

                    </div>

                `
            )
            .join("");
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
                    ""
                )}
            </span>

            <p>
                ${escapeHTML(
                    doctor.hospital ||
                    ""
                )}
            </p>

            <p>
                📍
                ${escapeHTML(
                    doctor.location ||
                    ""
                )}
            </p>

            <p>
                Experience:
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

    $("specialistBox")
        .innerHTML = `

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


    $("recommendedDoctors")
        .innerHTML =
        doctors
            .slice(0, 3)
            .map(
                doctorCard
            )
            .join("");


    if (
        doctors.length === 0
    ) {

        $("recommendedDoctors")
            .innerHTML = `
                <div class="empty-state">
                    No matching dummy doctor found.
                </div>
            `;
    }
}


async function loadDoctors() {

    try {

        const response =
            await fetch(
                "/doctors"
            );

        const data =
            await response.json();


        $("doctorList")
            .innerHTML =
            (data.doctors || [])
                .map(
                    doctorCard
                )
                .join("");

    } catch (error) {

        console.error(
            error
        );

        $("doctorList")
            .innerHTML =
            "<p>Unable to load doctors.</p>";
    }
}


// ============================================================
// SAVE HISTORY
// ============================================================

async function saveCurrentHistory() {

    if (
        !currentUser ||
        !currentProfile ||
        !currentResult
    ) {

        return;
    }


    const button =
        $("saveHistoryBtn");

    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        await addDoc(
            collection(
                db,
                "users",
                currentUser.uid,
                "history"
            ),
            {

                disease:
                    currentResult.disease,

                rfDisease:
                    currentResult.rf_disease,

                rfConfidence:
                    currentResult.rf_confidence,

                qiskitDisease:
                    currentResult.qiskit_disease,

                qiskitScore:
                    currentResult.qiskit_score,

                scoreDifference:
                    currentResult.score_difference,

                modelAgreement:
                    currentResult.model_agreement,

                specialty:
                    currentResult.specialty,

                symptoms:
                    currentResult.selected_symptoms,

                patientName:
                    currentProfile.name,

                createdAt:
                    serverTimestamp()
            }
        );


        $("saveHistoryMessage")
            .textContent =
            "✓ Saved to Prediction History";


        await loadHistory();


    } catch (error) {

        console.error(
            "History save error:",
            error
        );

        $("saveHistoryMessage")
            .textContent =
            "Could not save history. Check Firestore rules.";

    } finally {

        button.disabled = false;

        button.textContent =
            "💾 Save to History";
    }
}


// ============================================================
// LOAD HISTORY
// ============================================================

let historyData = [];


async function loadHistory() {

    if (!currentUser) {
        return;
    }


    try {

        const historyReference =
            collection(
                db,
                "users",
                currentUser.uid,
                "history"
            );


        const historyQuery =
            query(
                historyReference,
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                historyQuery
            );


        historyData = [];


        snapshot.forEach(
            item => {

                historyData.push({
                    id:
                        item.id,

                    ...item.data()
                });

            }
        );


        renderHistory();

        updateDashboardStats();


    } catch (error) {

        console.error(
            "History loading error:",
            error
        );

        $("historyList")
            .innerHTML = `
                <div class="empty-state">
                    Unable to load history.
                    Check Firestore rules.
                </div>
            `;
    }
}


// ============================================================
// RENDER HISTORY
// ============================================================

function renderHistory() {

    const container =
        $("historyList");


    if (
        historyData.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                No predictions saved yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        historyData
            .map(
                item => `

                    <div class="history-card">

                        <div>

                            <span class="eyebrow">
                                PREDICTION
                            </span>

                            <h3>
                                ${escapeHTML(
                                    item.disease ||
                                    "Unknown"
                                )}
                            </h3>

                            <p>
                                Specialty:
                                ${escapeHTML(
                                    item.specialty ||
                                    "General Physician"
                                )}
                            </p>

                        </div>


                        <div class="history-scores">

                            <span>
                                🌲 RF:
                                ${Number(
                                    item.rfConfidence || 0
                                ).toFixed(2)}%
                            </span>

                            <span>
                                ⚛️ Qiskit:
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

                `
            )
            .join("");
}


// ============================================================
// DASHBOARD STATS
// ============================================================

function updateDashboardStats() {

    $("predictionCount")
        .textContent =
        historyData.length;


    if (
        historyData.length > 0
    ) {

        $("latestDisease")
            .textContent =
            historyData[0].disease ||
            "—";

    } else {

        $("latestDisease")
            .textContent =
            "—";
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


        $("perfAccuracy")
            .textContent =
            `${data.accuracy}%`;

        $("perfPrecision")
            .textContent =
            `${data.precision}%`;

        $("perfRecall")
            .textContent =
            `${data.recall}%`;

        $("perfF1")
            .textContent =
            `${data.f1}%`;


        $("trainingSamples")
            .textContent =
            data.training_samples;

        $("testingSamples")
            .textContent =
            data.testing_samples;

        $("symptomTotal")
            .textContent =
            data.number_of_symptoms;

        $("diseaseTotal")
            .textContent =
            data.number_of_diseases;


    } catch (error) {

        console.error(
            "Performance error:",
            error
        );
    }
}


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(
            auth
        );

        currentUser =
            null;

        currentProfile =
            null;

        currentResult =
            null;

    } catch (error) {

        console.error(
            error
        );

        alert(
            "Logout failed."
        );
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

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

$("loginTab")
    .addEventListener(
        "click",
        () => {

            setAuthMode(
                "login"
            );

        }
    );


$("signupTab")
    .addEventListener(
        "click",
        () => {

            setAuthMode(
                "signup"
            );

        }
    );


$("emailTab")
    .addEventListener(
        "click",
        showEmailMethod
    );


$("phoneTab")
    .addEventListener(
        "click",
        showPhoneMethod
    );


$("refreshCaptcha")
    .addEventListener(
        "click",
        generateCaptcha
    );


$("authSubmit")
    .addEventListener(
        "click",
        handleEmailAuth
    );


$("sendOtpBtn")
    .addEventListener(
        "click",
        sendOTP
    );


$("verifyOtpBtn")
    .addEventListener(
        "click",
        verifyOTP
    );


$("logoutBtn")
    .addEventListener(
        "click",
        logoutUser
    );


$("saveProfileBtn")
    .addEventListener(
        "click",
        saveProfile
    );


$("predictBtn")
    .addEventListener(
        "click",
        analyzeSymptoms
    );


$("saveHistoryBtn")
    .addEventListener(
        "click",
        saveCurrentHistory
    );


$("authPassword")
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                handleEmailAuth();
            }
        }
    );


// ============================================================
// INITIALIZE
// ============================================================

generateCaptcha();

updateCount();

console.log(
    "QuantumDiagnose loaded successfully."
);
