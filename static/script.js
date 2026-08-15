// ============================================================
// QuantumDiagnose - Complete Frontend
// Random Forest + Qiskit + Firebase
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
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================================
// FIREBASE
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


const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);


// ============================================================
// ELEMENT HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}


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

const userEmail =
    $("userEmail");

const welcomeName =
    $("welcomeName");


// ============================================================
// AUTH MODE
// ============================================================

let authMode = "login";


// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(
    message,
    error = false
) {

    if (!authMessage) return;

    authMessage.textContent =
        message;

    authMessage.className =
        error
            ? "error-message"
            : "success-message";
}


// ============================================================
// LOGIN TAB
// ============================================================

if (loginTab) {

    loginTab.addEventListener(
        "click",
        () => {

            authMode =
                "login";

            loginTab.classList.add(
                "active"
            );

            signupTab.classList.remove(
                "active"
            );

            authSubmit.textContent =
                "Login";

            showAuthMessage("");
        }
    );
}


// ============================================================
// SIGNUP TAB
// ============================================================

if (signupTab) {

    signupTab.addEventListener(
        "click",
        () => {

            authMode =
                "signup";

            signupTab.classList.add(
                "active"
            );

            loginTab.classList.remove(
                "active"
            );

            authSubmit.textContent =
                "Create Account";

            showAuthMessage("");
        }
    );
}


// ============================================================
// AUTH SUBMIT
// ============================================================

if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        async () => {

            const email =
                authEmail.value.trim();

            const password =
                authPassword.value;


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


            authSubmit.disabled =
                true;

            authSubmit.textContent =
                "Please wait...";


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

                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );
                }


                showAuthMessage(
                    authMode ===
                    "login"
                        ? "Login successful!"
                        : "Account created successfully!"
                );


            } catch (error) {

                console.error(
                    error
                );

                let message =
                    "Authentication failed.";

                switch (
                    error.code
                ) {

                    case "auth/invalid-email":
                        message =
                            "Invalid email address.";
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
                            "Email already registered. Please login.";
                        break;

                    case "auth/weak-password":
                        message =
                            "Password is too weak.";
                        break;

                    default:
                        message =
                            error.message;
                }


                showAuthMessage(
                    message,
                    true
                );

            } finally {

                authSubmit.disabled =
                    false;

                authSubmit.textContent =
                    authMode ===
                    "login"
                        ? "Login"
                        : "Create Account";
            }
        }
    );
}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    user => {

        if (user) {

            authScreen.classList.add(
                "hidden"
            );

            app.classList.remove(
                "hidden"
            );

            if (userEmail) {

                userEmail.textContent =
                    user.email || "User";
            }


            if (welcomeName) {

                const name =
                    (
                        user.email ||
                        "Patient"
                    )
                    .split("@")[0];

                welcomeName.textContent =
                    name;
            }

            loadPerformance();

            loadDoctors();

        } else {

            authScreen.classList.remove(
                "hidden"
            );

            app.classList.add(
                "hidden"
            );
        }
    }
);


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            await signOut(auth);
        }
    );
}


// ============================================================
// PAGE NAVIGATION
// ============================================================

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );

const pages =
    document.querySelectorAll(
        ".page"
    );

const pageTitle =
    $("pageTitle");


function showPage(
    pageId
) {

    pages.forEach(
        page => {

            page.classList.remove(
                "active-page"
            );
        }
    );


    navItems.forEach(
        item => {

            item.classList.remove(
                "active"
            );

            if (
                item.dataset.page ===
                pageId
            ) {

                item.classList.add(
                    "active"
                );
            }
        }
    );


    const page =
        $(pageId);

    if (page) {

        page.classList.add(
            "active-page"
        );
    }


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

        comparison:
            "Random Forest vs Qiskit",

        performance:
            "Performance"
    };


    if (pageTitle) {

        pageTitle.textContent =
            titles[pageId] ||
            "QuantumDiagnose";
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


navItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                showPage(
                    item.dataset.page
                );
            }
        );
    }
);


