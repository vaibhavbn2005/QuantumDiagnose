/* =========================================================
   QUANTUM DIAGNOSE - MAIN JAVASCRIPT
   Random Forest + Qiskit Prediction
   ========================================================= */

// ===============================
// GLOBAL VARIABLES
// ===============================

let currentUser = null;
let lastPrediction = null;


// ===============================
// PAGE LOAD
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    console.log("Quantum Diagnose JS loaded");

    initializeApp();
    setupNavigation();
    setupLogin();
    setupSignup();
    setupPrediction();
    setupLogout();
});


// ===============================
// INITIALIZE APP
// ===============================

function initializeApp() {

    const savedUser = localStorage.getItem("quantumDiagnoseUser");

    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard();
        } catch (error) {
            localStorage.removeItem("quantumDiagnoseUser");
        }
    } else {
        showLogin();
    }
}


// ===============================
// PAGE HELPERS
// ===============================

function getElement(...ids) {

    for (const id of ids) {
        const element = document.getElementById(id);

        if (element) {
            return element;
        }
    }

    return null;
}


function showElement(element) {

    if (!element) return;

    element.style.display = "";
}


function hideElement(element) {

    if (!element) return;

    element.style.display = "none";
}


// ===============================
// SHOW LOGIN
// ===============================

function showLogin() {

    const loginPage = getElement(
        "loginPage",
        "login-section",
        "loginSection",
        "login"
    );

    const signupPage = getElement(
        "signupPage",
        "signup-section",
        "signupSection",
        "signup"
    );

    const dashboard = getElement(
        "dashboard",
        "dashboardPage",
        "mainDashboard",
        "app"
    );

    if (loginPage) showElement(loginPage);
    if (signupPage) hideElement(signupPage);

    if (dashboard) hideElement(dashboard);
}


// ===============================
// SHOW SIGNUP
// ===============================

function showSignup() {

    const loginPage = getElement(
        "loginPage",
        "login-section",
        "loginSection",
        "login"
    );

    const signupPage = getElement(
        "signupPage",
        "signup-section",
        "signupSection",
        "signup"
    );

    if (loginPage) hideElement(loginPage);
    if (signupPage) showElement(signupPage);
}


// ===============================
// SHOW DASHBOARD
// ===============================

function showDashboard() {

    const loginPage = getElement(
        "loginPage",
        "login-section",
        "loginSection",
        "login"
    );

    const signupPage = getElement(
        "signupPage",
        "signup-section",
        "signupSection",
        "signup"
    );

    const dashboard = getElement(
        "dashboard",
        "dashboardPage",
        "mainDashboard",
        "app"
    );

    if (loginPage) hideElement(loginPage);
    if (signupPage) hideElement(signupPage);
    if (dashboard) showElement(dashboard);

    updateUserInformation();
}


// ===============================
// UPDATE USER INFORMATION
// ===============================

function updateUserInformation() {

    if (!currentUser) return;

    const userName = getElement(
        "userName",
        "profileName",
        "patientName",
        "welcomeName"
    );

    if (userName) {
        userName.textContent =
            currentUser.name ||
            currentUser.email ||
            "Patient";
    }

    const userEmail = getElement(
        "userEmail",
        "profileEmail",
        "patientEmail"
    );

    if (userEmail) {
        userEmail.textContent =
            currentUser.email || "";
    }
}


// ===============================
// NAVIGATION
// ===============================

function setupNavigation() {

    const signupLinks = document.querySelectorAll(
        "#signupBtn, #goToSignup, .signup-btn, [data-action='signup']"
    );

    signupLinks.forEach(button => {

        button.addEventListener("click", function (event) {

            event.preventDefault();
            showSignup();

        });

    });


    const loginLinks = document.querySelectorAll(
        "#loginBtn, #goToLogin, .login-btn, [data-action='login']"
    );

    loginLinks.forEach(button => {

        button.addEventListener("click", function (event) {

            event.preventDefault();
            showLogin();

        });

    });


    // Dashboard navigation buttons

    const dashboardButtons = document.querySelectorAll(
        "[data-section]"
    );

    dashboardButtons.forEach(button => {

        button.addEventListener("click", function () {

            const sectionName =
                this.getAttribute("data-section");

            showSection(sectionName);

        });

    });
}


// ===============================
// SHOW SECTION
// ===============================

