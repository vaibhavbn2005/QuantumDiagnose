// ============================================================
// QUANTUMDIAGNOSE - ORIGINAL SCRIPT.JS
// Updated only for requested Hybrid Health Analysis changes
// ============================================================

"use strict";

// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentUser = null;
let currentPrediction = null;
let predictionHistory = [];
let doctors = [];

// ============================================================
// FIREBASE / AUTH STATE
// ============================================================

if (typeof window.auth !== "undefined") {
    window.auth.onAuthStateChanged(function (user) {
        currentUser = user;

        if (user) {
            updateUserDetails(user);
            loadPredictionHistory();
        } else {
            updateUserDetails(null);
            predictionHistory = [];
        }
    });
}

// ============================================================
// UPDATE USER DETAILS
// ============================================================

function updateUserDetails(user) {
    const userEmail =
        document.getElementById("userEmail");

    const userName =
        document.getElementById("userName");

    if (!user) {
        if (userEmail) {
            userEmail.textContent = "Guest";
        }

        if (userName) {
            userName.textContent = "Guest";
        }

        return;
    }

    if (userEmail) {
        userEmail.textContent =
            user.email || "User";
    }

    if (userName) {
        const email =
            user.email || "";

        userName.textContent =
            email.split("@")[0] || "User";
    }
}

// ============================================================
// PAGE CONFIGURATION
// ============================================================

const pageConfig = {

    dashboard: {
        title: "Dashboard",
        subtitle: "AI-assisted health analysis"
    },

    prediction: {
        // UPDATED:
        // Only the main heading is changed.
        title: "Hybrid Health Analysis",
        subtitle: "AI-assisted health analysis"
    },

    history: {
        title: "Prediction History",
        subtitle: "View your previous health analyses"
    },

    doctors: {
        title: "Doctor Directory",
        subtitle: "Find a suitable medical specialist"
    },

    quantum: {
        title: "Quantum Analysis",
        subtitle: "Experimental quantum health analysis"
    },

    comparison: {
        title: "Model Comparison",
        subtitle: "Compare classical and quantum models"
    },

    performance: {
        title: "Model Performance",
        subtitle: "AI model performance metrics"
    }
};

// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(pageName) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(function (page) {
        page.classList.add("hidden");
    });

    const target =
        document.getElementById(
            "page-" + pageName
        );

    if (target) {
        target.classList.remove("hidden");
    }

    const config =
        pageConfig[pageName] ||
        pageConfig.dashboard;

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {
        pageTitle.textContent =
            config.title;
    }

    const pageSubtitle =
        document.getElementById("pageSubtitle");

    if (pageSubtitle) {
        pageSubtitle.textContent =
            config.subtitle;
    }

    // Keep existing sidebar behavior.
    const navItems =
        document.querySelectorAll(
            "[data-page]"
        );

    navItems.forEach(function (item) {

        item.classList.remove(
            "active"
        );

        if (
            item.getAttribute(
                "data-page"
            ) === pageName
        ) {
            item.classList.add(
                "active"
            );
        }
    });

    // Existing page loaders
    if (pageName === "dashboard") {
        loadDashboard();
    }

    if (pageName === "history") {
        loadPredictionHistory();
    }

    if (pageName === "doctors") {
        loadDoctors();
    }

    if (pageName === "comparison") {
        loadModelComparison();
    }

    if (pageName === "performance") {
        loadPerformance();
    }
}

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================

document.addEventListener(
    "click",
    function (event) {

        const navigationItem =
            event.target.closest(
                "[data-page]"
            );

        if (!navigationItem) {
            return;
        }

        event.preventDefault();

        const page =
            navigationItem.getAttribute(
                "data-page"
            );

        if (page) {
            showPage(page);
        }
    }
);

// ============================================================
// MOBILE SIDEBAR
// ============================================================

function setupMobileSidebar() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    if (
        !menuButton ||
        !sidebar
    ) {
        return;
    }

    menuButton.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );
        }
    );
}

// ============================================================
// SYMPTOM SELECTION
// ============================================================

function getSelectedSymptoms() {

    const selected =
        document.querySelectorAll(
            'input[name="symptoms"]:checked'
        );

    return Array.from(selected)
        .map(function (input) {
            return input.value;
        });
}

// ============================================================
// UPDATE SYMPTOM COUNT
// ============================================================

function updateSymptomCount() {

    const selected =
        getSelectedSymptoms();

    const countElement =
        document.getElementById(
            "symptomCount"
        );

    if (countElement) {

        countElement.textContent =
            selected.length +
            " selected";
    }
}

// ============================================================
// SYMPTOM EVENT LISTENERS
// ============================================================

function setupSymptomListeners() {

    const symptomInputs =
        document.querySelectorAll(
            'input[name="symptoms"]'
        );

    symptomInputs.forEach(
        function (input) {

            input.addEventListener(
                "change",
                updateSymptomCount
            );
        }
    );

    updateSymptomCount();
}

// ============================================================
// CLEAR SYMPTOMS
// ============================================================

function clearSymptoms() {

    const symptomInputs =
        document.querySelectorAll(
            'input[name="symptoms"]'
        );

    symptomInputs.forEach(
        function (input) {
            input.checked = false;
        }
    );

    updateSymptomCount();

    currentPrediction = null;

    const result =
        document.getElementById(
            "predictionResult"
        );

    if (result) {
        result.classList.add(
            "hidden"
        );
    }
}

// ============================================================
// PATIENT INFORMATION
// ============================================================

function getPatientInformation() {

    return {

        name:
            document.getElementById(
                "patientName"
            )?.value?.trim() || "",

        age:
            document.getElementById(
                "patientAge"
            )?.value?.trim() || "",

        gender:
            document.getElementById(
                "patientGender"
            )?.value || "",

        email:
            document.getElementById(
                "patientEmail"
            )?.value?.trim() ||
            currentUser?.email ||
            ""
    };
}

// ============================================================
// INPUT VALIDATION
// ============================================================

function validatePredictionInput() {

    const symptoms =
        getSelectedSymptoms();

    if (
        !symptoms ||
        symptoms.length === 0
    ) {

        alert(
            "Please select at least one symptom."
        );

        return false;
    }

    return true;
}

// ============================================================
// PREDICTION REQUEST
// ============================================================

