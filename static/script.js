// =====================================================
// QUANTUMDIAGNOSE
// Symptom Prediction + Firebase Authentication
// =====================================================


// =====================================================
// FIREBASE IMPORTS
// =====================================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore
} from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIGURATION
// =====================================================
//
// Put the configuration from:
// Firebase Console
// → Project Settings
// → Your apps
// → QuantumDiagnose Web
//
// in this block.
// =====================================================

const firebaseConfig = {

  apiKey: "YOUR_API_KEY",

  authDomain: "YOUR_AUTH_DOMAIN",

  projectId: "YOUR_PROJECT_ID",

  storageBucket: "YOUR_STORAGE_BUCKET",

  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",

  appId: "YOUR_APP_ID"

};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const firebaseApp =
  initializeApp(firebaseConfig);

const auth =
  getAuth(firebaseApp);

const db =
  getFirestore(firebaseApp);


// =====================================================
// SYMPTOM ELEMENTS
// =====================================================

const boxes =
  [...document.querySelectorAll('.symptom input')];

const count =
  document.getElementById('count');

const result =
  document.getElementById('result');

const disease =
  document.getElementById('disease');

const confidenceBar =
  document.getElementById('confidenceBar');

const confidenceText =
  document.getElementById('confidenceText');

const message =
  document.getElementById('message');

const topPredictions =
  document.getElementById('topPredictions');


// =====================================================
// UPDATE SYMPTOM COUNT
// =====================================================

function updateCount() {

  count.textContent =
    boxes.filter(box => box.checked).length;

}


boxes.forEach(box => {

  box.addEventListener(
    'change',
    updateCount
  );

});


// =====================================================
// SEARCH SYMPTOMS
// =====================================================

document
  .getElementById('search')
  .addEventListener(
    'input',
    event => {

      const query =
        event.target.value
          .toLowerCase()
          .trim();


      document
        .querySelectorAll('.symptom')
        .forEach(element => {

          const name =
            element.dataset.name
              .toLowerCase();


          element.style.display =
            name.includes(query)
              ? ''
              : 'none';

        });

    }
  );


// =====================================================
// CLEAR BUTTON
// =====================================================

document
  .getElementById('clearBtn')
  .addEventListener(
    'click',
    () => {

      boxes.forEach(
        box => box.checked = false
      );

      updateCount();

      result.classList.add('hidden');

      disease.textContent = '—';

      confidenceBar.style.width = '0%';

      confidenceText.textContent = '';

      topPredictions.innerHTML = '';

      message.textContent = '';

    }
  );


// =====================================================
// PREDICTION
// =====================================================

document
  .getElementById('predictBtn')
  .addEventListener(
    'click',
    async () => {

      const symptoms =
        boxes
          .filter(box => box.checked)
          .map(box => box.value);


      if (!symptoms.length) {

        alert(
          'Please select at least one symptom.'
        );

        return;

      }


      const button =
        document.getElementById(
          'predictBtn'
        );


      button.disabled = true;

      button.textContent =
        'Analyzing...';


      try {

        const response =
          await fetch(
            '/predict',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body: JSON.stringify({
                symptoms: symptoms
              })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.error ||
            'Prediction failed.'
          );

        }


        // Main prediction

        disease.textContent =
          data.disease
            .replaceAll('_', ' ');


        // Confidence

        confidenceBar.style.width =
          `${data.confidence}%`;


        confidenceText.textContent =
          `Model confidence: ${data.confidence}%`;


        // Disclaimer

        message.textContent =
          data.message;


        // Top predictions

        topPredictions.innerHTML =
          data.top_predictions
            .map(item => {

              return `
                <div class="top-item">

                  <span>
                    ${item.disease
                      .replaceAll('_', ' ')}
                  </span>

                  <strong>
                    ${item.confidence}%
                  </strong>

                </div>
              `;

            })
            .join('');


        // Show result

        result.classList.remove(
          'hidden'
        );


        result.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });


      } catch (error) {

        console.error(
          'Prediction Error:',
          error
        );


        alert(
          error.message ||
          'Prediction failed.'
        );

      } finally {

        button.disabled = false;

        button.textContent =
          'Predict Possible Disease';

      }

    }
  );


// =====================================================
// AUTHENTICATION ELEMENTS
// =====================================================

const authModal =
  document.getElementById(
    'authModal'
  );

const authTitle =
  document.getElementById(
    'authTitle'
  );

const authEmail =
  document.getElementById(
    'authEmail'
  );

const authPassword =
  document.getElementById(
    'authPassword'
  );

const authSubmit =
  document.getElementById(
    'authSubmit'
  );

