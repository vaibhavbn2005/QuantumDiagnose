// ============================================================
// QuantumDiagnose
// Firebase Authentication + Phone OTP + Firestore
// + Random Forest Prediction
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

// Symptoms

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


// Buttons

const loginBtn =
  document.getElementById("loginBtn");

const signupBtn =
  document.getElementById("signupBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const clearBtn =
  document.getElementById("clearBtn");

const predictBtn =
  document.getElementById("predictBtn");


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


// Phone authentication

const phoneAuthArea =
  document.getElementById("phoneAuthArea");

const authPhone =
  document.getElementById("authPhone");

const sendOTP =
  document.getElementById("sendOTP");

const authOTP =
  document.getElementById("authOTP");

const verifyOTP =
  document.getElementById("verifyOTP");


// ============================================================
// VARIABLES
// ============================================================

let authMode =
  "login";

let confirmationResult =
  null;

let recaptchaVerifier =
  null;


// ============================================================
// SYMPTOM COUNT
// ============================================================

function updateCount() {

  count.textContent =
    boxes.filter(
      box => box.checked
    ).length;

}


// ============================================================
// CHECKBOX EVENTS
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
    function () {

      const query =
        this.value
          .toLowerCase()
          .trim();


      document
        .querySelectorAll(".symptom")
        .forEach(item => {

          const name =
            item.dataset.name
              .toLowerCase();


          if (
            name.includes(query)
          ) {

            item.style.display =
              "";

          } else {

            item.style.display =
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
        box => {
          box.checked = false;
        }
      );


      updateCount();


      if (result) {

        result.classList.add(
          "hidden"
        );

      }

    }
  );

}


// ============================================================
// OPEN LOGIN
// ============================================================

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    function () {

      openAuthModal("login");

    }
  );

}


// ============================================================
// OPEN SIGNUP
// ============================================================

if (signupBtn) {

  signupBtn.addEventListener(
    "click",
    function () {

      openAuthModal("signup");

    }
  );

}


// ============================================================
// OPEN AUTH MODAL
// ============================================================

function openAuthModal(mode) {

  authMode =
    mode;


  authModal.classList.remove(
    "hidden"
  );


  authMessage.textContent =
    "";


  authEmail.value =
    "";

  authPassword.value =
    "";


  // Show email authentication

  authEmail.style.display =
    "block";

  authPassword.style.display =
    "block";

  authSubmit.style.display =
    "block";


  // Hide phone authentication initially

  phoneAuthArea.style.display =
    "none";


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


  // Create/use phone button

  createPhoneButton();

}


// ============================================================
// PHONE BUTTON
// ============================================================

function createPhoneButton() {

  let phoneButton =
    document.getElementById(
      "phoneLoginButton"
    );


  if (!phoneButton) {

    phoneButton =
      document.createElement(
        "button"
      );

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
      phoneAuthArea
    );


    phoneButton.addEventListener(
      "click",
      openPhoneAuthentication
    );

  }


  phoneButton.style.display =
    "block";

}


// ============================================================
// OPEN PHONE AUTHENTICATION
// ============================================================

function openPhoneAuthentication() {

  authEmail.style.display =
    "none";

  authPassword.style.display =
    "none";

  authSubmit.style.display =
    "none";


  const phoneButton =
    document.getElementById(
      "phoneLoginButton"
    );


  if (phoneButton) {

    phoneButton.style.display =
      "none";

  }


  phoneAuthArea.style.display =
    "block";


  authTitle.textContent =
    "Phone Authentication";


  authMessage.textContent =
    "Enter your phone number with country code.";

}


// ============================================================
// CLOSE MODAL
// ============================================================

if (closeModal) {

  closeModal.addEventListener(
    "click",
    closeAuthModal
  );

}


