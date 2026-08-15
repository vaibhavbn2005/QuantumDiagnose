// ============================================================
// QuantumDiagnose - Complete Updated script.js
// ============================================================
// Includes:
// 1. Email/Password Login only
// 2. Math CAPTCHA
// 3. Mandatory Patient Profile
// 4. Remember Patient Profile after logout/login
// 5. Welcome Back, Patient Name
// 6. Light/Dark Mode Toggle
// 7. Random Forest + Qiskit with ONE Analyze button
// 8. Firestore Doctor Recommendation
// 9. Prediction History
// 10. Date + Time in Prediction History
// 11. Download PDF Report
// 12. Model Comparison
// ============================================================


// ============================================================
// FIREBASE IMPORTS
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    addDoc,
    collection,
    getDocs,
    query,
    where,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAPrulUfMubKieGuU5QxQVWSu8sDtKvTZE",
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


// ============================================================
// HELPER
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// HTML ELEMENTS
// ============================================================

// Authentication
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


// Theme
const themeToggle = $("themeToggle");


// Profile
const profileName = $("profileName");
const profileGender = $("profileGender");
const profileAge = $("profileAge");
const profileHeight = $("profileHeight");
const profileWeight = $("profileWeight");

const saveProfileBtn = $("saveProfileBtn");
const profileMessage = $("profileMessage");


// Symptoms
const symptomGrid = $("symptomGrid");
const searchInput = $("search");
const count = $("count");
const clearBtn = $("clearBtn");
const predictBtn = $("predictBtn");


// Prediction result
const result = $("result");
const disease = $("disease");
const confidenceText = $("confidenceText");
const confidenceBar = $("confidenceBar");
const topPredictions = $("topPredictions");

const specialistBox = $("specialistBox");
const message = $("message");


// Random Forest
const rfResultSummary = $("rfResultSummary");


// Qiskit
const quantumPrediction = $("quantumPrediction");
const quantumScore = $("quantumScore");
const quantumScoreBar = $("quantumScoreBar");
const quantumQubits = $("quantumQubits");
const quantumDepth = $("quantumDepth");


// Doctor
const recommendedDoctorBox = $("recommendedDoctorBox");


// Buttons
const downloadReportBtn = $("downloadReportBtn");
const compareBtn = $("compareBtn");


// History
const historyList = $("historyList");
const doctorList = $("doctorList");


// ============================================================
// APPLICATION STATE
// ============================================================

let authMode = "login";

let currentUser = null;

let currentProfile = null;

let profileComplete = false;

let latestPrediction = null;

let predictionHistory = [];

let captchaAnswer = null;


// ============================================================
// THEME TOGGLE
// ============================================================

function applyTheme(dark) {

    document.body.classList.toggle("dark", dark);

    if (themeToggle) {
        themeToggle.checked = dark;
    }

    localStorage.setItem(
        "quantumdiagnose_theme",
        dark ? "dark" : "light"
    );
}


// Load saved theme
applyTheme(
    localStorage.getItem("quantumdiagnose_theme") === "dark"
);


// Toggle
themeToggle?.addEventListener("change", () => {

    applyTheme(themeToggle.checked);

});


// ============================================================
// CAPTCHA
// ============================================================

function createCaptcha() {

    const a = Math.floor(Math.random() * 9) + 2;

    const b = Math.floor(Math.random() * 9) + 1;

    captchaAnswer = a + b;

    if ($("captchaQuestion")) {

        $("captchaQuestion").textContent =
            `${a} + ${b} = ?`;

    }

    if ($("captchaAnswer")) {

        $("captchaAnswer").value = "";

    }
}


$("captchaRefresh")?.addEventListener(
    "click",
    createCaptcha
);


createCaptcha();


function verifyCaptcha() {

    const entered =
        Number($("captchaAnswer")?.value);

    if (
        !Number.isFinite(entered) ||
        entered !== captchaAnswer
    ) {

        showAuthMessage(
            "Security check failed. Please solve the question correctly.",
            true
        );

        createCaptcha();

        return false;
    }

    return true;
}


// ============================================================
// AUTHENTICATION MODE
// ============================================================

function setAuthMode(mode) {

    authMode = mode;

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

    createCaptcha();
}


loginTab?.addEventListener(
    "click",
    () => setAuthMode("login")
);


signupTab?.addEventListener(
    "click",
    () => setAuthMode("signup")
);


authPassword?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            handleAuthentication();

        }

    }
);


authSubmit?.addEventListener(
    "click",
    handleAuthentication
);


// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(
    text,
    isError = false
) {

    if (!authMessage) return;

    authMessage.textContent = text;

    authMessage.style.color =
        isError
            ? "#d9363e"
            : "#16834b";
}


// ============================================================
// FIREBASE ERROR MESSAGE
// ============================================================

function firebaseErrorMessage(error) {

    const code = error?.code || "";

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


// ============================================================
// LOGIN / SIGNUP
// ============================================================

async function handleAuthentication() {

    const email =
        authEmail?.value.trim();

    const password =
        authPassword?.value || "";


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


    if (!verifyCaptcha()) return;


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

            const resultCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            await createInitialProfile(
                resultCredential.user
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
            firebaseErrorMessage(error),
            true
        );

        createCaptcha();


    } finally {

        authSubmit.disabled = false;

        authSubmit.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";

    }
}