function showSection(sectionName) {

    if (!sectionName) return;

    const sections = document.querySelectorAll(
        ".dashboard-section, .content-section"
    );

    sections.forEach(section => {

        section.style.display = "none";

    });


    const target = document.getElementById(sectionName);

    if (target) {

        target.style.display = "block";

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
}


// ===============================
// LOGIN
// ===============================

function setupLogin() {

    const loginForm = getElement(
        "loginForm",
        "login-form"
    );

    if (!loginForm) {
        console.log("Login form not found");
        return;
    }


    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const emailInput = getElement(
            "loginEmail",
            "email",
            "userEmail"
        );

        const passwordInput = getElement(
            "loginPassword",
            "password",
            "userPassword"
        );

        const email =
            emailInput ? emailInput.value.trim() : "";

        const password =
            passwordInput ? passwordInput.value : "";


        if (!email || !password) {

            alert("Please enter email and password.");
            return;

        }


        // Firebase authentication can be connected here.
        // For the current frontend flow, create a local session.

        currentUser = {
            email: email,
            name: email.split("@")[0]
        };


        localStorage.setItem(
            "quantumDiagnoseUser",
            JSON.stringify(currentUser)
        );


        showDashboard();

    });
}


// ===============================
// SIGNUP
// ===============================

function setupSignup() {

    const signupForm = getElement(
        "signupForm",
        "signup-form"
    );

    if (!signupForm) {
        console.log("Signup form not found");
        return;
    }


    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        const nameInput = getElement(
            "signupName",
            "name",
            "registerName"
        );

        const emailInput = getElement(
            "signupEmail",
            "email",
            "registerEmail"
        );

        const passwordInput = getElement(
            "signupPassword",
            "password",
            "registerPassword"
        );


        const name =
            nameInput ? nameInput.value.trim() : "";

        const email =
            emailInput ? emailInput.value.trim() : "";

        const password =
            passwordInput ? passwordInput.value : "";


        if (!name || !email || !password) {

            alert("Please fill all fields.");
            return;

        }


        if (password.length < 6) {

            alert(
                "Password should contain at least 6 characters."
            );

            return;
        }


        // Store a basic frontend session.
        // Replace with Firebase createUserWithEmailAndPassword
        // if Firebase Authentication is enabled.

        currentUser = {
            name: name,
            email: email
        };


        localStorage.setItem(
            "quantumDiagnoseUser",
            JSON.stringify(currentUser)
        );


        alert("Account created successfully.");

        showDashboard();

    });
}


// ===============================
// LOGOUT
// ===============================

function setupLogout() {

    const logoutButtons = document.querySelectorAll(
        "#logoutBtn, #logout, .logout-btn, [data-action='logout']"
    );


    logoutButtons.forEach(button => {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            currentUser = null;

            lastPrediction = null;

            localStorage.removeItem(
                "quantumDiagnoseUser"
            );

            showLogin();

        });

    });
}


// =========================================================
// SYMPTOM PREDICTION
// =========================================================

function setupPrediction() {

    const predictionForm = getElement(
        "predictionForm",
        "symptomForm",
        "analysisForm",
        "predictForm"
    );


    const analyzeButton = getElement(
        "analyzeBtn",
        "analyzeSymptoms",
        "predictBtn",
        "analyzeButton"
    );


    if (predictionForm) {

        predictionForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                analyzeSymptoms();

            }
        );

    }


    if (analyzeButton) {

        analyzeButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                analyzeSymptoms();

            }
        );

    }
}


// =========================================================
// ANALYZE SYMPTOMS
// =========================================================

