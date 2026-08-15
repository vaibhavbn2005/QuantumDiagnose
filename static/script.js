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
   AUTH TAB
========================================================= */

function setAuthMode(mode) {

    authMode = mode;

    if (mode === "login") {

        loginTab.classList.add("active");

        signupTab.classList.remove("active");

        authSubmit.textContent = "Login";

        authPassword.autocomplete =
            "current-password";

    } else {

        signupTab.classList.add("active");

        loginTab.classList.remove("active");

        authSubmit.textContent =
            "Create Account";

        authPassword.autocomplete =
            "new-password";
    }

    authMessage.textContent = "";
}


loginTab.addEventListener(
    "click",
    () => setAuthMode("login")
);


signupTab.addEventListener(
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

authSubmit.addEventListener(
    "click",
    async () => {

        const email =
            authEmail.value.trim();

        const password =
            authPassword.value;


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

            authScreen.classList.add(
                "hidden"
            );

            app.classList.remove(
                "hidden"
            );

            $("userEmail").textContent =
                user.email || "User";

            loadProfile();

            loadHistory();

            loadDoctors();

            loadPerformance();

        } else {

            authScreen.classList.remove(
                "hidden"
            );

            app.classList.add(
                "hidden"
            );

            $("userEmail").textContent =
                "—";
        }
    }
);


/* =========================================================
   LOGOUT
========================================================= */

$("logoutBtn").addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

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
                button.dataset.page === pageId
            );

        });


    $("pageTitle").textContent =
        pageTitles[pageId] ||
        "QuantumDiagnose";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

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


/* =========================================================
   QUICK ACTION BUTTONS
========================================================= */

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
   PROFILE
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


function saveProfile() {

    const data = {

        name:
            $("profileName").value.trim(),

        gender:
            $("profileGender").value,

        age:
            $("profileAge").value,

        height:
            $("profileHeight").value,

        weight:
            $("profileWeight").value
    };


    localStorage.setItem(
        profileKey(),
        JSON.stringify(data)
    );


    $("profileMessage").textContent =
        "Profile saved successfully.";

    $("profileMessage").style.color =
        "#16a34a";


    updateWelcomeName(
        data.name
    );
}


function loadProfile() {

    const key =
        profileKey();

    if (!key) {
        return;
    }


    const saved =
        localStorage.getItem(key);

    if (!saved) {
        return;
    }


    try {

        const data =
            JSON.parse(saved);


        $("profileName").value =
            data.name || "";

        $("profileGender").value =
            data.gender || "";

        $("profileAge").value =
            data.age || "";

        $("profileHeight").value =
            data.height || "";

        $("profileWeight").value =
            data.weight || "";


        updateWelcomeName(
            data.name
        );

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );
    }
}


function updateWelcomeName(name) {

    $("welcomeName").textContent =
        name && name.trim()
            ? name.trim()
            : "Patient";
}


$("saveProfileBtn").addEventListener(
    "click",
    saveProfile
);


/* =========================================================
   SYMPTOMS
========================================================= */

const symptomCheckboxes =
    () => document.querySelectorAll(
        "#symptomGrid input[type='checkbox']"
    );


function getSelectedSymptoms() {

    return Array
        .from(symptomCheckboxes())
        .filter(
            checkbox => checkbox.checked
        )
        .map(
            checkbox => checkbox.value
        );
}


function updateCount() {

    const selected =
        getSelectedSymptoms();

    $("count").textContent =
        selected.length;
}


document
    .querySelectorAll(
        "#symptomGrid input[type='checkbox']"
    )
    .forEach(checkbox => {

        checkbox.addEventListener(
            "change",
            updateCount
        );

    });


/* =========================================================
   SEARCH SYMPTOMS
========================================================= */

