/* ============================================================
   QuantumDiagnose
   Complete Frontend JavaScript
   ============================================================ */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
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


/* ============================================================
   FIREBASE CONFIG
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyAPrulUfMubKieGuU5QxQVwSu8sDtKvTZE",
    authDomain: "quantumdiagnose.firebaseapp.com",
    projectId: "quantumdiagnose",
    storageBucket: "quantumdiagnose.firebasestorage.app",
    messagingSenderId: "727641186346",
    appId: "1:727641186346:web:958942c8d9f6906a69e353",
    measurementId: "G-YM0HMMVBFR"
};


/* ============================================================
   INITIALIZE FIREBASE
   ============================================================ */

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);

console.log("QuantumDiagnose Firebase initialized");


/* ============================================================
   DOM ELEMENTS
   ============================================================ */

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


/* Dashboard */

const predictionCount =
    document.getElementById("predictionCount");

const latestDisease =
    document.getElementById("latestDisease");

const dashboardLatest =
    document.getElementById("dashboardLatest");


/* Profile */

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


/* Symptoms */

const symptomGrid =
    document.getElementById("symptomGrid");

const searchInput =
    document.getElementById("search");

const count =
    document.getElementById("count");

const clearBtn =
    document.getElementById("clearBtn");

const predictBtn =
    document.getElementById("predictBtn");


/* Result */

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


/* History */

const historyList =
    document.getElementById("historyList");


/* Doctors */

const doctorList =
    document.getElementById("doctorList");


/* Quantum */

const quantumBtn =
    document.getElementById("quantumBtn");

const quantumResult =
    document.getElementById("quantumResult");


/* Performance */

const metricAccuracy =
    document.getElementById("metricAccuracy");

const metricPrecision =
    document.getElementById("metricPrecision");

const metricRecall =
    document.getElementById("metricRecall");

const metricF1 =
    document.getElementById("metricF1");

const trainingSamples =
    document.getElementById("trainingSamples");

const testingSamples =
    document.getElementById("testingSamples");

const symptomTotal =
    document.getElementById("symptomTotal");

const diseaseTotal =
    document.getElementById("diseaseTotal");

const rfAccuracy =
    document.getElementById("rfAccuracy");


/* ============================================================
   AUTHENTICATION
   ============================================================ */

let authMode = "login";


function showAuthMessage(text, isError = false) {

    if (!authMessage) return;

    authMessage.textContent = text;

    authMessage.style.color =
        isError
            ? "#d9363e"
            : "#16834b";
}


function setAuthMode(mode) {

    authMode = mode;

    if (loginTab) {
        loginTab.classList.toggle(
            "active",
            mode === "login"
        );
    }

    if (signupTab) {
        signupTab.classList.toggle(
            "active",
            mode === "signup"
        );
    }

    if (authSubmit) {
        authSubmit.textContent =
            mode === "login"
                ? "Login"
                : "Create Account";
    }

    showAuthMessage("");
}


/* Login / Signup */

async function handleAuthentication() {

    const email =
        authEmail.value.trim();

    const password =
        authPassword.value;


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

        } else {

            const result =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            await createInitialProfile(
                result.user
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

    } finally {

        authSubmit.disabled = false;

        authSubmit.textContent =
            authMode === "login"
                ? "Login"
                : "Create Account";
    }
}


/* Firebase errors */