async function analyzeSymptoms() {

    console.log("Analyze Symptoms clicked");


    const symptoms = collectSymptoms();


    if (symptoms.length === 0) {

        alert(
            "Please select or enter at least one symptom."
        );

        return;
    }


    const button = getElement(
        "analyzeBtn",
        "analyzeSymptoms",
        "predictBtn",
        "analyzeButton"
    );


    const originalText =
        button ? button.innerHTML : "Analyze Symptoms";


    if (button) {

        button.disabled = true;

        button.innerHTML =
            "⏳ Running Random Forest + Qiskit...";
    }


    showLoading();


    try {

        /*
         * IMPORTANT
         *
         * Your Vercel backend should have:
         *
         * POST /api/predict
         *
         * Example request:
         *
         * {
         *   "symptoms": ["fever", "cough"]
         * }
         *
         * Example response:
         *
         * {
         *   "disease": "Flu",
         *   "random_forest": 82.4,
         *   "qiskit": 79.8
         * }
         */


        const response = await fetch(
            "/api/predict",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    symptoms: symptoms,

                    patient: currentUser
                        ? currentUser.email
                        : null
                })
            }
        );


        if (!response.ok) {

            throw new Error(
                "Prediction API returned " +
                response.status
            );

        }


        const data = await response.json();


        console.log(
            "Prediction response:",
            data
        );


        const result = normalizePrediction(data);


        lastPrediction = result;


        displayPrediction(result);

        savePredictionHistory(result);


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        /*
         * If your backend is not ready yet,
         * show an error instead of inventing a
         * medical prediction.
         */

        displayPredictionError(
            "Unable to connect to the prediction server. " +
            "Please make sure /api/predict is deployed correctly."
        );

    } finally {

        hideLoading();


        if (button) {

            button.disabled = false;

            button.innerHTML = originalText;

        }

    }
}


// =========================================================
// COLLECT SYMPTOMS
// =========================================================

function collectSymptoms() {

    const symptoms = [];


    // -----------------------------------------
    // Checkbox symptoms
    // -----------------------------------------

    const checkedSymptoms =
        document.querySelectorAll(
            "input[type='checkbox']:checked"
        );


    checkedSymptoms.forEach(input => {

        const value =
            input.value ||
            input.getAttribute("data-symptom") ||
            input.name;


        if (value) {

            symptoms.push(
                value.trim().toLowerCase()
            );

        }

    });


    // -----------------------------------------
    // Select dropdown
    // -----------------------------------------

    const symptomSelect = getElement(
        "symptoms",
        "symptom",
        "symptomSelect"
    );


    if (
        symptomSelect &&
        symptomSelect.tagName === "SELECT"
    ) {

        const selected =
            Array.from(
                symptomSelect.selectedOptions
            );


        selected.forEach(option => {

            if (
                option.value &&
                option.value !== "none"
            ) {

                symptoms.push(
                    option.value
                        .trim()
                        .toLowerCase()
                );

            }

        });

    }


    // -----------------------------------------
    // Text input
    // -----------------------------------------

    const symptomText = getElement(
        "symptomText",
        "symptomInput",
        "symptomsInput",
        "symptomsText",
        "symptoms"
    );


    if (
        symptomText &&
        (
            symptomText.tagName === "TEXTAREA" ||
            symptomText.tagName === "INPUT"
        )
    ) {

        const value =
            symptomText.value.trim();


        if (value) {

            const textSymptoms =
                value
                    .split(",")
                    .map(item =>
                        item.trim().toLowerCase()
                    )
                    .filter(Boolean);


            symptoms.push(
                ...textSymptoms
            );

        }

    }


    // -----------------------------------------
    // Remove duplicates
    // -----------------------------------------

    return [...new Set(symptoms)];
}


// =========================================================
// NORMALIZE BACKEND RESULT
// =========================================================

function normalizePrediction(data) {

    /*
     * This accepts several possible backend names.
     * Therefore you don't have to completely rewrite
     * the frontend if your Python API uses a slightly
     * different response structure.
     */


    const disease =
        data.disease ||
        data.prediction ||
        data.diagnosis ||
        data.result ||
        "Analysis completed";


    const randomForest =
        extractPercentage(
            data.random_forest ??
            data.randomForest ??
            data.rf_probability ??
            data.rf_probability_percent ??
            data.random_forest_probability
        );


    const qiskit =
        extractPercentage(
            data.qiskit ??
            data.qiskit_probability ??
            data.qiskit_probability_percent ??
            data.quantum_probability ??
            data.quantum
        );


    return {

        disease: disease,

        randomForest: randomForest,

        qiskit: qiskit,

        symptoms:
            data.symptoms ||
            collectSymptoms(),

        timestamp:
            data.timestamp ||
            new Date().toISOString()

    };
}


// =========================================================
// EXTRACT PERCENTAGE
// =========================================================

