/* =========================================================
   QUANTUMDIAGNOSE - UPDATED SCRIPT.JS
   =========================================================
   Features:
   - Firebase Email/Password Login
   - Patient Profile mandatory before prediction
   - Saved profile per user
   - Welcome back, Name
   - Random Forest prediction
   - Qiskit experimental analysis
   - Model comparison
   - Doctor recommendation
   - Prediction history
   - Date & time for every prediction
   - Download / Save PDF report
   - Phone removed
   - No toggle
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


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


const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let authMode = "login";

let currentUser = null;

let latestPrediction = null;

let predictionHistory = [];


/* =========================================================
   DOM HELPER
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   AUTH ELEMENTS
   ========================================================= */

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

const authScreen =
    $("authScreen");

const app =
    $("app");


/* =========================================================
   AUTH MODE
   ========================================================= */

function setAuthMode(mode) {

    authMode = mode;

    if (mode === "login") {

        loginTab?.classList.add("active");
        signupTab?.classList.remove("active");

        if (authSubmit) {
            authSubmit.textContent = "Login";
        }

        if (authPassword) {
            authPassword.autocomplete =
                "current-password";
        }

    } else {

        signupTab?.classList.add("active");
        loginTab?.classList.remove("active");

        if (authSubmit) {
            authSubmit.textContent =
                "Create Account";
        }

        if (authPassword) {
            authPassword.autocomplete =
                "new-password";
        }
    }

    if (authMessage) {
        authMessage.textContent = "";
    }
}


loginTab?.addEventListener(
    "click",
    () => setAuthMode("login")
);


signupTab?.addEventListener(
    "click",
    () => setAuthMode("signup")
);


/* =========================================================
   AUTH MESSAGE
   ========================================================= */

function showAuthMessage(
    message,
    success = false
) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        message;

    authMessage.style.color =
        success
            ? "#16a34a"
            : "#dc2626";
}


/* =========================================================
   AUTH SUBMIT
   ========================================================= */

authSubmit?.addEventListener(
    "click",
    async () => {

        const email =
            authEmail?.value.trim();

        const password =
            authPassword?.value || "";

        if (!email || !password) {

            showAuthMessage(
                "Please enter email and password."
            );

            return;
        }

        if (password.length < 6) {

            showAuthMessage(
                "Password must contain at least 6 characters."
            );

            return;
        }

        authSubmit.disabled = true;

        authSubmit.textContent =
            authMode === "login"
                ? "Logging in..."
                : "Creating account...";


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

            showAuthMessage(
                "Success!",
                true
            );

        } catch (error) {

            console.error(
                "Firebase authentication error:",
                error
            );

            let message =
                "Authentication failed.";

            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                message =
                    "Invalid email or password.";

            } else if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                message =
                    "This email is already registered.";

            } else if (
                error.code ===
                "auth/invalid-email"
            ) {

                message =
                    "Please enter a valid email.";

            } else if (
                error.code ===
                "auth/weak-password"
            ) {

                message =
                    "Password is too weak.";

            } else if (
                error.code ===
                "auth/network-request-failed"
            ) {

                message =
                    "Network error. Please try again.";

            } else if (error.message) {

                message =
                    error.message;
            }

            showAuthMessage(message);

        } finally {

            authSubmit.disabled = false;

            authSubmit.textContent =
                authMode === "login"
                    ? "Login"
                    : "Create Account";
        }
    }
);


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
    auth,
    user => {

        currentUser = user;

        if (user) {

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

            loadProfile();

            loadHistory();

            loadDoctors();

            loadPerformance();

        } else {

            authScreen?.classList.remove(
                "hidden"
            );

            app?.classList.add(
                "hidden"
            );

            if ($("userEmail")) {
                $("userEmail").textContent =
                    "—";
            }
        }
    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

$("logoutBtn")?.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            latestPrediction = null;
            predictionHistory = [];

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );
        }
    }
);


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

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
        "Recommended Doctors",

    quantum:
        "Quantum Analysis",

    comparison:
        "Random Forest vs Qiskit",

    performance:
        "Performance"
};


function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );
        });


    const target =
        $(pageId);

    if (!target) {
        return;
    }


    target.classList.add(
        "active-page"
    );


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page ===
                pageId
            );
        });


    if ($("pageTitle")) {

        $("pageTitle").textContent =
            pageTitles[pageId] ||
            "QuantumDiagnose";
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    /*
     * Prediction cannot be used without
     * a saved patient profile.
     */
    if (
        pageId === "prediction" &&
        !hasPatientProfile()
    ) {

        alert(
            "Please complete and save your Patient Profile before making a prediction."
        );

        showPage("profile");
    }
}