// Dashboard buttons

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

const symptomGrid =
    $("symptomGrid");

const searchInput =
    $("search");

const count =
    $("count");

const clearBtn =
    $("clearBtn");

const predictBtn =
    $("predictBtn");


function getCheckboxes() {

    return document.querySelectorAll(
        '#symptomGrid input[type="checkbox"]'
    );
}


function getSelectedSymptoms() {

    const selected = [];

    getCheckboxes().forEach(
        checkbox => {

            if (checkbox.checked) {

                selected.push(
                    checkbox.value
                );
            }
        }
    );

    return selected;
}


function updateCount() {

    if (!count) return;

    count.textContent =
        getSelectedSymptoms().length;
}


getCheckboxes().forEach(
    checkbox => {

        checkbox.addEventListener(
            "change",
            updateCount
        );
    }
);


updateCount();


// ============================================================
// SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const text =
                searchInput.value
                    .toLowerCase()
                    .trim();

            document
                .querySelectorAll(
                    "#symptomGrid .symptom"
                )
                .forEach(
                    item => {

                        const name =
                            (
                                item.dataset.name ||
                                ""
                            )
                            .toLowerCase();

                        item.style.display =
                            name.includes(text)
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
        () => {

            getCheckboxes()
                .forEach(
                    checkbox => {
                        checkbox.checked =
                            false;
                    }
                );

            updateCount();

            const result =
                $("result");

            if (result) {

                result.classList.add(
                    "hidden"
                );
            }

            if (searchInput) {

                searchInput.value =
                    "";
            }

            document
                .querySelectorAll(
                    "#symptomGrid .symptom"
                )
                .forEach(
                    item => {
                        item.style.display =
                            "";
                    }
                );
        }
    );
}


// ============================================================
// API HELPER
// ============================================================

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


    let data;

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


// ============================================================
// ANALYZE
// ============================================================

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        analyzeSymptoms
    );
}


async function analyzeSymptoms() {

    const symptoms =
        getSelectedSymptoms();


    if (
        symptoms.length ===
        0
    ) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }


    predictBtn.disabled =
        true;

    predictBtn.textContent =
        "Analyzing Random Forest + Qiskit...";


    const result =
        $("result");

    result.classList.remove(
        "hidden"
    );


    showLoading();


    try {

        const [rf, quantum] =
            await Promise.all([
                apiFetch(
                    "/predict",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
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
                                symptoms
                            })
                    }
                )
            ]);


        renderRandomForest(
            rf
        );

        renderQuantum(
            quantum
        );


        renderCombinedComparison(
            rf,
            quantum
        );


        renderDoctors(
            rf.doctors || [],
            rf.specialty
        );


        updateDashboard(
            rf
        );


        saveLocalHistory(
            rf,
            quantum
        );


        showPage(
            "prediction"
        );


    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );

        showGlobalError(
            error.message
        );

    } finally {

        predictBtn.disabled =
            false;

        predictBtn.textContent =
            "Analyze Symptoms";
    }
}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    const disease =
        $("disease");

    const confidenceText =
        $("confidenceText");

    const confidenceBar =
        $("confidenceBar");

    const topPredictions =
        $("topPredictions");

    const quantumDisease =
        $("quantumDisease");

    const quantumScore =
        $("quantumScore");

    const quantumBar =
        $("quantumScoreBar");

    if (disease)
        disease.textContent =
            "Analyzing...";

    if (confidenceText)
        confidenceText.textContent =
            "—";

    if (confidenceBar)
        confidenceBar.style.width =
            "0%";

    if (topPredictions)
        topPredictions.innerHTML =
            "<p>Running Random Forest...</p>";

    if (quantumDisease)
        quantumDisease.textContent =
            "Analyzing...";

    if (quantumScore)
        quantumScore.textContent =
            "—";

    if (quantumBar)
        quantumBar.style.width =
            "0%";
}


