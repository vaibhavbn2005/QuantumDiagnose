// ============================================================
// QuantumDiagnose - Complete script.js
// Firebase Authentication + Phone OTP + Firestore + ML Prediction
// ============================================================


// ============================================================
// FIREBASE IMPORTS
// ============================================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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

const db = getFirestore(firebaseApp);


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
// DOM ELEMENTS
// ============================================================

// Symptoms
const boxes = [
  ...document.querySelectorAll(".symptom input")
];

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


// Authentication buttons
const loginBtn =
  document.getElementById("loginBtn");

const signupBtn =
  document.getElementById("signupBtn");

const logoutBtn =
  document.getElementById("logoutBtn");


// Authentication modal
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
// AUTHENTICATION STATE
// ============================================================

let authMode = "login";

let currentAuthMethod = "email";

let confirmationResult = null;

let recaptchaVerifier = null;


// ============================================================
// UPDATE SYMPTOM COUNT
// ============================================================

function updateCount() {

  count.textContent =
    boxes.filter(box => box.checked).length;
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
// SYMPTOM SEARCH
// ============================================================

const searchInput =
  document.getElementById("search");

if (searchInput) {

  searchInput.addEventListener(
    "input",
    event => {

      const searchText =
        event.target.value
          .toLowerCase()
          .trim();

      document
        .querySelectorAll(".symptom")
        .forEach(symptom => {

          const name =
            symptom.dataset.name
              .toLowerCase();

          if (name.includes(searchText)) {

            symptom.style.display = "";

          } else {

            symptom.style.display = "none";

          }

        });

    }
  );

}


// ============================================================
// CLEAR BUTTON
// ============================================================

const clearBtn =
  document.getElementById("clearBtn");

if (clearBtn) {

  clearBtn.addEventListener(
    "click",
    () => {

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
// CREATE PHONE AUTH UI DYNAMICALLY
// NO HTML CHANGE REQUIRED
// ============================================================

function createPhoneAuthUI() {

  // Prevent duplicate creation
  if (document.getElementById("phoneAuthArea")) {
    return;
  }


  const area =
    document.createElement("div");

  area.id = "phoneAuthArea";

  area.style.marginTop = "15px";


  // Phone number input
  const phoneInput =
    document.createElement("input");

  phoneInput.id =
    "authPhone";

  phoneInput.type =
    "tel";

  phoneInput.placeholder =
    "Phone number e.g. +919876543210";

  phoneInput.style.width =
    "100%";

  phoneInput.style.boxSizing =
    "border-box";

  phoneInput.style.padding =
    "12px";

  phoneInput.style.margin =
    "8px 0";

  phoneInput.style.border =
    "1px solid #ddd";

  phoneInput.style.borderRadius =
    "8px";

  phoneInput.style.fontSize =
    "15px";


  // Send OTP button
  const sendOTP =
    document.createElement("button");

  sendOTP.id =
    "sendOTP";

  sendOTP.textContent =
    "Send OTP";

  sendOTP.className =
    "primary";

  sendOTP.style.width =
    "100%";

  sendOTP.style.marginTop =
    "8px";


  // OTP input
  const otpInput =
    document.createElement("input");

  otpInput.id =
    "authOTP";

  otpInput.type =
    "text";

  otpInput.placeholder =
    "Enter OTP";

  otpInput.style.width =
    "100%";

  otpInput.style.boxSizing =
    "border-box";

  otpInput.style.padding =
    "12px";

  otpInput.style.margin =
    "8px 0";

  otpInput.style.border =
    "1px solid #ddd";

  otpInput.style.borderRadius =
    "8px";

  otpInput.style.fontSize =
    "15px";


  // Verify OTP button
  const verifyOTP =
    document.createElement("button");

  verifyOTP.id =
    "verifyOTP";

  verifyOTP.textContent =
    "Verify OTP";

  verifyOTP.className =
    "primary";

  verifyOTP.style.width =
    "100%";

  verifyOTP.style.marginTop =
    "8px";


  // Initially hide OTP section
  otpInput.style.display =
    "none";

  verifyOTP.style.display =
    "none";


  // Recaptcha container
  const recaptcha =
    document.createElement("div");

  recaptcha.id =
    "recaptcha-container";

  recaptcha.style.marginTop =
    "10px";


  area.appendChild(phoneInput);

  area.appendChild(sendOTP);

  area.appendChild(otpInput);

  area.appendChild(verifyOTP);

  area.appendChild(recaptcha);


  authSubmit.parentNode.insertBefore(
    area,
    authMessage
  );


  // Send OTP
  sendOTP.addEventListener(
    "click",
    sendPhoneOTP
  );


  // Verify OTP
  verifyOTP.addEventListener(
    "click",
    verifyPhoneOTP
  );

}


// ============================================================
// CREATE PHONE BUTTON
// ============================================================

function createPhoneButton() {

  if (
    document.getElementById(
      "phoneLoginButton"
    )
  ) {
    return;
  }


  const phoneButton =
    document.createElement("button");

  phoneButton.id =
    "phoneLoginButton";

  phoneButton.textContent =
    "Use Phone Number";

  phoneButton.className =
    "secondary";

  phoneButton.style.width =
    "100%";

  phoneButton.style.marginTop =
    "10px";


  authSubmit.parentNode.insertBefore(
    phoneButton,
    authMessage
  );


  phoneButton.addEventListener(
    "click",
    () => {

      currentAuthMethod = "phone";

      createPhoneAuthUI();

      const area =
        document.getElementById(
          "phoneAuthArea"
        );

      if (area) {

        area.style.display = "block";

      }

      authEmail.style.display =
        "none";

      authPassword.style.display =
        "none";

      authSubmit.style.display =
        "none";

      phoneButton.style.display =
        "none";

      authTitle.textContent =
        "Phone Authentication";

      authMessage.textContent =
        "Enter your phone number with country code.";

    }
  );

}


// ============================================================
// OPEN AUTH MODAL
// ============================================================

function openAuthModal(mode) {

  authMode = mode;

  currentAuthMethod = "email";

  authModal.classList.remove("hidden");

  authEmail.value = "";

  authPassword.value = "";

  authMessage.textContent = "";


  authEmail.style.display = "";

  authPassword.style.display = "";

  authSubmit.style.display = "";


  if (mode === "login") {

    authTitle.textContent =
      "Login";

    authSubmit.textContent =
      "Login";

  } else {

    authTitle.textContent =
      "Create Account";

    authSubmit.textContent =
      "Sign Up";

  }


  // Create phone button
  createPhoneButton();


  const phoneButton =
    document.getElementById(
      "phoneLoginButton"
    );

  if (phoneButton) {

    phoneButton.style.display =
      "block";

  }


  const phoneArea =
    document.getElementById(
      "phoneAuthArea"
    );

  if (phoneArea) {

    phoneArea.style.display =
      "none";

  }

}


// ============================================================
// CLOSE AUTH MODAL
// ============================================================

function closeAuthModal() {

  authModal.classList.add("hidden");

  authMessage.textContent = "";

  authEmail.value = "";

  authPassword.value = "";

}


// ============================================================
// LOGIN BUTTON
// ============================================================

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    () => {

      openAuthModal("login");

    }
  );

}


// ============================================================
// SIGNUP BUTTON
// ============================================================

if (signupBtn) {

  signupBtn.addEventListener(
    "click",
    () => {

      openAuthModal("signup");

    }
  );

}


// ============================================================
// CLOSE BUTTON
// ============================================================

if (closeModal) {

  closeModal.addEventListener(
    "click",
    closeAuthModal
  );

}


// ============================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

if (authModal) {

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

}


// ============================================================
// EMAIL LOGIN / SIGNUP
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


      authSubmit.disabled = true;

      authSubmit.textContent =
        "Please wait...";


      try {

        if (authMode === "signup") {

          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

          authMessage.textContent =
            "Account created successfully!";

        } else {

          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );

          authMessage.textContent =
            "Login successful!";

        }


        setTimeout(
          () => {

            closeAuthModal();

          },
          1000
        );


      } catch (error) {

        console.error(
          "Firebase authentication error:",
          error
        );

        authMessage.textContent =
          getFirebaseErrorMessage(
            error
          );

      } finally {

        authSubmit.disabled =
          false;

        authSubmit.textContent =
          authMode === "signup"
            ? "Sign Up"
            : "Login";

      }

    }
  );

}


