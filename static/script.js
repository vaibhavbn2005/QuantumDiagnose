// ============================================================
// QUANTUMDIAGNOSE
// Complete Firebase + Dashboard + Prediction JavaScript
// ============================================================


// ============================================================
// FIREBASE IMPORTS
// ============================================================

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



// ============================================================
// FIREBASE CONFIGURATION
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
// INITIALIZE FIREBASE
// ============================================================

const firebaseApp =
    initializeApp(firebaseConfig);


const auth =
    getAuth(firebaseApp);


const db =
    getFirestore(firebaseApp);



// ============================================================
// DOM ELEMENTS
// ============================================================

const authScreen =
    document.getElementById(
        "authScreen"
    );


const app =
    document.getElementById(
        "app"
    );


const authEmail =
    document.getElementById(
        "authEmail"
    );


const authPassword =
    document.getElementById(
        "authPassword"
    );


const authSubmit =
    document.getElementById(
        "authSubmit"
    );


const authMessage =
    document.getElementById(
        "authMessage"
    );


const loginTab =
    document.getElementById(
        "loginTab"
    );


const signupTab =
    document.getElementById(
        "signupTab"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


const userEmail =
    document.getElementById(
        "userEmail"
    );



// ============================================================
// AUTH MODE
// ============================================================

let authMode =
    "login";



// ============================================================
// LOGIN TAB
// ============================================================

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


        authMessage.textContent =
            "";

    }
);



// ============================================================
// SIGNUP TAB
// ============================================================

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


        authMessage.textContent =
            "";

    }
);



// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(
    message
) {

    authMessage.textContent =
        message;

}



// ============================================================
// FIREBASE ERROR MESSAGE
// ============================================================

function firebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";


    if (
        code.includes(
            "auth/invalid-credential"
        )
    ) {

        return "Invalid email or password.";

    }


    if (
        code.includes(
            "auth/user-not-found"
        )
    ) {

        return "Account not found.";

    }


    if (
        code.includes(
            "auth/wrong-password"
        )
    ) {

        return "Invalid password.";

    }


    if (
        code.includes(
            "auth/email-already-in-use"
        )
    ) {

        return "This email is already registered.";

    }


    if (
        code.includes(
            "auth/invalid-email"
        )
    ) {

        return "Please enter a valid email.";

    }


    if (
        code.includes(
            "auth/weak-password"
        )
    ) {

        return "Password must contain at least 6 characters.";

    }


    if (
        code.includes(
            "auth/operation-not-allowed"
        )
    ) {

        return "Email/password authentication is not enabled in Firebase.";

    }


    if (
        code.includes(
            "auth/network-request-failed"
        )
    ) {

        return "Network error. Check your internet connection.";

    }


    return (
        error?.message ||
        "Authentication failed."
    );

}



// ============================================================
// AUTH BUTTON
// ============================================================