function firebaseErrorMessage(error) {

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


/* Create initial profile */

async function createInitialProfile(user) {

    try {

        const reference =
            doc(
                db,
                "patients",
                user.uid
            );


        const existing =
            await getDoc(reference);


        if (!existing.exists()) {

            await setDoc(
                reference,
                {
                    uid: user.uid,

                    email:
                        user.email || "",

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

    } catch (error) {

        console.error(
            "Profile creation error:",
            error
        );
    }
}


/* ============================================================
   AUTH STATE
   ============================================================ */

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            showApplication(user);

        } else {

            showAuthenticationScreen();
        }

    }
);


function showApplication(user) {

    if (authScreen) {
        authScreen.classList.add("hidden");
    }

    if (app) {
        app.classList.remove("hidden");
    }

    if (userEmail) {
        userEmail.textContent =
            user.email || "";
    }


    const username =
        user.email
            ? user.email.split("@")[0]
            : "Patient";


    if (welcomeName) {
        welcomeName.textContent =
            username;
    }


    loadProfile();

    loadHistory();

    loadPerformance();

    showPage("dashboard");
}


function showAuthenticationScreen() {

    if (app) {
        app.classList.add("hidden");
    }

    if (authScreen) {
        authScreen.classList.remove("hidden");
    }
}


/* ============================================================
   LOGOUT
   ============================================================ */

if (logoutBtn) {

    logoutBtn.addEventListener(
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
}


/* ============================================================
   PAGE NAVIGATION
   ============================================================ */

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );

const goButtons =
    document.querySelectorAll(
        "[data-go]"
    );

const pages =
    document.querySelectorAll(
        ".page"
    );


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


    const selected =
        document.getElementById(
            pageName
        );


    if (!selected) {

        console.warn(
            "Page not found:",
            pageName
        );

        return;
    }


    selected.classList.add(
        "active-page"
    );


    navItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page === pageName
            );

        }
    );


    if (pageTitle) {

        pageTitle.textContent =
            pageTitles[pageName] ||
            "Dashboard";
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (pageName === "history") {
        loadHistory();
    }

    if (pageName === "doctors") {
        loadDoctors();
    }

    if (pageName === "performance") {
        loadPerformance();
    }
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


goButtons.forEach(
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


/* ============================================================
   PROFILE
   ============================================================ */

async function loadProfile() {

    const user =
        auth.currentUser;


    if (!user) return;


    try {

        const reference =
            doc(
                db,
                "patients",
                user.uid
            );


        const snapshot =
            await getDoc(reference);


        if (!snapshot.exists()) {
            return;
        }


        const profile =
            snapshot.data();


        if (profileName) {
            profileName.value =
                profile.name || "";
        }

        if (profileGender) {
            profileGender.value =
                profile.gender || "";
        }

        if (profileAge) {
            profileAge.value =
                profile.age || "";
        }

        if (profileHeight) {
            profileHeight.value =
                profile.height || "";
        }

        if (profileWeight) {
            profileWeight.value =
                profile.weight || "";
        }


        if (welcomeName) {

            welcomeName.textContent =
                profile.name ||
                (
                    user.email
                        ? user.email.split("@")[0]
                        : "Patient"
                );
        }


    } catch (error) {

        console.error(
            "Profile load error:",
            error
        );
    }
}


if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        async () => {

            const user =
                auth.currentUser;


            if (!user) {

                profileMessage.textContent =
                    "Please login first.";

                return;
            }


            const profile = {

                uid:
                    user.uid,

                email:
                    user.email || "",

                name:
                    profileName.value.trim(),

                gender:
                    profileGender.value,

                age:
                    profileAge.value,

                height:
                    profileHeight.value,

                weight:
                    profileWeight.value,

                updatedAt:
                    serverTimestamp()
            };


            saveProfileBtn.disabled = true;

            saveProfileBtn.textContent =
                "Saving...";


            try {

                await setDoc(
                    doc(
                        db,
                        "patients",
                        user.uid
                    ),
                    profile,
                    {
                        merge: true
                    }
                );


                if (welcomeName) {

                    welcomeName.textContent =
                        profile.name ||
                        "Patient";
                }


                profileMessage.textContent =
                    "Profile saved successfully.";


            } catch (error) {

                console.error(
                    "Profile save error:",
                    error
                );

                profileMessage.textContent =
                    "Could not save profile.";

            } finally {

                saveProfileBtn.disabled = false;

                saveProfileBtn.textContent =
                    "Save Profile";
            }

        }
    );
}


/* ============================================================
   SYMPTOMS
   ============================================================ */

function getSymptomCheckboxes() {

    return document.querySelectorAll(
        "#symptomGrid input[type='checkbox']"
    );
}


function getSelectedSymptoms() {

    const selected = [];


    getSymptomCheckboxes()
        .forEach(
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

    const boxes =
        getSymptomCheckboxes();


    let selectedCount = 0;


    boxes.forEach(
        checkbox => {

            if (checkbox.checked) {
                selectedCount++;
            }


            const label =
                checkbox.closest(
                    ".symptom"
                );


            if (label) {

                label.classList.toggle(
                    "selected",
                    checkbox.checked
                );
            }

        }
    );


    if (count) {

        count.textContent =
            selectedCount;
    }
}


getSymptomCheckboxes()
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                updateCount
            );

        }
    );


updateCount();


/* Symptom search */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const searchText =
                searchInput.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    "#symptomGrid .symptom"
                )
                .forEach(
                    symptom => {

                        const name =
                            (
                                symptom.dataset.name ||
                                ""
                            ).toLowerCase();


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


/* Clear */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        () => {

            getSymptomCheckboxes()
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            false;

                    }
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
                    symptom => {

                        symptom.style.display =
                            "";

                    }
                );

        }
    );
}


