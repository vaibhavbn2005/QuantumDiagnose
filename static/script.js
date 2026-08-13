// ============================================================
// QuantumDiagnose
// Complete Firebase + Symptom Prediction JavaScript
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
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {

    apiKey: "AIzaSyAPrulUfMubKieGuU5QxQVwSu8sDtKvTZE",

    authDomain: "quantumdiagnose.firebaseapp.com",

    projectId: "quantumdiagnose",

    storageBucket: "quantumdiagnose.firebasestorage.app",

    messagingSenderId: "727641186346",

    appId: "1:727641186346",

    measurementId: "G-DSDM1YM4WB"

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
// MAKE FIREBASE AVAILABLE GLOBALLY
// ============================================================

window.firebaseAuth = auth;

window.firebaseDB = db;

window.firebaseCreateUser =
    createUserWithEmailAndPassword;

window.firebaseSignIn =
    signInWithEmailAndPassword;

window.firebaseSignOut =
    signOut;

window.firebaseOnAuthStateChanged =
    onAuthStateChanged;


// ============================================================
// HTML ELEMENTS
// ============================================================

const boxes =
    [...document.querySelectorAll(".symptom input")];

const count =
    document.getElementById("count");

const result =
    document.getElementById("result");

const disease =
    document.getElementById("disease");

const confidenceBar =
    document.getElementById("confidenceBar");

const confidenceText =
    document.getElementById("confidenceText");

const message =
    document.getElementById("message");

const topPredictions =
    document.getElementById("topPredictions");

const searchInput =
    document.getElementById("search");

const clearBtn =
    document.getElementById("clearBtn");

const predictBtn =
    document.getElementById("predictBtn");


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


// ============================================================
// PHONE AUTH ELEMENTS
// ============================================================

const emailTab =
    document.getElementById("emailTab");

const phoneTab =
    document.getElementById("phoneTab");

const emailAuth =
    document.getElementById("emailAuth");

const phoneAuth =
    document.getElementById("phoneAuth");

const phoneNumber =
    document.getElementById("phoneNumber");

const sendOtpBtn =
    document.getElementById("sendOtpBtn");

const verifyOtpBtn =
    document.getElementById("verifyOtpBtn");

const otpCode =
    document.getElementById("otpCode");


// ============================================================
// AUTH STATE
// ============================================================

let authMode = "login";

let authMethod = "email";

let confirmationResult = null;

let recaptchaVerifier = null;


// ============================================================
// UPDATE SYMPTOM COUNT
// ============================================================

function updateCount() {

    if (!count) {
        return;
    }

    const selected =
        boxes.filter(
            box => box.checked
        ).length;

    count.textContent = selected;
}


// ============================================================
// SYMPTOM CHECKBOX EVENTS
// ============================================================

boxes.forEach(box => {

    box.addEventListener(
        "change",
        updateCount
    );

});


// ============================================================
// SEARCH SYMPTOMS
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const searchText =
                this.value
                    .toLowerCase()
                    .trim();

            document
                .querySelectorAll(".symptom")
                .forEach(symptom => {

                    const name =
                        (
                            symptom.dataset.name || ""
                        ).toLowerCase();

                    if (
                        name.includes(searchText)
                    ) {

                        symptom.style.display =
                            "";

                    } else {

                        symptom.style.display =
                            "none";

                    }

                });

        }
    );

}


// ============================================================
// CLEAR SYMPTOMS
// ============================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            boxes.forEach(
                box => box.checked = false
            );

            updateCount();

            if (result) {
                result.classList.add("hidden");
            }

        }
    );

}


// ============================================================
// SAVE PREDICTION TO FIRESTORE
// ============================================================

async function savePrediction(
    symptoms,
    prediction,
    confidence,
    topPredictions
) {

    const user =
        auth.currentUser;

    if (!user) {

        console.log(
            "User not logged in. Prediction will not be saved."
        );

        return;

    }

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
                    user.email || null,

                phoneNumber:
                    user.phoneNumber || null,

                symptoms:
                    symptoms,

                disease:
                    prediction,

                confidence:
                    confidence,

                topPredictions:
                    topPredictions,

                createdAt:
                    serverTimestamp()

            }
        );

        console.log(
            "Prediction saved successfully."
        );

    } catch (error) {

        console.error(
            "Error saving prediction:",
            error
        );

    }

}