// ============================================================
// FIREBASE ERROR MESSAGES
// ============================================================

function getFirebaseErrorMessage(error) {

  const code =
    error.code || "";


  switch (code) {

    case "auth/email-already-in-use":
      return "This email is already registered. Please login.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";

    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    case "auth/api-key-not-valid":
      return "Firebase API key is invalid. Check your Firebase configuration.";

    case "auth/invalid-verification-code":
      return "The OTP is incorrect.";

    case "auth/code-expired":
      return "The OTP has expired. Please request a new OTP.";

    case "auth/invalid-phone-number":
      return "Invalid phone number. Use country code, e.g. +919876543210.";

    case "auth/quota-exceeded":
      return "Firebase SMS quota has been exceeded.";

    case "auth/captcha-check-failed":
      return "reCAPTCHA verification failed. Please try again.";

    default:
      return "Firebase error: " +
        (error.message || "Unknown error");

  }

}


// ============================================================
// CREATE RECAPTCHA
// ============================================================

function setupRecaptcha() {

  if (recaptchaVerifier) {

    return recaptchaVerifier;

  }


  const container =
    document.getElementById(
      "recaptcha-container"
    );

  if (!container) {

    console.error(
      "reCAPTCHA container not found."
    );

    return null;

  }


  recaptchaVerifier =
    new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",

        callback: () => {

          console.log(
            "reCAPTCHA solved."
          );

        },

        "expired-callback": () => {

          console.log(
            "reCAPTCHA expired."
          );

        }

      }
    );


  return recaptchaVerifier;

}