async function predictDisease() {

    if (
        !validatePredictionInput()
    ) {
        return;
    }

    const button =
        document.getElementById(
            "predictBtn"
        );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Analyzing...";
    }

    const symptoms =
        getSelectedSymptoms();

    const patient =
        getPatientInformation();

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
                        JSON.stringify({

                            symptoms:
                                symptoms,

                            patient:
                                patient
                        })
                }
            );

        if (!response.ok) {

            throw new Error(
                "Prediction request failed."
            );
        }

        const data =
            await response.json();

        if (data.error) {

            throw new Error(
                data.error
            );
        }

        // Store the complete backend result.
        currentPrediction =
            data;

        // Render all model outputs.
        renderPredictionResult(
            data
        );

        // Move to prediction page.
        showPage(
            "prediction"
        );

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

        if (button) {

            button.disabled = false;

            button.textContent =
                "Analyze Symptoms";
        }
    }
}

// ============================================================
// PREDICTION BUTTON
// ============================================================

function setupPredictionButton() {

    const button =
        document.getElementById(
            "predictBtn"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        predictDisease
    );
}

// ============================================================
// NUMBER HELPER
// ============================================================

function numberValue(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    if (
        !Number.isFinite(
            number
        )
    ) {
        return fallback;
    }

    return number;
}

// ============================================================
// PERCENTAGE FORMATTER
// ============================================================

function formatPercentage(
    value
) {

    return (
        numberValue(value)
            .toFixed(2) +
        "%"
    );
}

// ============================================================
// DISEASE NAME FORMATTER
// ============================================================

function formatDiseaseName(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
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
            function (letter) {
                return letter.toUpperCase();
            }
        );
}

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
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
// DATE/TIME FORMATTER
// ============================================================