// ============================================================
// CREATE INITIAL PATIENT PROFILE
// ============================================================

async function createInitialProfile(user) {

    const ref =
        doc(
            db,
            "patients",
            user.uid
        );


    const existing =
        await getDoc(ref);


    if (!existing.exists()) {

        await setDoc(
            ref,
            {

                uid: user.uid,

                email: user.email || "",

                name: "",

                gender: "",

                age: "",

                height: "",

                weight: "",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );

    }

}


// ============================================================
// LOGOUT
// ============================================================

logoutBtn?.addEventListener(
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


// ============================================================
// PROFILE
// ============================================================

function profileIsComplete(data) {

    return Boolean(

        data &&

        String(data.name || "").trim() &&

        String(data.gender || "").trim() &&

        String(data.age || "").trim() &&

        String(data.height || "").trim() &&

        String(data.weight || "").trim()

    );
}


// ============================================================
// LOAD PROFILE
// ============================================================

async function loadProfile() {

    if (!currentUser) return false;


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

            profileComplete = false;

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

        profileComplete = false;

        return false;

    }
}


// ============================================================
// WELCOME BACK
// ============================================================

function updateWelcomeName(name) {

    if (!welcomeName) return;

    welcomeName.textContent =
        name?.trim() || "Patient";
}


// ============================================================
// SAVE PROFILE
// ============================================================

saveProfileBtn?.addEventListener(
    "click",
    saveProfile
);


async function saveProfile() {

    if (!currentUser) return;


    const data = {

        uid: currentUser.uid,

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


    if (!profileIsComplete(data)) {

        if (profileMessage) {

            profileMessage.textContent =
                "Please complete all patient profile fields.";

            profileMessage.style.color =
                "#d9363e";

        }

        profileComplete = false;

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
            ...currentProfile,
            ...data
        };


        profileComplete = true;


        updateWelcomeName(
            data.name
        );


        if (profileMessage) {

            profileMessage.textContent =
                "Profile saved successfully.";

            profileMessage.style.color =
                "#16834b";

        }


        setTimeout(
            () => showPage("dashboard"),
            600
        );


    } catch (error) {

        console.error(
            "Profile save error:",
            error
        );


        if (profileMessage) {

            profileMessage.textContent =
                "Could not save profile: " +
                error.message;

            profileMessage.style.color =
                "#d9363e";

        }

    }

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
        "Recommended Doctors",

    comparison:
        "Random Forest vs Qiskit",

    performance:
        "Performance"

};


function showPage(pageId) {


    // Profile is mandatory before prediction
    if (
        pageId === "prediction" &&
        !profileComplete
    ) {

        pageId = "profile";


        if (profileMessage) {

            profileMessage.textContent =
                "Please complete your Patient Profile before making a prediction.";

            profileMessage.style.color =
                "#d9363e";

        }

    }


    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );

        });


    const target =
        $(pageId);


    if (!target) return;


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


    if ($("pageTitle")) {

        $("pageTitle").textContent =
            pageTitles[pageId] ||
            "QuantumDiagnose";

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (pageId === "history") {

        loadHistory();

    }


    if (pageId === "doctors") {

        loadDoctors();

    }


    if (pageId === "performance") {

        loadPerformance();

    }

}


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


compareBtn?.addEventListener(
    "click",
    () => showPage("comparison")
);


// ============================================================
// SYMPTOMS
// ============================================================

function getSelectedSymptoms() {

    return Array
        .from(
            symptomGrid
                ?.querySelectorAll(
                    "input:checked"
                ) || []
        )
        .map(input => input.value);

}


function updateCount() {

    const selected =
        getSelectedSymptoms();


    if (count) {

        count.textContent =
            selected.length;

    }


    symptomGrid
        ?.querySelectorAll(".symptom")
        .forEach(label => {

            const checkbox =
                label.querySelector("input");


            label.classList.toggle(
                "selected",
                Boolean(
                    checkbox?.checked
                )
            );

        });

}


symptomGrid?.addEventListener(
    "change",
    updateCount
);


searchInput?.addEventListener(
    "input",
    () => {

        const value =
            searchInput.value
                .trim()
                .toLowerCase();


        symptomGrid
            ?.querySelectorAll(".symptom")
            .forEach(item => {

                const name =
                    (
                        item.dataset.name ||
                        item.textContent ||
                        ""
                    )
                    .toLowerCase();


                item.style.display =
                    name.includes(value)
                        ? "flex"
                        : "none";

            });

    }
);


clearBtn?.addEventListener(
    "click",
    () => {

        symptomGrid
            ?.querySelectorAll("input")
            .forEach(
                input =>
                    input.checked = false
            );


        if (searchInput) {

            searchInput.value = "";

        }


        symptomGrid
            ?.querySelectorAll(".symptom")
            .forEach(
                item =>
                    item.style.display = "flex"
            );


        updateCount();


        result?.classList.add(
            "hidden"
        );

    }
);


// ============================================================
// API
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


// ============================================================
// ANALYZE SYMPTOMS
// BOTH RANDOM FOREST + QISKIT
// ============================================================

predictBtn?.addEventListener(
    "click",
    analyzeSymptoms
);


