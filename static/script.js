// ============================================================
// QUANTUMDIAGNOSE
// Firebase Authentication + Firestore + Prediction
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


import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



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
        "1:727641186346:web:c8eed6274fd1582169e353",

    measurementId:
        "G-DSDM1YM4WB"
};



// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);



// ============================================================
// AUTH ELEMENTS
// ============================================================

const loginBtn =
    document.getElementById("loginBtn");


const signupBtn =
    document.getElementById("signupBtn");


const logoutBtn =
    document.getElementById("logoutBtn");


const authModal =
    document.getElementById("authModal");


const closeModal =
    document.getElementById("closeModal");


const authTitle =
    document.getElementById("authTitle");


const authEmail =
    document.getElementById("authEmail");


const authPassword =
    document.getElementById("authPassword");


const authSubmit =
    document.getElementById("authSubmit");


const authMessage =
    document.getElementById("authMessage");


const userStatus =
    document.getElementById("userStatus");



// ============================================================
// PROFILE ELEMENTS
// ============================================================

const profileModal =
    document.getElementById("profileModal");


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



// ============================================================
// SYMPTOM ELEMENTS
// ============================================================

const search =
    document.getElementById("search");


const symptomGrid =
    document.getElementById("symptomGrid");


const count =
    document.getElementById("count");


const clearBtn =
    document.getElementById("clearBtn");


const predictBtn =
    document.getElementById("predictBtn");



// ============================================================
// RESULT ELEMENTS
// ============================================================

const result =
    document.getElementById("result");


const disease =
    document.getElementById("disease");


const confidenceBar =
    document.getElementById("confidenceBar");


const confidenceText =
    document.getElementById("confidenceText");


const topPredictions =
    document.getElementById("topPredictions");


const message =
    document.getElementById("message");



// ============================================================
// AUTH MODE
// ============================================================

let authMode =
    "login";



// ============================================================
// OPEN LOGIN
// ============================================================

function openLogin() {

    authMode = "login";

    authTitle.textContent =
        "Login";

    authSubmit.textContent =
        "Login";

    authEmail.value =
        "";

    authPassword.value =
        "";

    authMessage.textContent =
        "";

    authModal.classList.remove(
        "hidden"
    );
}



// ============================================================
// OPEN SIGNUP
// ============================================================

function openSignup() {

    authMode = "signup";

    authTitle.textContent =
        "Create Account";

    authSubmit.textContent =
        "Sign Up";

    authEmail.value =
        "";

    authPassword.value =
        "";

    authMessage.textContent =
        "";

    authModal.classList.remove(
        "hidden"
    );
}



// ============================================================
// CLOSE AUTH MODAL
// ============================================================

function closeAuthModal() {

    authModal.classList.add(
        "hidden"
    );

}



// ============================================================
// LOGIN BUTTON
// ============================================================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        openLogin
    );

}



// ============================================================
// SIGNUP BUTTON
// ============================================================

if (signupBtn) {

    signupBtn.addEventListener(
        "click",
        openSignup
    );

}



// ============================================================
// CLOSE AUTH
// ============================================================

if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeAuthModal
    );

}



// ============================================================
// AUTHENTICATION
// ============================================================

if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        async function () {

            const email =
                authEmail.value.trim();


            const password =
                authPassword.value.trim();



            if (!email) {

                authMessage.textContent =
                    "Please enter your email.";

                return;

            }



            if (!password) {

                authMessage.textContent =
                    "Please enter your password.";

                return;

            }



            if (password.length < 6) {

                authMessage.textContent =
                    "Password must contain at least 6 characters.";

                return;

            }



            authSubmit.disabled =
                true;


            authSubmit.textContent =
                "Please wait...";



            try {

                if (
                    authMode ===
                    "signup"
                ) {

                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                    authMessage.textContent =
                        "Account created successfully.";

                    authMessage.style.color =
                        "green";


                } else {

                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                    authMessage.textContent =
                        "Login successful.";

                    authMessage.style.color =
                        "green";

                }



                setTimeout(
                    closeAuthModal,
                    700
                );


            } catch (error) {

                console.error(
                    error
                );


                let errorMessage =
                    "Authentication failed.";



                switch (error.code) {

                    case "auth/email-already-in-use":

                        errorMessage =
                            "This email is already registered.";

                        break;


                    case "auth/invalid-email":

                        errorMessage =
                            "Please enter a valid email.";

                        break;


                    case "auth/weak-password":

                        errorMessage =
                            "Password must contain at least 6 characters.";

                        break;


                    case "auth/invalid-credential":

                        errorMessage =
                            "Incorrect email or password.";

                        break;


                    case "auth/operation-not-allowed":

                        errorMessage =
                            "Email/Password authentication is not enabled.";

                        break;


                    default:

                        errorMessage =
                            error.message;

                }



                authMessage.textContent =
                    errorMessage;

                authMessage.style.color =
                    "red";


            } finally {

                authSubmit.disabled =
                    false;


                authSubmit.textContent =
                    authMode === "login"
                        ? "Login"
                        : "Sign Up";

            }

        }
    );

}



// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

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



// ============================================================
// CHECK PATIENT PROFILE
// ============================================================

async function checkPatientProfile(user) {

    try {

        const profileRef =
            doc(
                db,
                "patients",
                user.uid
            );


        const profileSnapshot =
            await getDoc(
                profileRef
            );


        if (
            profileSnapshot.exists()
        ) {

            console.log(
                "Patient profile found."
            );


            const profileData =
                profileSnapshot.data();


            if (userStatus) {

                userStatus.textContent =
                    `Welcome back, ${profileData.name}.`;

            }


            return true;

        }


        // ======================================================
        // PROFILE DOES NOT EXIST
        // ======================================================

        console.log(
            "No patient profile found."
        );


        openProfileModal();

        return false;


    } catch (error) {

        console.error(
            "Profile check error:",
            error
        );


        if (profileMessage) {

            profileMessage.textContent =
                "Unable to load your profile. Please try again.";

            profileMessage.style.color =
                "red";

        }


        return false;

    }

}



// ============================================================
// OPEN PROFILE MODAL
// ============================================================

function openProfileModal() {

    if (!profileModal) {

        return;

    }


    profileModal.classList.remove(
        "hidden"
    );


    profileMessage.textContent =
        "";

}



// ============================================================
// SAVE PROFILE
// ============================================================

if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        async function () {

            const user =
                auth.currentUser;



            if (!user) {

                profileMessage.textContent =
                    "Please login first.";

                return;

            }



            const name =
                profileName.value.trim();


            const gender =
                profileGender.value;


            const age =
                profileAge.value;


            const height =
                profileHeight.value;


            const weight =
                profileWeight.value;



            // ==================================================
            // VALIDATION
            // ==================================================

            if (!name) {

                profileMessage.textContent =
                    "Please enter your name.";

                profileMessage.style.color =
                    "red";

                return;

            }



            if (!gender) {

                profileMessage.textContent =
                    "Please select your gender.";

                profileMessage.style.color =
                    "red";

                return;

            }



            if (!age) {

                profileMessage.textContent =
                    "Please enter your age.";

                profileMessage.style.color =
                    "red";

                return;

            }



            if (!height) {

                profileMessage.textContent =
                    "Please enter your height.";

                profileMessage.style.color =
                    "red";

                return;

            }



            if (!weight) {

                profileMessage.textContent =
                    "Please enter your weight.";

                profileMessage.style.color =
                    "red";

                return;

            }



            saveProfileBtn.disabled =
                true;


            saveProfileBtn.textContent =
                "Saving...";



            try {

                const profileRef =
                    doc(
                        db,
                        "patients",
                        user.uid
                    );



                await setDoc(
                    profileRef,
                    {

                        uid:
                            user.uid,

                        email:
                            user.email,

                        name:
                            name,

                        gender:
                            gender,

                        age:
                            Number(age),

                        height:
                            Number(height),

                        weight:
                            Number(weight),

                        updatedAt:
                            serverTimestamp(),

                        createdAt:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );



                profileMessage.textContent =
                    "Profile saved successfully.";

                profileMessage.style.color =
                    "green";



                if (userStatus) {

                    userStatus.textContent =
                        `Welcome, ${name}.`;

                }



                setTimeout(
                    function () {

                        profileModal.classList.add(
                            "hidden"
                        );

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Profile save error:",
                    error
                );


                profileMessage.textContent =
                    "Unable to save profile: " +
                    error.message;

                profileMessage.style.color =
                    "red";


            } finally {

                saveProfileBtn.disabled =
                    false;


                saveProfileBtn.textContent =
                    "Save & Continue";

            }

        }
    );

}



// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (user) {

            console.log(
                "Logged in:",
                user.email
            );



            // -----------------------------------------------
            // BUTTONS
            // -----------------------------------------------

            loginBtn?.classList.add(
                "hidden"
            );

            signupBtn?.classList.add(
                "hidden"
            );

            logoutBtn?.classList.remove(
                "hidden"
            );



            if (userStatus) {

                userStatus.textContent =
                    `Logged in as ${user.email}`;

            }



            // -----------------------------------------------
            // CHECK PROFILE
            // -----------------------------------------------

            await checkPatientProfile(
                user
            );


        } else {

            console.log(
                "User logged out."
            );


            loginBtn?.classList.remove(
                "hidden"
            );

            signupBtn?.classList.remove(
                "hidden"
            );

            logoutBtn?.classList.add(
                "hidden"
            );


            if (userStatus) {

                userStatus.textContent =
                    "Please login or create an account to continue.";

            }

        }

    }
);