/* ============================================================
   PREDICTION
   ============================================================ */

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        makePrediction
    );
}


async function makePrediction() {

    const symptoms =
        getSelectedSymptoms();


    if (!symptoms.length) {

        alert(
            "Please select at least one symptom."
        );

        return;
    }


    if (!auth.currentUser) {

        alert(
            "Please login before making a prediction."
        );

        return;
    }


    predictBtn.disabled = true;

    predictBtn.textContent =
        "Analyzing...";


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
                                symptoms
                        })
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


        displayPrediction(
            data
        );


        await savePrediction(
            symptoms,
            data
        );


        await loadHistory();


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


/* Display prediction */

function displayPrediction(data) {

    if (result) {

        result.classList.remove(
            "hidden"
        );
    }


    const predictedDisease =
        data.disease ||
        "Unknown";


    const confidence =
        Number(
            data.confidence || 0
        );


    if (disease) {

        disease.textContent =
            formatDiseaseName(
                predictedDisease
            );
    }


    if (confidenceText) {

        confidenceText.textContent =
            `Model confidence: ${confidence.toFixed(2)}%`;
    }


    if (confidenceBar) {

        confidenceBar.style.width =
            `${Math.min(
                100,
                Math.max(
                    0,
                    confidence
                )
            )}%`;
    }


    if (topPredictions) {

        topPredictions.innerHTML = "";


        const predictions =
            data.top_predictions ||
            [];


        if (!predictions.length) {

            topPredictions.innerHTML =
                '<p class="muted">No additional predictions available.</p>';

        } else {

            predictions
                .forEach(
                    item => {

                        const div =
                            document.createElement(
                                "div"
                            );


                        div.className =
                            "prediction-item";


                        const name =
                            document.createElement(
                                "span"
                            );


                        name.textContent =
                            formatDiseaseName(
                                item.disease
                            );


                        const value =
                            document.createElement(
                                "strong"
                            );


                        value.textContent =
                            `${Number(
                                item.confidence || 0
                            ).toFixed(2)}%`;


                        div.appendChild(
                            name
                        );

                        div.appendChild(
                            value
                        );


                        topPredictions.appendChild(
                            div
                        );

                    }
                );
        }
    }


    if (message) {

        message.textContent =
            data.message ||
            "This is an educational machine-learning prediction and is not a medical diagnosis.";
    }


    if (latestDisease) {

        latestDisease.textContent =
            formatDiseaseName(
                predictedDisease
            );
    }


    if (dashboardLatest) {

        dashboardLatest.textContent =
            `${formatDiseaseName(
                predictedDisease
            )} (${confidence.toFixed(2)}% confidence)`;
    }
}


/* ============================================================
   SAVE PREDICTION
   ============================================================ */

async function savePrediction(
    symptoms,
    data
) {

    const user =
        auth.currentUser;


    if (!user) return;


    try {

        await addDoc(
            collection(
                db,
                "predictions"
            ),
            {

                userId:
                    user.uid,

                userEmail:
                    user.email || "",

                symptoms:
                    symptoms,

                disease:
                    data.disease || "",

                confidence:
                    Number(
                        data.confidence || 0
                    ),

                topPredictions:
                    data.top_predictions || [],

                createdAt:
                    serverTimestamp()
            }
        );


        console.log(
            "Prediction saved."
        );


    } catch (error) {

        console.error(
            "Prediction save error:",
            error
        );

        /*
           Prediction still works even if
           Firestore saving fails.
        */
    }
}


/* ============================================================
   HISTORY
   ============================================================ */