authSubmit.addEventListener(
    "click",
    async () => {

        const email =
            authEmail.value.trim();


        const password =
            authPassword.value;


        if (
            !email ||
            !password
        ) {

            showAuthMessage(
                "Please enter email and password."
            );

            return;

        }


        if (
            password.length < 6
        ) {

            showAuthMessage(
                "Password must contain at least 6 characters."
            );

            return;

        }


        try {

            authSubmit.disabled =
                true;


            authSubmit.textContent =
                "Please wait...";


            // ------------------------------------------------
            // SIGN UP
            // ------------------------------------------------

            if (
                authMode ===
                "signup"
            ) {

                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                // Create profile.
                // If Firestore fails, authentication
                // still remains successful.

                try {

                    await createInitialProfile(
                        result.user
                    );

                } catch (
                    profileError
                ) {

                    console.error(
                        "Profile creation error:",
                        profileError
                    );

                }


                showAuthMessage(
                    "Account created successfully."
                );

            }


            // ------------------------------------------------
            // LOGIN
            // ------------------------------------------------

            else {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            }


        } catch (
            error
        ) {

            console.error(
                "Firebase authentication error:",
                error
            );


            showAuthMessage(
                firebaseErrorMessage(
                    error
                )
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



// ============================================================
// CREATE INITIAL PROFILE
// ============================================================

async function createInitialProfile(
    user
) {

    const reference =
        doc(
            db,
            "patients",
            user.uid
        );


    const existing =
        await getDoc(
            reference
        );


    if (
        !existing.exists()
    ) {

        await setDoc(
            reference,
            {

                uid:
                    user.uid,

                email:
                    user.email,

                name:
                    "",

                gender:
                    "",

                age:
                    "",

                height:
                    "",

                weight:
                    "",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );

    }

}



// ============================================================
// SHOW APPLICATION
// IMPORTANT FIX
// ============================================================

function showApplication(
    user
) {

    console.log(
        "Opening QuantumDiagnose dashboard..."
    );


    // --------------------------------------------------------
    // HIDE LOGIN
    // --------------------------------------------------------

    authScreen.classList.add(
        "hidden"
    );


    authScreen.style.display =
        "none";


    // --------------------------------------------------------
    // SHOW APPLICATION
    // --------------------------------------------------------

    app.classList.remove(
        "hidden"
    );


    app.style.display =
        "flex";


    app.style.visibility =
        "visible";


    app.style.opacity =
        "1";


    // --------------------------------------------------------
    // USER EMAIL
    // --------------------------------------------------------

    if (
        userEmail
    ) {

        userEmail.textContent =
            user.email ||
            "";

    }


    // --------------------------------------------------------
    // SHOW DASHBOARD IMMEDIATELY
    // --------------------------------------------------------

    showPage(
        "dashboard"
    );


    console.log(
        "Dashboard opened successfully."
    );

}



// ============================================================
// HIDE APPLICATION
// ============================================================

function hideApplication() {

    authScreen.classList.remove(
        "hidden"
    );


    authScreen.style.display =
        "flex";


    app.classList.add(
        "hidden"
    );


    app.style.display =
        "none";

}



// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        if (
            user
        ) {

            console.log(
                "Firebase login detected:",
                user.email
            );


            // ================================================
            // CRITICAL:
            // SHOW APP BEFORE FIRESTORE
            // ================================================

            showApplication(
                user
            );


            // ================================================
            // LOAD PROFILE
            // ================================================

            loadProfile(
                user
            ).catch(
                error => {

                    console.error(
                        "Profile load error:",
                        error
                    );

                }
            );


            // ================================================
            // LOAD HISTORY
            // ================================================

            loadHistory().catch(
                error => {

                    console.error(
                        "History load error:",
                        error
                    );

                }
            );


            // ================================================
            // LOAD PERFORMANCE
            // ================================================

            loadPerformance().catch(
                error => {

                    console.error(
                        "Performance load error:",
                        error
                    );

                }
            );

        }

        else {

            console.log(
                "No Firebase user."
            );


            hideApplication();

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

            await signOut(
                auth
            );

        } catch (
            error
        ) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);



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



function showPage(
    pageName
) {

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


    if (
        selected
    ) {

        selected.classList.add(
            "active-page"
        );

    }


    navItems.forEach(
        item => {

            item.classList.toggle(

                "active",

                item.dataset.page ===
                    pageName

            );

        }
    );


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
            "Doctor Recommendation",

        quantum:
            "Quantum Analysis",

        comparison:
            "Random Forest vs Quantum",

        performance:
            "Performance Dashboard"

    };


    const title =
        document.getElementById(
            "pageTitle"
        );


    if (
        title
    ) {

        title.textContent =
            titles[pageName] ||
            "Dashboard";

    }


    // Load doctor data only when needed.

    if (
        pageName ===
        "doctors"
    ) {

        loadDoctors();

    }


    if (
        pageName ===
        "history"
    ) {

        loadHistory();

    }


    if (
        pageName ===
        "performance"
    ) {

        loadPerformance();

    }

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
// DASHBOARD QUICK BUTTONS
// ============================================================

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
// PROFILE LOAD
// ============================================================

async function loadProfile(
    user
) {

    try {

        const reference =
            doc(
                db,
                "patients",
                user.uid
            );


        const snapshot =
            await getDoc(
                reference
            );


        if (
            !snapshot.exists()
        ) {

            return;

        }


        const profile =
            snapshot.data();


        const name =
            document.getElementById(
                "profileName"
            );


        const gender =
            document.getElementById(
                "profileGender"
            );


        const age =
            document.getElementById(
                "profileAge"
            );


        const height =
            document.getElementById(
                "profileHeight"
            );


        const weight =
            document.getElementById(
                "profileWeight"
            );


        if (
            name
        ) {

            name.value =
                profile.name ||
                "";

        }


        if (
            gender
        ) {

            gender.value =
                profile.gender ||
                "";

        }


        if (
            age
        ) {

            age.value =
                profile.age ||
                "";

        }


        if (
            height
        ) {

            height.value =
                profile.height ||
                "";

        }


        if (
            weight
        ) {

            weight.value =
                profile.weight ||
                "";

        }


        const welcomeName =
            document.getElementById(
                "welcomeName"
            );


        if (
            welcomeName
        ) {

            welcomeName.textContent =
                profile.name ||
                "Patient";

        }


    } catch (
        error
    ) {

        console.error(
            "Profile error:",
            error
        );

    }

}



// ============================================================
// SAVE PROFILE
// ============================================================

document
    .getElementById(
        "saveProfileBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const user =
                auth.currentUser;


            if (
                !user
            ) {

                return;

            }


            const profile = {

                uid:
                    user.uid,

                email:
                    user.email,

                name:
                    document
                        .getElementById(
                            "profileName"
                        )
                        .value
                        .trim(),

                gender:
                    document
                        .getElementById(
                            "profileGender"
                        )
                        .value,

                age:
                    document
                        .getElementById(
                            "profileAge"
                        )
                        .value,

                height:
                    document
                        .getElementById(
                            "profileHeight"
                        )
                        .value,

                weight:
                    document
                        .getElementById(
                            "profileWeight"
                        )
                        .value,

                updatedAt:
                    serverTimestamp()

            };


            try {

                await setDoc(

                    doc(
                        db,
                        "patients",
                        user.uid
                    ),

                    profile,

                    {
                        merge:
                            true
                    }

                );


                document.getElementById(
                    "welcomeName"
                ).textContent =
                    profile.name ||
                    "Patient";


                document.getElementById(
                    "profileMessage"
                ).textContent =
                    "Profile saved successfully.";

            } catch (
                error
            ) {

                console.error(
                    "Save profile error:",
                    error
                );


                document.getElementById(
                    "profileMessage"
                ).textContent =
                    "Could not save profile.";

            }

        }
    );



// ============================================================
// SYMPTOMS
// ============================================================

const symptomGrid =
    document.getElementById(
        "symptomGrid"
    );


const search =
    document.getElementById(
        "search"
    );


const count =
    document.getElementById(
        "count"
    );



function updateCount() {

    if (
        !symptomGrid
    ) {

        return;

    }


    const checked =
        symptomGrid.querySelectorAll(
            "input:checked"
        ).length;


    count.textContent =
        checked;


    symptomGrid
        .querySelectorAll(
            ".symptom"
        )
        .forEach(
            label => {

                const checkbox =
                    label.querySelector(
                        "input"
                    );


                label.classList.toggle(
                    "selected",
                    checkbox.checked
                );

            }
        );

}



// ============================================================
// SYMPTOM CHANGE
// ============================================================

symptomGrid.addEventListener(
    "change",
    updateCount
);



// ============================================================
// SEARCH
// ============================================================

search.addEventListener(
    "input",
    () => {

        const value =
            search.value
                .trim()
                .toLowerCase();


        symptomGrid
            .querySelectorAll(
                ".symptom"
            )
            .forEach(
                item => {

                    const name =
                        item.dataset.name
                            .toLowerCase();


                    item.style.display =
                        name.includes(
                            value
                        )
                            ? ""
                            : "none";

                }
            );

    }
);



// ============================================================
// CLEAR
// ============================================================

document
    .getElementById(
        "clearBtn"
    )
    .addEventListener(
        "click",
        () => {

            symptomGrid
                .querySelectorAll(
                    "input"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            false;

                    }
                );


            updateCount();


            document
                .getElementById(
                    "result"
                )
                .classList.add(
                    "hidden"
                );

        }
    );



// ============================================================
// GET SELECTED SYMPTOMS
// ============================================================

function getSelectedSymptoms() {

    return Array.from(

        symptomGrid.querySelectorAll(
            "input:checked"
        )

    ).map(

        checkbox =>
            checkbox.value

    );

}



// ============================================================
// PREDICTION
// ============================================================

document
    .getElementById(
        "predictBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const symptoms =
                getSelectedSymptoms();


            if (
                !symptoms.length
            ) {

                alert(
                    "Please select at least one symptom."
                );

                return;

            }


            const button =
                document.getElementById(
                    "predictBtn"
                );


            button.disabled =
                true;


            button.textContent =
                "Analyzing...";


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
                                        symptoms
                                })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data.error ||
                        "Prediction failed."
                    );

                }


                showPrediction(
                    data
                );


                await savePrediction(
                    data,
                    symptoms
                );


                loadHistory();

            } catch (
                error
            ) {

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
                    "Analyze Symptoms";

            }

        }
    );



