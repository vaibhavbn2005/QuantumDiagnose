// ============================================================
// QuantumDiagnose - Complete script.js
// ============================================================

// ------------------------------------------------------------
// FIREBASE IMPORTS
// ------------------------------------------------------------
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
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------
// IMPORTANT:
// Copy these values EXACTLY from:
// Firebase Console
// → Project Settings
// → General
// → Your apps
// → QuantumDiagnose Web
// → SDK setup and configuration
//
// Do NOT use the old/incorrect API key.
//

const firebaseConfig = {
  apiKey: "PASTE_YOUR_REAL_FIREBASE_API_KEY_HERE",
  authDomain: "quantumdiagnose.firebaseapp.com",
  projectId: "quantumdiagnose",
  storageBucket: "quantumdiagnose.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};


// ------------------------------------------------------------
// INITIALIZE FIREBASE
// ------------------------------------------------------------

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


// ------------------------------------------------------------
// MAKE FIREBASE AVAILABLE TO OTHER SCRIPTS
// ------------------------------------------------------------

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
// EXISTING SYMPTOM ANALYSIS
// ============================================================

const boxes = [
  ...document.querySelectorAll(".symptom input")
];

const count = document.getElementById("count");

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


// ------------------------------------------------------------
// UPDATE SYMPTOM COUNT
// ------------------------------------------------------------

function updateCount() {

  count.textContent =
    boxes.filter(
      b => b.checked
    ).length;

}


// ------------------------------------------------------------
// SYMPTOM CHECKBOX EVENTS
// ------------------------------------------------------------

boxes.forEach(box => {

  box.addEventListener(
    "change",
    updateCount
  );

});


// ------------------------------------------------------------
// SYMPTOM SEARCH
// ------------------------------------------------------------

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

  // If user is not logged in,
  // don't save history.

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

        userId: user.uid,

        userEmail: user.email,

        symptoms: symptoms,

        disease: prediction,

        confidence: confidence,

        topPredictions: topPredictions,

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


      // ------------------------------------------------------
      // NO SYMPTOMS
      // ------------------------------------------------------

      if (!symptoms.length) {

        alert(
          "Please select at least one symptom."
        );

        return;

      }


      // ------------------------------------------------------
      // BUTTON LOADING
      // ------------------------------------------------------

      predictBtn.disabled = true;

      predictBtn.textContent =
        "Analyzing...";


      try {

        // ----------------------------------------------------
        // SEND REQUEST TO FLASK
        // ----------------------------------------------------

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
                  symptoms: symptoms
                })

            }
          );


        const data =
          await response.json();


        // ----------------------------------------------------
        // ERROR
        // ----------------------------------------------------

        if (!response.ok) {

          throw new Error(
            data.error ||
            "Prediction failed"
          );

        }


        // ----------------------------------------------------
        // DISPLAY MAIN PREDICTION
        // ----------------------------------------------------

        disease.textContent =
          data.disease
            .replaceAll(
              "_",
              " "
            );


        // ----------------------------------------------------
        // CONFIDENCE BAR
        // ----------------------------------------------------

        confidenceBar.style.width =
          `${data.confidence}%`;


        confidenceText.textContent =
          `Model confidence: ${data.confidence}%`;


        // ----------------------------------------------------
        // DISCLAIMER
        // ----------------------------------------------------

        message.textContent =
          data.message;


        // ----------------------------------------------------
        // TOP 5 PREDICTIONS
        // ----------------------------------------------------

        topPredictions.innerHTML =
          data.top_predictions
            .map(
              prediction => {

                return `
                  <div class="top-item">
                    <span>
                      ${prediction.disease
                        .replaceAll("_", " ")}
                    </span>

                    <strong>
                      ${prediction.confidence}%
                    </strong>
                  </div>
                `;

              }
            )
            .join("");


        // ----------------------------------------------------
        // SHOW RESULT
        // ----------------------------------------------------

        result.classList.remove(
          "hidden"
        );


        // ----------------------------------------------------
        // SAVE TO FIRESTORE
        // ----------------------------------------------------

        await savePrediction(

          symptoms,

          data.disease,

          data.confidence,

          data.top_predictions

        );


        // ----------------------------------------------------
        // SCROLL TO RESULT
        // ----------------------------------------------------

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
// FIREBASE AUTHENTICATION UI
// ============================================================


// ------------------------------------------------------------
// FIND AUTH BUTTONS
// ------------------------------------------------------------

const loginBtn =
  document.getElementById(
    "loginBtn"
  );

const signupBtn =
  document.getElementById(
    "signupBtn"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


// ------------------------------------------------------------
// AUTH MODAL ELEMENTS
// ------------------------------------------------------------

const loginModal =
  document.getElementById(
    "loginModal"
  );

const signupModal =
  document.getElementById(
    "signupModal"
  );


// ------------------------------------------------------------
// LOGIN FORM
// ------------------------------------------------------------

const loginForm =
  document.getElementById(
    "loginForm"
  );


// ------------------------------------------------------------
// SIGNUP FORM
// ------------------------------------------------------------

const signupForm =
  document.getElementById(
    "signupForm"
  );


// ============================================================
// OPEN LOGIN
// ============================================================

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    () => {

      if (loginModal) {

        loginModal.classList.remove(
          "hidden"
        );

      }

    }
  );

}