async function analyzeSymptoms() {


    if (!profileComplete) {

        showPage("profile");

        return;

    }


    const symptoms =
        getSelectedSymptoms();


    if (!symptoms.length) {

        alert(
            "Please select at least one symptom."
        );

        return;

    }


    predictBtn.disabled = true;


    predictBtn.textContent =
        "Analyzing Random Forest + Qiskit...";


    result?.classList.remove(
        "hidden"
    );


    resetResult();


    try {


        // Run both models together
        const [
            rfResult,
            qResult
        ] = await Promise.allSettled([


            apiFetch(
                "/predict",
                {

                    method: "POST",

                    body: JSON.stringify({
                        symptoms
                    })

                }
            ),


            apiFetch(
                "/quantum",
                {

                    method: "POST",

                    body: JSON.stringify({
                        symptoms
                    })

                }
            )

        ]);


        if (
            rfResult.status !==
            "fulfilled"
        ) {

            throw (
                rfResult.reason ||
                new Error(
                    "Random Forest prediction failed."
                )
            );

        }


        const rf =
            rfResult.value;


        const quantum =
            qResult.status ===
            "fulfilled"
                ? qResult.value
                : null;


        // Render RF
        renderRandomForest(rf);


        // Render Qiskit
        renderQuantum(
            quantum,
            qResult.status === "rejected"
                ? qResult.reason
                : null
        );


        // Save latest prediction
        latestPrediction = {

            disease:
                rf.disease ||
                "Unknown",

            confidence:
                Number(
                    rf.confidence || 0
                ),

            topPredictions:
                rf.top_predictions ||
                [],

            specialty:
                rf.specialty ||
                "General Physician",

            doctors:
                Array.isArray(rf.doctors)
                    ? rf.doctors
                    : [],

            symptoms,

            quantumDisease:
                quantum?.prediction ||
                quantum?.disease ||
                null,

            quantumScore:
                quantum?.quantum_score ??
                quantum?.confidence ??
                null,

            quantumQubits:
                quantum?.qubits ??
                null,

            quantumDepth:
                quantum?.circuit_depth ??
                null,

            quantumInterpretation:
                quantum?.interpretation ||
                "",

            createdAtClient:
                new Date().toISOString()

        };


        // Get doctor from Firestore
        const firestoreDoctors =
            await findDoctorsFromFirestore(
                latestPrediction.specialty
            );


        if (
            firestoreDoctors.length
        ) {

            latestPrediction.doctors =
                firestoreDoctors;

            renderRecommendedDoctor(
                firestoreDoctors,
                latestPrediction.specialty
            );

        }


        // Save prediction
        await savePrediction(
            latestPrediction
        );


        // Reload history
        await loadHistory();


        // Update dashboard
        updateDashboard(
            latestPrediction
        );


        // Update comparison
        updateComparison(
            latestPrediction
        );


        showPage(
            "prediction"
        );


        setTimeout(
            () => {

                result?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            100
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

        predictBtn.disabled = false;


        predictBtn.textContent =
            "Analyze Symptoms";

    }

}


// ============================================================
// RESET RESULT
// ============================================================

function resetResult() {

    if (disease)
        disease.textContent = "—";


    if (confidenceText)
        confidenceText.textContent = "0%";


    if (confidenceBar)
        confidenceBar.style.width = "0%";


    if (topPredictions)
        topPredictions.innerHTML = "";


    if (specialistBox)
        specialistBox.innerHTML = "";


    if (recommendedDoctorBox)
        recommendedDoctorBox.innerHTML = "";


    if (rfResultSummary)
        rfResultSummary.textContent = "—";


    if (quantumPrediction)
        quantumPrediction.textContent =
            "Experimental quantum score";


    if (quantumScore)
        quantumScore.textContent = "—";


    if (quantumScoreBar)
        quantumScoreBar.style.width = "0%";


    if (quantumQubits)
        quantumQubits.textContent = "—";


    if (quantumDepth)
        quantumDepth.textContent = "—";


    if (message)
        message.textContent = "";

}


// ============================================================
// RANDOM FOREST RESULT
// ============================================================

function renderRandomForest(data) {

    const confidence =
        Number(
            data.confidence || 0
        );


    if (disease) {

        disease.textContent =
            data.disease ||
            "Unknown";

    }


    if (confidenceText) {

        confidenceText.textContent =
            `${confidence.toFixed(2)}%`;

    }


    if (confidenceBar) {

        confidenceBar.style.width =
            `${Math.min(
                Math.max(
                    confidence,
                    0
                ),
                100
            )}%`;

    }


    if (rfResultSummary) {

        rfResultSummary.textContent =
            `${data.disease || "Unknown"} • ${confidence.toFixed(2)}%`;

    }


    if (topPredictions) {

        topPredictions.innerHTML =
            (
                data.top_predictions ||
                []
            )
            .slice(0, 5)
            .map(item => `

                <div class="top-row">

                    <span>
                        ${escapeHtml(
                            item.disease
                        )}
                    </span>

                    <strong>
                        ${Number(
                            item.confidence || 0
                        ).toFixed(2)}%
                    </strong>

                </div>

            `)
            .join("");

    }


    const specialty =
        data.specialty ||
        "General Physician";


    if (specialistBox) {

        specialistBox.innerHTML = `

            <strong>
                Recommended Medical Specialty
            </strong>

            <p>
                ${escapeHtml(
                    specialty
                )}
            </p>

        `;

    }


    if (
        Array.isArray(
            data.doctors
        ) &&
        data.doctors.length
    ) {

        renderRecommendedDoctor(
            data.doctors,
            specialty
        );

    }


    if (message) {

        message.textContent =
            data.message ||
            "This is an educational machine-learning prediction and not a medical diagnosis.";

    }

}


// ============================================================
// QISKIT RESULT
// ============================================================

function renderQuantum(
    data,
    error = null
) {


    if (!data) {

        if (quantumScore) {

            quantumScore.textContent =
                "Unavailable";

        }


        if (quantumPrediction) {

            quantumPrediction.textContent =
                error
                    ? "Qiskit could not run."
                    : "No Qiskit result returned.";

        }


        return;

    }


    const score =
        Number(
            data.quantum_score ??
            data.confidence ??
            0
        );


    if (quantumScore) {

        quantumScore.textContent =
            `${score.toFixed(2)}%`;

    }


    if (quantumScoreBar) {

        quantumScoreBar.style.width =
            `${Math.min(
                Math.max(
                    score,
                    0
                ),
                100
            )}%`;

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


    if (quantumPrediction) {

        if (
            data.prediction ||
            data.disease
        ) {

            quantumPrediction.textContent =
                `Experimental prediction: ${
                    data.prediction ||
                    data.disease
                }`;

        } else {

            quantumPrediction.textContent =
                "Experimental quantum score";

        }

    }

}


// ============================================================
// FIND DOCTOR FROM FIRESTORE
// ============================================================

async function findDoctorsFromFirestore(
    specialty = ""
) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "doctors"
                )
            );


        const doctors =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        if (!specialty) {

            return doctors;

        }


        const target =
            normalizeText(
                specialty
            );


        // First try exact/strong specialty match
        let matched =
            doctors.filter(
                doctor => {

                    const doctorSpecialty =
                        normalizeText(
                            doctor.specialization ||
                            doctor.specialty ||
                            ""
                        );

                    return (
                        doctorSpecialty.includes(
                            target
                        ) ||
                        target.includes(
                            doctorSpecialty
                        )
                    );

                }
            );


        // If no exact match, try keyword matching
        if (!matched.length) {

            const keywords =
                target
                    .split(" ")
                    .filter(
                        word =>
                            word.length > 3
                    );


            matched =
                doctors.filter(
                    doctor => {

                        const text =
                            normalizeText(
                                doctor.specialization ||
                                doctor.specialty ||
                                ""
                            );

                        return keywords.some(
                            keyword =>
                                text.includes(
                                    keyword
                                )
                        );

                    }
                );

        }


        return matched.length
            ? matched
            : doctors;

    } catch (error) {

        console.error(
            "Firestore doctor search error:",
            error
        );

        return [];

    }

}


