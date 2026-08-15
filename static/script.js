// ============================================================
// QUANTUMDIAGNOSE - COMPLETE JAVASCRIPT
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
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


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
        "1:727641186346:web:c8eed6274fd1582169e353",

    measurementId:
        "G-DSDM1YM4WB"
};


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);


// ============================================================
// ELEMENTS
// ============================================================

const authScreen =
    document.getElementById("authScreen");

const app =
    document.getElementById("app");


const loginTab =
    document.getElementById("loginTab");

const signupTab =
    document.getElementById("signupTab");

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const authSubmit =
    document.getElementById("authSubmit");

const authMessage =
    document.getElementById("authMessage");

const logoutBtn =
    document.getElementById("logoutBtn");


const userEmail =
    document.getElementById("userEmail");

const welcomeName =
    document.getElementById("welcomeName");


const pageTitle =
    document.getElementById("pageTitle");

const pages =
    document.querySelectorAll(".page");

const navItems =
    document.querySelectorAll(".nav-item");


const count =
    document.getElementById("count");

const searchInput =
    document.getElementById("search");

const clearBtn =
    document.getElementById("clearBtn");

const predictBtn =
    document.getElementById("predictBtn");


const result =
    document.getElementById("result");

const disease =
    document.getElementById("disease");

const confidenceText =
    document.getElementById("confidenceText");

const confidenceBar =
    document.getElementById("confidenceBar");

const topPredictions =
    document.getElementById("topPredictions");

const message =
    document.getElementById("message");


const quantumDisease =
    document.getElementById("quantumDisease");

const quantumConfidence =
    document.getElementById("quantumConfidence");

const quantumConfidenceBar =
    document.getElementById("quantumConfidenceBar");

const rfTestAccuracy =
    document.getElementById("rfTestAccuracy");

const quantumTestAccuracy =
    document.getElementById("quantumTestAccuracy");


const analysisComparison =
    document.getElementById("analysisComparison");


const quantumPageResult =
    document.getElementById("quantumPageResult");


const comparisonRF =
    document.getElementById("comparisonRF");

const comparisonQuantum =
    document.getElementById("comparisonQuantum");

const comparisonSummary =
    document.getElementById("comparisonSummary");


const historyList =
    document.getElementById("historyList");

const doctorList =
    document.getElementById("doctorList");


const predictionCount =
    document.getElementById("predictionCount");

const latestDisease =
    document.getElementById("latestDisease");

const dashboardLatest =
    document.getElementById("dashboardLatest");


const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const profileMessage =
    document.getElementById("profileMessage");


// ============================================================
// AUTH MODE
// ============================================================

let authMode = "login";


function setAuthMode(mode) {

    authMode = mode;

    if (mode === "login") {

        loginTab.classList.add("active");

        signupTab.classList.remove("active");

        authSubmit.textContent =
            "Login";

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

    showAuthMessage("");
}


// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(
    text,
    error = false
) {

    authMessage.textContent =
        text;

    authMessage.style.color =
        error
            ? "#dc2626"
            : "#16a34a";
}


// ============================================================
// FIREBASE AUTH
// ============================================================

async function handleAuthentication() {

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


    authSubmit.disabled = true;

    authSubmit.textContent =
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

        console.error(
            "Authentication error:",
            error
        );


        let text =
            "Authentication failed.";


        switch (error.code) {

            case "auth/invalid-email":

                text =
                    "Please enter a valid email.";

                break;


            case "auth/user-not-found":

                text =
                    "No account found with this email.";

                break;


            case "auth/wrong-password":

                text =
                    "Incorrect password.";

                break;


            case "auth/invalid-credential":

                text =
                    "Invalid email or password.";

                break;


            case "auth/email-already-in-use":

                text =
                    "Email already registered. Please login.";

                break;


            case "auth/weak-password":

                text =
                    "Password must contain at least 6 characters.";

                break;


            case "auth/too-many-requests":

                text =
                    "Too many attempts. Try again later.";

                break;


            default:

                text =
                    error.message || text;
        }


        showAuthMessage(
            text,
            true
        );

    } finally {

        authSubmit.disabled = false;

        authSubmit.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";
    }
}