// ============================================================
// PREDICT BUTTON
// ============================================================

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        async function () {

            const symptoms =
                boxes
                    .filter(
                        box => box.checked
                    )
                    .map(
                        box => box.value
                    );


            // No symptoms

            if (!symptoms.length) {

                alert(
                    "Please select at least one symptom."
                );

                return;

            }


            // Loading state

            predictBtn.disabled =
                true;

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


                // Disease

                disease.textContent =
                    String(
                        data.disease
                    ).replaceAll(
                        "_",
                        " "
                    );


                // Confidence

                const confidence =
                    Number(
                        data.confidence || 0
                    );

                confidenceBar.style.width =
                    `${confidence}%`;

                confidenceText.textContent =
                    `Model confidence: ${confidence}%`;


                // Top predictions

                const predictions =
                    Array.isArray(
                        data.top_predictions
                    )
                        ? data.top_predictions
                        : [];


                topPredictions.innerHTML =
                    predictions
                        .map(
                            item => {

                                const diseaseName =
                                    String(
                                        item.disease
                                    ).replaceAll(
                                        "_",
                                        " "
                                    );

                                return `
                                    <div class="top-item">
                                        <span>
                                            ${diseaseName}
                                        </span>

                                        <strong>
                                            ${item.confidence}%
                                        </strong>
                                    </div>
                                `;

                            }
                        )
                        .join("");


                // Message

                message.textContent =
                    data.message ||
                    "Educational ML prediction only.";


                // Show result

                result.classList.remove(
                    "hidden"
                );


                // Scroll

                result.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


                // Save if logged in

                await savePrediction(
                    symptoms,
                    data.disease,
                    confidence,
                    predictions
                );


            } catch (error) {

                console.error(
                    "Prediction error:",
                    error
                );

                alert(
                    error.message ||
                    "Prediction failed."
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
// OPEN LOGIN
// ============================================================

function openLogin() {

    authMode =
        "login";

    authTitle.textContent =
        "Login";

    authSubmit.textContent =
        "Login";

    authMessage.textContent =
        "";

    authModal.classList.remove(
        "hidden"
    );

    switchToEmail();

}


// ============================================================
// OPEN SIGNUP
// ============================================================

function openSignup() {

    authMode =
        "signup";

    authTitle.textContent =
        "Create Account";

    authSubmit.textContent =
        "Sign Up";

    authMessage.textContent =
        "";

    authModal.classList.remove(
        "hidden"
    );

    switchToEmail();

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
// CLOSE MODAL
// ============================================================

if (closeModal) {

    closeModal.addEventListener(
        "click",
        function () {

            authModal.classList.add(
                "hidden"
            );

            authMessage.textContent =
                "";

        }
    );

}


// ============================================================
// CLOSE WHEN CLICKING OUTSIDE
// ============================================================

if (authModal) {

    authModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                authModal
            ) {

                authModal.classList.add(
                    "hidden"
                );

            }

        }
    );

}


// ============================================================
// EMAIL TAB
// ============================================================

function switchToEmail() {

    authMethod =
        "email";

    emailTab.classList.add(
        "active"
    );

    phoneTab.classList.remove(
        "active"
    );

    emailAuth.classList.remove(
        "hidden"
    );

    phoneAuth.classList.add(
        "hidden"
    );

    authMessage.textContent =
        "";

}


// ============================================================
// PHONE TAB
// ============================================================

function switchToPhone() {

    authMethod =
        "phone";

    phoneTab.classList.add(
        "active"
    );

    emailTab.classList.remove(
        "active"
    );

    emailAuth.classList.add(
        "hidden"
    );

    phoneAuth.classList.remove(
        "hidden"
    );

    authMessage.textContent =
        "";

    createRecaptcha();

}


// ============================================================
// TAB EVENTS
// ============================================================

if (emailTab) {

    emailTab.addEventListener(
        "click",
        switchToEmail
    );

}

if (phoneTab) {

    phoneTab.addEventListener(
        "click",
        switchToPhone
    );

}


// ============================================================
// FIREBASE ERROR MESSAGE
// ============================================================

function firebaseErrorMessage(error) {

    console.error(
        "Firebase error:",
        error
    );


    const code =
        error?.code || "";


    switch (code) {

        case "auth/invalid-api-key":

            return "Firebase API key is invalid. Check the Firebase configuration.";

        case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":

            return "Firebase API key is invalid. Check your Firebase Web App configuration.";

        case "auth/email-already-in-use":

            return "This email is already registered. Please login.";

        case "auth/invalid-email":

            return "Please enter a valid email address.";

        case "auth/weak-password":

            return "Password should be at least 6 characters.";

        case "auth/invalid-credential":

            return "Incorrect email or password.";

        case "auth/user-not-found":

            return "No account was found with this email.";

        case "auth/wrong-password":

            return "Incorrect password.";

        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";

        case "auth/operation-not-allowed":

            return "This authentication method is not enabled in Firebase.";

        case "auth/quota-exceeded":

            return "Firebase SMS quota has been exceeded.";

        case "auth/invalid-phone-number":

            return "Enter the phone number in international format, for example +919876543210.";

        case "auth/missing-phone-number":

            return "Please enter a phone number.";

        case "auth/code-expired":

            return "The OTP has expired. Please request a new OTP.";

        case "auth/invalid-verification-code":

            return "The OTP is incorrect.";

        case "auth/captcha-check-failed":

            return "reCAPTCHA verification failed. Please try again.";

        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";

        default:

            return (
                error?.message ||
                "Authentication failed."
            );

    }

}


// ============================================================
// EMAIL LOGIN / SIGNUP
// ============================================================

