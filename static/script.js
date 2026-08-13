// ============================================================
// QUANTUMDIAGNOSE - COMPLETE FIREBASE + APP JAVASCRIPT
// Email/Password + Phone Number OTP Authentication
// ============================================================

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    updateProfile,
    linkWithCredential,
    PhoneAuthProvider
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAPrulUfMubKieGuU5QxQVwSu8sDtKvTZE",
    authDomain: "quantumdiagnose.firebaseapp.com",
    projectId: "quantumdiagnose",
    storageBucket: "quantumdiagnose.firebasestorage.app",
    messagingSenderId: "727641186346",
    appId: "1:727641186346:web:c8eed6274fd1582169e353",
    measurementId: "G-DSDM1YM4WB"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);


// ============================================================
// GET HTML ELEMENTS
// ============================================================

const boxes = [...document.querySelectorAll(".symptom input")];

const count = document.getElementById("count");

const result = document.getElementById("result");
const disease = document.getElementById("disease");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceText = document.getElementById("confidenceText");
const message = document.getElementById("message");
const topPredictions = document.getElementById("topPredictions");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");

const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");


// ============================================================
// AUTH VARIABLES
// ============================================================

let authMode = "login";

let recaptchaVerifier = null;
let phoneConfirmationResult = null;

let currentEmailUser = null;


// ============================================================
// CREATE PHONE INPUTS AUTOMATICALLY
// NO HTML CHANGE REQUIRED
// ============================================================

const phoneInput = document.createElement("input");

phoneInput.id = "authPhone";
phoneInput.type = "tel";
phoneInput.placeholder = "Phone number e.g. +919876543210";

phoneInput.style.width = "100%";
phoneInput.style.boxSizing = "border-box";
phoneInput.style.padding = "12px";
phoneInput.style.margin = "8px 0";
phoneInput.style.border = "1px solid #ddd";
phoneInput.style.borderRadius = "8px";
phoneInput.style.fontSize = "15px";


// OTP input

const otpInput = document.createElement("input");

otpInput.id = "authOTP";
otpInput.type = "text";
otpInput.placeholder = "Enter OTP";

otpInput.style.width = "100%";
otpInput.style.boxSizing = "border-box";
otpInput.style.padding = "12px";
otpInput.style.margin = "8px 0";
otpInput.style.border = "1px solid #ddd";
otpInput.style.borderRadius = "8px";
otpInput.style.fontSize = "15px";


// Send OTP button

const sendOtpBtn = document.createElement("button");

sendOtpBtn.type = "button";
sendOtpBtn.textContent = "Send OTP";

sendOtpBtn.className = "secondary";

sendOtpBtn.style.width = "100%";
sendOtpBtn.style.marginTop = "8px";


// Verify OTP button

const verifyOtpBtn = document.createElement("button");

verifyOtpBtn.type = "button";
verifyOtpBtn.textContent = "Verify OTP";

verifyOtpBtn.className = "primary";

verifyOtpBtn.style.width = "100%";
verifyOtpBtn.style.marginTop = "8px";


// Recaptcha container

const recaptchaContainer = document.createElement("div");

recaptchaContainer.id = "recaptcha-container";

recaptchaContainer.style.marginTop = "10px";


// Insert elements into modal

authEmail.insertAdjacentElement("afterend", phoneInput);

phoneInput.insertAdjacentElement("afterend", sendOtpBtn);

sendOtpBtn.insertAdjacentElement("afterend", otpInput);

otpInput.insertAdjacentElement("afterend", verifyOtpBtn);

verifyOtpBtn.insertAdjacentElement(
    "afterend",
    recaptchaContainer
);


// Initially hide phone/OTP controls

phoneInput.classList.add("hidden");
sendOtpBtn.classList.add("hidden");
otpInput.classList.add("hidden");
verifyOtpBtn.classList.add("hidden");


// ============================================================
// UPDATE SYMPTOM COUNT
// ============================================================

function updateCount() {

    count.textContent =
        boxes.filter(box => box.checked).length;
}