function closeAuthModal() {

  authModal.classList.add(
    "hidden"
  );


  authMessage.textContent =
    "";


  // Reset phone area

  phoneAuthArea.style.display =
    "none";


  authEmail.style.display =
    "block";

  authPassword.style.display =
    "block";

  authSubmit.style.display =
    "block";


  const phoneButton =
    document.getElementById(
      "phoneLoginButton"
    );


  if (phoneButton) {

    phoneButton.style.display =
      "block";

  }


  if (recaptchaVerifier) {

    try {

      recaptchaVerifier.clear();

    } catch (error) {

      console.log(
        error
      );

    }


    recaptchaVerifier =
      null;

  }

}


// ============================================================
// CLOSE MODAL BY CLICKING OUTSIDE
// ============================================================

if (authModal) {

  authModal.addEventListener(
    "click",
    function (event) {

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
    async function () {

      const email =
        authEmail.value.trim();

      const password =
        authPassword.value;


      // Validate email

      if (!email) {

        authMessage.textContent =
          "Please enter your email.";

        return;

      }


      // Validate password

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
          authMode === "signup"
        ) {

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
          closeAuthModal,
          1000
        );


      } catch (error) {

        console.error(
          "Authentication error:",
          error
        );


        authMessage.textContent =
          firebaseErrorMessage(
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
// FIREBASE ERROR MESSAGE
// ============================================================

function firebaseErrorMessage(error) {

  switch (error.code) {

    case "auth/email-already-in-use":

      return "This email is already registered. Please login.";


    case "auth/invalid-email":

      return "Please enter a valid email address.";


    case "auth/weak-password":

      return "Password must contain at least 6 characters.";


    case "auth/user-not-found":

      return "No account found with this email.";


    case "auth/wrong-password":

      return "Incorrect password.";


    case "auth/invalid-credential":

      return "Incorrect email or password.";


    case "auth/too-many-requests":

      return "Too many attempts. Please try again later.";


    case "auth/network-request-failed":

      return "Network error. Check your internet connection.";


    case "auth/invalid-phone-number":

      return "Invalid phone number. Use +91XXXXXXXXXX.";


    case "auth/invalid-verification-code":

      return "Incorrect OTP.";


    case "auth/code-expired":

      return "OTP expired. Please request a new OTP.";


    case "auth/captcha-check-failed":

      return "reCAPTCHA verification failed. Please try again.";


    case "auth/quota-exceeded":

      return "Firebase SMS quota has been exceeded.";


    default:

      return (
        error.message ||
        "Authentication failed."
      );

  }

}


// ============================================================
// CREATE RECAPTCHA
// ============================================================

function createRecaptcha() {

  if (recaptchaVerifier) {

    return recaptchaVerifier;

  }


  recaptchaVerifier =
    new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {

        size:
          "invisible",

        callback:
          function () {

            console.log(
              "reCAPTCHA completed."
            );

          },

        "expired-callback":
          function () {

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

if (sendOTP) {

  sendOTP.addEventListener(
    "click",
    async function () {

      const phoneNumber =
        authPhone.value.trim();


      if (!phoneNumber) {

        authMessage.textContent =
          "Please enter your phone number.";

        return;

      }


      if (
        !phoneNumber.startsWith("+")
      ) {

        authMessage.textContent =
          "Use country code. Example: +919876543210";

        return;

      }


      sendOTP.disabled =
        true;


      sendOTP.textContent =
        "Sending OTP...";


      try {

        const verifier =
          createRecaptcha();


        confirmationResult =
          await signInWithPhoneNumber(
            auth,
            phoneNumber,
            verifier
          );


        authMessage.textContent =
          "OTP sent successfully. Enter the OTP below.";


        authOTP.style.display =
          "block";


        verifyOTP.style.display =
          "block";


        sendOTP.textContent =
          "OTP Sent";


      } catch (error) {

        console.error(
          "Phone OTP error:",
          error
        );


        authMessage.textContent =
          firebaseErrorMessage(
            error
          );


        if (recaptchaVerifier) {

          try {

            recaptchaVerifier.clear();

          } catch (e) {

            console.log(e);

          }


          recaptchaVerifier =
            null;

        }


        sendOTP.textContent =
          "Send OTP";

      } finally {

        sendOTP.disabled =
          false;

      }

    }
  );

}


// ============================================================
// VERIFY PHONE OTP
// ============================================================

if (verifyOTP) {

  verifyOTP.addEventListener(
    "click",
    async function () {

      const otp =
        authOTP.value.trim();


      if (!confirmationResult) {

        authMessage.textContent =
          "Please request an OTP first.";

        return;

      }


      if (!otp) {

        authMessage.textContent =
          "Please enter the OTP.";

        return;

      }


      verifyOTP.disabled =
        true;


      verifyOTP.textContent =
        "Verifying...";


      try {

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
          closeAuthModal,
          1000
        );


      } catch (error) {

        console.error(
          "OTP verification error:",
          error
        );


        authMessage.textContent =
          firebaseErrorMessage(
            error
          );

      } finally {

        verifyOTP.disabled =
          false;


        verifyOTP.textContent =
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
        "Logged in:",
        user.email ||
        user.phoneNumber ||
        user.uid
      );


      // Hide Login

      if (loginBtn) {

        loginBtn.classList.add(
          "hidden"
        );

      }


      // Hide Sign Up

      if (signupBtn) {

        signupBtn.classList.add(
          "hidden"
        );

      }


      // Show Logout

      if (logoutBtn) {

        logoutBtn.classList.remove(
          "hidden"
        );

      }


    } else {

      // Show Login

      if (loginBtn) {

        loginBtn.classList.remove(
          "hidden"
        );

      }


      // Show Sign Up

      if (signupBtn) {

        signupBtn.classList.remove(
          "hidden"
        );

      }


      // Hide Logout

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
  diseaseName,
  confidence,
  predictions
) {

  const user =
    auth.currentUser;


  // Only save for logged-in users

  if (!user) {

    console.log(
      "Not logged in. Prediction not saved."
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

        email:
          user.email ||
          null,

        phoneNumber:
          user.phoneNumber ||
          null,

        symptoms:
          symptoms,

        disease:
          diseaseName,

        confidence:
          confidence,

        topPredictions:
          predictions,

        createdAt:
          serverTimestamp()

      }
    );


    console.log(
      "Prediction saved to Firestore."
    );


  } catch (error) {

    console.error(
      "Firestore error:",
      error
    );

  }

}


// ============================================================
// PREDICTION
// ============================================================

if (predictBtn) {

  predictBtn.addEventListener(
    "click",
    async function () {

      const selectedSymptoms =
        boxes
          .filter(
            box => box.checked
          )
          .map(
            box => box.value
          );


      // Check symptoms

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

        // Send request to Flask

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
            "Prediction failed."
          );

        }


        // ==================================================
        // DISPLAY DISEASE
        // ==================================================

        disease.textContent =
          data.disease
            .replaceAll(
              "_",
              " "
            );


        // ==================================================
        // CONFIDENCE
        // ==================================================

        confidenceBar.style.width =
          `${data.confidence}%`;


        confidenceText.textContent =
          `Model confidence: ${data.confidence}%`;


        // ==================================================
        // DISCLAIMER
        // ==================================================

        message.textContent =
          data.message;


        // ==================================================
        // TOP PREDICTIONS
        // ==================================================

        topPredictions.innerHTML =
          data.top_predictions
            .map(
              item => `

                <div class="top-item">

                  <span>
                    ${item.disease.replaceAll(
                      "_",
                      " "
                    )}
                  </span>

                  <strong>
                    ${item.confidence}%
                  </strong>

                </div>

              `
            )
            .join("");


        // ==================================================
        // SHOW RESULT
        // ==================================================

        result.classList.remove(
          "hidden"
        );


        // ==================================================
        // SAVE HISTORY
        // ==================================================

        await savePrediction(
          selectedSymptoms,
          data.disease,
          data.confidence,
          data.top_predictions
        );


        // ==================================================
        // SCROLL
        // ==================================================

        result.scrollIntoView({
          behavior:
            "smooth",

          block:
            "center"

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
// INITIALIZE
// ============================================================

updateCount();


console.log(
  "QuantumDiagnose loaded successfully."
);

console.log(
  "Firebase initialized successfully."
);