// ============================================================
// SEND PHONE OTP
// ============================================================

async function sendPhoneOTP() {

  const phoneInput =
    document.getElementById(
      "authPhone"
    );

  const sendOTP =
    document.getElementById(
      "sendOTP"
    );

  const otpInput =
    document.getElementById(
      "authOTP"
    );

  const verifyOTP =
    document.getElementById(
      "verifyOTP"
    );


  if (!phoneInput) {

    return;

  }


  let phoneNumber =
    phoneInput.value.trim();


  if (!phoneNumber) {

    authMessage.textContent =
      "Please enter your phone number.";

    return;

  }


  // Basic international format
  if (!phoneNumber.startsWith("+")) {

    authMessage.textContent =
      "Enter phone number with country code. Example: +919876543210";

    return;

  }


  try {

    sendOTP.disabled = true;

    sendOTP.textContent =
      "Sending OTP...";


    // Create reCAPTCHA
    const verifier =
      setupRecaptcha();


    if (!verifier) {

      throw new Error(
        "Could not initialize reCAPTCHA."
      );

    }


    confirmationResult =
      await signInWithPhoneNumber(
        auth,
        phoneNumber,
        verifier
      );


    authMessage.textContent =
      "OTP sent successfully. Enter the OTP below.";


    otpInput.style.display =
      "block";

    verifyOTP.style.display =
      "block";

    sendOTP.textContent =
      "OTP Sent";


  } catch (error) {

    console.error(
      "Phone authentication error:",
      error
    );


    authMessage.textContent =
      getFirebaseErrorMessage(
        error
      );


    // Reset reCAPTCHA
    if (recaptchaVerifier) {

      try {

        recaptchaVerifier.clear();

      } catch (e) {

        console.log(e);

      }

      recaptchaVerifier =
        null;

    }


  } finally {

    sendOTP.disabled =
      false;

  }

}