async function loadHistory() {

    const user =
        auth.currentUser;


    if (!user || !historyList) {
        return;
    }


    historyList.innerHTML =
        '<div class="loading">Loading prediction history...</div>';


    try {

        /*
           IMPORTANT:
           We intentionally do NOT use orderBy()
           here. This avoids the Firestore composite
           index problem that was causing your
           "Could not load history" message.
        */

        const historyQuery =
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
                historyQuery
            );


        const entries = [];


        snapshot.forEach(
            documentSnapshot => {

                entries.push({
                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()
                });

            }
        );


        /*
           Sort on the client.
        */

        entries.sort(
            (a, b) => {

                const timeA =
                    getTimestampValue(
                        a.createdAt
                    );

                const timeB =
                    getTimestampValue(
                        b.createdAt
                    );

                return timeB - timeA;
            }
        );


        if (!entries.length) {

            historyList.innerHTML = `
                <div class="empty-state">
                    <div>📋</div>
                    <h3>No predictions yet</h3>
                    <p>
                        Your completed analyses will appear here.
                    </p>
                </div>
            `;


            if (predictionCount) {

                predictionCount.textContent =
                    "0";
            }


            return;
        }


        historyList.innerHTML = "";


        entries.forEach(
            entry => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "history-item";


                const diseaseDiv =
                    document.createElement(
                        "div"
                    );


                diseaseDiv.className =
                    "history-disease";


                diseaseDiv.textContent =
                    formatDiseaseName(
                        entry.disease ||
                        "Unknown"
                    );


                const symptomsDiv =
                    document.createElement(
                        "div"
                    );


                symptomsDiv.className =
                    "history-symptoms";


                const symptoms =
                    Array.isArray(
                        entry.symptoms
                    )
                        ? entry.symptoms
                        : [];


                symptomsDiv.textContent =
                    symptoms.length
                        ? symptoms
                            .map(
                                formatDiseaseName
                            )
                            .join(", ")
                        : "No symptoms recorded";


                const confidenceDiv =
                    document.createElement(
                        "div"
                    );


                confidenceDiv.className =
                    "history-confidence";


                confidenceDiv.textContent =
                    `${Number(
                        entry.confidence || 0
                    ).toFixed(2)}%`;


                item.appendChild(
                    diseaseDiv
                );

                item.appendChild(
                    symptomsDiv
                );

                item.appendChild(
                    confidenceDiv
                );


                historyList.appendChild(
                    item
                );

            }
        );


        if (predictionCount) {

            predictionCount.textContent =
                String(
                    entries.length
                );
        }


        const latest =
            entries[0];


        if (latest) {

            const latestName =
                formatDiseaseName(
                    latest.disease ||
                    "Unknown"
                );


            if (latestDisease) {

                latestDisease.textContent =
                    latestName;
            }


            if (dashboardLatest) {

                dashboardLatest.textContent =
                    `${latestName} (${Number(
                        latest.confidence || 0
                    ).toFixed(2)}% confidence)`;
            }
        }


    } catch (error) {

        console.error(
            "History load error:",
            error
        );


        historyList.innerHTML = `
            <div class="error-box">
                Could not load prediction history.
                Please check your Firebase Firestore rules.
            </div>
        `;
    }
}


/* ============================================================
   DOCTORS
   ============================================================ */

async function loadDoctors() {

    if (!doctorList) return;


    doctorList.innerHTML =
        '<div class="loading">Loading doctor recommendations...</div>';


    try {

        const response =
            await fetch(
                "/doctors"
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not load doctors."
            );
        }


        const doctors =
            data.doctors ||
            [];


        doctorList.innerHTML = "";


        if (!doctors.length) {

            doctorList.innerHTML = `
                <div class="content-card">
                    No doctor recommendations available.
                </div>
            `;

            return;
        }


        doctors.forEach(
            doctor => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "doctor-card";


                card.innerHTML = `
                    <div class="doctor-avatar">
                        👨‍⚕️
                    </div>
                `;


                const name =
                    document.createElement(
                        "strong"
                    );

                name.textContent =
                    doctor.name ||
                    "Doctor";


                const specialization =
                    document.createElement(
                        "span"
                    );

                specialization.textContent =
                    doctor.specialization ||
                    "Medical Specialist";


                const hospital =
                    document.createElement(
                        "span"
                    );

                hospital.textContent =
                    doctor.hospital
                        ? `${doctor.hospital}, ${doctor.location || ""}`
                        : doctor.location || "";


                const experience =
                    document.createElement(
                        "span"
                    );

                experience.textContent =
                    doctor.experience
                        ? `${doctor.experience} experience`
                        : "";


                card.appendChild(
                    name
                );

                card.appendChild(
                    specialization
                );

                card.appendChild(
                    hospital
                );

                card.appendChild(
                    experience
                );


                doctorList.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "Doctors load error:",
            error
        );


        doctorList.innerHTML = `
            <div class="error-box">
                Could not load doctor recommendations.
            </div>
        `;
    }
}


/* ============================================================
   QUANTUM ANALYSIS
   ============================================================ */

if (quantumBtn) {

    quantumBtn.addEventListener(
        "click",
        runQuantumAnalysis
    );
}