// ============================================================
// SHOW PREDICTION
// ============================================================

function showPrediction(
    data
) {

    const result =
        document.getElementById(
            "result"
        );


    result.classList.remove(
        "hidden"
    );


    const disease =
        data.disease ||
        "Unknown";


    const confidence =
        Number(
            data.confidence ||
            0
        );


    document.getElementById(
        "disease"
    ).textContent =
        disease;


    document.getElementById(
        "confidenceText"
    ).textContent =
        `${confidence}%`;


    document.getElementById(
        "confidenceBar"
    ).style.width =
        `${Math.min(
            confidence,
            100
        )}%`;


    const top =
        document.getElementById(
            "topPredictions"
        );


    top.innerHTML =
        "";


    const predictions =
        Array.isArray(
            data.top_predictions
        )
            ? data.top_predictions
            : [];


    predictions.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "top-row";


            row.innerHTML = `

                <span>
                    ${escapeHtml(
                        item.disease
                    )}
                </span>

                <strong>
                    ${Number(
                        item.confidence ||
                        0
                    )}%
                </strong>

            `;


            top.appendChild(
                row
            );

        }
    );


    document.getElementById(
        "specialistBox"
    ).innerHTML = `

        <strong>
            Recommended Specialist
        </strong>

        <p>
            ${escapeHtml(
                data.specialty ||
                "General Physician"
            )}
        </p>

        <small>
            Educational recommendation only.
            Consult a qualified healthcare professional
            for actual diagnosis and treatment.
        </small>

    `;


    document.getElementById(
        "message"
    ).textContent =
        data.message ||
        "Educational ML prediction only.";


    document.getElementById(
        "latestDisease"
    ).textContent =
        disease;


    document.getElementById(
        "dashboardLatest"
    ).innerHTML = `

        <strong>
            ${escapeHtml(
                disease
            )}
        </strong>

        <p class="muted">
            Confidence:
            ${confidence}%
        </p>

    `;


    window.latestPrediction =
        data;


    showPage(
        "prediction"
    );

}