boxes.forEach(box => {

    box.addEventListener(
        "change",
        updateCount
    );

});


// ============================================================
// SEARCH SYMPTOMS
// ============================================================

const searchBox =
    document.getElementById("search");

searchBox.addEventListener(
    "input",
    event => {

        const query =
            event.target.value.toLowerCase();

        document
            .querySelectorAll(".symptom")
            .forEach(element => {

                const name =
                    element.dataset.name.toLowerCase();

                element.style.display =
                    name.includes(query)
                        ? ""
                        : "none";

            });

    }
);


// ============================================================
// CLEAR BUTTON
// ============================================================

document
    .getElementById("clearBtn")
    .addEventListener("click", () => {

        boxes.forEach(
            box => box.checked = false
        );

        updateCount();

        result.classList.add("hidden");

    });


// ============================================================
// PREDICT DISEASE
// ============================================================

document
    .getElementById("predictBtn")
    .addEventListener(
        "click",
        async () => {

            const symptoms =
                boxes
                    .filter(box => box.checked)
                    .map(box => box.value);


            if (!symptoms.length) {

                alert(
                    "Please select at least one symptom."
                );

                return;
            }


            const btn =
                document.getElementById(
                    "predictBtn"
                );

            btn.disabled = true;

            btn.textContent =
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
                        "Prediction failed"
                    );

                }


                disease.textContent =
                    data.disease
                        .replaceAll("_", " ");


                confidenceBar.style.width =
                    `${data.confidence}%`;


                confidenceText.textContent =
                    `Model confidence: ${data.confidence}%`;


                message.textContent =
                    data.message;


                topPredictions.innerHTML =
                    data.top_predictions
                        .map(item => {

                            return `
                                <div class="top-item">
                                    <span>
                                        ${item.disease
                                            .replaceAll("_", " ")}
                                    </span>

                                    <strong>
                                        ${item.confidence}%
                                    </strong>
                                </div>
                            `;

                        })
                        .join("");


                result.classList.remove(
                    "hidden"
                );


                result.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


            } catch (error) {

                alert(error.message);

            } finally {

                btn.disabled = false;

                btn.textContent =
                    "Predict Possible Disease";

            }

        }
    );


// ============================================================
// OPEN LOGIN
// ============================================================

loginBtn.addEventListener(
    "click",
    () => {

        openAuthModal("login");

    }
);


// ============================================================
// OPEN SIGNUP
// ============================================================

signupBtn.addEventListener(
    "click",
    () => {

        openAuthModal("signup");

    }
);


// ============================================================
// OPEN AUTH MODAL
// ============================================================

function openAuthModal(mode) {

    authMode = mode;

    authModal.classList.remove(
        "hidden"
    );

    authEmail.value = "";
    authPassword.value = "";

    phoneInput.value = "";
    otpInput.value = "";

    authMessage.textContent = "";

    phoneConfirmationResult = null;


    if (mode === "login") {

        authTitle.textContent =
            "Login";

        authSubmit.textContent =
            "Login";

        phoneInput.classList.add(
            "hidden"
        );

        sendOtpBtn.classList.add(
            "hidden"
        );

        otpInput.classList.add(
            "hidden"
        );

        verifyOtpBtn.classList.add(
            "hidden"
        );

    } else {

        authTitle.textContent =
            "Create Account";

        authSubmit.textContent =
            "Sign Up";

        phoneInput.classList.remove(
            "hidden"
        );

        sendOtpBtn.classList.remove(
            "hidden"
        );

        otpInput.classList.remove(
            "hidden"
        );

        verifyOtpBtn.classList.remove(
            "hidden"
        );

        createRecaptcha();

    }

}


// ============================================================
// CLOSE AUTH MODAL
// ============================================================

closeModal.addEventListener(
    "click",
    () => {

        closeAuthModal();

    }
);


authModal.addEventListener(
    "click",
    event => {

        if (
            event.target === authModal
        ) {

            closeAuthModal();

        }

    }
);