async function runQuantumAnalysis() {

    const selectedSymptoms =
        getSelectedSymptoms();


    if (!selectedSymptoms.length) {

        alert(
            "Please select symptoms in New Prediction first."
        );

        showPage(
            "prediction"
        );

        return;
    }


    quantumBtn.disabled = true;

    quantumBtn.textContent =
        "Running Quantum Analysis...";


    quantumResult.innerHTML = `
        <div class="loading">
            <div style="font-size:32px;">⚛️</div>
            <p>Encoding symptoms into quantum features...</p>
        </div>
    `;


    try {

        const response =
            await fetch(
                "/quantum",
                {
                    method: "POST",

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


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Quantum analysis failed."
            );
        }


        displayQuantumResult(
            data
        );


    } catch (error) {

        console.error(
            "Quantum error:",
            error
        );


        quantumResult.innerHTML = `
            <div class="error-box">
                Quantum analysis failed:
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;

    } finally {

        quantumBtn.disabled = false;

        quantumBtn.textContent =
            "Run Quantum Analysis";
    }
}


function displayQuantumResult(data) {

    const qubits =
        data.qubits ?? "—";

    const depth =
        data.circuit_depth ?? "—";

    const score =
        data.quantum_score ?? "—";


    quantumResult.innerHTML = `

        <div style="width:100%;">

            <span class="eyebrow">
                QISKIT EXPERIMENT
            </span>

            <h2 style="margin-top:0;">
                Quantum Feature Analysis
            </h2>

            <div class="quantum-metrics">

                <div class="quantum-metric">
                    <span>Qubits Used</span>
                    <strong>${qubits}</strong>
                </div>

                <div class="quantum-metric">
                    <span>Circuit Depth</span>
                    <strong>${depth}</strong>
                </div>

                <div class="quantum-metric">
                    <span>Features</span>
                    <strong>${qubits}</strong>
                </div>

            </div>

            <div class="quantum-score">

                <span>
                    Experimental Quantum Score
                </span>

                <br>

                <strong>
                    ${score}%
                </strong>

            </div>

            <p class="muted">
                ${
                    escapeHtml(
                        data.interpretation ||
                        "Experimental quantum feature encoding completed."
                    )
                }
            </p>

            <div class="educational-note">

                <strong>
                    Educational / Research Demonstration
                </strong>

                <p>
                    This quantum component is a
                    proof-of-concept feature encoding
                    demonstration. It is not a medical
                    diagnosis and should not be interpreted
                    as clinically superior to the classical
                    model.
                </p>

            </div>

        </div>
    `;
}


/* ============================================================
   PERFORMANCE
   ============================================================ */

async function loadPerformance() {

    try {

        const response =
            await fetch(
                "/performance"
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Performance data unavailable."
            );
        }


        setText(
            metricAccuracy,
            formatPercent(
                data.accuracy
            )
        );

        setText(
            metricPrecision,
            formatPercent(
                data.precision
            )
        );

        setText(
            metricRecall,
            formatPercent(
                data.recall
            )
        );

        setText(
            metricF1,
            formatPercent(
                data.f1
            )
        );


        setText(
            trainingSamples,
            data.training_samples
        );

        setText(
            testingSamples,
            data.testing_samples
        );

        setText(
            symptomTotal,
            data.number_of_symptoms
        );

        setText(
            diseaseTotal,
            data.number_of_diseases
        );


        setText(
            rfAccuracy,
            formatPercent(
                data.accuracy
            )
        );


    } catch (error) {

        console.error(
            "Performance error:",
            error
        );


        setText(
            metricAccuracy,
            "—"
        );

        setText(
            metricPrecision,
            "—"
        );

        setText(
            metricRecall,
            "—"
        );

        setText(
            metricF1,
            "—"
        );
    }
}


/* ============================================================
   HELPERS
   ============================================================ */

function setText(
    element,
    value
) {

    if (element) {

        element.textContent =
            value ??
            "—";
    }
}


function formatPercent(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {
        return "—";
    }


    return `${number.toFixed(2)}%`;
}


function formatDiseaseName(value) {

    if (!value) {
        return "Unknown";
    }


    return String(value)
        .replaceAll("_", " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );
}


function getTimestampValue(timestamp) {

    if (!timestamp) {
        return 0;
    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();
    }


    if (
        timestamp.seconds !== undefined
    ) {

        return (
            Number(timestamp.seconds) *
            1000
        );
    }


    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();
    }


    return 0;
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ============================================================
   INITIALIZATION
   ============================================================ */

setAuthMode(
    "login"
);


if (loginTab) {

    loginTab.addEventListener(
        "click",
        () => {

            setAuthMode(
                "login"
            );

        }
    );
}


if (signupTab) {

    signupTab.addEventListener(
        "click",
        () => {

            setAuthMode(
                "signup"
            );

        }
    );
}


if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        handleAuthentication
    );
}


if (authPassword) {

    authPassword.addEventListener(
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
}


console.log(
    "QuantumDiagnose frontend loaded successfully."
);