/* Sidebar */

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage(
                    button.dataset.page
                );
            }
        );
    });


/* Quick action buttons */

document
    .querySelectorAll("[data-go]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage(
                    button.dataset.go
                );
            }
        );
    });


/* =========================================================
   PATIENT PROFILE
   ========================================================= */

function profileKey() {

    if (!currentUser) {
        return null;
    }

    return (
        "quantumdiagnose_profile_" +
        currentUser.uid
    );
}


function getPatientProfile() {

    const key =
        profileKey();

    if (!key) {
        return null;
    }

    const saved =
        localStorage.getItem(key);

    if (!saved) {
        return null;
    }

    try {

        return JSON.parse(saved);

    } catch {

        return null;
    }
}


function hasPatientProfile() {

    const data =
        getPatientProfile();

    if (!data) {
        return false;
    }

    return Boolean(
        data.name &&
        data.gender &&
        data.age &&
        data.height &&
        data.weight
    );
}


/* Save profile */

function saveProfile() {

    const data = {

        name:
            $("profileName")?.value.trim(),

        gender:
            $("profileGender")?.value,

        age:
            $("profileAge")?.value,

        height:
            $("profileHeight")?.value,

        weight:
            $("profileWeight")?.value
    };


    if (
        !data.name ||
        !data.gender ||
        !data.age ||
        !data.height ||
        !data.weight
    ) {

        if ($("profileMessage")) {

            $("profileMessage").textContent =
                "Please complete all profile fields.";

            $("profileMessage").style.color =
                "#dc2626";
        }

        return;
    }


    const key =
        profileKey();

    if (!key) {
        return;
    }


    localStorage.setItem(
        key,
        JSON.stringify(data)
    );


    if ($("profileMessage")) {

        $("profileMessage").textContent =
            "Profile saved successfully.";

        $("profileMessage").style.color =
            "#16a34a";
    }


    updateWelcomeName(
        data.name
    );
}


function loadProfile() {

    const data =
        getPatientProfile();

    if (!data) {

        updateWelcomeName(
            "Patient"
        );

        return;
    }


    if ($("profileName")) {
        $("profileName").value =
            data.name || "";
    }

    if ($("profileGender")) {
        $("profileGender").value =
            data.gender || "";
    }

    if ($("profileAge")) {
        $("profileAge").value =
            data.age || "";
    }

    if ($("profileHeight")) {
        $("profileHeight").value =
            data.height || "";
    }

    if ($("profileWeight")) {
        $("profileWeight").value =
            data.weight || "";
    }


    updateWelcomeName(
        data.name
    );
}


function updateWelcomeName(name) {

    if (!$("welcomeName")) {
        return;
    }

    $("welcomeName").textContent =
        name &&
        name.trim()
            ? name.trim()
            : "Patient";
}


$("saveProfileBtn")?.addEventListener(
    "click",
    saveProfile
);


/* =========================================================
   SYMPTOMS
   ========================================================= */

function symptomCheckboxes() {

    return document.querySelectorAll(
        "#symptomGrid input[type='checkbox']"
    );
}


function getSelectedSymptoms() {

    return Array
        .from(
            symptomCheckboxes()
        )
        .filter(
            checkbox =>
                checkbox.checked
        )
        .map(
            checkbox =>
                checkbox.value
        );
}


function updateCount() {

    const selected =
        getSelectedSymptoms();

    if ($("count")) {

        $("count").textContent =
            selected.length;
    }
}


document
    .querySelectorAll(
        "#symptomGrid input[type='checkbox']"
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                updateCount
            );
        }
    );


/* =========================================================
   SEARCH SYMPTOMS
   ========================================================= */

$("search")?.addEventListener(
    "input",
    event => {

        const search =
            event.target.value
                .trim()
                .toLowerCase();


        document
            .querySelectorAll(
                ".symptom"
            )
            .forEach(item => {

                const name =
                    (
                        item.dataset.name ||
                        ""
                    ).toLowerCase();


                item.style.display =
                    name.includes(search)
                        ? "flex"
                        : "none";
            });
    }
);