function extractPercentage(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    // If backend sends an object

    if (
        typeof value === "object"
    ) {

        value =
            value.probability ??
            value.confidence ??
            value.score ??
            value.percentage;

    }


    let number =
        Number(value);


    if (Number.isNaN(number)) {

        return null;

    }


    /*
     * If backend gives 0.82,
     * convert to 82%.
     */

    if (
        number >= 0 &&
        number <= 1
    ) {

        number = number * 100;

    }


    return Math.max(
        0,
        Math.min(
            100,
            Number(number.toFixed(2))
        )
    );
}


// =========================================================
// DISPLAY PREDICTION
// =========================================================

function displayPrediction(result) {

    const resultSection = getElement(
        "predictionResult",
        "results",
        "resultSection",
        "analysisResult"
    );


    if (resultSection) {

        resultSection.style.display =
            "block";

    }


    // -----------------------------------------
    // Disease
    // -----------------------------------------

    const diseaseElement = getElement(
        "predictionDisease",
        "diseaseResult",
        "diagnosis",
        "disease",
        "resultDisease"
    );


    if (diseaseElement) {

        diseaseElement.textContent =
            result.disease;

    }


    // -----------------------------------------
    // Random Forest
    // -----------------------------------------

    const rfElement = getElement(
        "randomForestPercentage",
        "rfPercentage",
        "rfResult",
        "randomForestResult",
        "randomForestScore"
    );


    if (rfElement) {

        if (result.randomForest !== null) {

            rfElement.textContent =
                result.randomForest + "%";

        } else {

            rfElement.textContent =
                "Not available";

        }

    }


    // -----------------------------------------
    // Qiskit
    // -----------------------------------------

    const qiskitElement = getElement(
        "qiskitPercentage",
        "quantumPercentage",
        "qiskitResult",
        "quantumResult",
        "qiskitScore"
    );


    if (qiskitElement) {

        if (result.qiskit !== null) {

            qiskitElement.textContent =
                result.qiskit + "%";

        } else {

            qiskitElement.textContent =
                "Not available";

        }

    }


    // -----------------------------------------
    // Progress bars
    // -----------------------------------------

    updateProgressBar(
        [
            "randomForestBar",
            "rfProgress",
            "rfBar"
        ],
        result.randomForest
    );


    updateProgressBar(
        [
            "qiskitBar",
            "quantumProgress",
            "quantumBar"
        ],
        result.qiskit
    );


    // -----------------------------------------
    // Comparison
    // -----------------------------------------

    displayComparison(result);


    // -----------------------------------------
    // Timestamp
    // -----------------------------------------

    const timeElement = getElement(
        "predictionTime",
        "analysisTime",
        "resultTime"
    );


    if (timeElement) {

        timeElement.textContent =
            new Date(
                result.timestamp
            ).toLocaleString();

    }


    // Scroll to result

    if (resultSection) {

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
}


// =========================================================
// UPDATE PROGRESS BAR
// =========================================================

function updateProgressBar(
    ids,
    percentage
) {

    if (percentage === null) return;


    for (const id of ids) {

        const bar =
            document.getElementById(id);


        if (bar) {

            bar.style.width =
                percentage + "%";

            bar.setAttribute(
                "aria-valuenow",
                percentage
            );

            break;

        }

    }
}


// =========================================================
// COMPARISON
// =========================================================

function displayComparison(result) {

    const comparisonElement = getElement(
        "comparisonResult",
        "modelComparison",
        "comparison",
        "quantumComparison"
    );


    if (!comparisonElement) return;


    if (
        result.randomForest === null ||
        result.qiskit === null
    ) {

        comparisonElement.innerHTML = `
            <p>
                Comparison is unavailable because
                both model results were not returned.
            </p>
        `;

        return;

    }


    const difference =
        Math.abs(
            result.randomForest -
            result.qiskit
        ).toFixed(2);


    let higherModel;


    if (
        result.randomForest >
        result.qiskit
    ) {

        higherModel =
            "Random Forest";

    } else if (
        result.qiskit >
        result.randomForest
    ) {

        higherModel =
            "Qiskit";

    } else {

        higherModel =
            "Both models";

    }


    comparisonElement.innerHTML = `
        <div class="comparison-card">

            <h3>Model Comparison</h3>

            <p>
                <strong>Random Forest:</strong>
                ${result.randomForest}%
            </p>

            <p>
                <strong>Qiskit Quantum Model:</strong>
                ${result.qiskit}%
            </p>

            <p>
                <strong>Difference:</strong>
                ${difference} percentage points
            </p>

            <p>
                <strong>Higher model score:</strong>
                ${higherModel}
            </p>

            <small>
                These values represent model outputs,
                not a confirmed medical diagnosis.
            </small>

        </div>
    `;
}


// =========================================================
// ERROR DISPLAY
// =========================================================

function displayPredictionError(message) {

    const resultSection = getElement(
        "predictionResult",
        "results",
        "resultSection",
        "analysisResult"
    );


    if (resultSection) {

        resultSection.style.display =
            "block";


        resultSection.innerHTML = `
            <div class="error-card">

                <h3>⚠ Analysis Error</h3>

                <p>${escapeHTML(message)}</p>

                <p>
                    Check that your Python prediction
                    API is deployed at:
                </p>

                <code>/api/predict</code>

            </div>
        `;

    } else {

        alert(message);

    }
}


// =========================================================
// LOADING
// =========================================================

function showLoading() {

    const loading = getElement(
        "loading",
        "loadingIndicator",
        "predictionLoading"
    );


    if (loading) {

        loading.style.display =
            "block";

    }
}


function hideLoading() {

    const loading = getElement(
        "loading",
        "loadingIndicator",
        "predictionLoading"
    );


    if (loading) {

        loading.style.display =
            "none";

    }
}


// =========================================================
// SAVE HISTORY
// =========================================================

function savePredictionHistory(result) {

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    "quantumDiagnoseHistory"
                ) || "[]"
            );


        history.unshift({

            ...result,

            user:
                currentUser
                    ? currentUser.email
                    : "guest"

        });


        // Keep latest 20 results

        const limitedHistory =
            history.slice(0, 20);


        localStorage.setItem(
            "quantumDiagnoseHistory",
            JSON.stringify(
                limitedHistory
            )
        );


        renderHistory();

    } catch (error) {

        console.error(
            "History error:",
            error
        );

    }
}