// ============================================================
// RECOMMENDED DOCTOR
// ============================================================

function renderRecommendedDoctor(
    doctors,
    specialty
) {


    if (!recommendedDoctorBox)
        return;


    if (
        !Array.isArray(doctors) ||
        !doctors.length
    ) {

        recommendedDoctorBox.innerHTML = `

            <h4>
                👨‍⚕️ Recommended Doctor
            </h4>

            <p>
                Specialty:
                <strong>
                    ${escapeHtml(
                        specialty ||
                        "General Physician"
                    )}
                </strong>
            </p>

            <p>
                No matching doctor found.
            </p>

        `;

        return;

    }


    const doctor =
        doctors[0];


    recommendedDoctorBox.innerHTML = `

        <h4>
            👨‍⚕️ Recommended Doctor
        </h4>

        <p>
            <strong>
                ${escapeHtml(
                    doctor.name ||
                    "Doctor"
                )}
            </strong>
        </p>

        <p>
            ${escapeHtml(
                doctor.specialization ||
                doctor.specialty ||
                specialty ||
                "General Physician"
            )}
        </p>

        <p>
            ${escapeHtml(
                doctor.hospital ||
                ""
            )}
        </p>

        <p>
            ${escapeHtml(
                doctor.location ||
                ""
            )}
        </p>

        <p>
            Experience:
            ${escapeHtml(
                doctor.experience ||
                "—"
            )}
        </p>

        ${
            doctor.available !== undefined
                ? `
                    <p>
                        Availability:
                        <strong>
                            ${
                                doctor.available
                                    ? "Available"
                                    : "Not Available"
                            }
                        </strong>
                    </p>
                `
                : ""
        }

    `;

}


// ============================================================
// DOCTORS PAGE
// ============================================================

async function loadDoctors(
    specialty = ""
) {

    if (!doctorList) return;


    doctorList.innerHTML =
        `<p class="muted">
            Loading doctors...
        </p>`;


    try {

        const doctors =
            await findDoctorsFromFirestore(
                specialty
            );


        doctorList.innerHTML =
            doctors.length

                ? doctors
                    .map(
                        doctorCard
                    )
                    .join("")

                : `

                    <p class="muted">
                        No doctors found.
                    </p>

                  `;


    } catch (error) {

        console.error(
            "Doctor loading error:",
            error
        );


        doctorList.innerHTML = `

            <p class="muted">
                Could not load doctors.
            </p>

        `;

    }

}


// ============================================================
// DOCTOR CARD
// ============================================================