/* =========================================================
   CLEAR SYMPTOMS
   ========================================================= */

$("clearBtn")?.addEventListener(
    "click",
    () => {

        symptomCheckboxes()
            .forEach(
                checkbox => {

                    checkbox.checked =
                        false;
                }
            );


        if ($("search")) {
            $("search").value = "";
        }


        document
            .querySelectorAll(
                ".symptom"
            )
            .forEach(item => {

                item.style.display =
                    "flex";
            });


        updateCount();


        $("result")?.classList.add(
            "hidden"
        );
    }
);


/* =========================================================
   API HELPER
   ========================================================= */

async function apiFetch(
    url,
    options = {}
) {

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


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = null;
    }


    if (!response.ok) {

        throw new Error(
            data?.error ||
            `Request failed: ${response.status}`
        );
    }


    return data;
}


/* =========================================================
   RESULT RESET
   ========================================================= */

function resetResult() {

    if ($("disease")) {
        $("disease").textContent =
            "Analyzing...";
    }

    if ($("confidenceText")) {
        $("confidenceText").textContent =
            "0%";
    }

    if ($("confidenceBar")) {
        $("confidenceBar").style.width =
            "0%";
    }

    if ($("topPredictions")) {
        $("topPredictions").innerHTML =
            "";
    }

    if ($("quantumScore")) {
        $("quantumScore").textContent =
            "Analyzing...";
    }

    if ($("quantumScoreText")) {
        $("quantumScoreText").textContent =
            "0%";
    }

    if ($("quantumScoreBar")) {
        $("quantumScoreBar").style.width =
            "0%";
    }

    if ($("quantumQubits")) {
        $("quantumQubits").textContent =
            "—";
    }

    if ($("quantumDepth")) {
        $("quantumDepth").textContent =
            "—";
    }

    if ($("quantumInterpretation")) {
        $("quantumInterpretation").textContent =
            "Running Qiskit quantum analysis...";
    }

    if ($("specialistBox")) {
        $("specialistBox").innerHTML =
            "";
    }

    if ($("recommendedDoctors")) {
        $("recommendedDoctors").innerHTML =
            "";
    }

    if ($("message")) {
        $("message").textContent =
            "";
    }

    if ($("predictionDateTime")) {
        $("predictionDateTime").textContent =
            "";
    }
}


/* =========================================================
   ANALYZE SYMPTOMS
   ========================================================= */

$("predictBtn")?.addEventListener(
    "click",
    analyzeSymptoms
);


async function analyzeSymptoms() {

    /* PROFILE CHECK */

    if (!hasPatientProfile()) {

        alert(
            "Patient Profile is mandatory. Please complete and save your profile first."
        );

        showPage("profile");

        return;
    }


    const symptoms =
        getSelectedSymptoms();


    if (symptoms.length === 0) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }


    const button =
        $("predictBtn");


    if (button) {

        button.disabled = true;

        button.textContent =
            "Analyzing Random Forest + Qiskit...";
    }


    $("result")?.classList.remove(
        "hidden"
    );


    resetResult();


    try {

        const [
            rfResult,
            quantumResult
        ] =
            await Promise.allSettled([

                apiFetch(
                    "/predict",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                symptoms:
                                    symptoms
                            })
                    }
                ),

                apiFetch(
                    "/quantum",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                symptoms:
                                    symptoms
                            })
                    }
                )
            ]);


        /* RANDOM FOREST */

        if (
            rfResult.status ===
            "fulfilled"
        ) {

            renderRandomForest(
                rfResult.value
            );

        } else {

            console.error(
                "Random Forest error:",
                rfResult.reason
            );

            showRFError(
                rfResult.reason
            );
        }


        /* QISKIT */

        if (
            quantumResult.status ===
            "fulfilled"
        ) {

            renderQuantum(
                quantumResult.value
            );

        } else {

            console.error(
                "Qiskit error:",
                quantumResult.reason
            );

            showQuantumError(
                quantumResult.reason
            );
        }


        /* SAVE RESULT */

        if (
            rfResult.status ===
            "fulfilled"
        ) {

            const rf =
                rfResult.value;

            const quantum =
                quantumResult.status ===
                "fulfilled"
                    ? quantumResult.value
                    : null;


            const now =
                new Date();


            latestPrediction = {

                disease:
                    rf.disease,

                confidence:
                    rf.confidence,

                topPredictions:
                    rf.top_predictions ||
                    [],

                symptoms:
                    symptoms,

                quantumScore:
                    quantum
                        ? quantum.quantum_score
                        : null,

                quantumQubits:
                    quantum
                        ? quantum.qubits
                        : null,

                quantumDepth:
                    quantum
                        ? quantum.circuit_depth
                        : null,

                specialty:
                    rf.specialty ||
                    rf.recommended_specialty ||
                    "",

                doctors:
                    rf.doctors ||
                    rf.recommended_doctors ||
                    [],

                date:
                    now.toLocaleString(
                        "en-IN",
                        {
                            dateStyle:
                                "medium",
                            timeStyle:
                                "medium"
                        }
                    ),

                timestamp:
                    now.toISOString()
            };


            saveHistoryItem(
                latestPrediction
            );


            updateDashboard(
                latestPrediction
            );


            updateComparison(
                latestPrediction
            );


            addReportButton();


            if ($("predictionDateTime")) {

                $("predictionDateTime")
                    .textContent =
                    "Prediction Date & Time: " +
                    latestPrediction.date;
            }
        }


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        alert(
            "Unable to complete prediction. Please try again."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Analyze Symptoms";
        }
    }
}