// ============================================================
// SEARCH SYMPTOMS
// ============================================================

if (search) {

    search.addEventListener(
        "input",
        function () {

            const searchText =
                search.value
                    .trim()
                    .toLowerCase();


            const symptoms =
                symptomGrid.querySelectorAll(
                    ".symptom"
                );


            symptoms.forEach(
                function (symptom) {

                    const name =
                        symptom
                            .getAttribute(
                                "data-name"
                            )
                            .toLowerCase();


                    symptom.style.display =
                        name.includes(searchText)
                            ? ""
                            : "none";

                }
            );

        }
    );

}



// ============================================================
// UPDATE COUNT
// ============================================================

function updateCount() {

    if (!symptomGrid) {

        return;

    }


    const checked =
        symptomGrid.querySelectorAll(
            'input[type="checkbox"]:checked'
        );


    count.textContent =
        checked.length;

}



// ============================================================
// CHECKBOX EVENTS
// ============================================================

if (symptomGrid) {

    symptomGrid.addEventListener(
        "change",
        function () {

            updateCount();

        }
    );

}



// ============================================================
// CLEAR
// ============================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            const checkboxes =
                symptomGrid.querySelectorAll(
                    'input[type="checkbox"]'
                );


            checkboxes.forEach(
                function (checkbox) {

                    checkbox.checked =
                        false;

                }
            );


            updateCount();


            search.value =
                "";


            const symptoms =
                symptomGrid.querySelectorAll(
                    ".symptom"
                );


            symptoms.forEach(
                function (symptom) {

                    symptom.style.display =
                        "";

                }
            );


            result?.classList.add(
                "hidden"
            );

        }
    );

}



// ============================================================
// GET SELECTED SYMPTOMS
// ============================================================

function getSelectedSymptoms() {

    const checked =
        symptomGrid.querySelectorAll(
            'input[type="checkbox"]:checked'
        );


    return Array.from(
        checked
    ).map(
        checkbox =>
            checkbox.value
    );

}



// ============================================================
// PREDICTION
// ============================================================

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        async function () {

            // -----------------------------------------------
            // LOGIN CHECK
            // -----------------------------------------------

            if (!auth.currentUser) {

                alert(
                    "Please login before making a prediction."
                );

                openLogin();

                return;

            }



            const selectedSymptoms =
                getSelectedSymptoms();



            if (
                selectedSymptoms.length === 0
            ) {

                alert(
                    "Please select at least one symptom."
                );

                return;

            }



            predictBtn.disabled =
                true;


            predictBtn.textContent =
                "Analyzing...";



            try {

                const response =
                    await fetch(
                        "/predict",
                        {

                            method:
                                "POST",

                            headers:
                                {
                                    "Content-Type":
                                        "application/json"
                                },

                            body:
                                JSON.stringify(
                                    {
                                        symptoms:
                                            selectedSymptoms
                                    }
                                )

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

                predictBtn.disabled =
                    false;


                predictBtn.textContent =
                    "Predict Possible Disease";

            }

        }
    );

}



// ============================================================
// DISPLAY PREDICTION
// ============================================================

function displayPrediction(data) {

    disease.textContent =
        formatDiseaseName(
            data.disease
        );


    const confidence =
        Number(
            data.confidence
        ) || 0;



    confidenceText.textContent =
        `Model confidence: ${confidence}%`;



    confidenceBar.style.width =
        `${Math.min(
            confidence,
            100
        )}%`;



    topPredictions.innerHTML =
        "";



    if (
        data.top_predictions
    ) {

        data.top_predictions.forEach(
            function (
                prediction,
                index
            ) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "prediction-item";


                item.innerHTML = `

                    <div>
                        <strong>
                            ${index + 1}.
                            ${formatDiseaseName(
                                prediction.disease
                            )}
                        </strong>
                    </div>

                    <div>
                        ${prediction.confidence}%
                    </div>

                `;


                topPredictions.appendChild(
                    item
                );

            }
        );

    }



    message.textContent =
        data.message ||
        "This is an educational ML prediction and should not be used as a medical diagnosis.";



    result.classList.remove(
        "hidden"
    );


    result.scrollIntoView(
        {
            behavior: "smooth"
        }
    );

}



// ============================================================
// FORMAT DISEASE NAME
// ============================================================

function formatDiseaseName(name) {

    if (!name) {

        return "Unknown";

    }


    return String(name)
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
            letter =>
                letter.toUpperCase()
        );

}



// ============================================================
// INITIALIZE
// ============================================================

updateCount();


console.log(
    "QuantumDiagnose loaded successfully."
);

console.log(
    "Firebase Authentication initialized."
);

console.log(
    "Firestore initialized."
);