function doctorCard(
    doctor
) {

    return `

        <div class="doctor-card">

            <h3>
                ${escapeHtml(
                    doctor.name ||
                    "Doctor"
                )}
            </h3>

            <div class="specialty">

                ${escapeHtml(
                    doctor.specialization ||
                    doctor.specialty ||
                    ""
                )}

            </div>

            <p>
                ${escapeHtml(
                    doctor.hospital ||
                    ""
                )}
            </p>

            <p>
                ${escapeHtml(
                    doctor.location ||
                    ""
                )}
            </p>

            <p>
                Experience:
                ${escapeHtml(
                    doctor.experience ||
                    "—"
                )}
            </p>

            ${
                doctor.available !== undefined
                    ? `
                        <p>
                            ${
                                doctor.available
                                    ? "🟢 Available"
                                    : "🔴 Not Available"
                            }
                        </p>
                    `
                    : ""
            }

        </div>

    `;

}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard(
    prediction
) {


    if ($("latestDisease")) {

        $("latestDisease").textContent =
            prediction.disease;

    }


    if ($("dashboardLatest")) {

        $("dashboardLatest").innerHTML = `

            <strong>
                ${escapeHtml(
                    prediction.disease
                )}
            </strong>

            <p class="muted">

                Random Forest confidence:
                ${Number(
                    prediction.confidence
                ).toFixed(2)}%

            </p>

            <p class="muted">

                Qiskit experimental score:
                ${
                    prediction.quantumScore ==
                    null

                        ? "Unavailable"

                        : Number(
                            prediction.quantumScore
                        ).toFixed(2) + "%"
                }

            </p>

        `;

    }

}


// ============================================================
// MODEL COMPARISON
// ============================================================

function updateComparison(
    prediction
) {


    if ($("comparisonDisease")) {

        $("comparisonDisease").textContent =
            prediction.disease ||
            "—";

    }


    if ($("comparisonRF")) {

        $("comparisonRF").textContent =
            `${Number(
                prediction.confidence || 0
            ).toFixed(2)}%`;

    }


    if ($("comparisonQiskit")) {

        $("comparisonQiskit").textContent =
            prediction.quantumScore ==
            null

                ? "Unavailable"

                : `${Number(
                    prediction.quantumScore
                ).toFixed(2)}%`;

    }


    if ($("rfAccuracy")) {

        $("rfAccuracy").textContent =
            `${Number(
                prediction.confidence || 0
            ).toFixed(2)}% confidence`;

    }

}


// ============================================================
// SAVE PREDICTION TO FIRESTORE
// ============================================================

async function savePrediction(
    prediction
) {

    if (!currentUser) return;


    try {

        // IMPORTANT:
        // Your Firestore collection is "predictions"

        await addDoc(

            collection(
                db,
                "predictions"
            ),

            {

                userId:
                    currentUser.uid,

                userEmail:
                    currentUser.email ||
                    "",

                patientName:
                    currentProfile?.name ||
                    "",

                symptoms:
                    prediction.symptoms ||
                    [],

                disease:
                    prediction.disease ||
                    "Unknown",

                confidence:
                    Number(
                        prediction.confidence ||
                        0
                    ),

                topPredictions:
                    prediction.topPredictions ||
                    [],

                specialty:
                    prediction.specialty ||
                    "",

                doctors:
                    prediction.doctors ||
                    [],

                quantumDisease:
                    prediction.quantumDisease ||
                    null,

                quantumScore:
                    prediction.quantumScore ==
                    null

                        ? null

                        : Number(
                            prediction.quantumScore
                        ),

                quantumQubits:
                    prediction.quantumQubits ??
                    null,

                quantumDepth:
                    prediction.quantumDepth ??
                    null,

                // Firebase server time
                createdAt:
                    serverTimestamp(),

                // Backup time
                // Used if server timestamp
                // has not resolved yet
                createdAtClient:
                    prediction.createdAtClient ||
                    new Date().toISOString()

            }

        );


    } catch (error) {

        console.error(
            "Prediction save error:",
            error
        );

    }

}


// ============================================================
// CONVERT FIRESTORE TIMESTAMP
// ============================================================