/* =========================================================
   RANDOM FOREST RESULT
   ========================================================= */

function renderRandomForest(data) {

    if ($("disease")) {

        $("disease").textContent =
            formatDisease(
                data.disease
            );
    }


    const confidence =
        Number(
            data.confidence || 0
        );


    if ($("confidenceText")) {

        $("confidenceText").textContent =
            confidence.toFixed(2) +
            "%";
    }


    if ($("confidenceBar")) {

        $("confidenceBar").style.width =
            Math.min(
                Math.max(
                    confidence,
                    0
                ),
                100
            ) +
            "%";
    }


    const predictions =
        Array.isArray(
            data.top_predictions
        )
            ? data.top_predictions
            : [];


    if ($("topPredictions")) {

        $("topPredictions").innerHTML =
            predictions
                .map(
                    (item, index) => {

                        const score =
                            Number(
                                item.confidence ||
                                0
                            );


                        return `
                            <div class="prediction-row">
                                <span class="prediction-rank">
                                    ${index + 1}
                                </span>

                                <span class="prediction-name">
                                    ${escapeHTML(
                                        formatDisease(
                                            item.disease
                                        )
                                    )}
                                </span>

                                <span class="prediction-score">
                                    ${score.toFixed(2)}%
                                </span>
                            </div>
                        `;
                    }
                )
                .join("");
    }


    if ($("message")) {

        $("message").textContent =
            data.message ||
            "Random Forest analysis completed.";
    }


    renderDoctors(
        data.doctors ||
        data.recommended_doctors ||
        [],
        data.specialty ||
        data.recommended_specialty ||
        ""
    );
}


/* =========================================================
   QISKIT RESULT
   ========================================================= */

function renderQuantum(data) {

    const score =
        Number(
            data.quantum_score || 0
        );


    if ($("quantumScore")) {

        $("quantumScore").textContent =
            score.toFixed(2) +
            "%";
    }


    if ($("quantumScoreText")) {

        $("quantumScoreText").textContent =
            score.toFixed(2) +
            "%";
    }


    if ($("quantumScoreBar")) {

        $("quantumScoreBar").style.width =
            Math.min(
                Math.max(score, 0),
                100
            ) +
            "%";
    }


    if ($("quantumQubits")) {

        $("quantumQubits").textContent =
            data.qubits ??
            "—";
    }


    if ($("quantumDepth")) {

        $("quantumDepth").textContent =
            data.circuit_depth ??
            "—";
    }


    if ($("quantumInterpretation")) {

        $("quantumInterpretation").textContent =
            data.interpretation ||
            "Experimental Qiskit analysis completed.";
    }


    /*
     * Fallback for your current HTML
     * where quantumResult is used as
     * the main Qiskit output container.
     */

    if (
        $("quantumResult") &&
        !$("quantumScore")
    ) {

        $("quantumResult").innerHTML = `

            <div class="quantum-summary">

                <strong>
                    Qiskit Experimental Score:
                </strong>

                ${score.toFixed(2)}%

                <br><br>

                <strong>
                    Qubits:
                </strong>

                ${data.qubits ?? "—"}

                <br>

                <strong>
                    Circuit Depth:
                </strong>

                ${data.circuit_depth ?? "—"}

                <br><br>

                <span>
                    ${escapeHTML(
                        data.interpretation ||
                        "Experimental Qiskit analysis completed."
                    )}
                </span>

            </div>
        `;
    }
}