function closeAuthModal() {

    authModal.classList.add(
        "hidden"
    );

    authMessage.textContent = "";

    destroyRecaptcha();

}


// ============================================================
// FIREBASE RECAPTCHA
// ============================================================

function createRecaptcha() {

    destroyRecaptcha();


    try {

        recaptchaVerifier =
            new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "normal",

                    callback: () => {

                        console.log(
                            "reCAPTCHA verified"
                        );

                    },

                    "expired-callback": () => {

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

    }

}


function destroyRecaptcha() {

    if (recaptchaVerifier) {

        try {

            recaptchaVerifier.clear();

        } catch (error) {

            console.log(
                "reCAPTCHA cleanup:",
                error
            );

        }

        recaptchaVerifier = null;

    }

}


// ============================================================
// SIGNUP - EMAIL + PASSWORD
// ============================================================

authSubmit.addEventListener(
    "click",
    async () => {

        if (authMode === "login") {

            await loginUser();

        } else {

            await signupUser();

        }

    }
);


// ============================================================
// LOGIN
// ============================================================

async function loginUser() {

    const email =
        authEmail.value.trim();

    const password =
        authPassword.value;


    if (!email || !password) {

        showAuthMessage(
            "Please enter email and password.",
            "red"
        );

        return;
    }


    authSubmit.disabled = true;

    authSubmit.textContent =
        "Logging in...";


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        showAuthMessage(
            "Login successful!",
            "green"
        );


        setTimeout(
            () => {

                closeAuthModal();

            },
            1000
        );


    } catch (error) {

        console.error(error);

        showAuthMessage(
            firebaseErrorMessage(
                error
            ),
            "red"
        );

    } finally {

        authSubmit.disabled = false;

        authSubmit.textContent =
            "Login";

    }

}


// ============================================================
// SIGNUP
// ============================================================

async function signupUser() {

    const email =
        authEmail.value.trim();

    const password =
        authPassword.value;

    const phone =
        phoneInput.value.trim();


    if (!email) {

        showAuthMessage(
            "Please enter your email.",
            "red"
        );

        return;

    }


    if (!password) {

        showAuthMessage(
            "Please enter a password.",
            "red"
        );

        return;

    }


    if (password.length < 6) {

        showAuthMessage(
            "Password must be at least 6 characters.",
            "red"
        );

        return;

    }


    if (!phone) {

        showAuthMessage(
            "Please enter your phone number.",
            "red"
        );

        return;

    }


    if (!phone.startsWith("+")) {

        showAuthMessage(
            "Enter phone number with country code. Example: +919876543210",
            "red"
        );

        return;

    }


    if (!phoneConfirmationResult) {

        showAuthMessage(
            "Please click Send OTP and verify your phone number first.",
            "red"
        );

        return;

    }


    const otp =
        otpInput.value.trim();


    if (!otp) {

        showAuthMessage(
            "Please enter the OTP.",
            "red"
        );

        return;

    }


    authSubmit.disabled = true;

    authSubmit.textContent =
        "Creating account...";


    try {

        // ----------------------------------------------------
        // STEP 1: VERIFY PHONE OTP
        // ----------------------------------------------------

        const phoneCredential =
            PhoneAuthProvider.credential(
                phoneConfirmationResult.verificationId,
                otp
            );


        // ----------------------------------------------------
        // STEP 2: CREATE EMAIL/PASSWORD ACCOUNT
        // ----------------------------------------------------

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        // ----------------------------------------------------
        // STEP 3: LINK VERIFIED PHONE TO ACCOUNT
        // ----------------------------------------------------

        await linkWithCredential(
            user,
            phoneCredential
        );


        showAuthMessage(
            "Account created successfully!",
            "green"
        );


        setTimeout(
            () => {

                closeAuthModal();

            },
            1200
        );


    } catch (error) {

        console.error(
            "Signup error:",
            error
        );


        showAuthMessage(
            firebaseErrorMessage(
                error
            ),
            "red"
        );

    } finally {

        authSubmit.disabled = false;

        authSubmit.textContent =
            "Sign Up";

    }

}