// ============================================================
// SAVE PREDICTION
// ============================================================

async function savePrediction(
    data,
    symptoms
) {

    const user =
        auth.currentUser;


    if (
        !user
    ) {

        return;

    }


    try {

        await addDoc(

            collection(
                db,
                "prediction_history"
            ),

            {

                userId:
                    user.uid,

                userEmail:
                    user.email,

                symptoms:
                    symptoms,

                disease:
                    data.disease,

                confidence:
                    data.confidence,

                model:
                    "Random Forest",

                specialty:
                    data.specialty ||
                    "General Physician",

                createdAt:
                    serverTimestamp()

            }

        );

    } catch (
        error
    ) {

        console.error(
            "History save error:",
            error
        );

    }

}



// ============================================================
// LOAD HISTORY
// ============================================================

async function loadHistory() {

    const user =
        auth.currentUser;


    if (
        !user
    ) {

        return;

    }


    const list =
        document.getElementById(
            "historyList"
        );


    try {

        // IMPORTANT:
        // No orderBy here.
        // This avoids requiring a Firestore composite index.

        const reference =
            collection(
                db,
                "prediction_history"
            );


        const q =
            query(
                reference,
                where(
                    "userId",
                    "==",
                    user.uid
                )
            );


        const snapshot =
            await getDocs(
                q
            );


        const records =
            [];


        snapshot.forEach(
            item => {

                records.push({
                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        // Sort in browser.

        records.sort(
            (a, b) => {

                const aTime =
                    a.createdAt?.seconds ||
                    0;


                const bTime =
                    b.createdAt?.seconds ||
                    0;


                return (
                    bTime -
                    aTime
                );

            }
        );


        document.getElementById(
            "predictionCount"
        ).textContent =
            records.length;


        list.innerHTML =
            "";


        if (
            !records.length
        ) {

            list.innerHTML = `

                <p class="muted">
                    No predictions yet.
                </p>

            `;

            return;

        }


        records.forEach(
            data => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "history-item";


                const symptoms =
                    Array.isArray(
                        data.symptoms
                    )
                        ? data.symptoms.join(
                            ", "
                        )
                        : "";


                div.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHtml(
                                data.disease ||
                                "Unknown"
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                symptoms
                            )}
                        </small>

                    </div>


                    <div>

                        <strong>
                            ${Number(
                                data.confidence ||
                                0
                            )}%
                        </strong>

                        <small>
                            ${escapeHtml(
                                data.model ||
                                "Random Forest"
                            )}
                        </small>

                    </div>

                `;


                list.appendChild(
                    div
                );

            }
        );


        const latest =
            records[0];


        if (
            latest
        ) {

            document.getElementById(
                "latestDisease"
            ).textContent =
                latest.disease ||
                "—";

        }


    } catch (
        error
    ) {

        console.error(
            "History loading error:",
            error
        );


        list.innerHTML = `

            <p class="muted">
                No history available yet.
            </p>

        `;

    }

}



// ============================================================
// DOCTORS
// ============================================================

async function loadDoctors(
    specialty = ""
) {

    const container =
        document.getElementById(
            "doctorList"
        );


    container.innerHTML =
        "<p>Loading doctors...</p>";


    try {

        let url =
            "/doctors";


        if (
            specialty
        ) {

            url +=
                "?specialty=" +
                encodeURIComponent(
                    specialty
                );

        }


        const response =
            await fetch(
                url
            );


        const data =
            await response.json();


        if (
            !response.ok
        ) {

            throw new Error(
                data.error ||
                "Could not load doctors."
            );

        }


        container.innerHTML =
            "";


        const doctors =
            Array.isArray(
                data.doctors
            )
                ? data.doctors
                : [];


        if (
            !doctors.length
        ) {

            container.innerHTML = `

                <p class="muted">
                    No doctor recommendations available.
                </p>

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

                    <h3>
                        ${escapeHtml(
                            doctor.name
                        )}
                    </h3>

                    <div class="specialty">
                        ${escapeHtml(
                            doctor.specialization ||
                            "General Physician"
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
                            "Not specified"
                        )}
                    </p>

                `;


                container.appendChild(
                    card
                );

            }
        );


    } catch (
        error
    ) {

        console.error(
            "Doctor error:",
            error
        );


        container.innerHTML = `

            <p class="muted">
                Doctor service is not available yet.
            </p>

        `;

    }

}



// ============================================================
// QUANTUM ANALYSIS
// ============================================================

document
    .getElementById(
        "quantumBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const symptoms =
                getSelectedSymptoms();


            if (
                !symptoms.length
            ) {

                alert(
                    "Select symptoms in New Prediction first."
                );

                return;

            }


            const output =
                document.getElementById(
                    "quantumResult"
                );


            output.textContent =
                "Running Qiskit analysis...";


            try {

                const response =
                    await fetch(
                        "/quantum",
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
                                        symptoms
                                })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data.error ||
                        "Quantum analysis failed."
                    );

                }


                output.textContent =

                    "Qiskit Quantum Analysis\n\n" +

                    "Qubits: " +
                    (
                        data.qubits ??
                        "—"
                    ) +

                    "\n\nCircuit Depth: " +
                    (
                        data.circuit_depth ??
                        "—"
                    ) +

                    "\n\nQuantum Score: " +
                    (
                        data.quantum_score ??
                        "—"
                    ) +
                    "%" +

                    "\n\n" +

                    (
                        data.interpretation ||
                        ""
                    ) +

                    "\n\nCircuit:\n\n" +

                    (
                        data.circuit ||
                        "Not available"
                    );


            } catch (
                error
            ) {

                console.error(
                    "Quantum error:",
                    error
                );


                output.textContent =
                    "Quantum analysis unavailable:\n\n" +
                    error.message;

            }

        }
    );



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


        if (
            !response.ok
        ) {

            throw new Error(
                data.error ||
                "Performance request failed."
            );

        }


        document.getElementById(
            "metricAccuracy"
        ).textContent =
            formatMetric(
                data.accuracy
            );


        document.getElementById(
            "metricPrecision"
        ).textContent =
            formatMetric(
                data.precision
            );


        document.getElementById(
            "metricRecall"
        ).textContent =
            formatMetric(
                data.recall
            );


        document.getElementById(
            "metricF1"
        ).textContent =
            formatMetric(
                data.f1
            );


        document.getElementById(
            "trainingSamples"
        ).textContent =
            data.training_samples ??
            "—";


        document.getElementById(
            "testingSamples"
        ).textContent =
            data.testing_samples ??
            "—";


        document.getElementById(
            "symptomTotal"
        ).textContent =
            data.number_of_symptoms ??
            "—";


        document.getElementById(
            "diseaseTotal"
        ).textContent =
            data.number_of_diseases ??
            "—";


        document.getElementById(
            "rfAccuracy"
        ).textContent =
            formatMetric(
                data.accuracy
            );


    } catch (
        error
    ) {

        console.error(
            "Performance error:",
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
        value ===
        undefined ||
        value ===
        null
    ) {

        return "—";

    }


    return `${value}%`;

}



// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    value
) {

    return String(
        value ??
        ""
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
// INITIALIZATION
// ============================================================

updateCount();


console.log(
    "QuantumDiagnose JavaScript loaded successfully."
);