/* =========================================================
   ERROR STATES
   ========================================================= */

function showRFError(error) {

    if ($("disease")) {

        $("disease").textContent =
            "Random Forest unavailable";
    }

    if ($("confidenceText")) {

        $("confidenceText").textContent =
            "—";
    }

    if ($("confidenceBar")) {

        $("confidenceBar").style.width =
            "0%";
    }

    if ($("topPredictions")) {

        $("topPredictions").innerHTML = `

            <div class="prediction-row">

                <span>⚠</span>

                <span class="prediction-name">

                    ${escapeHTML(
                        error?.message ||
                        "Prediction failed."
                    )}

                </span>

            </div>
        `;
    }
}


function showQuantumError(error) {

    if ($("quantumScore")) {

        $("quantumScore").textContent =
            "Unavailable";
    }

    if ($("quantumScoreText")) {

        $("quantumScoreText").textContent =
            "—";
    }

    if ($("quantumScoreBar")) {

        $("quantumScoreBar").style.width =
            "0%";
    }

    if ($("quantumInterpretation")) {

        $("quantumInterpretation").textContent =
            "Qiskit could not run. " +
            (
                error?.message ||
                "Unknown error."
            );
    }

    if (
        $("quantumResult") &&
        !$("quantumScore")
    ) {

        $("quantumResult").textContent =
            "Qiskit unavailable: " +
            (
                error?.message ||
                "Unknown error."
            );
    }
}


/* =========================================================
   DOCTOR RECOMMENDATION
   ========================================================= */

function renderDoctors(
    doctors,
    specialty
) {

    if ($("specialistBox")) {

        if (specialty) {

            $("specialistBox").innerHTML = `

                <strong>
                    Recommended specialty:
                </strong>

                ${escapeHTML(
                    specialty
                )}
            `;

        } else {

            $("specialistBox").innerHTML =
                "";
        }
    }


    const list =
        Array.isArray(doctors)
            ? doctors
            : [];


    if ($("recommendedDoctors")) {

        $("recommendedDoctors").innerHTML =
            list
                .slice(0, 3)
                .map(
                    doctor =>
                        doctorCard(
                            doctor
                        )
                )
                .join("");
    }
}