$("search").addEventListener(
    "input",
    event => {

        const search =
            event.target.value
                .trim()
                .toLowerCase();


        document
            .querySelectorAll(".symptom")
            .forEach(item => {

                const name =
                    item.dataset.name
                        .toLowerCase();


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

$("clearBtn").addEventListener(
    "click",
    () => {

        symptomCheckboxes()
            .forEach(
                checkbox => {
                    checkbox.checked = false;
                }
            );


        $("search").value = "";


        document
            .querySelectorAll(".symptom")
            .forEach(item => {
                item.style.display =
                    "flex";
            });


        updateCount();

        $("result").classList.add(
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
   ANALYZE SYMPTOMS
========================================================= */

$("predictBtn").addEventListener(
    "click",
    analyzeSymptoms
);


async function analyzeSymptoms() {

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


    button.disabled = true;

    button.textContent =
        "Analyzing Random Forest + Qiskit...";


    $("result").classList.remove(
        "hidden"
    );


    resetResult();


    try {

        /*
         * IMPORTANT:
         *
         * Both models are triggered by
         * ONE button.
         *
         * Random Forest -> /predict
         * Qiskit        -> /quantum
         */

        const [rfResult, quantumResult] =
            await Promise.allSettled([

                apiFetch(
                    "/predict",
                    {
                        method: "POST",

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
                        method: "POST",

                        body:
                            JSON.stringify({
                                symptoms:
                                    symptoms
                            })
                    }
                )

            ]);


        /* ================================================
           RANDOM FOREST
        ================================================= */

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


        /* ================================================
           QISKIT
        ================================================= */

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


        /* ================================================
           SAVE RESULT
        ================================================= */

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


            latestPrediction = {

                disease:
                    rf.disease,

                confidence:
                    rf.confidence,

                topPredictions:
                    rf.top_predictions || [],

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

                date:
                    new Date().toLocaleString()
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


            renderDoctors(
                rf.doctors || [],
                rf.specialty
            );
        }


    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );

        alert(
            "Analysis failed: " +
            error.message
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Analyze Symptoms";
    }
}


/* =========================================================
   RESET RESULT
========================================================= */

function resetResult() {

    $("disease").textContent =
        "Analyzing...";

    $("confidenceText").textContent =
        "0%";

    $("confidenceBar").style.width =
        "0%";

    $("topPredictions").innerHTML =
        "";

    $("quantumScore").textContent =
        "Analyzing...";

    $("quantumScoreText").textContent =
        "0%";

    $("quantumScoreBar").style.width =
        "0%";

    $("quantumQubits").textContent =
        "—";

    $("quantumDepth").textContent =
        "—";

    $("quantumInterpretation").textContent =
        "Running Qiskit quantum analysis...";

    $("specialistBox").innerHTML =
        "";

    $("recommendedDoctors").innerHTML =
        "";

    $("message").textContent =
        "";
}


/* =========================================================
   RANDOM FOREST RESULT
========================================================= */

function renderRandomForest(data) {

    $("disease").textContent =
        formatDisease(
            data.disease
        );


    const confidence =
        Number(
            data.confidence || 0
        );


    $("confidenceText").textContent =
        confidence.toFixed(2) +
        "%";


    $("confidenceBar").style.width =
        Math.min(
            Math.max(confidence, 0),
            100
        ) + "%";


    const predictions =
        Array.isArray(
            data.top_predictions
        )
            ? data.top_predictions
            : [];


    $("topPredictions").innerHTML =
        predictions
            .map(
                (item, index) => {

                    const score =
                        Number(
                            item.confidence || 0
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


    $("message").textContent =
        data.message ||
        "Random Forest analysis completed.";
}


/* =========================================================
   QISKIT RESULT
========================================================= */

function renderQuantum(data) {

    const score =
        Number(
            data.quantum_score || 0
        );


    $("quantumScore").textContent =
        score.toFixed(2) +
        "%";


    $("quantumScoreText").textContent =
        score.toFixed(2) +
        "%";


    $("quantumScoreBar").style.width =
        Math.min(
            Math.max(score, 0),
            100
        ) + "%";


    $("quantumQubits").textContent =
        data.qubits ?? "—";


    $("quantumDepth").textContent =
        data.circuit_depth ?? "—";


    $("quantumInterpretation").textContent =
        data.interpretation ||
        "Experimental Qiskit analysis completed.";
}


/* =========================================================
   ERROR STATES
========================================================= */

function showRFError(error) {

    $("disease").textContent =
        "Random Forest unavailable";

    $("confidenceText").textContent =
        "—";

    $("confidenceBar").style.width =
        "0%";

    $("topPredictions").innerHTML = `

        <div class="prediction-row">

            <span>⚠</span>

            <span class="prediction-name">
                ${escapeHTML(
                    error.message
                )}
            </span>

        </div>

    `;
}


function showQuantumError(error) {

    $("quantumScore").textContent =
        "Unavailable";

    $("quantumScoreText").textContent =
        "—";

    $("quantumScoreBar").style.width =
        "0%";

    $("quantumInterpretation").textContent =
        "Qiskit could not run. " +
        error.message;
}


/* =========================================================
   SPECIALTY + DOCTORS
========================================================= */

function renderDoctors(
    doctors,
    specialty
) {

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


    const list =
        Array.isArray(doctors)
            ? doctors
            : [];


    $("recommendedDoctors").innerHTML =
        list
            .slice(0, 3)
            .map(
                doctor => doctorCard(
                    doctor
                )
            )
            .join("");
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
   LOAD ALL DOCTORS
========================================================= */

async function loadDoctors() {

    try {

        const data =
            await apiFetch(
                "/doctors"
            );


        const doctors =
            data.doctors || [];


        $("doctorList").innerHTML =
            doctors
                .map(
                    doctor =>
                        doctorCard(
                            doctor
                        )
                )
                .join("");

    } catch (error) {

        console.error(
            "Doctor loading error:",
            error
        );

        $("doctorList").innerHTML =
            "<p>Unable to load doctors.</p>";
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
                                    item.date || ""
                                )}
                            </span>

                        </div>

                        <div class="history-symptoms">

                            Symptoms:
                            ${escapeHTML(
                                (item.symptoms || [])
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
                                    item.confidence || 0
                                ).toFixed(2)}%
                            </strong>

                            &nbsp; | &nbsp;

                            Qiskit:
                            <strong>
                                ${
                                    item.quantumScore !== null &&
                                    item.quantumScore !== undefined
                                        ? Number(
                                            item.quantumScore
                                          ).toFixed(2) +
                                          "%"
                                        : "Unavailable"
                                }
                            </strong>

                        </div>

                    </div>

                `
            )
            .join("");
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard(item) {

    $("latestDisease").textContent =
        formatDisease(
            item.disease
        );


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
                    item.confidence || 0
                ).toFixed(2)}%
            </strong>
        </p>

        <p>
            Qiskit:
            <strong>
                ${
                    item.quantumScore !== null &&
                    item.quantumScore !== undefined
                        ? Number(
                            item.quantumScore
                          ).toFixed(2) +
                          "%"
                        : "Unavailable"
                }
            </strong>
        </p>

    `;
}


function updateDashboardStats() {

    $("predictionCount").textContent =
        predictionHistory.length;


    if (
        predictionHistory.length > 0
    ) {

        $("latestDisease").textContent =
            formatDisease(
                predictionHistory[0].disease
            );

    }
}


/* =========================================================
   COMPARISON
========================================================= */

function updateComparison(item) {

    $("comparisonRF").textContent =
        Number(
            item.confidence || 0
        ).toFixed(2) +
        "%";


    $("comparisonQuantum").textContent =
        item.quantumScore !== null &&
        item.quantumScore !== undefined

            ? Number(
                item.quantumScore
              ).toFixed(2) + "%"

            : "Unavailable";


    $("comparisonDisease").textContent =
        formatDisease(
            item.disease
        );
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


        $("metricAccuracy").textContent =
            Number(
                data.accuracy || 0
            ).toFixed(2) + "%";


        $("metricPrecision").textContent =
            Number(
                data.precision || 0
            ).toFixed(2) + "%";


        $("metricRecall").textContent =
            Number(
                data.recall || 0
            ).toFixed(2) + "%";


        $("metricF1").textContent =
            Number(
                data.f1 || 0
            ).toFixed(2) + "%";


        $("trainingSamples").textContent =
            data.training_samples ??
            "—";


        $("testingSamples").textContent =
            data.testing_samples ??
            "—";


        $("symptomTotal").textContent =
            data.number_of_symptoms ??
            "—";


        $("diseaseTotal").textContent =
            data.number_of_diseases ??
            "—";


    } catch (error) {

        console.error(
            "Performance loading error:",
            error
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
        .replaceAll("_", " ")
        .replaceAll("-", " ")
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

setAuthMode("login");

updateCount();