// ============================================================
// SEND PHONE OTP
// ============================================================

sendOtpBtn.addEventListener(
    "click",
    async () => {

        const phone =
            phoneInput.value.trim();


        if (!phone) {

            showAuthMessage(
                "Please enter your phone number.",
                "red"
            );

            return;

        }


        if (!phone.startsWith("+")) {

            showAuthMessage(
                "Use international format. Example: +919876543210",
                "red"
            );

            return;

        }


        if (!recaptchaVerifier) {

            createRecaptcha();

        }


        sendOtpBtn.disabled = true;

        sendOtpBtn.textContent =
            "Sending OTP...";


        try {

            phoneConfirmationResult =
                await signInWithPhoneNumber(
                    auth,
                    phone,
                    recaptchaVerifier
                );


            showAuthMessage(
                "OTP sent to your phone number.",
                "green"
            );


            otpInput.focus();


        } catch (error) {

            console.error(
                "OTP error:",
                error
            );


            phoneConfirmationResult =
                null;


            showAuthMessage(
                firebaseErrorMessage(
                    error
                ),
                "red"
            );


            // Recreate reCAPTCHA
            createRecaptcha();


        } finally {

            sendOtpBtn.disabled = false;

            sendOtpBtn.textContent =
                "Send OTP";

        }

    }
);


// ============================================================
// VERIFY OTP BUTTON
// ============================================================

verifyOtpBtn.addEventListener(
    "click",
    () => {

        if (!phoneConfirmationResult) {

            showAuthMessage(
                "Please send the OTP first.",
                "red"
            );

            return;

        }


        const otp =
            otpInput.value.trim();


        if (!otp) {

            showAuthMessage(
                "Please enter the OTP.",
                "red"
            );

            return;

        }


        showAuthMessage(
            "OTP entered. Click Sign Up to finish creating your account.",
            "green"
        );

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

            alert(
                "You have been logged out."
            );

        } catch (error) {

            console.error(error);

            alert(
                firebaseErrorMessage(
                    error
                )
            );

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

            console.log(
                "Logged in:",
                user.email,
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
// FIREBASE ERROR MESSAGES
// ============================================================

function firebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/invalid-email":

            return "Invalid email address.";

        case "auth/email-already-in-use":

            return "This email is already registered. Please login.";

        case "auth/weak-password":

            return "Password is too weak. Use at least 6 characters.";

        case "auth/invalid-credential":

            return "Invalid email or password.";

        case "auth/user-not-found":

            return "No account found with this email.";

        case "auth/wrong-password":

            return "Incorrect password.";

        case "auth/too-many-requests":

            return "Too many attempts. Please wait and try again.";

        case "auth/invalid-phone-number":

            return "Invalid phone number. Use format +919876543210.";

        case "auth/missing-phone-number":

            return "Please enter a phone number.";

        case "auth/quota-exceeded":

            return "Firebase SMS quota has been exceeded.";

        case "auth/captcha-check-failed":

            return "reCAPTCHA verification failed. Please try again.";

        case "auth/invalid-verification-code":

            return "Incorrect OTP.";

        case "auth/code-expired":

            return "OTP expired. Please request a new OTP.";

        case "auth/provider-already-linked":

            return "This phone number is already linked to this account.";

        case "auth/credential-already-in-use":

            return "This phone number is already associated with another account.";

        case "auth/operation-not-allowed":

            return "This authentication method is not enabled in Firebase.";

        default:

            return (
                error?.message ||
                "Authentication failed."
            );

    }

}


// ============================================================
// AUTH MESSAGE
// ============================================================

function showAuthMessage(
    text,
    type
) {

    authMessage.textContent =
        text;


    if (type === "green") {

        authMessage.style.color =
            "green";

    } else {

        authMessage.style.color =
            "red";

    }

}


// ============================================================
// INITIAL COUNT
// ============================================================

updateCount();