function doctorCard(doctor) {

    return `

        <div class="doctor-card">

            <h4>
                ${escapeHTML(
                    doctor.name ||
                    "Doctor"
                )}
            </h4>

            <p>
                <strong>
                    ${escapeHTML(
                        doctor.specialization ||
                        ""
                    )}
                </strong>
            </p>

            <p>
                ${escapeHTML(
                    doctor.hospital ||
                    ""
                )}
            </p>

            <p>
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


/* =========================================================
   LOAD DOCTORS
   ========================================================= */

async function loadDoctors() {

    try {

        const data =
            await apiFetch(
                "/doctors"
            );


        const doctors =
            data.doctors ||
            [];


        if ($("doctorList")) {

            $("doctorList").innerHTML =
                doctors
                    .map(
                        doctor =>
                            doctorCard(
                                doctor
                            )
                    )
                    .join("");
        }

    } catch (error) {

        console.error(
            "Doctor loading error:",
            error
        );

        if ($("doctorList")) {

            $("doctorList").innerHTML =
                "<p>Unable to load doctors.</p>";
        }
    }
}


/* =========================================================
   HISTORY
   ========================================================= */

function historyKey() {

    if (!currentUser) {
        return null;
    }

    return (
        "quantumdiagnose_history_" +
        currentUser.uid
    );
}


function loadHistory() {

    const key =
        historyKey();

    if (!key) {
        return;
    }


    const saved =
        localStorage.getItem(key);


    if (!saved) {

        predictionHistory = [];

        renderHistory();

        return;
    }


    try {

        predictionHistory =
            JSON.parse(saved);

        if (
            !Array.isArray(
                predictionHistory
            )
        ) {

            predictionHistory = [];
        }

    } catch {

        predictionHistory = [];
    }


    renderHistory();

    updateDashboardStats();
}


function saveHistoryItem(item) {

    predictionHistory.unshift(
        item
    );


    predictionHistory =
        predictionHistory.slice(
            0,
            20
        );


    const key =
        historyKey();


    if (key) {

        localStorage.setItem(
            key,
            JSON.stringify(
                predictionHistory
            )
        );
    }


    renderHistory();

    updateDashboardStats();
}


function renderHistory() {

    const container =
        $("historyList");

    if (!container) {
        return;
    }


    if (
        predictionHistory.length ===
        0
    ) {

        container.innerHTML = `

            <p class="muted">
                No predictions yet.
            </p>
        `;

        return;
    }


    container.innerHTML =
        predictionHistory
            .map(
                item => `

                    <div class="history-item">

                        <div class="history-item-top">

                            <strong>
                                ${escapeHTML(
                                    formatDisease(
                                        item.disease
                                    )
                                )}
                            </strong>

                            <span class="history-meta">

                                ${escapeHTML(
                                    item.date ||
                                    formatDate(
                                        item.timestamp
                                    )
                                )}

                            </span>

                        </div>


                        <div class="history-symptoms">

                            Symptoms:

                            ${escapeHTML(
                                (
                                    item.symptoms ||
                                    []
                                )
                                    .map(
                                        formatDisease
                                    )
                                    .join(", ")
                            )}

                        </div>


                        <div class="history-symptoms">

                            Random Forest:

                            <strong>
                                ${Number(
                                    item.confidence ||
                                    0
                                ).toFixed(2)}%
                            </strong>

                            &nbsp; | &nbsp;

                            Qiskit:

                            <strong>

                                ${
                                    item.quantumScore !==
                                        null &&
                                    item.quantumScore !==
                                        undefined

                                        ? Number(
                                            item.quantumScore
                                          ).toFixed(2) +
                                          "%"

                                        : "Unavailable"
                                }

                            </strong>

                        </div>


                        <div class="history-actions">

                            <button
                                class="secondary history-report-btn"
                                data-history-index="${predictionHistory.indexOf(item)}"
                            >
                                Download Report
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");


    document
        .querySelectorAll(
            ".history-report-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .historyIndex
                        );

                    const item =
                        predictionHistory[
                            index
                        ];

                    if (item) {
                        downloadReport(
                            item
                        );
                    }
                }
            );
        });
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard(item) {

    if ($("latestDisease")) {

        $("latestDisease").textContent =
            formatDisease(
                item.disease
            );
    }


    if ($("dashboardLatest")) {

        $("dashboardLatest").innerHTML = `

            <p>

                <strong>
                    ${escapeHTML(
                        formatDisease(
                            item.disease
                        )
                    )}
                </strong>

            </p>

            <p>
                Random Forest:
                <strong>
                    ${Number(
                        item.confidence ||
                        0
                    ).toFixed(2)}%
                </strong>
            </p>

            <p>
                Qiskit:
                <strong>

                    ${
                        item.quantumScore !==
                            null &&
                        item.quantumScore !==
                            undefined

                            ? Number(
                                item.quantumScore
                              ).toFixed(2) +
                              "%"

                            : "Unavailable"
                    }

                </strong>
            </p>

            <p>
                Date & Time:
                <strong>
                    ${escapeHTML(
                        item.date ||
                        ""
                    )}
                </strong>
            </p>
        `;
    }
}


function updateDashboardStats() {

    if ($("predictionCount")) {

        $("predictionCount").textContent =
            predictionHistory.length;
    }


    if (
        predictionHistory.length >
        0
    ) {

        const latest =
            predictionHistory[0];


        if ($("latestDisease")) {

            $("latestDisease").textContent =
                formatDisease(
                    latest.disease
                );
        }
    }
}


/* =========================================================
   MODEL COMPARISON
   ========================================================= */

function updateComparison(item) {

    const rf =
        Number(
            item.confidence || 0
        ).toFixed(2) +
        "%";


    const quantum =
        item.quantumScore !== null &&
        item.quantumScore !== undefined

            ? Number(
                item.quantumScore
              ).toFixed(2) +
              "%"

            : "Unavailable";


    if ($("comparisonRF")) {

        $("comparisonRF").textContent =
            rf;
    }


    if ($("comparisonQuantum")) {

        $("comparisonQuantum").textContent =
            quantum;
    }


    if ($("comparisonDisease")) {

        $("comparisonDisease").textContent =
            formatDisease(
                item.disease
            );
    }


    /*
     * Support your current HTML IDs too.
     */

    if ($("rfAccuracy")) {

        $("rfAccuracy").textContent =
            rf;
    }
}