// ============================================================
// RANDOM FOREST RESULT
// ============================================================

function renderRandomForest(
    data
) {

    const disease =
        $("disease");

    const confidenceText =
        $("confidenceText");

    const confidenceBar =
        $("confidenceBar");

    const topPredictions =
        $("topPredictions");


    if (disease) {

        disease.textContent =
            formatDisease(
                data.disease
            );
    }


    const confidence =
        Number(
            data.confidence || 0
        );


    if (confidenceText) {

        confidenceText.textContent =
            confidence.toFixed(2) +
            "%";
    }


    if (confidenceBar) {

        confidenceBar.style.width =
            Math.min(
                Math.max(
                    confidence,
                    0
                ),
                100
            ) +
            "%";
    }


    if (topPredictions) {

        topPredictions.innerHTML =
            (
                data.top_predictions ||
                []
            )
            .map(
                (item, index) => {

                    const score =
                        Number(
                            item.confidence ||
                            0
                        );

                    return `
                        <div class="prediction-row">
                            <span class="rank">
                                ${index + 1}
                            </span>

                            <span class="prediction-name">
                                ${escapeHTML(
                                    formatDisease(
                                        item.disease
                                    )
                                )}
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
}


// ============================================================
// QISKIT RESULT
// ============================================================

function renderQuantum(
    data
) {

    const quantumDisease =
        $("quantumDisease");

    const quantumScore =
        $("quantumScore");

    const quantumBar =
        $("quantumScoreBar");

    const quantumQubits =
        $("quantumQubits");

    const quantumDepth =
        $("quantumDepth");

    const quantumPredictions =
        $("quantumPredictions");

    const quantumInterpretation =
        $("quantumInterpretation");


    if (quantumDisease) {

        quantumDisease.textContent =
            formatDisease(
                data.prediction ||
                "Unavailable"
            );
    }


    const score =
        Number(
            data.quantum_score || 0
        );


    if (quantumScore) {

        quantumScore.textContent =
            score.toFixed(2) +
            "%";
    }


    if (quantumBar) {

        quantumBar.style.width =
            Math.min(
                Math.max(
                    score,
                    0
                ),
                100
            ) +
            "%";
    }


    if (quantumQubits) {

        quantumQubits.textContent =
            data.qubits ??
            "—";
    }


    if (quantumDepth) {

        quantumDepth.textContent =
            data.circuit_depth ??
            "—";
    }


    if (quantumInterpretation) {

        quantumInterpretation.textContent =
            data.interpretation ||
            "Experimental Qiskit analysis completed.";
    }


    if (quantumPredictions) {

        quantumPredictions.innerHTML =
            (
                data.top_predictions ||
                []
            )
            .map(
                (item, index) => {

                    return `
                        <div class="prediction-row quantum-row">
                            <span class="rank">
                                ${index + 1}
                            </span>

                            <span class="prediction-name">
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
                }
            )
            .join("");
    }
}


// ============================================================
// COMPARISON
// ============================================================

function renderCombinedComparison(
    rf,
    quantum
) {

    const comparison =
        $("comparisonResult");

    if (!comparison)
        return;


    const rfDisease =
        formatDisease(
            rf.disease
        );

    const qDisease =
        formatDisease(
            quantum.prediction
        );


    const rfScore =
        Number(
            rf.confidence || 0
        );

    const qScore =
        Number(
            quantum.quantum_score || 0
        );


    const difference =
        Math.abs(
            rfScore -
            qScore
        );


    comparison.innerHTML = `

        <div class="comparison-summary">

            <div>
                <span>Random Forest</span>
                <strong>
                    ${escapeHTML(rfDisease)}
                </strong>
                <b>
                    ${rfScore.toFixed(2)}%
                </b>
            </div>

            <div class="comparison-arrow">
                VS
            </div>

            <div>
                <span>Qiskit Experimental</span>
                <strong>
                    ${escapeHTML(qDisease)}
                </strong>
                <b>
                    ${qScore.toFixed(2)}%
                </b>
            </div>

        </div>

        <p class="comparison-note">
            Score difference:
            <strong>
                ${difference.toFixed(2)} percentage points
            </strong>
        </p>

        <p class="small-note">
            The Qiskit value is an experimental quantum-feature
            similarity score and is not a clinically validated
            probability.
        </p>
    `;
}