function formatPredictionDateTime(
    value
) {

    if (!value) {
        return "Not available";
    }

    try {

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }

        return date.toLocaleString(
            [],
            {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    } catch (error) {

        return String(value);
    }
}
// ============================================================
// RENDER COMPLETE PREDICTION RESULT
// ============================================================

function renderPredictionResult(data) {

    const resultContainer =
        document.getElementById(
            "predictionResult"
        );

    if (resultContainer) {
        resultContainer.classList.remove(
            "hidden"
        );
    }

    // ========================================================
    // RANDOM FOREST
    // ========================================================

    const rfDisease =
        data.rf_disease ??
        data.random_forest_disease ??
        data.disease ??
        "Unknown";

    const rfConfidence =
        numberValue(
            data.rf_confidence ??
            data.random_forest_confidence ??
            data.confidence
        );

    // ========================================================
    // QISKIT
    // ========================================================

    const qiskitDisease =
        data.qiskit_disease ??
        data.quantum_disease ??
        "Unknown";

    const qiskitConfidence =
        numberValue(
            data.qiskit_confidence ??
            data.quantum_confidence ??
            data.quantum_score ??
            data.qiskit_score
        );

    // ========================================================
    // FINAL / HYBRID
    // ========================================================

    const finalDisease =
        data.final_prediction ??
        data.hybrid_prediction ??
        data.hybrid_disease ??
        data.disease ??
        rfDisease;

    const finalConfidence =
        numberValue(
            data.final_confidence ??
            data.hybrid_confidence ??
            data.confidence ??
            rfConfidence
        );

    // ========================================================
    // AGREEMENT
    // ========================================================

    let agreement =
        data.agreement ??
        data.model_agreement ??
        "";

    if (!agreement) {

        const rfNormalized =
            String(rfDisease)
                .trim()
                .toLowerCase();

        const qNormalized =
            String(qiskitDisease)
                .trim()
                .toLowerCase();

        agreement =
            rfNormalized === qNormalized
                ? "High"
                : "Low";
    }

    // ========================================================
    // PREDICTION DATE / TIME
    // ========================================================

    const predictionTime =
        data.prediction_time ??
        data.created_at ??
        data.timestamp ??
        new Date().toISOString();

    const formattedDate =
        formatPredictionDateTime(
            predictionTime
        );

    // ========================================================
    // RANDOM FOREST DISEASE
    // ========================================================

    const rfDiseaseElement =
        document.getElementById(
            "rfDisease"
        );

    if (rfDiseaseElement) {

        rfDiseaseElement.textContent =
            formatDiseaseName(
                rfDisease
            );
    }

    // Existing disease element
    const diseaseElement =
        document.getElementById(
            "disease"
        );

    if (
        diseaseElement &&
        !rfDiseaseElement
    ) {

        diseaseElement.textContent =
            formatDiseaseName(
                rfDisease
            );
    }

    // ========================================================
    // RANDOM FOREST CONFIDENCE
    // ========================================================

    const rfConfidenceElement =
        document.getElementById(
            "rfConfidence"
        );

    if (rfConfidenceElement) {

        rfConfidenceElement.textContent =
            formatPercentage(
                rfConfidence
            );
    }

    const rfConfidenceText =
        document.getElementById(
            "confidenceText"
        );

    if (
        rfConfidenceText &&
        !rfConfidenceElement
    ) {

        rfConfidenceText.textContent =
            formatPercentage(
                rfConfidence
            );
    }

    const rfProgress =
        document.getElementById(
            "rfConfidenceBar"
        );

    if (rfProgress) {

        rfProgress.style.width =
            Math.min(
                Math.max(
                    rfConfidence,
                    0
                ),
                100
            ) + "%";
    }

    const confidenceBar =
        document.getElementById(
            "confidenceBar"
        );

    if (
        confidenceBar &&
        !rfProgress
    ) {

        confidenceBar.style.width =
            Math.min(
                Math.max(
                    rfConfidence,
                    0
                ),
                100
            ) + "%";
    }

    // ========================================================
    // QISKIT DISEASE
    // ========================================================

    const qiskitDiseaseElement =
        document.getElementById(
            "qiskitDisease"
        );

    if (qiskitDiseaseElement) {

        qiskitDiseaseElement.textContent =
            formatDiseaseName(
                qiskitDisease
            );
    }

    const quantumDiseaseElement =
        document.getElementById(
            "quantumDisease"
        );

    if (
        quantumDiseaseElement &&
        !qiskitDiseaseElement
    ) {

        quantumDiseaseElement.textContent =
            formatDiseaseName(
                qiskitDisease
            );
    }

    // ========================================================
    // QISKIT CONFIDENCE
    // ========================================================

    const qiskitConfidenceElement =
        document.getElementById(
            "qiskitConfidence"
        );

    if (qiskitConfidenceElement) {

        qiskitConfidenceElement.textContent =
            formatPercentage(
                qiskitConfidence
            );
    }

    const quantumConfidenceElement =
        document.getElementById(
            "quantumConfidence"
        );

    if (
        quantumConfidenceElement &&
        !qiskitConfidenceElement
    ) {

        quantumConfidenceElement.textContent =
            formatPercentage(
                qiskitConfidence
            );
    }

    // ========================================================
    // QISKIT SCORE
    // ========================================================

    const quantumScore =
        numberValue(
            data.quantum_score ??
            data.qiskit_score ??
            data.quantum_signal ??
            qiskitConfidence
        );

    const quantumScoreElement =
        document.getElementById(
            "quantumScore"
        );

    if (quantumScoreElement) {

        quantumScoreElement.textContent =
            formatPercentage(
                quantumScore
            );
    }

    const quantumScoreText =
        document.getElementById(
            "quantumScoreText"
        );

    if (
        quantumScoreText &&
        !quantumScoreElement
    ) {

        quantumScoreText.textContent =
            formatPercentage(
                quantumScore
            );
    }

    const quantumBar =
        document.getElementById(
            "quantumScoreBar"
        );

    if (quantumBar) {

        quantumBar.style.width =
            Math.min(
                Math.max(
                    quantumScore,
                    0
                ),
                100
            ) + "%";
    }

    // ========================================================
    // QISKIT QUANTUM METRICS
    // ========================================================

    const qubits =
        data.qiskit_qubits ??
        data.quantum_qubits ??
        data.qubits ??
        "—";

    const depth =
        data.qiskit_depth ??
        data.quantum_depth ??
        data.circuit_depth ??
        data.depth ??
        "—";

    const qiskitSignal =
        numberValue(
            data.quantum_signal ??
            data.qiskit_signal ??
            data.quantum_score
        );

    const qubitsElement =
        document.getElementById(
            "qiskitQubits"
        );

    if (qubitsElement) {
        qubitsElement.textContent =
            qubits;
    }

    const depthElement =
        document.getElementById(
            "qiskitDepth"
        );

    if (depthElement) {
        depthElement.textContent =
            depth;
    }

    const quantumSignalElement =
        document.getElementById(
            "quantumSignal"
        );

    if (quantumSignalElement) {

        quantumSignalElement.textContent =
            formatPercentage(
                qiskitSignal
            );
    }

    // Existing quantum metrics
    const quantumQubits =
        document.getElementById(
            "quantumQubits"
        );

    if (
        quantumQubits &&
        !qubitsElement
    ) {

        quantumQubits.textContent =
            qubits;
    }

    const quantumDepth =
        document.getElementById(
            "quantumDepth"
        );

    if (
        quantumDepth &&
        !depthElement
    ) {

        quantumDepth.textContent =
            depth;
    }

    // ========================================================
    // FINAL PREDICTION
    // ========================================================

    const finalDiseaseElement =
        document.getElementById(
            "finalDisease"
        );

    if (finalDiseaseElement) {

        finalDiseaseElement.textContent =
            formatDiseaseName(
                finalDisease
            );
    }

    // Existing hybrid disease element
    const hybridDiseaseElement =
        document.getElementById(
            "hybridDisease"
        );

    if (
        hybridDiseaseElement &&
        !finalDiseaseElement
    ) {

        hybridDiseaseElement.textContent =
            formatDiseaseName(
                finalDisease
            );
    }

    // ========================================================
    // FINAL CONFIDENCE
    // ========================================================

    const finalConfidenceElement =
        document.getElementById(
            "finalConfidence"
        );

    if (finalConfidenceElement) {

        finalConfidenceElement.textContent =
            formatPercentage(
                finalConfidence
            );
    }

    const hybridConfidenceElement =
        document.getElementById(
            "hybridConfidence"
        );

    if (
        hybridConfidenceElement &&
        !finalConfidenceElement
    ) {

        hybridConfidenceElement.textContent =
            formatPercentage(
                finalConfidence
            );
    }

    const hybridConfidenceText =
        document.getElementById(
            "hybridConfidenceText"
        );

    if (
        hybridConfidenceText &&
        !finalConfidenceElement &&
        !hybridConfidenceElement
    ) {

        hybridConfidenceText.textContent =
            formatPercentage(
                finalConfidence
            );
    }

    // ========================================================
    // AGREEMENT DISPLAY
    // ========================================================

    renderModelAgreement(
        agreement,
        rfDisease,
        qiskitDisease
    );

    // ========================================================
    // PREDICTION DATE/TIME
    // ========================================================

    const dateElement =
        document.getElementById(
            "predictionDateTime"
        );

    if (dateElement) {

        dateElement.textContent =
            "Prediction date & time: " +
            formattedDate;
    }

    // ========================================================
    // SELECTED SYMPTOMS
    // ========================================================

    renderSelectedSymptoms(
        data.selected_symptoms ??
        data.symptoms ??
        getSelectedSymptoms()
    );

    // ========================================================
    // TOP PREDICTIONS
    // ========================================================

    renderTopPredictions(
        data.top_predictions ||
        data.topPredictions ||
        []
    );

    // ========================================================
    // SPECIALIST
    // ========================================================

    const specialty =
        data.specialty ??
        data.recommended_specialty ??
        data.doctor_specialty ??
        "General Physician";

    renderSpecialistRecommendation(
        specialty,
        data.doctors ||
        data.recommended_doctors ||
        []
    );

    // ========================================================
    // STORE NORMALIZED RESULT
    // ========================================================

    currentPrediction = {

        ...data,

        rf_disease:
            rfDisease,

        rf_confidence:
            rfConfidence,

        qiskit_disease:
            qiskitDisease,

        qiskit_confidence:
            qiskitConfidence,

        quantum_score:
            quantumScore,

        final_prediction:
            finalDisease,

        final_confidence:
            finalConfidence,

        agreement:
            agreement,

        prediction_time:
            predictionTime,

        selected_symptoms:
            data.selected_symptoms ??
            data.symptoms ??
            getSelectedSymptoms(),

        specialty:
            specialty
    };
}

// ============================================================
// MODEL AGREEMENT
// ============================================================

function renderModelAgreement(
    agreement,
    rfDisease,
    qiskitDisease
) {

    const agreementElement =
        document.getElementById(
            "modelAgreement"
        );

    const agreementBadge =
        document.getElementById(
            "agreementBadge"
        );

    const agreementStatus =
        document.getElementById(
            "agreementStatus"
        );

    const rfName =
        formatDiseaseName(
            rfDisease
        );

    const qiskitName =
        formatDiseaseName(
            qiskitDisease
        );

    // ========================================================
    // AGREEMENT MESSAGE
    // ========================================================

    let message = "";

    if (
        String(agreement)
            .toLowerCase()
            .includes("high")
    ) {

        message =
            "Both models agree on " +
            rfName +
            ".";

    } else if (
        String(agreement)
            .toLowerCase()
            .includes("moderate")
    ) {

        message =
            "The models show moderate agreement.";

    } else {

        message =
            "The models produced different predictions: " +
            rfName +
            " vs " +
            qiskitName +
            ".";
    }

    if (agreementElement) {

        agreementElement.textContent =
            message;
    }

    if (agreementStatus) {

        agreementStatus.textContent =
            String(
                agreement
            ) +
            " Agreement";
    }

    if (agreementBadge) {

        agreementBadge.textContent =
            String(
                agreement
            ) +
            " Agreement";

        agreementBadge.className =
            "agreement-badge " +
            String(
                agreement
            )
            .toLowerCase();
    }
}

// ============================================================
// SELECTED SYMPTOMS
// ============================================================

function renderSelectedSymptoms(
    symptoms
) {

    const container =
        document.getElementById(
            "selectedSymptoms"
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(
            symptoms
        ) ||
        symptoms.length === 0
    ) {

        container.innerHTML =
            '<span class="empty-state">No symptoms selected.</span>';

        return;
    }

    container.innerHTML =
        symptoms
            .map(
                function (symptom) {

                    return `
                        <span class="symptom-tag">
                            ${escapeHTML(
                                formatDiseaseName(
                                    symptom
                                )
                            )}
                        </span>
                    `;
                }
            )
            .join("");
}

// ============================================================
// TOP PREDICTIONS
// ============================================================

function renderTopPredictions(
    predictions
) {

    const container =
        document.getElementById(
            "topPredictions"
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(
            predictions
        ) ||
        predictions.length === 0
    ) {

        container.innerHTML =
            `
            <div class="empty-state">
                No additional predictions available.
            </div>
            `;

        return;
    }

    container.innerHTML =
        predictions
            .slice(
                0,
                5
            )
            .map(
                function (
                    prediction,
                    index
                ) {

                    const disease =
                        prediction.disease ??
                        prediction.name ??
                        prediction.label ??
                        "Unknown";

                    const confidence =
                        numberValue(
                            prediction.confidence ??
                            prediction.probability ??
                            prediction.score
                        );

                    return `
                        <div class="prediction-row">

                            <div class="prediction-rank">
                                ${index + 1}
                            </div>

                            <div class="prediction-info">

                                <strong>
                                    ${escapeHTML(
                                        formatDiseaseName(
                                            disease
                                        )
                                    )}
                                </strong>

                                <div class="prediction-progress">

                                    <div
                                        class="prediction-progress-fill"
                                        style="width:${Math.min(
                                            Math.max(
                                                confidence,
                                                0
                                            ),
                                            100
                                        )}%"
                                    ></div>

                                </div>

                            </div>

                            <div class="prediction-value">
                                ${formatPercentage(
                                    confidence
                                )}
                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}

// ============================================================
// SPECIALIST RECOMMENDATION
// ============================================================

function renderSpecialistRecommendation(
    specialty,
    recommendedDoctors
) {

    const specialtyElement =
        document.getElementById(
            "recommendedSpecialty"
        );

    if (specialtyElement) {

        specialtyElement.textContent =
            specialty ||
            "General Physician";
    }

    const specialtyBox =
        document.getElementById(
            "specialistBox"
        );

    if (specialtyBox) {

        specialtyBox.innerHTML = `
            <strong>
                Recommended Specialist:
            </strong>

            <span>
                ${escapeHTML(
                    specialty ||
                    "General Physician"
                )}
            </span>
        `;
    }

    // ========================================================
    // DOCTORS
    // ========================================================

    const doctorContainer =
        document.getElementById(
            "recommendedDoctors"
        );

    if (!doctorContainer) {
        return;
    }

    if (
        !Array.isArray(
            recommendedDoctors
        ) ||
        recommendedDoctors.length === 0
    ) {

        doctorContainer.innerHTML =
            `
            <div class="empty-state">
                No specialist information available.
            </div>
            `;

        return;
    }

    doctorContainer.innerHTML =
        recommendedDoctors
            .slice(
                0,
                3
            )
            .map(
                function (doctor) {

                    const name =
                        doctor.name ||
                        "Doctor";

                    const doctorSpecialty =
                        doctor.specialization ||
                        doctor.specialty ||
                        specialty ||
                        "General Physician";

                    return `
                        <div class="doctor-card">

                            <div class="doctor-avatar">
                                👨‍⚕️
                            </div>

                            <div class="doctor-details">

                                <h4>
                                    ${escapeHTML(
                                        name
                                    )}
                                </h4>

                                <p>
                                    ${escapeHTML(
                                        doctorSpecialty
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
// SAVE CURRENT PREDICTION
// ============================================================

async function saveCurrentPrediction() {

    if (!currentPrediction) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    if (!currentUser) {

        alert(
            "Please log in before saving prediction history."
        );

        return;
    }

    const button =
        document.getElementById(
            "saveHistoryBtn"
        );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Saving...";
    }

    try {

        const predictionTime =
            currentPrediction.prediction_time ||
            new Date().toISOString();

        const historyData = {

            userId:
                currentUser.uid,

            userEmail:
                currentUser.email || "",

            patient:
                currentPrediction.patient ||
                getPatientInformation(),

            symptoms:
                currentPrediction.selected_symptoms ||
                getSelectedSymptoms(),

            rfDisease:
                currentPrediction.rf_disease ||
                "",

            rfConfidence:
                numberValue(
                    currentPrediction.rf_confidence
                ),

            qiskitDisease:
                currentPrediction.qiskit_disease ||
                "",

            qiskitConfidence:
                numberValue(
                    currentPrediction.qiskit_confidence
                ),

            quantumScore:
                numberValue(
                    currentPrediction.quantum_score
                ),

            qiskitQubits:
                currentPrediction.qiskit_qubits ||
                currentPrediction.qubits ||
                "",

            qiskitDepth:
                currentPrediction.qiskit_depth ||
                currentPrediction.depth ||
                "",

            finalPrediction:
                currentPrediction.final_prediction ||
                "",

            finalConfidence:
                numberValue(
                    currentPrediction.final_confidence
                ),

            agreement:
                currentPrediction.agreement ||
                "",

            topPredictions:
                currentPrediction.top_predictions ||
                [],

            specialty:
                currentPrediction.specialty ||
                "",

            predictionTime:
                predictionTime
        };

        // Use existing Firestore function
        // if it exists.
        if (
            typeof window.savePredictionToFirestore ===
            "function"
        ) {

            await window.savePredictionToFirestore(
                historyData
            );
        }

        predictionHistory.unshift(
            historyData
        );

        saveHistoryLocally();

        const message =
            document.getElementById(
                "saveHistoryMessage"
            );

        if (message) {

            message.textContent =
                "✓ Prediction saved successfully";
        }

        await loadPredictionHistory();

    } catch (error) {

        console.error(
            "Error saving prediction:",
            error
        );

        alert(
            "Unable to save prediction history."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Save to History";
        }
    }
}

// ============================================================
// LOCAL HISTORY STORAGE
// ============================================================

function getHistoryStorageKey() {

    if (!currentUser) {
        return null;
    }

    return (
        "quantumdiagnose_history_" +
        currentUser.uid
    );
}

function saveHistoryLocally() {

    const key =
        getHistoryStorageKey();

    if (!key) {
        return;
    }

    try {

        localStorage.setItem(
            key,
            JSON.stringify(
                predictionHistory
                    .slice(
                        0,
                        50
                    )
            )
        );

    } catch (error) {

        console.error(
            "Local history error:",
            error
        );
    }
}

function loadHistoryLocally() {

    const key =
        getHistoryStorageKey();

    if (!key) {

        predictionHistory = [];

        return [];
    }

    try {

        const raw =
            localStorage.getItem(
                key
            );

        if (!raw) {

            predictionHistory = [];

            return [];
        }

        const parsed =
            JSON.parse(
                raw
            );

        predictionHistory =
            Array.isArray(
                parsed
            )
                ? parsed
                : [];

        return predictionHistory;

    } catch (error) {

        predictionHistory = [];

        return [];
    }
}
// ============================================================
// LOAD PREDICTION HISTORY
// ============================================================

async function loadPredictionHistory() {

    // First load the locally stored history.
    loadHistoryLocally();

    // If there is no logged-in user,
    // keep the existing local history empty.
    if (!currentUser) {
        renderPredictionHistory(
            predictionHistory
        );
        return;
    }

    try {

        // Use the existing backend/API if available.
        const response =
            await fetch(
                "/prediction-history"
            );

        if (response.ok) {

            const data =
                await response.json();

            if (
                data &&
                Array.isArray(
                    data.predictions
                )
            ) {

                predictionHistory =
                    data.predictions;
            }
        }

    } catch (error) {

        // Do not break the page if the
        // history endpoint is unavailable.
        console.warn(
            "Prediction history API unavailable. Using local history.",
            error
        );
    }

    renderPredictionHistory(
        predictionHistory
    );

    updateDashboard();
}

// ============================================================
// RENDER PREDICTION HISTORY
// ============================================================

function renderPredictionHistory(
    history
) {

    const container =
        document.getElementById(
            "historyList"
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No Prediction History
                </h3>

                <p>
                    Your saved predictions
                    will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        history
            .map(
                function (
                    item,
                    index
                ) {

                    // ------------------------------------------------
                    // IMPORTANT:
                    // Use the SAVED prediction date/time.
                    // Do NOT generate a new Date() here.
                    // ------------------------------------------------

                    const predictionTime =
                        item.predictionTime ??
                        item.prediction_time ??
                        item.createdAt ??
                        item.created_at ??
                        item.timestamp ??
                        "";

                    const dateTime =
                        formatPredictionDateTime(
                            predictionTime
                        );

                    const finalDisease =
                        item.finalPrediction ??
                        item.final_prediction ??
                        item.hybridDisease ??
                        item.hybrid_disease ??
                        item.disease ??
                        "Unknown";

                    const finalConfidence =
                        numberValue(
                            item.finalConfidence ??
                            item.final_confidence ??
                            item.hybridConfidence ??
                            item.hybrid_confidence ??
                            item.confidence
                        );

                    const rfDisease =
                        item.rfDisease ??
                        item.rf_disease ??
                        "";

                    const rfConfidence =
                        numberValue(
                            item.rfConfidence ??
                            item.rf_confidence
                        );

                    const qiskitDisease =
                        item.qiskitDisease ??
                        item.qiskit_disease ??
                        "";

                    const qiskitConfidence =
                        numberValue(
                            item.qiskitConfidence ??
                            item.qiskit_confidence ??
                            item.qiskitScore ??
                            item.qiskit_score
                        );

                    const agreement =
                        item.agreement ??
                        item.modelAgreement ??
                        item.model_agreement ??
                        "";

                    const symptoms =
                        item.symptoms ||
                        item.selected_symptoms ||
                        [];

                    return `
                        <div
                            class="history-card"
                            data-history-index="${index}"
                        >

                            <div class="history-card-header">

                                <div>
                                    <span class="history-label">
                                        Final Prediction
                                    </span>

                                    <h3>
                                        ${escapeHTML(
                                            formatDiseaseName(
                                                finalDisease
                                            )
                                        )}
                                    </h3>
                                </div>

                                <div class="history-confidence">
                                    ${formatPercentage(
                                        finalConfidence
                                    )}
                                </div>

                            </div>

                            <div class="history-date">

                                🕒

                                ${escapeHTML(
                                    dateTime
                                )}

                            </div>

                            <div class="history-models">

                                <div class="history-model">

                                    <span>
                                        Random Forest
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            formatDiseaseName(
                                                rfDisease
                                            )
                                        )}
                                    </strong>

                                    <small>
                                        ${formatPercentage(
                                            rfConfidence
                                        )}
                                    </small>

                                </div>

                                <div class="history-model">

                                    <span>
                                        Qiskit
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            formatDiseaseName(
                                                qiskitDisease
                                            )
                                        )}
                                    </strong>

                                    <small>
                                        ${formatPercentage(
                                            qiskitConfidence
                                        )}
                                    </small>

                                </div>

                            </div>

                            ${
                                agreement
                                    ? `
                                        <div class="history-agreement">

                                            Agreement:
                                            <strong>
                                                ${escapeHTML(
                                                    agreement
                                                )}
                                            </strong>

                                        </div>
                                    `
                                    : ""
                            }

                            ${
                                Array.isArray(
                                    symptoms
                                ) &&
                                symptoms.length > 0
                                    ? `
                                        <div class="history-symptoms">

                                            <span>
                                                Symptoms:
                                            </span>

                                            <div class="symptom-tags">

                                                ${symptoms
                                                    .slice(
                                                        0,
                                                        8
                                                    )
                                                    .map(
                                                        function (
                                                            symptom
                                                        ) {

                                                            return `
                                                                <span class="symptom-tag">
                                                                    ${escapeHTML(
                                                                        formatDiseaseName(
                                                                            symptom
                                                                        )
                                                                    )}
                                                                </span>
                                                            `;
                                                        }
                                                    )
                                                    .join("")}

                                            </div>

                                        </div>
                                    `
                                    : ""
                            }

                        </div>
                    `;
                }
            )
            .join("");
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    updateDashboard();

    // If a backend dashboard endpoint exists,
    // use it without changing the existing UI.
    try {

        const response =
            await fetch(
                "/dashboard"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        if (data) {
            updateDashboard(
                data
            );
        }

    } catch (error) {

        console.warn(
            "Dashboard API unavailable.",
            error
        );
    }
}

// ============================================================
// UPDATE DASHBOARD
// ============================================================

function updateDashboard(
    dashboardData = null
) {

    const history =
        predictionHistory || [];

    // --------------------------------------------------------
    // TOTAL PREDICTIONS
    // --------------------------------------------------------

    const total =
        dashboardData?.total_predictions ??
        history.length;

    const totalElement =
        document.getElementById(
            "totalPredictions"
        );

    if (totalElement) {
        totalElement.textContent =
            total;
    }

    // --------------------------------------------------------
    // LATEST PREDICTION
    // --------------------------------------------------------

    const latest =
        history.length > 0
            ? history[0]
            : null;

    const latestDisease =
        dashboardData?.latest_disease ??
        latest?.finalPrediction ??
        latest?.final_prediction ??
        latest?.hybridDisease ??
        latest?.hybrid_disease ??
        latest?.disease;

    const latestDiseaseElement =
        document.getElementById(
            "latestPrediction"
        );

    if (latestDiseaseElement) {

        latestDiseaseElement.textContent =
            latestDisease
                ? formatDiseaseName(
                    latestDisease
                )
                : "No predictions yet";
    }

    // --------------------------------------------------------
    // LATEST CONFIDENCE
    // --------------------------------------------------------

    const latestConfidence =
        dashboardData?.latest_confidence ??
        latest?.finalConfidence ??
        latest?.final_confidence ??
        latest?.hybridConfidence ??
        latest?.hybrid_confidence ??
        latest?.confidence;

    const latestConfidenceElement =
        document.getElementById(
            "latestConfidence"
        );

    if (latestConfidenceElement) {

        latestConfidenceElement.textContent =
            latestConfidence !==
            undefined &&
            latestConfidence !==
            null
                ? formatPercentage(
                    latestConfidence
                )
                : "—";
    }

    // --------------------------------------------------------
    // LATEST DATE
    // --------------------------------------------------------

    const latestTime =
        dashboardData?.latest_prediction_time ??
        latest?.predictionTime ??
        latest?.prediction_time ??
        latest?.createdAt ??
        latest?.created_at;

    const latestTimeElement =
        document.getElementById(
            "latestPredictionTime"
        );

    if (latestTimeElement) {

        latestTimeElement.textContent =
            latestTime
                ? formatPredictionDateTime(
                    latestTime
                )
                : "—";
    }

    // --------------------------------------------------------
    // AGREEMENT COUNT
    // --------------------------------------------------------

    const agreementCount =
        dashboardData?.agreement_count ??
        history.filter(
            function (item) {

                const agreement =
                    String(
                        item.agreement ??
                        item.modelAgreement ??
                        item.model_agreement ??
                        ""
                    ).toLowerCase();

                return (
                    agreement.includes(
                        "high"
                    ) ||
                    agreement.includes(
                        "agree"
                    )
                );
            }
        ).length;

    const agreementElement =
        document.getElementById(
            "agreementCount"
        );

    if (agreementElement) {
        agreementElement.textContent =
            agreementCount;
    }
}

// ============================================================
// DOCTOR DIRECTORY
// ============================================================

async function loadDoctors() {

    const container =
        document.getElementById(
            "doctorList"
        );

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(
                "/doctors"
            );

        if (!response.ok) {
            throw new Error(
                "Doctor request failed"
            );
        }

        const data =
            await response.json();

        doctors =
            Array.isArray(
                data.doctors
            )
                ? data.doctors
                : [];

        renderDoctorDirectory(
            doctors
        );

    } catch (error) {

        console.error(
            "Doctor loading error:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">
                Unable to load doctor information.
            </div>
        `;
    }
}

// ============================================================
// RENDER DOCTOR DIRECTORY
// ============================================================

function renderDoctorDirectory(
    doctorList
) {

    const container =
        document.getElementById(
            "doctorList"
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(
            doctorList
        ) ||
        doctorList.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                No doctors available.
            </div>
        `;

        return;
    }

    container.innerHTML =
        doctorList
            .map(
                function (doctor) {

                    const name =
                        doctor.name ||
                        "Doctor";

                    const specialty =
                        doctor.specialization ||
                        doctor.specialty ||
                        "General Physician";

                    const experience =
                        doctor.experience ||
                        doctor.experience_years ||
                        "";

                    const hospital =
                        doctor.hospital ||
                        doctor.clinic ||
                        "";

                    return `
                        <div class="doctor-card">

                            <div class="doctor-avatar">
                                👨‍⚕️
                            </div>

                            <div class="doctor-details">

                                <h3>
                                    ${escapeHTML(
                                        name
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        specialty
                                    )}
                                </p>

                                ${
                                    experience
                                        ? `
                                            <small>
                                                Experience:
                                                ${escapeHTML(
                                                    String(
                                                        experience
                                                    )
                                                )}
                                            </small>
                                        `
                                        : ""
                                }

                                ${
                                    hospital
                                        ? `
                                            <small>
                                                ${escapeHTML(
                                                    hospital
                                                )}
                                            </small>
                                        `
                                        : ""
                                }

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}

// ============================================================
// SEARCH DOCTORS
// ============================================================

function searchDoctors(
    searchValue
) {

    const query =
        String(
            searchValue ||
            ""
        )
        .trim()
        .toLowerCase();

    if (!query) {

        renderDoctorDirectory(
            doctors
        );

        return;
    }

    const filtered =
        doctors.filter(
            function (doctor) {

                const text =
                    [
                        doctor.name,
                        doctor.specialty,
                        doctor.specialization,
                        doctor.hospital,
                        doctor.clinic
                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return text.includes(
                    query
                );
            }
        );

    renderDoctorDirectory(
        filtered
    );
}

// ============================================================
// DOCTOR SEARCH LISTENER
// ============================================================

function setupDoctorSearch() {

    const input =
        document.getElementById(
            "doctorSearch"
        );

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        function () {

            searchDoctors(
                input.value
            );
        }
    );
}

// ============================================================
// MODEL COMPARISON
// ============================================================

async function loadModelComparison() {

    try {

        const response =
            await fetch(
                "/model-comparison"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        renderModelComparison(
            data
        );

    } catch (error) {

        console.warn(
            "Model comparison unavailable.",
            error
        );
    }
}

// ============================================================
// RENDER MODEL COMPARISON
// ============================================================

function renderModelComparison(
    data
) {

    if (!data) {
        return;
    }

    const rfAccuracy =
        data.random_forest_accuracy ??
        data.rf_accuracy;

    const qiskitAccuracy =
        data.qiskit_accuracy ??
        data.quantum_accuracy;

    const hybridAccuracy =
        data.hybrid_accuracy ??
        data.final_accuracy;

    const rfElement =
        document.getElementById(
            "rfAccuracy"
        );

    if (rfElement &&
        rfAccuracy !== undefined) {

        rfElement.textContent =
            formatPercentage(
                rfAccuracy
            );
    }

    const qiskitElement =
        document.getElementById(
            "qiskitAccuracy"
        );

    if (
        qiskitElement &&
        qiskitAccuracy !== undefined
    ) {

        qiskitElement.textContent =
            formatPercentage(
                qiskitAccuracy
            );
    }

    const hybridElement =
        document.getElementById(
            "hybridAccuracy"
        );

    if (
        hybridElement &&
        hybridAccuracy !== undefined
    ) {

        hybridElement.textContent =
            formatPercentage(
                hybridAccuracy
            );
    }

    // --------------------------------------------------------
    // AGREEMENT
    // --------------------------------------------------------

    const agreement =
        data.agreement_percentage ??
        data.model_agreement;

    const agreementElement =
        document.getElementById(
            "modelAgreementPercentage"
        );

    if (
        agreementElement &&
        agreement !== undefined
    ) {

        agreementElement.textContent =
            formatPercentage(
                agreement
            );
    }
}

// ============================================================
// MODEL PERFORMANCE
// ============================================================

async function loadPerformance() {

    try {

        const response =
            await fetch(
                "/model-performance"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        renderPerformance(
            data
        );

    } catch (error) {

        console.warn(
            "Performance data unavailable.",
            error
        );
    }
}

// ============================================================
// RENDER PERFORMANCE
// ============================================================

function renderPerformance(
    data
) {

    if (!data) {
        return;
    }

    const mappings = {

        rfAccuracy:
            data.random_forest_accuracy ??
            data.rf_accuracy,

        qiskitAccuracy:
            data.qiskit_accuracy ??
            data.quantum_accuracy,

        hybridAccuracy:
            data.hybrid_accuracy ??
            data.final_accuracy,

        rfPrecision:
            data.rf_precision ??
            data.random_forest_precision,

        rfRecall:
            data.rf_recall ??
            data.random_forest_recall,

        rfF1:
            data.rf_f1 ??
            data.random_forest_f1,

        qiskitPrecision:
            data.qiskit_precision ??
            data.quantum_precision,

        qiskitRecall:
            data.qiskit_recall ??
            data.quantum_recall,

        qiskitF1:
            data.qiskit_f1 ??
            data.quantum_f1
    };

    Object.keys(
        mappings
    ).forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );

            const value =
                mappings[id];

            if (
                element &&
                value !== undefined &&
                value !== null
            ) {

                element.textContent =
                    formatPercentage(
                        value
                    );
            }
        }
    );
}

// ============================================================
// DOWNLOAD PDF REPORT
// ============================================================

async function downloadPDFReport() {

    if (!currentPrediction) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    const button =
        document.getElementById(
            "downloadReportBtn"
        );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Generating...";
    }

    try {

        const response =
            await fetch(
                "/generate-report",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            currentPrediction
                        )
                }
            );

        if (!response.ok) {

            throw new Error(
                "Unable to generate report."
            );
        }

        const blob =
            await response.blob();

        const url =
            window.URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            "QuantumDiagnose_Report.pdf";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
            url
        );

    } catch (error) {

        console.error(
            "PDF report error:",
            error
        );

        alert(
            "Unable to generate PDF report."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Download Report";
        }
    }
}

// ============================================================
// EMAIL REPORT
// ============================================================

async function emailReport() {

    if (!currentPrediction) {

        alert(
            "Please complete a prediction first."
        );

        return;
    }

    const email =
        currentUser?.email ||
        document.getElementById(
            "patientEmail"
        )?.value?.trim();

    if (!email) {

        alert(
            "Please provide an email address."
        );

        return;
    }

    const button =
        document.getElementById(
            "emailReportBtn"
        );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Sending...";
    }

    try {

        const response =
            await fetch(
                "/send-report",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            ...currentPrediction,

                            email:
                                email
                        })
                }
            );

        if (!response.ok) {

            throw new Error(
                "Email request failed."
            );
        }

        const data =
            await response.json();

        if (data.error) {

            throw new Error(
                data.error
            );
        }

        alert(
            "Report sent successfully."
        );

    } catch (error) {

        console.error(
            "Email report error:",
            error
        );

        alert(
            "Unable to send report: " +
            error.message
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Email Report";
        }
    }
}
// ============================================================
// EVENT LISTENERS
// ============================================================

function setupReportButtons() {

    const downloadButton =
        document.getElementById(
            "downloadReportBtn"
        );

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            downloadPDFReport
        );
    }

    const emailButton =
        document.getElementById(
            "emailReportBtn"
        );

    if (emailButton) {

        emailButton.addEventListener(
            "click",
            emailReport
        );
    }

    const saveButton =
        document.getElementById(
            "saveHistoryBtn"
        );

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveCurrentPrediction
        );
    }
}

// ============================================================
// CLEAR / RESET PREDICTION BUTTON
// ============================================================

function setupClearButton() {

    const clearButton =
        document.getElementById(
            "clearSymptomsBtn"
        );

    if (!clearButton) {
        return;
    }

    clearButton.addEventListener(
        "click",
        function () {

            clearSymptoms();

            const patientFields =
                [
                    "patientName",
                    "patientAge",
                    "patientGender"
                ];

            patientFields.forEach(
                function (id) {

                    const element =
                        document.getElementById(
                            id
                        );

                    if (element) {
                        element.value = "";
                    }
                }
            );
        }
    );
}

// ============================================================
// NEW PREDICTION BUTTON
// ============================================================

function setupNewPredictionButton() {

    const buttons =
        document.querySelectorAll(
            "[data-new-prediction]"
        );

    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    clearSymptoms();

                    showPage(
                        "prediction"
                    );
                }
            );
        }
    );
}

// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        if (
            typeof window.auth !==
            "undefined"
        ) {

            await window.auth.signOut();
        }

        currentUser = null;

        predictionHistory = [];

        currentPrediction = null;

        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to log out."
        );
    }
}

// ============================================================
// LOGOUT BUTTON
// ============================================================

function setupLogout() {

    const logoutButtons =
        document.querySelectorAll(
            "#logoutBtn, [data-logout]"
        );

    logoutButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    logoutUser();
                }
            );
        }
    );
}

// ============================================================
// LOGIN / REGISTER NAVIGATION
// ============================================================

function setupAuthNavigation() {

    const loginButtons =
        document.querySelectorAll(
            "[data-login]"
        );

    loginButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "index.html";
                }
            );
        }
    );
}

// ============================================================
// PATIENT AGE VALIDATION
// ============================================================

function setupPatientValidation() {

    const ageInput =
        document.getElementById(
            "patientAge"
        );

    if (!ageInput) {
        return;
    }

    ageInput.addEventListener(
        "input",
        function () {

            let value =
                parseInt(
                    ageInput.value,
                    10
                );

            if (
                Number.isNaN(
                    value
                )
            ) {
                return;
            }

            if (value < 0) {
                ageInput.value = 0;
            }

            if (value > 120) {
                ageInput.value = 120;
            }
        }
    );
}

// ============================================================
// ENTER KEY SUPPORT
// ============================================================

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        function (event) {

            // Do not interfere with typing
            // inside form fields.

            if (
                event.target.matches(
                    "input, textarea, select"
                )
            ) {
                return;
            }

            // N = New Prediction

            if (
                event.key.toLowerCase() ===
                "n"
            ) {

                showPage(
                    "prediction"
                );
            }

            // H = History

            if (
                event.key.toLowerCase() ===
                "h"
            ) {

                showPage(
                    "history"
                );
            }
        }
    );
}

// ============================================================
// URL / HASH NAVIGATION
// ============================================================

function setupHashNavigation() {

    function navigateFromHash() {

        const hash =
            window.location.hash
                .replace(
                    "#",
                    ""
                )
                .trim();

        if (
            hash &&
            pageConfig[hash]
        ) {

            showPage(
                hash
            );

        } else {

            showPage(
                "dashboard"
            );
        }
    }

    window.addEventListener(
        "hashchange",
        navigateFromHash
    );

    navigateFromHash();
}

// ============================================================
// NAVIGATION WITH HASH
// ============================================================

function setupNavigationHashUpdates() {

    const items =
        document.querySelectorAll(
            "[data-page]"
        );

    items.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function () {

                    const page =
                        item.getAttribute(
                            "data-page"
                        );

                    if (
                        page &&
                        pageConfig[page]
                    ) {

                        history.replaceState(
                            null,
                            "",
                            "#" + page
                        );
                    }
                }
            );
        }
    );
}

// ============================================================
// AUTO REFRESH HISTORY
// ============================================================

function setupHistoryRefresh() {

    // Refresh only when the user is
    // viewing the history page.

    window.addEventListener(
        "focus",
        function () {

            const historyPage =
                document.getElementById(
                    "page-history"
                );

            if (
                historyPage &&
                !historyPage.classList.contains(
                    "hidden"
                )
            ) {

                loadPredictionHistory();
            }
        }
    );
}

// ============================================================
// EXISTING FIREBASE AUTH SUPPORT
// ============================================================

function setupFirebaseAuthListener() {

    if (
        typeof window.auth ===
        "undefined"
    ) {
        return;
    }

    try {

        window.auth.onAuthStateChanged(
            async function (user) {

                currentUser =
                    user;

                updateUserDetails(
                    user
                );

                if (user) {

                    loadHistoryLocally();

                    await loadPredictionHistory();

                    updateDashboard();

                } else {

                    predictionHistory =
                        [];

                    currentPrediction =
                        null;

                    updateDashboard();
                }
            }
        );

    } catch (error) {

        console.warn(
            "Firebase auth listener could not be initialized.",
            error
        );
    }
}

// ============================================================
// INITIALIZE APPLICATION
// ============================================================

function initializeQuantumDiagnose() {

    console.log(
        "QuantumDiagnose initializing..."
    );

    // Existing UI functionality

    setupMobileSidebar();

    setupSymptomListeners();

    setupPredictionButton();

    setupReportButtons();

    setupClearButton();

    setupNewPredictionButton();

    setupLogout();

    setupAuthNavigation();

    setupPatientValidation();

    setupDoctorSearch();

    setupKeyboardShortcuts();

    setupHashNavigation();

    setupNavigationHashUpdates();

    setupHistoryRefresh();

    // Firebase

    setupFirebaseAuthListener();

    // Default page

    const initialHash =
        window.location.hash
            .replace(
                "#",
                ""
            )
            .trim();

    if (
        initialHash &&
        pageConfig[initialHash]
    ) {

        showPage(
            initialHash
        );

    } else {

        showPage(
            "dashboard"
        );
    }

    console.log(
        "QuantumDiagnose ready."
    );
}

// ============================================================
// DOM READY
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeQuantumDiagnose
    );

} else {

    initializeQuantumDiagnose();
}

// ============================================================
// GLOBAL FUNCTION EXPORTS
// ============================================================

window.showPage =
    showPage;

window.predictDisease =
    predictDisease;

window.clearSymptoms =
    clearSymptoms;

window.downloadPDFReport =
    downloadPDFReport;

window.emailReport =
    emailReport;

window.saveCurrentPrediction =
    saveCurrentPrediction;

window.loadPredictionHistory =
    loadPredictionHistory;

window.renderPredictionResult =
    renderPredictionResult;

window.renderTopPredictions =
    renderTopPredictions;

window.renderSelectedSymptoms =
    renderSelectedSymptoms;

window.logoutUser =
    logoutUser;

// ============================================================
// END OF QUANTUMDIAGNOSE SCRIPT
// ============================================================