/* =========================================================
   PERFORMANCE
   ========================================================= */

async function loadPerformance() {

    try {

        const data =
            await apiFetch(
                "/performance"
            );


        if ($("metricAccuracy")) {

            $("metricAccuracy").textContent =
                Number(
                    data.accuracy || 0
                ).toFixed(2) +
                "%";
        }


        if ($("metricPrecision")) {

            $("metricPrecision").textContent =
                Number(
                    data.precision || 0
                ).toFixed(2) +
                "%";
        }


        if ($("metricRecall")) {

            $("metricRecall").textContent =
                Number(
                    data.recall || 0
                ).toFixed(2) +
                "%";
        }


        if ($("metricF1")) {

            $("metricF1").textContent =
                Number(
                    data.f1 || 0
                ).toFixed(2) +
                "%";
        }


        if ($("trainingSamples")) {

            $("trainingSamples").textContent =
                data.training_samples ??
                "—";
        }


        if ($("testingSamples")) {

            $("testingSamples").textContent =
                data.testing_samples ??
                "—";
        }


        if ($("symptomTotal")) {

            $("symptomTotal").textContent =
                data.number_of_symptoms ??
                "—";
        }


        if ($("diseaseTotal")) {

            $("diseaseTotal").textContent =
                data.number_of_diseases ??
                "—";
        }

    } catch (error) {

        console.error(
            "Performance loading error:",
            error
        );
    }
}


/* =========================================================
   PDF REPORT
   ========================================================= */