// ============================================================
// DOCTORS
// ============================================================

function renderDoctors(
    doctors,
    specialty
) {

    const specialistBox =
        $("specialistBox");

    const recommendedDoctors =
        $("recommendedDoctors");


    if (specialistBox) {

        specialistBox.innerHTML = `

            <div class="specialty-result">

                <span>
                    Recommended Medical Specialty
                </span>

                <strong>
                    ${escapeHTML(
                        specialty ||
                        "General Physician"
                    )}
                </strong>

            </div>
        `;
    }


    if (!recommendedDoctors)
        return;


    if (
        !doctors ||
        doctors.length === 0
    ) {

        recommendedDoctors.innerHTML = `

            <div class="empty-state">
                No matching dummy doctor found.
            </div>

        `;

        return;
    }


    recommendedDoctors.innerHTML =
        doctors
            .map(
                doctor =>
                    doctorCard(
                        doctor
                    )
            )
            .join("");
}


function doctorCard(
    doctor
) {

    return `

        <div class="doctor-card">

            <div class="doctor-icon">
                👨‍⚕️
            </div>

            <div>

                <h4>
                    ${escapeHTML(
                        doctor.name ||
                        "Doctor"
                    )}
                </h4>

                <p class="doctor-specialty">
                    ${escapeHTML(
                        doctor.specialization ||
                        ""
                    )}
                </p>

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
                        ""
                    )}
                </p>

                <p>
                    ⭐
                    ${escapeHTML(
                        doctor.experience ||
                        "—"
                    )}
                    experience
                </p>

            </div>

        </div>
    `;
}


// ============================================================
// LOAD DOCTORS
// ============================================================