if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        async function () {

            const email =
                authEmail.value.trim();

            const password =
                authPassword.value;


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


            authSubmit.disabled =
                true;

            authSubmit.textContent =
                "Please wait...";


            try {

                let userCredential;


                if (
                    authMode ===
                    "signup"
                ) {

                    userCredential =
                        await createUserWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );

                    authMessage.textContent =
                        "Account created successfully!";


                } else {

                    userCredential =
                        await signInWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );

                    authMessage.textContent =
                        "Login successful!";

                }


                console.log(
                    "Authenticated user:",
                    userCredential.user
                );


                setTimeout(
                    () => {

                        authModal.classList.add(
                            "hidden"
                        );

                    },
                    1000
                );


            } catch (error) {

                authMessage.textContent =
                    firebaseErrorMessage(
                        error
                    );

            } finally {

                authSubmit.disabled =
                    false;

                authSubmit.textContent =
                    authMode ===
                    "signup"
                        ? "Sign Up"
                        : "Login";

            }

        }
    );

}


// ============================================================
// CREATE RECAPTCHA
// ============================================================

function createRecaptcha() {

    if (
        recaptchaVerifier !==
        null
    ) {
        return;
    }


    try {

        recaptchaVerifier =
            new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "normal",

                    callback: function () {

                        console.log(
                            "reCAPTCHA verified."
                        );

                    },

                    "expired-callback":
                        function () {

                            authMessage.textContent =
                                "reCAPTCHA expired. Please verify again.";

                        }

                }
            );


        recaptchaVerifier.render();


    } catch (error) {

        console.error(
            "reCAPTCHA error:",
            error
        );

        authMessage.textContent =
            "Could not load reCAPTCHA.";

    }

}


// ============================================================
// SEND PHONE OTP
// ============================================================

if (sendOtpBtn) {

    sendOtpBtn.addEventListener(
        "click",
        async function () {

            const number =
                phoneNumber.value.trim();


            if (!number) {

                authMessage.textContent =
                    "Please enter your phone number.";

                return;

            }


            if (
                !number.startsWith("+")
            ) {

                authMessage.textContent =
                    "Use international format, for example +919876543210.";

                return;

            }


            try {

                sendOtpBtn.disabled =
                    true;

                sendOtpBtn.textContent =
                    "Sending OTP...";


                if (
                    !recaptchaVerifier
                ) {

                    createRecaptcha();

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                1000
                            )
                    );

                }


                confirmationResult =
                    await signInWithPhoneNumber(
                        auth,
                        number,
                        recaptchaVerifier
                    );


                authMessage.textContent =
                    "OTP sent successfully. Check your phone.";

                console.log(
                    "OTP sent."
                );


            } catch (error) {

                authMessage.textContent =
                    firebaseErrorMessage(
                        error
                    );


                // Reset reCAPTCHA

                if (
                    recaptchaVerifier
                ) {

                    try {

                        recaptchaVerifier.clear();

                    } catch (_) {}

                    recaptchaVerifier =
                        null;

                }

            } finally {

                sendOtpBtn.disabled =
                    false;

                sendOtpBtn.textContent =
                    "Send OTP";

            }

        }
    );

}


// ============================================================
// VERIFY PHONE OTP
// ============================================================

if (verifyOtpBtn) {

    verifyOtpBtn.addEventListener(
        "click",
        async function () {

            const code =
                otpCode.value.trim();


            if (
                !confirmationResult
            ) {

                authMessage.textContent =
                    "Please request an OTP first.";

                return;

            }


            if (
                code.length !== 6
            ) {

                authMessage.textContent =
                    "Please enter the 6-digit OTP.";

                return;

            }


            try {

                verifyOtpBtn.disabled =
                    true;

                verifyOtpBtn.textContent =
                    "Verifying...";


                const result =
                    await confirmationResult.confirm(
                        code
                    );


                console.log(
                    "Phone authenticated:",
                    result.user
                );


                authMessage.textContent =
                    "Phone authentication successful!";


                confirmationResult =
                    null;


                setTimeout(
                    () => {

                        authModal.classList.add(
                            "hidden"
                        );

                    },
                    1000
                );


            } catch (error) {

                authMessage.textContent =
                    firebaseErrorMessage(
                        error
                    );

            } finally {

                verifyOtpBtn.disabled =
                    false;

                verifyOtpBtn.textContent =
                    "Verify OTP";

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

                await signOut(
                    auth
                );

                alert(
                    "Logged out successfully."
                );

            } catch (error) {

                alert(
                    firebaseErrorMessage(
                        error
                    )
                );

            }

        }
    );

}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "User logged in:",
                user.email ||
                user.phoneNumber
            );


            loginBtn.classList.add(
                "hidden"
            );

            signupBtn.classList.add(
                "hidden"
            );

            logoutBtn.classList.remove(
                "hidden"
            );


        } else {

            console.log(
                "No user logged in."
            );


            loginBtn.classList.remove(
                "hidden"
            );

            signupBtn.classList.remove(
                "hidden"
            );

            logoutBtn.classList.add(
                "hidden"
            );

        }

    }
);


// ============================================================
// INITIAL COUNT
// ============================================================

updateCount();


// ============================================================
// FIREBASE TEST
// ============================================================

console.log(
    "QuantumDiagnose Firebase initialized successfully."
);