function addReportButton() {

    if (!$("result")) {
        return;
    }


    if (
        $("downloadReportBtn")
    ) {
        return;
    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "downloadReportBtn";

    button.className =
        "primary";

    button.textContent =
        "Download Report PDF";


    button.style.marginTop =
        "20px";


    button.addEventListener(
        "click",
        () => {

            if (latestPrediction) {

                downloadReport(
                    latestPrediction
                );
            }
        }
    );


    $("result").appendChild(
        button
    );
}


function downloadReport(item) {

    const patient =
        getPatientProfile() ||
        {};


    const symptoms =
        (item.symptoms || [])
            .map(
                formatDisease
            )
            .join(", ");


    const disease =
        formatDisease(
            item.disease
        );


    const rfConfidence =
        Number(
            item.confidence || 0
        ).toFixed(2);


    const quantumScore =
        item.quantumScore !==
            null &&
        item.quantumScore !==
            undefined

            ? Number(
                item.quantumScore
              ).toFixed(2) +
              "%"

            : "Unavailable";


    const reportDate =
        item.date ||
        formatDate(
            item.timestamp
        );


    /*
     * Open a clean report page.
     * Browser print dialog allows:
     * Print → Save as PDF
     */

    const reportWindow =
        window.open(
            "",
            "_blank"
        );


    if (!reportWindow) {

        alert(
            "Please allow pop-ups to download the report."
        );

        return;
    }


    reportWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                QuantumDiagnose Report
            </title>

            <style>

                body {

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    padding:
                        40px;

                    color:
                        #182238;

                    line-height:
                        1.6;
                }

                h1 {

                    margin-bottom:
                        5px;
                }

                h2 {

                    margin-top:
                        30px;
                }

                .header {

                    border-bottom:
                        2px solid #3560f5;

                    padding-bottom:
                        15px;
                }

                .box {

                    border:
                        1px solid #ddd;

                    border-radius:
                        10px;

                    padding:
                        18px;

                    margin-top:
                        15px;
                }

                .row {

                    margin:
                        8px 0;
                }

                .label {

                    font-weight:
                        bold;
                }

                .warning {

                    margin-top:
                        30px;

                    padding:
                        15px;

                    background:
                        #f5f7fb;

                    border-radius:
                        8px;

                    font-size:
                        13px;
                }

                .footer {

                    margin-top:
                        35px;

                    font-size:
                        12px;

                    color:
                        #70798a;
                }

            </style>

        </head>


        <body>

            <div class="header">

                <h1>
                    QuantumDiagnose
                </h1>

                <div>
                    AI Health Prediction Report
                </div>

            </div>


            <h2>
                Patient Information
            </h2>

            <div class="box">

                <div class="row">
                    <span class="label">
                        Name:
                    </span>

                    ${escapeHTML(
                        patient.name ||
                        "Not available"
                    )}
                </div>


                <div class="row">
                    <span class="label">
                        Gender:
                    </span>

                    ${escapeHTML(
                        patient.gender ||
                        "Not available"
                    )}
                </div>


                <div class="row">
                    <span class="label">
                        Age:
                    </span>

                    ${escapeHTML(
                        patient.age ||
                        "Not available"
                    )}
                </div>


                <div class="row">
                    <span class="label">
                        Height:
                    </span>

                    ${escapeHTML(
                        patient.height ||
                        "Not available"
                    )}
                    cm
                </div>


                <div class="row">
                    <span class="label">
                        Weight:
                    </span>

                    ${escapeHTML(
                        patient.weight ||
                        "Not available"
                    )}
                    kg
                </div>

            </div>


            <h2>
                Prediction Details
            </h2>

            <div class="box">

                <div class="row">
                    <span class="label">
                        Prediction Date & Time:
                    </span>

                    ${escapeHTML(
                        reportDate
                    )}
                </div>


                <div class="row">
                    <span class="label">
                        Selected Symptoms:
                    </span>

                    ${escapeHTML(
                        symptoms ||
                        "None"
                    )}
                </div>


                <div class="row">
                    <span class="label">
                        Random Forest Prediction:
                    </span>

                    ${escapeHTML(
                        disease
                    )}
                </div>


                <div class="row">
                    <span class="label">
                        Random Forest Confidence:
                    </span>

                    ${rfConfidence}%
                </div>


                <div class="row">
                    <span class="label">
                        Qiskit Experimental Score:
                    </span>

                    ${quantumScore}
                </div>


                <div class="row">
                    <span class="label">
                        Qubits:
                    </span>

                    ${escapeHTML(
                        item.quantumQubits ??
                        "—"
                    )}
                </div>


                <div class="row">
                    <span class="label">
                        Circuit Depth:
                    </span>

                    ${escapeHTML(
                        item.quantumDepth ??
                        "—"
                    )}
                </div>

            </div>


            <h2>
                Doctor Recommendation
            </h2>

            <div class="box">

                <div class="row">

                    <span class="label">
                        Recommended Specialty:
                    </span>

                    ${escapeHTML(
                        item.specialty ||
                        "Based on predicted condition"
                    )}

                </div>

            </div>


            <div class="warning">

                <strong>
                    Disclaimer:
                </strong>

                This report is generated by an
                educational and experimental
                symptom-analysis system.
                It is not a medical diagnosis
                and should not replace evaluation
                by a qualified healthcare professional.

            </div>


            <div class="footer">

                QuantumDiagnose • Educational Project

            </div>


            <script>

                window.onload = function() {

                    setTimeout(
                        function() {

                            window.print();

                        },
                        500
                    );

                };

            <\/script>

        </body>

        </html>
    `);


    reportWindow.document.close();
}


/* =========================================================
   QUANTUM ANALYSIS BUTTON
   ========================================================= */

$("quantumBtn")?.addEventListener(
    "click",
    async () => {

        const symptoms =
            getSelectedSymptoms();


        if (
            symptoms.length ===
            0
        ) {

            alert(
                "Please select symptoms first."
            );

            showPage(
                "prediction"
            );

            return;
        }


        const button =
            $("quantumBtn");


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Running Quantum Analysis...";
        }


        try {

            const data =
                await apiFetch(
                    "/quantum",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                symptoms:
                                    symptoms
                            })
                    }
                );


            renderQuantum(data);

        } catch (error) {

            console.error(
                "Quantum analysis error:",
                error
            );

            showQuantumError(
                error
            );

        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "Run Quantum Analysis";
            }
        }
    }
);


/* =========================================================
   DATE FORMATTER
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "Unknown";
    }


    try {

        return new Date(
            value
        ).toLocaleString(
            "en-IN",
            {
                dateStyle:
                    "medium",

                timeStyle:
                    "medium"
            }
        );

    } catch {

        return String(
            value
        );
    }
}


/* =========================================================
   FORMAT DISEASE
   ========================================================= */

function formatDisease(value) {

    if (!value) {

        return "Unknown";
    }


    return String(value)

        .replaceAll(
            "_",
            " "
        )

        .replaceAll(
            "-",
            " "
        )

        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   INITIAL
   ========================================================= */

setAuthMode(
    "login"
);

updateCount();