async function loadDoctors() {

    try {

        const data =
            await apiFetch(
                "/doctors"
            );

        const doctors =
            data.doctors || [];

        const doctorList =
            $("doctorList");

        if (doctorList) {

            doctorList.innerHTML =
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
    }
}


// ============================================================
// PERFORMANCE
// ============================================================

async function loadPerformance() {

    try {

        const data =
            await apiFetch(
                "/performance"
            );


        setText(
            "metricAccuracy",
            data.accuracy + "%"
        );

        setText(
            "metricPrecision",
            data.precision + "%"
        );

        setText(
            "metricRecall",
            data.recall + "%"
        );

        setText(
            "metricF1",
            data.f1 + "%"
        );

        setText(
            "trainingSamples",
            data.training_samples
        );

        setText(
            "testingSamples",
            data.testing_samples
        );

        setText(
            "symptomTotal",
            data.number_of_symptoms
        );

        setText(
            "diseaseTotal",
            data.number_of_diseases
        );

        setText(
            "rfAccuracy",
            data.accuracy + "%"
        );

    } catch (error) {

        console.error(
            "Performance error:",
            error
        );
    }
}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard(
    rf
) {

    setText(
        "latestDisease",
        formatDisease(
            rf.disease
        )
    );


    const dashboardLatest =
        $("dashboardLatest");

    if (
        dashboardLatest
    ) {

        dashboardLatest.innerHTML = `

            <div class="dashboard-result">

                <strong>
                    ${escapeHTML(
                        formatDisease(
                            rf.disease
                        )
                    )}
                </strong>

                <span>
                    ${Number(
                        rf.confidence || 0
                    ).toFixed(2)}%
                    model confidence
                </span>

            </div>

        `;
    }


    const stored =
        JSON.parse(
            localStorage.getItem(
                "quantumDiagnoseHistory"
            ) || "[]"
        );


    setText(
        "predictionCount",
        stored.length
    );
}


// ============================================================
// LOCAL HISTORY
// ============================================================

function saveLocalHistory(
    rf,
    quantum
) {

    const history =
        JSON.parse(
            localStorage.getItem(
                "quantumDiagnoseHistory"
            ) || "[]"
        );


    history.unshift({

        disease:
            rf.disease,

        confidence:
            rf.confidence,

        quantumDisease:
            quantum.prediction,

        quantumScore:
            quantum.quantum_score,

        specialty:
            rf.specialty,

        date:
            new Date().toLocaleString()

    });


    localStorage.setItem(
        "quantumDiagnoseHistory",
        JSON.stringify(
            history.slice(
                0,
                20
            )
        )
    );


    renderHistory();
}


function renderHistory() {

    const historyList =
        $("historyList");

    if (!historyList)
        return;


    const history =
        JSON.parse(
            localStorage.getItem(
                "quantumDiagnoseHistory"
            ) || "[]"
        );


    if (
        history.length ===
        0
    ) {

        historyList.innerHTML = `
            <p class="muted">
                No predictions yet.
            </p>
        `;

        return;
    }


    historyList.innerHTML =
        history
            .map(
                item => `

                    <div class="history-item">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    formatDisease(
                                        item.disease
                                    )
                                )}
                            </strong>

                            <span>
                                Random Forest:
                                ${Number(
                                    item.confidence || 0
                                ).toFixed(2)}%
                            </span>

                            <span>
                                Qiskit:
                                ${Number(
                                    item.quantumScore || 0
                                ).toFixed(2)}%
                            </span>

                        </div>

                        <small>
                            ${escapeHTML(
                                item.date
                            )}
                        </small>

                    </div>

                `
            )
            .join("");
}


renderHistory();


// ============================================================
// PROFILE
// ============================================================

const saveProfileBtn =
    $("saveProfileBtn");


if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        () => {

            const profile = {

                name:
                    $("profileName")?.value
                    || "",

                gender:
                    $("profileGender")?.value
                    || "",

                age:
                    $("profileAge")?.value
                    || "",

                height:
                    $("profileHeight")?.value
                    || "",

                weight:
                    $("profileWeight")?.value
                    || ""
            };


            localStorage.setItem(
                "quantumDiagnoseProfile",
                JSON.stringify(
                    profile
                )
            );


            const message =
                $("profileMessage");

            if (message) {

                message.textContent =
                    "Profile saved successfully.";

                message.className =
                    "success-message";
            }
        }
    );
}


// Load profile

function loadProfile() {

    const profile =
        JSON.parse(
            localStorage.getItem(
                "quantumDiagnoseProfile"
            ) || "null"
        );


    if (!profile)
        return;


    if ($("profileName"))
        $("profileName").value =
            profile.name || "";

    if ($("profileGender"))
        $("profileGender").value =
            profile.gender || "";

    if ($("profileAge"))
        $("profileAge").value =
            profile.age || "";

    if ($("profileHeight"))
        $("profileHeight").value =
            profile.height || "";

    if ($("profileWeight"))
        $("profileWeight").value =
            profile.weight || "";
}


loadProfile();


// ============================================================
// ERROR
// ============================================================

function showGlobalError(
    message
) {

    const result =
        $("result");

    if (!result)
        return;


    result.classList.remove(
        "hidden"
    );


    result.innerHTML = `

        <div class="error-box">

            <h3>
                Analysis failed
            </h3>

            <p>
                ${escapeHTML(
                    message
                )}
            </p>

        </div>
    `;
}


// ============================================================
// HELPERS
// ============================================================

function setText(
    id,
    value
) {

    const element =
        $(id);

    if (element) {

        element.textContent =
            value;
    }
}


function formatDisease(
    disease
) {

    if (!disease)
        return "—";


    return String(disease)
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


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