// ============================================================
// VERIFY PHONE OTP
// ============================================================

async function verifyPhoneOTP() {

  const otpInput =
    document.getElementById(
      "authOTP"
    );

  const verifyOTP =
    document.getElementById(
      "verifyOTP"
    );


  if (!confirmationResult) {

    authMessage.textContent =
      "Please request an OTP first.";

    return;

  }


  const otp =
    otpInput.value.trim();


  if (!otp) {

    authMessage.textContent =
      "Please enter the OTP.";

    return;

  }


  try {

    verifyOTP.disabled =
      true;

    verifyOTP.textContent =
      "Verifying...";


    const result =
      await confirmationResult.confirm(
        otp
      );


    console.log(
      "Phone login successful:",
      result.user
    );


    authMessage.textContent =
      "Phone authentication successful!";


    setTimeout(
      () => {

        closeAuthModal();

      },
      1000
    );


  } catch (error) {

    console.error(
      "OTP verification error:",
      error
    );


    authMessage.textContent =
      getFirebaseErrorMessage(
        error
      );


  } finally {

    verifyOTP.disabled =
      false;

    verifyOTP.textContent =
      "Verify OTP";

  }

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        console.log(
          "User logged out."
        );

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

        alert(
          getFirebaseErrorMessage(
            error
          )
        );

      }

    }
  );

}


// ============================================================
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      console.log(
        "Logged in user:",
        user.email ||
        user.phoneNumber ||
        user.uid
      );


      // Hide login/signup
      if (loginBtn) {

        loginBtn.classList.add(
          "hidden"
        );

      }


      if (signupBtn) {

        signupBtn.classList.add(
          "hidden"
        );

      }


      // Show logout
      if (logoutBtn) {

        logoutBtn.classList.remove(
          "hidden"
        );

      }

    } else {

      console.log(
        "No user logged in."
      );


      // Show login/signup
      if (loginBtn) {

        loginBtn.classList.remove(
          "hidden"
        );

      }


      if (signupBtn) {

        signupBtn.classList.remove(
          "hidden"
        );

      }


      // Hide logout
      if (logoutBtn) {

        logoutBtn.classList.add(
          "hidden"
        );

      }

    }

  }
);


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


  // Don't save if user isn't logged in
  if (!user) {

    console.log(
      "User not logged in. Prediction not saved."
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
          user.email ||
          null,

        phoneNumber:
          user.phoneNumber ||
          null,

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

const predictBtn =
  document.getElementById(
    "predictBtn"
  );


if (predictBtn) {

  predictBtn.addEventListener(
    "click",
    async () => {

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


      // Button loading state
      predictBtn.disabled =
        true;

      predictBtn.textContent =
        "Analyzing...";


      try {

        // Send to Flask
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
          data.disease
            .replaceAll(
              "_",
              " "
            );


        // Confidence
        confidenceBar.style.width =
          `${data.confidence}%`;


        confidenceText.textContent =
          `Model confidence: ${data.confidence}%`;


        // Message
        message.textContent =
          data.message;


        // Top predictions
        topPredictions.innerHTML =
          data.top_predictions
            .map(
              item => {

                return `
                  <div class="top-item">
                    <span>
                      ${item.disease.replaceAll("_", " ")}
                    </span>

                    <strong>
                      ${item.confidence}%
                    </strong>
                  </div>
                `;

              }
            )
            .join("");


        // Show result
        result.classList.remove(
          "hidden"
        );


        // Save to Firestore
        await savePrediction(
          symptoms,
          data.disease,
          data.confidence,
          data.top_predictions
        );


        // Scroll to result
        result.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });


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
// INITIAL COUNT
// ============================================================

updateCount();


// ============================================================
// PAGE LOADED
// ============================================================

console.log(
  "QuantumDiagnose JavaScript loaded successfully."
);

console.log(
  "Firebase initialized successfully."
);