const authMessage =
  document.getElementById(
    'authMessage'
  );

const loginBtn =
  document.getElementById(
    'loginBtn'
  );

const signupBtn =
  document.getElementById(
    'signupBtn'
  );

const logoutBtn =
  document.getElementById(
    'logoutBtn'
  );

const closeModal =
  document.getElementById(
    'closeModal'
  );


// =====================================================
// AUTH MODE
// =====================================================

let authMode = 'login';


// =====================================================
// OPEN LOGIN
// =====================================================

loginBtn.addEventListener(
  'click',
  () => {

    authMode = 'login';

    authTitle.textContent =
      'Login';

    authSubmit.textContent =
      'Login';

    authMessage.textContent =
      '';

    authEmail.value =
      '';

    authPassword.value =
      '';

    authModal.classList.remove(
      'hidden'
    );

  }
);


// =====================================================
// OPEN SIGN UP
// =====================================================

signupBtn.addEventListener(
  'click',
  () => {

    authMode = 'signup';

    authTitle.textContent =
      'Create Account';

    authSubmit.textContent =
      'Sign Up';

    authMessage.textContent =
      '';

    authEmail.value =
      '';

    authPassword.value =
      '';

    authModal.classList.remove(
      'hidden'
    );

  }
);


// =====================================================
// CLOSE MODAL
// =====================================================

closeModal.addEventListener(
  'click',
  () => {

    authModal.classList.add(
      'hidden'
    );

  }
);


// =====================================================
// LOGIN / SIGN UP
// =====================================================

authSubmit.addEventListener(
  'click',
  async () => {

    const email =
      authEmail.value.trim();

    const password =
      authPassword.value;


    // Validate email

    if (!email) {

      authMessage.textContent =
        'Please enter your email.';

      return;

    }


    // Validate password

    if (!password) {

      authMessage.textContent =
        'Please enter your password.';

      return;

    }


    if (password.length < 6) {

      authMessage.textContent =
        'Password must be at least 6 characters.';

      return;

    }


    authSubmit.disabled = true;


    authSubmit.textContent =
      authMode === 'signup'
        ? 'Creating account...'
        : 'Logging in...';


    try {

      // ===============================================
      // SIGN UP
      // ===============================================

      if (authMode === 'signup') {

        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


        authMessage.textContent =
          'Account created successfully!';


        setTimeout(
          () => {

            authModal.classList.add(
              'hidden'
            );

          },
          1000
        );

      }


      // ===============================================
      // LOGIN
      // ===============================================

      else {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        authModal.classList.add(
          'hidden'
        );

      }


    } catch (error) {

      console.error(
        'Firebase Authentication Error:',
        error
      );


      // Friendly error messages

      if (
        error.code ===
        'auth/email-already-in-use'
      ) {

        authMessage.textContent =
          'This email is already registered.';

      }

      else if (
        error.code ===
        'auth/invalid-email'
      ) {

        authMessage.textContent =
          'Please enter a valid email address.';

      }

      else if (
        error.code ===
        'auth/weak-password'
      ) {

        authMessage.textContent =
          'Password must be at least 6 characters.';

      }

      else if (
        error.code ===
        'auth/invalid-credential'
      ) {

        authMessage.textContent =
          'Invalid email or password.';

      }

      else if (
        error.code ===
        'auth/user-not-found'
      ) {

        authMessage.textContent =
          'No account found with this email.';

      }

      else if (
        error.code ===
        'auth/wrong-password'
      ) {

        authMessage.textContent =
          'Incorrect password.';

      }

      else {

        authMessage.textContent =
          error.message ||
          'Authentication failed.';

      }

    } finally {

      authSubmit.disabled = false;

      authSubmit.textContent =
        authMode === 'signup'
          ? 'Sign Up'
          : 'Login';

    }

  }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
  'click',
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(
        'Logout Error:',
        error
      );

      alert(
        'Unable to logout.'
      );

    }

  }
);


// =====================================================
// AUTHENTICATION STATE
// =====================================================

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      console.log(
        'Logged in:',
        user.email
      );


      loginBtn.classList.add(
        'hidden'
      );


      signupBtn.classList.add(
        'hidden'
      );


      logoutBtn.classList.remove(
        'hidden'
      );

    }

    else {

      console.log(
        'No user is logged in.'
      );


      loginBtn.classList.remove(
        'hidden'
      );


      signupBtn.classList.remove(
        'hidden'
      );


      logoutBtn.classList.add(
        'hidden'
      );

    }

  }
);


// =====================================================
// INITIALIZE
// =====================================================

updateCount();

console.log(
  'QuantumDiagnose loaded successfully.'
);