// =========================================================
// RENDER HISTORY
// =========================================================

function renderHistory() {

    const historyElement = getElement(
        "historyList",
        "predictionHistory",
        "history"
    );


    if (!historyElement) return;


    let history = [];


    try {

        history =
            JSON.parse(
                localStorage.getItem(
                    "quantumDiagnoseHistory"
                ) || "[]"
            );

    } catch (error) {

        history = [];

    }


    if (history.length === 0) {

        historyElement.innerHTML =
            "<p>No prediction history yet.</p>";

        return;

    }


    historyElement.innerHTML =
        history.map(item => {

            return `
                <div class="history-item">

                    <h4>
                        ${escapeHTML(
                            item.disease
                        )}
                    </h4>

                    <p>
                        Random Forest:
                        ${
                            item.randomForest !== null
                                ? item.randomForest + "%"
                                : "N/A"
                        }
                    </p>

                    <p>
                        Qiskit:
                        ${
                            item.qiskit !== null
                                ? item.qiskit + "%"
                                : "N/A"
                        }
                    </p>

                    <small>
                        ${
                            new Date(
                                item.timestamp
                            ).toLocaleString()
                        }
                    </small>

                </div>
            `;

        }).join("");

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


// =========================================================
// CLEAR HISTORY
// =========================================================

function clearHistory() {

    localStorage.removeItem(
        "quantumDiagnoseHistory"
    );

    renderHistory();

}


// =========================================================
// DOCTOR RECOMMENDATION
// =========================================================

function getDoctorRecommendation(disease) {

    const recommendations = {

        "flu":
            "Consider consulting a general physician.",

        "cold":
            "A general physician can help if symptoms persist.",

        "diabetes":
            "Consult a qualified physician for proper testing.",

        "hypertension":
            "Consult a healthcare professional for proper evaluation.",

        "asthma":
            "Consider consulting a physician for appropriate assessment."

    };


    const key =
        String(disease)
            .toLowerCase()
            .trim();


    return (
        recommendations[key] ||
        "Consult a qualified healthcare professional for proper evaluation."
    );
}


// =========================================================
// EXPOSE FUNCTIONS
// =========================================================

window.showLogin =
    showLogin;

window.showSignup =
    showSignup;

window.showDashboard =
    showDashboard;

window.showSection =
    showSection;

window.analyzeSymptoms =
    analyzeSymptoms;

window.clearHistory =
    clearHistory;

window.renderHistory =
    renderHistory;

window.getDoctorRecommendation =
    getDoctorRecommendation;