// ============================================================
// AUTH BUTTONS
// ============================================================

loginTab.addEventListener(
    "click",
    () => setAuthMode("login")
);


signupTab.addEventListener(
    "click",
    () => setAuthMode("signup")
);


authSubmit.addEventListener(
    "click",
    handleAuthentication
);


authPassword.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            handleAuthentication();
        }
    }
);


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


            userEmail.textContent =
                user.email;


            const savedProfile =
                getProfile();


            if (
                savedProfile &&
                savedProfile.name
            ) {

                welcomeName.textContent =
                    savedProfile.name;

            } else {

                welcomeName.textContent =
                    user.email.split("@")[0];
            }


            loadHistory();

            loadPerformance();

            showPage(
                "dashboard"
            );

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

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

        } catch (error) {

            alert(
                "Logout failed: " +
                error.message
            );
        }
    }
);


// ============================================================
// PAGE NAVIGATION
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
        "Doctors",

    quantum:
        "Quantum Analysis",

    comparison:
        "Random Forest vs Quantum",

    performance:
        "Performance Dashboard"
};


function showPage(pageName) {

    pages.forEach(
        page => {

            page.classList.remove(
                "active-page"
            );
        }
    );


    const selectedPage =
        document.getElementById(
            pageName
        );


    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );
    }


    navItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page === pageName
            );
        }
    );


    pageTitle.textContent =
        pageNames[pageName] ||
        "Dashboard";


    if (pageName === "history") {

        loadHistory();
    }


    if (pageName === "doctors") {

        loadDoctors();
    }


    if (pageName === "performance") {

        loadPerformance();
    }


    if (pageName === "quantum") {

        updateQuantumPage();
    }


    if (pageName === "comparison") {

        updateComparisonPage();
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// SIDEBAR NAVIGATION
// ============================================================

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


// ============================================================
// DASHBOARD BUTTONS
// ============================================================

document
    .querySelectorAll("[data-go]")
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
// PROFILE
// ============================================================

function profileKey() {

    const user =
        auth.currentUser;

    if (!user) {
        return null;
    }

    return (
        "quantum_profile_" +
        user.uid
    );
}


function getProfile() {

    const key =
        profileKey();

    if (!key) {
        return null;
    }

    try {

        return JSON.parse(
            localStorage.getItem(key)
        );

    } catch {

        return null;
    }
}


function loadProfile() {

    const profile =
        getProfile();

    if (!profile) {
        return;
    }


    document.getElementById(
        "profileName"
    ).value =
        profile.name || "";


    document.getElementById(
        "profileGender"
    ).value =
        profile.gender || "";


    document.getElementById(
        "profileAge"
    ).value =
        profile.age || "";


    document.getElementById(
        "profileHeight"
    ).value =
        profile.height || "";


    document.getElementById(
        "profileWeight"
    ).value =
        profile.weight || "";


    if (profile.name) {

        welcomeName.textContent =
            profile.name;
    }
}


saveProfileBtn.addEventListener(
    "click",
    () => {

        const profile = {

            name:
                document.getElementById(
                    "profileName"
                ).value.trim(),

            gender:
                document.getElementById(
                    "profileGender"
                ).value,

            age:
                document.getElementById(
                    "profileAge"
                ).value,

            height:
                document.getElementById(
                    "profileHeight"
                ).value,

            weight:
                document.getElementById(
                    "profileWeight"
                ).value
        };


        const key =
            profileKey();


        if (!key) {

            return;
        }


        localStorage.setItem(
            key,
            JSON.stringify(profile)
        );


        welcomeName.textContent =
            profile.name || "Patient";


        profileMessage.textContent =
            "Profile saved successfully.";

        profileMessage.style.color =
            "#16a34a";


        setTimeout(
            () => {

                profileMessage.textContent =
                    "";
            },
            2500
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


function getSelectedSymptoms() {

    const selected = [];

    getSymptomBoxes()
        .forEach(
            box => {

                if (box.checked) {

                    selected.push(
                        box.value
                    );
                }
            }
        );

    return selected;
}


function updateCount() {

    count.textContent =
        getSelectedSymptoms().length;
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


updateCount();


// ============================================================
// SEARCH
// ============================================================

searchInput.addEventListener(
    "input",
    event => {

        const text =
            event.target.value
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                "#symptomGrid .symptom"
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

clearBtn.addEventListener(
    "click",
    () => {

        getSymptomBoxes()
            .forEach(
                box => {

                    box.checked = false;
                }
            );


        updateCount();


        searchInput.value =
            "";


        document
            .querySelectorAll(
                "#symptomGrid .symptom"
            )
            .forEach(
                symptom => {

                    symptom.style.display =
                        "";
                }
            );


        result.classList.add(
            "hidden"
        );
    }
);


// ============================================================
// FORMAT DISEASE
// ============================================================

function formatDisease(name) {

    if (!name) {
        return "—";
    }

    return String(name)
        .replaceAll("_", " ")
        .replace(/\s+/g, " ")
        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );
}


// ============================================================
// ANALYZE SYMPTOMS
// ============================================================

predictBtn.addEventListener(
    "click",
    makePrediction
);


async function makePrediction() {

    const selectedSymptoms =
        getSelectedSymptoms();


    if (selectedSymptoms.length === 0) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }


    predictBtn.disabled = true;

    predictBtn.textContent =
        "Analyzing...";


    try {

        const payload = {};


        getSymptomBoxes()
            .forEach(
                box => {

                    payload[
                        box.value
                    ] =
                        box.checked
                            ? 1
                            : 0;
                }
            );


        payload.selected_symptoms =
            selectedSymptoms;


        const response =
            await fetch(
                "/api/analyze",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "Analysis failed."
            );
        }


        displayResults(
            data,
            selectedSymptoms
        );


        saveHistory(
            data,
            selectedSymptoms
        );


        showPage(
            "prediction"
        );


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        alert(
            "Analysis failed: " +
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
// DISPLAY RESULTS
// ============================================================

let latestAnalysis = null;


function displayResults(
    data,
    selectedSymptoms
) {

    latestAnalysis = data;


    result.classList.remove(
        "hidden"
    );


    // ========================================================
    // RANDOM FOREST
    // ========================================================

    const rf =
        data.random_forest;


    disease.textContent =
        formatDisease(
            rf.prediction
        );


    const rfChance =
        Number(
            rf.confidence || 0
        );


    confidenceText.textContent =
        rfChance.toFixed(2) +
        "%";


    confidenceBar.style.width =
        Math.min(
            100,
            Math.max(
                0,
                rfChance
            )
        ) +
        "%";


    rfTestAccuracy.textContent =
        Number(
            rf.test_accuracy || 0
        ).toFixed(2) +
        "%";


    // ========================================================
    // TOP PREDICTIONS
    // ========================================================

    topPredictions.innerHTML =
        "";


    const top =
        rf.top_predictions || [];


    top.forEach(
        (item, index) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "top-row";


            row.innerHTML = `

                <div class="top-rank">
                    #${index + 1}
                </div>

                <div class="top-disease">
                    ${escapeHtml(
                        formatDisease(
                            item.disease
                        )
                    )}
                </div>

                <div class="top-confidence">
                    ${Number(
                        item.confidence
                    ).toFixed(2)}%
                </div>

            `;


            topPredictions.appendChild(
                row
            );
        }
    );


    // ========================================================
    // QISKIT
    // ========================================================

    const q =
        data.qiskit;


    if (q) {

        quantumDisease.textContent =
            formatDisease(
                q.prediction
            );


        const qChance =
            Number(
                q.confidence || 0
            );


        quantumConfidence.textContent =
            qChance.toFixed(2) +
            "%";


        quantumConfidenceBar.style.width =
            Math.min(
                100,
                Math.max(
                    0,
                    qChance
                )
            ) +
            "%";


        quantumTestAccuracy.textContent =
            Number(
                q.test_accuracy || 0
            ).toFixed(2) +
            "%";

    } else {

        quantumDisease.textContent =
            "Unavailable";

        quantumConfidence.textContent =
            "N/A";

        quantumConfidenceBar.style.width =
            "0%";

        quantumTestAccuracy.textContent =
            "N/A";
    }


    // ========================================================
    // COMPARISON
    // ========================================================

    const comparison =
        data.comparison;


    comparisonRF.textContent =
        Number(
            comparison.random_forest_confidence ||
            0
        ).toFixed(2) +
        "%";


    if (
        comparison.quantum_confidence !== null &&
        comparison.quantum_confidence !== undefined
    ) {

        comparisonQuantum.textContent =
            Number(
                comparison.quantum_confidence
            ).toFixed(2) +
            "%";

    } else {

        comparisonQuantum.textContent =
            "N/A";
    }


    if (q) {

        if (comparison.same_prediction) {

            analysisComparison.innerHTML = `

                <strong>
                    Both models selected the same
                    predicted condition.
                </strong>

                <br><br>

                Random Forest:
                <strong>
                    ${Number(
                        rf.confidence
                    ).toFixed(2)}%
                </strong>

                <br>

                Qiskit:
                <strong>
                    ${Number(
                        q.confidence
                    ).toFixed(2)}%
                </strong>

            `;

        } else {

            analysisComparison.innerHTML = `

                The models produced different
                predictions.

                <br><br>

                Random Forest:
                <strong>
                    ${escapeHtml(
                        formatDisease(
                            rf.prediction
                        )
                    )}
                </strong>

                (${Number(
                    rf.confidence
                ).toFixed(2)}%)

                <br>

                Qiskit:
                <strong>
                    ${escapeHtml(
                        formatDisease(
                            q.prediction
                        )
                    )}
                </strong>

                (${Number(
                    q.confidence
                ).toFixed(2)}%)

            `;
        }

    } else {

        analysisComparison.textContent =
            "Qiskit was unavailable on the server.";
    }


    // ========================================================
    // DISCLAIMER
    // ========================================================

    message.textContent =
        data.message ||
        "Educational model prediction only.";


    // ========================================================
    // UPDATE QUANTUM PAGE
    // ========================================================

    updateQuantumPage();


    // ========================================================
    // UPDATE COMPARISON PAGE
    // ========================================================

    updateComparisonPage();


    // ========================================================
    // DASHBOARD
    // ========================================================

    dashboardLatest.innerHTML = `

        <div class="history-confidence">
            ${Number(
                rf.confidence
            ).toFixed(2)}% confidence
        </div>

        <strong>
            ${escapeHtml(
                formatDisease(
                    rf.prediction
                )
            )}
        </strong>

        <p class="muted">
            ${selectedSymptoms.length}
            symptoms analyzed.
        </p>
    `;


    latestDisease.textContent =
        formatDisease(
            rf.prediction
        );


    updatePredictionCount();
}


// ============================================================
// QUANTUM PAGE
// ============================================================

function updateQuantumPage() {

    if (!latestAnalysis ||
        !latestAnalysis.qiskit) {

        quantumPageResult.innerHTML = `

            <div class="empty-state">

                Run "Analyze Symptoms" first.

            </div>
        `;

        return;
    }


    const q =
        latestAnalysis.qiskit;


    const symptoms =
        latestAnalysis.selected_symptoms ||
        [];


    quantumPageResult.innerHTML = `

        <div class="card">

            <h3>
                Quantum Prediction
            </h3>

            <h2>
                ${escapeHtml(
                    formatDisease(
                        q.prediction
                    )
                )}
            </h2>

            <div class="quantum-stats">

                <div class="quantum-stat">

                    <span>
                        Experimental Chance
                    </span>

                    <strong>
                        ${Number(
                            q.confidence
                        ).toFixed(2)}%
                    </strong>

                </div>


                <div class="quantum-stat">

                    <span>
                        Qubits Used
                    </span>

                    <strong>
                        ${q.qubits}
                    </strong>

                </div>


                <div class="quantum-stat">

                    <span>
                        Circuit Depth
                    </span>

                    <strong>
                        ${q.circuit_depth}
                    </strong>

                </div>

            </div>


            <p class="muted">

                Selected symptoms:
                ${symptoms
                    .map(
                        formatDisease
                    )
                    .join(", ")}

            </p>


            <div class="notice">

                The quantum percentage is a
                confidence-like experimental score
                generated by the Qiskit quantum-kernel
                model. It is not a clinically validated
                probability.

            </div>

        </div>
    `;
}


// ============================================================
// COMPARISON PAGE
// ============================================================

function updateComparisonPage() {

    if (!latestAnalysis) {

        comparisonRF.textContent =
            "—";

        comparisonQuantum.textContent =
            "—";

        comparisonSummary.textContent =
            "Analyze symptoms to populate the comparison.";

        return;
    }


    const rf =
        latestAnalysis.random_forest;

    const q =
        latestAnalysis.qiskit;


    comparisonRF.textContent =
        Number(
            rf.confidence
        ).toFixed(2) +
        "%";


    comparisonQuantum.textContent =
        q
            ? Number(
                q.confidence
            ).toFixed(2) + "%"
            : "N/A";


    if (!q) {

        comparisonSummary.textContent =
            "Random Forest is available, but the Qiskit component is currently unavailable.";

        return;
    }


    const same =
        latestAnalysis
            .comparison
            .same_prediction;


    if (same) {

        comparisonSummary.innerHTML = `

            <strong>
                Both models selected the same condition:
            </strong>

            ${escapeHtml(
                formatDisease(
                    rf.prediction
                )
            )}

            <br><br>

            Random Forest confidence:
            ${Number(
                rf.confidence
            ).toFixed(2)}%

            <br>

            Qiskit experimental confidence:
            ${Number(
                q.confidence
            ).toFixed(2)}%

        `;

    } else {

        comparisonSummary.innerHTML = `

            <strong>
                The models produced different predictions.
            </strong>

            <br><br>

            Random Forest:
            ${escapeHtml(
                formatDisease(
                    rf.prediction
                )
            )}
            —
            ${Number(
                rf.confidence
            ).toFixed(2)}%

            <br>

            Qiskit:
            ${escapeHtml(
                formatDisease(
                    q.prediction
                )
            )}
            —
            ${Number(
                q.confidence
            ).toFixed(2)}%

        `;
    }
}


// ============================================================
// LOCAL HISTORY
// ============================================================

function historyKey() {

    const user =
        auth.currentUser;

    if (!user) {
        return null;
    }

    return (
        "quantum_history_" +
        user.uid
    );
}


function getHistory() {

    const key =
        historyKey();


    if (!key) {
        return [];
    }


    try {

        return JSON.parse(
            localStorage.getItem(key)
        ) || [];

    } catch {

        return [];
    }
}


function saveHistory(
    data,
    selectedSymptoms
) {

    const key =
        historyKey();


    if (!key) {
        return;
    }


    const history =
        getHistory();


    const item = {

        id:
            Date.now(),

        date:
            new Date().toISOString(),

        disease:
            data.random_forest.prediction,

        confidence:
            data.random_forest.confidence,

        symptoms:
            selectedSymptoms,

        quantum:
            data.qiskit
                ? {
                    prediction:
                        data.qiskit.prediction,

                    confidence:
                        data.qiskit.confidence
                }
                : null
    };


    history.unshift(
        item
    );


    localStorage.setItem(
        key,
        JSON.stringify(
            history.slice(
                0,
                50
            )
        )
    );


    loadHistory();
}


// ============================================================
// LOAD HISTORY
// ============================================================

function loadHistory() {

    const history =
        getHistory();


    updatePredictionCount(
        history
    );


    if (history.length === 0) {

        historyList.innerHTML = `

            <div class="empty-state">
                No predictions yet.
            </div>

        `;

        return;
    }


    historyList.innerHTML =
        "";


    history.forEach(
        item => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "history-item";


            const date =
                new Date(
                    item.date
                ).toLocaleString();


            div.innerHTML = `

                <div class="history-header">

                    <div class="history-disease">

                        ${escapeHtml(
                            formatDisease(
                                item.disease
                            )
                        )}

                    </div>

                    <div class="history-date">

                        ${escapeHtml(
                            date
                        )}

                    </div>

                </div>


                <div class="history-confidence">

                    Random Forest:
                    ${Number(
                        item.confidence
                    ).toFixed(2)}%

                </div>


                <div class="history-symptoms">

                    Symptoms:
                    ${item.symptoms
                        .map(
                            symptom =>
                                escapeHtml(
                                    formatDisease(
                                        symptom
                                    )
                                )
                        )
                        .join(", ")}

                </div>


                ${
                    item.quantum
                    ? `
                    <div class="history-symptoms">

                        Qiskit:
                        ${escapeHtml(
                            formatDisease(
                                item.quantum.prediction
                            )
                        )}
                        —
                        ${Number(
                            item.quantum.confidence
                        ).toFixed(2)}%

                    </div>
                    `
                    : ""
                }

            `;


            historyList.appendChild(
                div
            );
        }
    );
}


// ============================================================
// COUNT
// ============================================================

function updatePredictionCount(
    history = getHistory()
) {

    predictionCount.textContent =
        history.length;


    if (history.length > 0) {

        latestDisease.textContent =
            formatDisease(
                history[0].disease
            );
    }
}


// ============================================================
// DOCTORS
// ============================================================

async function loadDoctors() {

    try {

        const response =
            await fetch(
                "/api/doctors"
            );


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.error ||
                "Could not load doctors."
            );
        }


        doctorList.innerHTML =
            "";


        data.doctors.forEach(
            doctor => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "doctor-card";


                card.innerHTML = `

                    <strong>
                        ${escapeHtml(
                            doctor.name
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            doctor.specialization
                        )}
                    </span>

                    <span>
                        ${escapeHtml(
                            doctor.hospital
                        )}
                    </span>

                    <span>
                        ${escapeHtml(
                            doctor.location
                        )}
                    </span>

                    <span>
                        ${escapeHtml(
                            doctor.experience
                        )} experience
                    </span>

                `;


                doctorList.appendChild(
                    card
                );
            }
        );


    } catch (error) {

        console.error(
            "Doctor error:",
            error
        );


        doctorList.innerHTML = `

            <div class="empty-state">
                Could not load doctors.
            </div>
        `;
    }
}


// ============================================================
// PERFORMANCE
// ============================================================

async function loadPerformance() {

    try {

        const response =
            await fetch(
                "/api/status"
            );


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.error ||
                "Could not load performance."
            );
        }


        document.getElementById(
            "metricAccuracy"
        ).textContent =
            data.random_forest.accuracy +
            "%";


        document.getElementById(
            "metricPrecision"
        ).textContent =
            data.random_forest.precision +
            "%";


        document.getElementById(
            "metricRecall"
        ).textContent =
            data.random_forest.recall +
            "%";


        document.getElementById(
            "metricF1"
        ).textContent =
            data.random_forest.f1 +
            "%";


        document.getElementById(
            "trainingSamples"
        ).textContent =
            data.training_samples;


        document.getElementById(
            "testingSamples"
        ).textContent =
            data.testing_samples;


        document.getElementById(
            "symptomTotal"
        ).textContent =
            data.number_of_symptoms;


        document.getElementById(
            "diseaseTotal"
        ).textContent =
            data.number_of_diseases;


    } catch (error) {

        console.error(
            "Performance error:",
            error
        );
    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// INITIALIZE
// ============================================================

loadProfile();

loadHistory();

loadPerformance();

console.log(
    "QuantumDiagnose loaded successfully."
);