// ============================================================
// OPEN SIGNUP
// ============================================================

if (signupBtn) {

  signupBtn.addEventListener(
    "click",
    () => {

      if (signupModal) {

        signupModal.classList.remove(
          "hidden"
        );

      }

    }
  );

}


// ============================================================
// CLOSE MODALS
// ============================================================

document
  .querySelectorAll(
    ".close-modal"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          if (loginModal) {

            loginModal.classList.add(
              "hidden"
            );

          }

          if (signupModal) {

            signupModal.classList.add(
              "hidden"
            );

          }

        }
      );

    }
  );


// ============================================================
// SIGN UP
// ============================================================

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        document.getElementById(
          "signupEmail"
        ).value.trim();


      const password =
        document.getElementById(
          "signupPassword"
        ).value;


      if (!email || !password) {

        alert(
          "Please enter email and password."
        );

        return;

      }


      try {

        await createUserWithEmailAndPassword(

          auth,

          email,

          password

        );


        alert(
          "Account created successfully!"
        );


        signupForm.reset();


        if (signupModal) {

          signupModal.classList.add(
            "hidden"
          );

        }


      } catch (error) {

        console.error(
          "Firebase signup error:",
          error
        );


        alert(
          "Firebase: " +
          error.message
        );

      }

    }
  );

}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        document.getElementById(
          "loginEmail"
        ).value.trim();


      const password =
        document.getElementById(
          "loginPassword"
        ).value;


      if (!email || !password) {

        alert(
          "Please enter email and password."
        );

        return;

      }


      try {

        await signInWithEmailAndPassword(

          auth,

          email,

          password

        );


        alert(
          "Login successful!"
        );


        loginForm.reset();


        if (loginModal) {

          loginModal.classList.add(
            "hidden"
          );

        }


      } catch (error) {

        console.error(
          "Firebase login error:",
          error
        );


        alert(
          "Firebase: " +
          error.message
        );

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
    async () => {

      try {

        await signOut(auth);

        alert(
          "Logged out successfully."
        );

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

        alert(
          error.message
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
  user => {

    if (user) {

      console.log(
        "Logged in:",
        user.email
      );


      // Show logout
      if (logoutBtn) {

        logoutBtn.classList.remove(
          "hidden"
        );

      }


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


      // Display user email if element exists
      const userEmail =
        document.getElementById(
          "userEmail"
        );

      if (userEmail) {

        userEmail.textContent =
          user.email;

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


      const userEmail =
        document.getElementById(
          "userEmail"
        );

      if (userEmail) {

        userEmail.textContent =
          "";

      }

    }

  }
);


// ============================================================
// LOAD USER PREDICTION HISTORY
// ============================================================

async function loadPredictionHistory() {

  const user =
    auth.currentUser;


  if (!user) {

    console.log(
      "Login required to view history."
    );

    return [];

  }


  try {

    const predictionsRef =
      collection(
        db,
        "predictions"
      );


    const predictionsQuery =
      query(

        predictionsRef,

        where(
          "userId",
          "==",
          user.uid
        ),

        orderBy(
          "createdAt",
          "desc"
        )

      );


    const snapshot =
      await getDocs(
        predictionsQuery
      );


    const history = [];


    snapshot.forEach(
      document => {

        history.push({

          id: document.id,

          ...document.data()

        });

      }
    );


    return history;


  } catch (error) {

    console.error(
      "Error loading history:",
      error
    );


    return [];

  }

}


// ============================================================
// DISPLAY HISTORY
// ============================================================

async function displayPredictionHistory() {

  const historyContainer =
    document.getElementById(
      "predictionHistory"
    );


  if (!historyContainer) {

    return;

  }


  const history =
    await loadPredictionHistory();


  if (!history.length) {

    historyContainer.innerHTML = `
      <p>
        No prediction history found.
      </p>
    `;

    return;

  }


  historyContainer.innerHTML =
    history
      .map(
        item => {

          const symptoms =
            Array.isArray(
              item.symptoms
            )
              ? item.symptoms
                  .map(
                    symptom =>
                      symptom.replaceAll(
                        "_",
                        " "
                      )
                  )
                  .join(", ")
              : "";


          return `
            <div class="history-item">

              <h3>
                ${item.disease
                  .replaceAll(
                    "_",
                    " "
                  )}
              </h3>

              <p>
                Confidence:
                <strong>
                  ${item.confidence}%
                </strong>
              </p>

              <p>
                Symptoms:
                ${symptoms}
              </p>

            </div>
          `;

        }
      )
      .join("");

}


// ============================================================
// EXPOSE HISTORY FUNCTION
// ============================================================

window.loadPredictionHistory =
  loadPredictionHistory;

window.displayPredictionHistory =
  displayPredictionHistory;


// ============================================================
// INITIALIZE
// ============================================================

updateCount();

console.log(
  "QuantumDiagnose initialized successfully."
);