function timestampToDate(
    value
) {

    if (!value)
        return null;


    // Firestore Timestamp
    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    // JavaScript Date
    if (
        value instanceof Date
    ) {

        return value;

    }


    // ISO string / number
    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {

        const date =
            new Date(value);


        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    // Firestore timestamp object
    if (
        typeof value === "object" &&
        value.seconds != null
    ) {

        return new Date(

            value.seconds * 1000 +

            Math.floor(
                (value.nanoseconds || 0) /
                1000000
            )

        );

    }


    return null;

}


// ============================================================
// FORMAT DATE + TIME
// ============================================================

function formatDateTime(
    item
) {


    // First use Firestore timestamp
    // Then fallback to client timestamp

    const date =
        timestampToDate(
            item.createdAt
        ) ||

        timestampToDate(
            item.createdAtClient
        );


    if (!date) {

        return "Date/time unavailable";

    }


    return date.toLocaleString(
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
// LOAD PREDICTION HISTORY
// ============================================================

async function loadHistory() {

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


        // No orderBy()
        // This avoids Firestore composite
        // index requirement.

        const q =
            query(

                collection(
                    db,
                    "predictions"
                ),

                where(
                    "userId",
                    "==",
                    currentUser.uid
                )

            );


        const snapshot =
            await getDocs(q);


        predictionHistory =
            snapshot.docs.map(
                item => ({

                    id: item.id,

                    ...item.data()

                })
            );


        // Sort newest first
        predictionHistory.sort(
            (a, b) => {

                const dateA =
                    timestampToDate(
                        a.createdAt
                    ) ||

                    timestampToDate(
                        a.createdAtClient
                    ) ||

                    new Date(0);


                const dateB =
                    timestampToDate(
                        b.createdAt
                    ) ||

                    timestampToDate(
                        b.createdAtClient
                    ) ||

                    new Date(0);


                return dateB - dateA;

            }
        );


        if ($("predictionCount")) {

            $("predictionCount").textContent =
                predictionHistory.length;

        }


        if (
            !predictionHistory.length
        ) {

            historyList.innerHTML =
                `<p class="muted">
                    No predictions yet.
                </p>`;

            return;

        }


        historyList.innerHTML =
            predictionHistory
                .map(
                    (
                        item,
                        index
                    ) => {


                        const symptoms =
                            Array.isArray(
                                item.symptoms
                            )

                                ? item.symptoms
                                    .map(
                                        formatSymptom
                                    )
                                    .join(", ")

                                : "";


                        const rf =
                            Number(
                                item.confidence ||
                                0
                            );


                        const qScore =
                            item.quantumScore ==
                            null

                                ? null

                                : Number(
                                    item.quantumScore
                                );


                        const agreement =
                            item.quantumDisease &&
                            item.disease &&

                            normalizeText(
                                item.quantumDisease
                            ) ===

                            normalizeText(
                                item.disease
                            );


                        return `

                            <div class="history-item">

                                <div class="history-main">

                                    <div>

                                        <div class="history-disease">

                                            ${escapeHtml(
                                                item.disease ||
                                                "Unknown"
                                            )}

                                        </div>


                                        <div class="history-time">

                                            🕒

                                            ${escapeHtml(
                                                formatDateTime(
                                                    item
                                                )
                                            )}

                                        </div>


                                        <div class="history-symptoms">

                                            <strong>
                                                Symptoms:
                                            </strong>

                                            ${escapeHtml(
                                                symptoms ||
                                                "Not recorded"
                                            )}

                                        </div>

                                    </div>


                                    <div class="history-badges">

                                        <span class="badge">

                                            RF:
                                            ${rf.toFixed(2)}%

                                        </span>


                                        ${
                                            qScore ==
                                            null

                                                ? ""

                                                : `

                                                    <span class="badge quantum">

                                                        Qiskit:
                                                        ${qScore.toFixed(2)}%

                                                    </span>

                                                  `
                                        }


                                        ${
                                            agreement

                                                ? `

                                                    <span class="badge agree">

                                                        Agreement:
                                                        High

                                                    </span>

                                                  `

                                                : ""
                                        }

                                    </div>

                                </div>


                                <div class="history-actions">

                                    <button

                                        class="secondary history-report"

                                        data-index="${index}"

                                        type="button"

                                    >

                                        📄 Download Report

                                    </button>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        // Download buttons
        document
            .querySelectorAll(
                ".history-report"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const item =
                                predictionHistory[
                                    Number(
                                        button.dataset.index
                                    )
                                ];


                            if (item) {

                                downloadReport(
                                    item
                                );

                            }

                        }
                    );

                }
            );


        const latest =
            predictionHistory[0];


        if (
            latest &&
            $("latestDisease")
        ) {

            $("latestDisease").textContent =
                latest.disease ||
                "—";

        }


    } catch (error) {

        console.error(
            "History loading error:",
            error
        );


        historyList.innerHTML = `

            <p class="muted">

                Could not load history:
                ${escapeHtml(
                    error.message
                )}

            </p>

        `;

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


        if ($("metricAccuracy")) {

            $("metricAccuracy").textContent =
                `${data.accuracy ?? "—"}%`;

        }


        if ($("metricPrecision")) {

            $("metricPrecision").textContent =
                `${data.precision ?? "—"}%`;

        }


        if ($("metricRecall")) {

            $("metricRecall").textContent =
                `${data.recall ?? "—"}%`;

        }


        if ($("metricF1")) {

            $("metricF1").textContent =
                `${data.f1 ?? "—"}%`;

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
            "Performance error:",
            error
        );

    }

}


// ============================================================
// DOWNLOAD REPORT BUTTON
// ============================================================

downloadReportBtn?.addEventListener(
    "click",
    async () => {

        if (!latestPrediction) {

            alert(
                "Please run an analysis first."
            );

            return;

        }


        await downloadReport(
            latestPrediction
        );

    }
);


// ============================================================
// LOAD jsPDF IF NEEDED
// ============================================================

async function loadJsPDF() {

    if (
        window.jspdf &&
        window.jspdf.jsPDF
    ) {

        return window.jspdf.jsPDF;

    }


    return new Promise(
        (resolve, reject) => {

            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";


            script.onload = () => {

                if (
                    window.jspdf &&
                    window.jspdf.jsPDF
                ) {

                    resolve(
                        window.jspdf.jsPDF
                    );

                } else {

                    reject(
                        new Error(
                            "jsPDF could not be loaded."
                        )
                    );

                }

            };


            script.onerror = () => {

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

}


// ============================================================
// DOWNLOAD PDF REPORT
// ============================================================

async function downloadReport(
    item
) {


    try {

        const JsPDF =
            await loadJsPDF();


        const pdf =
            new JsPDF();


        const patient =
            currentProfile || {};


        const dateTime =
            formatDateTime(
                item
            );


        const symptoms =
            Array.isArray(
                item.symptoms
            )

                ? item.symptoms
                    .map(
                        formatSymptom
                    )
                    .join(", ")

                : "Not recorded";


        let y = 20;


        function addLine(
            text,
            size = 11,
            bold = false
        ) {

            pdf.setFontSize(
                size
            );


            pdf.setFont(
                "helvetica",
                bold
                    ? "bold"
                    : "normal"
            );


            const lines =
                pdf.splitTextToSize(
                    String(text),
                    175
                );


            pdf.text(
                lines,
                18,
                y
            );


            y +=
                lines.length *
                (
                    size >= 16
                        ? 8
                        : 6
                ) +
                3;


            if (y > 275) {

                pdf.addPage();

                y = 20;

            }

        }


        // Header
        addLine(
            "QuantumDiagnose",
            20,
            true
        );


        addLine(
            "Patient Symptom Analysis Report",
            14,
            true
        );


        addLine(
            `Analysis Date & Time: ${dateTime}`
        );


        addLine(
            "------------------------------------------"
        );


        // Patient
        addLine(
            "PATIENT INFORMATION",
            14,
            true
        );


        addLine(
            `Name: ${
                patient.name ||
                "Not available"
            }`
        );


        addLine(
            `Email: ${
                currentUser?.email ||
                "Not available"
            }`
        );


        addLine(
            `Age: ${
                patient.age ||
                "Not available"
            }`
        );


        addLine(
            `Gender: ${
                patient.gender ||
                "Not available"
            }`
        );


        addLine(
            `Height: ${
                patient.height ||
                "Not available"
            }`
        );


        addLine(
            `Weight: ${
                patient.weight ||
                "Not available"
            }`
        );


        y += 3;


        // Symptoms
        addLine(
            "SYMPTOMS REPORTED",
            14,
            true
        );


        addLine(
            symptoms
        );


        y += 3;


        // RF
        addLine(
            "RANDOM FOREST RESULT",
            14,
            true
        );


        addLine(
            `Predicted Condition: ${
                item.disease ||
                "Unknown"
            }`
        );


        addLine(
            `Confidence: ${
                Number(
                    item.confidence ||
                    0
                ).toFixed(2)
            }%`
        );


        addLine(
            `Recommended Specialty: ${
                item.specialty ||
                "General Physician"
            }`
        );


        y += 3;


        // Top predictions
        addLine(
            "TOP PREDICTIONS",
            14,
            true
        );


        (
            item.topPredictions ||
            []
        )
        .slice(0, 5)
        .forEach(
            prediction => {

                addLine(

                    `${
                        prediction.disease
                    } : ${
                        Number(
                            prediction.confidence ||
                            0
                        ).toFixed(2)
                    }%`

                );

            }
        );


        y += 3;


        // Qiskit
        addLine(
            "QISKIT EXPERIMENTAL COMPONENT",
            14,
            true
        );


        addLine(
            `Experimental Score: ${
                item.quantumScore ==
                null

                    ? "Unavailable"

                    : Number(
                        item.quantumScore
                    ).toFixed(2) +
                    "%"
            }`
        );


        addLine(
            `Experimental Prediction: ${
                item.quantumDisease ||
                "Unavailable"
            }`
        );


        addLine(
            `Qubits: ${
                item.quantumQubits ??
                "—"
            }`
        );


        addLine(
            `Circuit Depth: ${
                item.quantumDepth ??
                "—"
            }`
        );


        y += 3;


        // Comparison
        addLine(
            "MODEL COMPARISON",
            14,
            true
        );


        addLine(
            `Random Forest: ${
                Number(
                    item.confidence ||
                    0
                ).toFixed(2)
            }%`
        );


        addLine(
            `Qiskit: ${
                item.quantumScore ==
                null

                    ? "Unavailable"

                    : Number(
                        item.quantumScore
                    ).toFixed(2) +
                    "%"
            }`
        );


        const agreement =
            item.quantumDisease &&
            item.disease &&
            normalizeText(
                item.quantumDisease
            ) ===
            normalizeText(
                item.disease
            );


        addLine(
            `Model Agreement: ${
                agreement
                    ? "High"
                    : "Different predictions"
            }`
        );


        y += 3;


        // Doctor
        addLine(
            "RECOMMENDED DOCTOR",
            14,
            true
        );


        const doctor =
            Array.isArray(
                item.doctors
            )
                ? item.doctors[0]
                : null;


        if (doctor) {

            addLine(
                `Doctor: ${
                    doctor.name ||
                    "Doctor"
                }`
            );


            addLine(
                `Specialization: ${
                    doctor.specialization ||
                    doctor.specialty ||
                    item.specialty ||
                    ""
                }`
            );


            addLine(
                `Hospital: ${
                    doctor.hospital ||
                    ""
                }`
            );


            addLine(
                `Location: ${
                    doctor.location ||
                    ""
                }`
            );


            addLine(
                `Experience: ${
                    doctor.experience ||
                    "—"
                }`
            );


            if (
                doctor.available !==
                undefined
            ) {

                addLine(
                    `Availability: ${
                        doctor.available
                            ? "Available"
                            : "Not Available"
                    }`
                );

            }

        } else {

            addLine(
                `Specialty: ${
                    item.specialty ||
                    "General Physician"
                }`
            );


            addLine(
                "No matching doctor was found."
            );

        }


        y += 4;


        // Disclaimer
        addLine(
            "DISCLAIMER",
            13,
            true
        );


        addLine(
            "This report is generated by an educational machine-learning and quantum proof-of-concept. It is not a medical diagnosis and should not replace evaluation or advice from a qualified healthcare professional."
        );


        pdf.save(
            `QuantumDiagnose_Report_${safeFileName(
                item.disease ||
                "Prediction"
            )}.pdf`
        );


    } catch (error) {

        console.error(
            "PDF report error:",
            error
        );


        // Fallback text report
        downloadTextReport(
            item
        );

    }

}


// ============================================================
// TEXT REPORT FALLBACK
// ============================================================

function downloadTextReport(
    item
) {


    const symptoms =
        Array.isArray(
            item.symptoms
        )

            ? item.symptoms
                .map(
                    formatSymptom
                )
                .join(", ")

            : "";


    const doctor =
        Array.isArray(
            item.doctors
        )
            ? item.doctors[0]
            : null;


    const text = [

        "QUANTUMDIAGNOSE",

        "PATIENT SYMPTOM ANALYSIS REPORT",

        "",

        `Date & Time: ${
            formatDateTime(item)
        }`,

        "",

        "PATIENT INFORMATION",

        `Name: ${
            currentProfile?.name ||
            "Not available"
        }`,

        `Email: ${
            currentUser?.email ||
            "Not available"
        }`,

        `Age: ${
            currentProfile?.age ||
            "Not available"
        }`,

        `Gender: ${
            currentProfile?.gender ||
            "Not available"
        }`,

        "",

        "SYMPTOMS",

        symptoms,

        "",

        "RANDOM FOREST",

        `Disease: ${
            item.disease ||
            "Unknown"
        }`,

        `Confidence: ${
            Number(
                item.confidence ||
                0
            ).toFixed(2)
        }%`,

        `Specialty: ${
            item.specialty ||
            "General Physician"
        }`,

        "",

        "QISKIT",

        `Experimental Prediction: ${
            item.quantumDisease ||
            "Unavailable"
        }`,

        `Experimental Score: ${
            item.quantumScore ==
            null
                ? "Unavailable"
                : Number(
                    item.quantumScore
                ).toFixed(2) +
                "%"
        }`,

        `Qubits: ${
            item.quantumQubits ??
            "—"
        }`,

        `Circuit Depth: ${
            item.quantumDepth ??
            "—"
        }`,

        "",

        "RECOMMENDED DOCTOR",

        `Name: ${
            doctor?.name ||
            "Not available"
        }`,

        `Specialization: ${
            doctor?.specialization ||
            doctor?.specialty ||
            item.specialty ||
            ""
        }`,

        `Hospital: ${
            doctor?.hospital ||
            ""
        }`,

        `Location: ${
            doctor?.location ||
            ""
        }`,

        "",

        "DISCLAIMER",

        "Educational prediction only. This report is not a medical diagnosis."

    ].join("\n");


    const blob =
        new Blob(
            [text],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href = url;


    a.download =
        `QuantumDiagnose_Report_${safeFileName(
            item.disease ||
            "Prediction"
        )}.txt`;


    document.body.appendChild(a);

    a.click();

    a.remove();


    URL.revokeObjectURL(
        url
    );

}


// ============================================================
// HELPERS
// ============================================================

function safeFileName(
    value
) {

    return String(
        value
    )
    .replace(
        /[^a-z0-9_-]+/gi,
        "_"
    )
    .slice(
        0,
        60
    );

}


function formatSymptom(
    value
) {

    return String(
        value || ""
    )
    .replace(
        /_/g,
        " "
    )
    .replace(
        /\b\w/g,
        c =>
            c.toUpperCase()
    );

}


function normalizeText(
    value
) {

    return String(
        value || ""
    )
    .toLowerCase()
    .replace(
        /[_-]/g,
        " "
    )
    .replace(
        /\s+/g,
        " "
    )
    .trim();

}


function escapeHtml(
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
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {


        currentUser =
            user;


        if (!user) {


            authScreen?.classList.remove(
                "hidden"
            );


            app?.classList.add(
                "hidden"
            );


            currentProfile =
                null;


            profileComplete =
                false;


            latestPrediction =
                null;


            predictionHistory =
                [];


            return;

        }


        // User logged in

        authScreen?.classList.add(
            "hidden"
        );


        app?.classList.remove(
            "hidden"
        );


        if (userEmail) {

            userEmail.textContent =
                user.email ||
                "User";

        }


        // Load saved profile
        const complete =
            await loadProfile();


        // Load history
        await loadHistory();


        // Load doctors
        await loadDoctors();


        // Load performance
        await loadPerformance();


        if (complete) {


            // Profile already saved
            // Do NOT ask again

            showPage(
                "dashboard"
            );


            if (
                welcomeName &&
                currentProfile?.name
            ) {

                welcomeName.textContent =
                    currentProfile.name;

            }


        } else {


            // First time / incomplete profile

            showPage(
                "profile"
            );


            if (profileMessage) {

                profileMessage.textContent =
                    "Please complete your Patient Profile before using New Prediction.";

                profileMessage.style.color =
                    "#d9363e";

            }

        }

    }
);


// ============================================================
// INITIALIZE
// ============================================================

updateCount();


console.log(
    "QuantumDiagnose updated script.js loaded successfully."
);
