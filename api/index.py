from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timezone
import os
import requests

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

# ============================================================
# OPTIONAL QISKIT
# ============================================================

QISKIT_AVAILABLE = False

try:
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector

    QISKIT_AVAILABLE = True

except Exception as error:
    print("Qiskit unavailable:", error)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

TRAIN_PATH = BASE_DIR / "data" / "Training.csv"
TEST_PATH = BASE_DIR / "data" / "Testing.csv"

TEMPLATE_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"


# ============================================================
# FLASK
# ============================================================

app = Flask(
    __name__,
    template_folder=str(TEMPLATE_DIR),
    static_folder=str(STATIC_DIR),
    static_url_path="/static"
)


# ============================================================
# LOAD DATA
# ============================================================

try:

    training_df = pd.read_csv(TRAIN_PATH)
    testing_df = pd.read_csv(TEST_PATH)

except Exception as error:

    raise RuntimeError(
        f"Could not load datasets: {error}"
    )


# Remove accidental index columns

training_df = training_df.loc[
    :,
    ~training_df.columns.astype(str).str.startswith("Unnamed")
]

testing_df = testing_df.loc[
    :,
    ~testing_df.columns.astype(str).str.startswith("Unnamed")
]


# Clean column names

training_df.columns = (
    training_df.columns
    .astype(str)
    .str.strip()
)

testing_df.columns = (
    testing_df.columns
    .astype(str)
    .str.strip()
)


# ============================================================
# TARGET COLUMN
# ============================================================

TARGET_COLUMN = None

possible_targets = [
    "prognosis",
    "Prognosis",
    "disease",
    "Disease",
    "diagnosis",
    "Diagnosis",
    "target",
    "Target",
    "label",
    "Label"
]

for column in possible_targets:

    if column in training_df.columns:

        TARGET_COLUMN = column
        break


if TARGET_COLUMN is None:

    TARGET_COLUMN = training_df.columns[-1]


# ============================================================
# SYMPTOM COLUMNS
# ============================================================

symptom_columns = [
    column
    for column in training_df.columns
    if column != TARGET_COLUMN
]


# ============================================================
# MAKE TRAINING / TESTING COLUMNS MATCH
# ============================================================

missing_in_test = [
    column
    for column in symptom_columns
    if column not in testing_df.columns
]

if missing_in_test:

    raise RuntimeError(
        "Testing.csv is missing symptom columns: "
        + ", ".join(missing_in_test[:20])
    )


# ============================================================
# CLEAN SYMPTOMS
# ============================================================

for column in symptom_columns:

    training_df[column] = pd.to_numeric(
        training_df[column],
        errors="coerce"
    ).fillna(0)

    testing_df[column] = pd.to_numeric(
        testing_df[column],
        errors="coerce"
    ).fillna(0)


# ============================================================
# TRAINING DATA
# ============================================================

X_train = training_df[symptom_columns]

y_train = (
    training_df[TARGET_COLUMN]
    .astype(str)
    .str.strip()
)


# ============================================================
# TESTING DATA
# ============================================================

X_test = testing_df[symptom_columns]

y_test = (
    testing_df[TARGET_COLUMN]
    .astype(str)
    .str.strip()
)


# ============================================================
# RANDOM FOREST
# ============================================================

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
    max_features="sqrt",
    n_jobs=1
)

model.fit(
    X_train,
    y_train
)


# ============================================================
# MODEL PERFORMANCE
# ============================================================

test_predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    test_predictions
)

precision = precision_score(
    y_test,
    test_predictions,
    average="weighted",
    zero_division=0
)

recall = recall_score(
    y_test,
    test_predictions,
    average="weighted",
    zero_division=0
)

f1 = f1_score(
    y_test,
    test_predictions,
    average="weighted",
    zero_division=0
)

labels = sorted(
    list(
        set(y_test) |
        set(test_predictions)
    )
)

cm = confusion_matrix(
    y_test,
    test_predictions,
    labels=labels
)


# ============================================================
# SYMPTOM NORMALIZATION
# ============================================================

def normalize_symptom(value):

    return (
        str(value)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )


symptom_map = {
    normalize_symptom(column): column
    for column in symptom_columns
}


# ============================================================
# SPECIALTY MAPPING
# ============================================================

SPECIALTY_KEYWORDS = {

    "skin": "Dermatologist",
    "rash": "Dermatologist",
    "acne": "Dermatologist",
    "itch": "Dermatologist",

    "heart": "Cardiologist",
    "cardiac": "Cardiologist",

    "lung": "Pulmonologist",
    "respiratory": "Pulmonologist",
    "bronch": "Pulmonologist",
    "pneumonia": "Pulmonologist",

    "brain": "Neurologist",
    "neuro": "Neurologist",
    "migraine": "Neurologist",

    "joint": "Rheumatologist",
    "arthritis": "Rheumatologist",
    "rheumatoid": "Rheumatologist",

    "stomach": "Gastroenterologist",
    "gastric": "Gastroenterologist",
    "digest": "Gastroenterologist",
    "intestinal": "Gastroenterologist",

    "kidney": "Nephrologist",
    "renal": "Nephrologist",

    "urinary": "Urologist",
    "urine": "Urologist",

    "eye": "Ophthalmologist",
    "vision": "Ophthalmologist",

    "ear": "ENT Specialist",
    "nose": "ENT Specialist",
    "throat": "ENT Specialist",

    "bone": "Orthopedic Specialist",
    "fracture": "Orthopedic Specialist",

    "general": "General Physician"
}


def recommend_specialty(disease):

    disease_text = str(disease).lower()

    for keyword, specialty in SPECIALTY_KEYWORDS.items():

        if keyword in disease_text:

            return specialty

    return "General Physician"


# ============================================================
# DOCTORS
# ============================================================

DOCTORS = [

    {
        "name": "Dr. Ananya Sharma",
        "specialization": "General Physician",
        "hospital": "CityCare Medical Center",
        "location": "Vijayawada",
        "experience": "8 years"
    },

    {
        "name": "Dr. Rahul Mehta",
        "specialization": "Pulmonologist",
        "hospital": "Apollo Medical Center",
        "location": "Vijayawada",
        "experience": "12 years"
    },

    {
        "name": "Dr. Priya Reddy",
        "specialization": "Dermatologist",
        "hospital": "SkinCare Hospital",
        "location": "Vijayawada",
        "experience": "9 years"
    },

    {
        "name": "Dr. Arjun Rao",
        "specialization": "Neurologist",
        "hospital": "NeuroCare Hospital",
        "location": "Vijayawada",
        "experience": "11 years"
    },

    {
        "name": "Dr. Sneha Kapoor",
        "specialization": "Cardiologist",
        "hospital": "HeartCare Institute",
        "location": "Vijayawada",
        "experience": "14 years"
    },

    {
        "name": "Dr. Karthik Iyer",
        "specialization": "Gastroenterologist",
        "hospital": "Digestive Health Center",
        "location": "Vijayawada",
        "experience": "10 years"
    },

    {
        "name": "Dr. Meera Nair",
        "specialization": "Rheumatologist",
        "hospital": "JointCare Hospital",
        "location": "Vijayawada",
        "experience": "7 years"
    },

    {
        "name": "Dr. Vikram Singh",
        "specialization": "ENT Specialist",
        "hospital": "Vision & ENT Center",
        "location": "Vijayawada",
        "experience": "9 years"
    },

    {
        "name": "Dr. Neha Iyer",
        "specialization": "Ophthalmologist",
        "hospital": "VisionCare Hospital",
        "location": "Vijayawada",
        "experience": "10 years"
    },

    {
        "name": "Dr. Rohan Kumar",
        "specialization": "Orthopedic Specialist",
        "hospital": "BoneCare Hospital",
        "location": "Vijayawada",
        "experience": "13 years"
    },

    {
        "name": "Dr. Aisha Khan",
        "specialization": "Nephrologist",
        "hospital": "KidneyCare Center",
        "location": "Vijayawada",
        "experience": "9 years"
    },

    {
        "name": "Dr. Sameer Rao",
        "specialization": "Urologist",
        "hospital": "UroCare Hospital",
        "location": "Vijayawada",
        "experience": "11 years"
    }
]


# ============================================================
# QUANTUM EXPERIMENT
# ============================================================

def quantum_experimental_score(
    input_vector,
    rf_confidence
):

    if not QISKIT_AVAILABLE:

        return {
            "available": False,
            "score": round(
                float(rf_confidence),
                2
            ),
            "qubits": 0,
            "circuit_depth": 0,
            "message":
                "Qiskit is not available on the server."
        }


    selected_indices = [
        index
        for index, value in enumerate(input_vector)
        if value == 1
    ]


    number_of_qubits = min(
        max(len(selected_indices), 1),
        4
    )


    circuit = QuantumCircuit(
        number_of_qubits
    )


    # Encode symptom information

    for qubit in range(number_of_qubits):

        circuit.h(qubit)

        if qubit < len(selected_indices):

            position = selected_indices[qubit]

            angle = (
                np.pi *
                (
                    (position + 1)
                    /
                    max(len(input_vector), 1)
                )
            )

            circuit.ry(
                angle,
                qubit
            )


    # Entanglement

    for qubit in range(
        number_of_qubits - 1
    ):

        circuit.cx(
            qubit,
            qubit + 1
        )


    # Statevector

    state = Statevector.from_instruction(
        circuit
    )

    probabilities = state.probabilities()

    quantum_signal = (
        float(
            np.max(probabilities)
        )
        * 100
    )


    # Calibrated experimental score

    rf_confidence = float(
        np.clip(
            rf_confidence,
            0,
            100
        )
    )

    quantum_signal = float(
        np.clip(
            quantum_signal,
            0,
            100
        )
    )


    score = (
        0.80 * rf_confidence
        +
        0.20 * quantum_signal
    )


    difference = (
        score -
        rf_confidence
    )


    if difference > 8:

        score = (
            rf_confidence +
            8
        )


    if difference < -8:

        score = (
            rf_confidence -
            8
        )


    score = float(
        np.clip(
            score,
            0,
            100
        )
    )


    return {

        "available": True,

        "score":
            round(
                score,
                2
            ),

        "qubits":
            number_of_qubits,

        "circuit_depth":
            circuit.depth(),

        "quantum_signal":
            round(
                quantum_signal,
                2
            ),

        "message":
            (
                "Experimental Qiskit score generated "
                "from the encoded symptom state and "
                "calibrated for comparison with the "
                "Random Forest result."
            )
    }


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return render_template(
        "index.html",
        symptoms=symptom_columns
    )


# ============================================================
# HEALTH
# ============================================================

@app.route("/health")
def health():

    return jsonify({

        "status": "ok",

        "random_forest": True,

        "qiskit":
            QISKIT_AVAILABLE,

        "target_column":
            TARGET_COLUMN,

        "training_rows":
            len(training_df),

        "testing_rows":
            len(testing_df),

        "symptoms":
            len(symptom_columns),

        "diseases":
            len(model.classes_)

    })


# ============================================================
# PERFORMANCE
# ============================================================

@app.route("/performance")
def performance():

    return jsonify({

        "accuracy":
            round(
                accuracy * 100,
                2
            ),

        "precision":
            round(
                precision * 100,
                2
            ),

        "recall":
            round(
                recall * 100,
                2
            ),

        "f1":
            round(
                f1 * 100,
                2
            ),

        "training_samples":
            len(training_df),

        "testing_samples":
            len(testing_df),

        "number_of_symptoms":
            len(symptom_columns),

        "number_of_diseases":
            len(model.classes_),

        "model":
            "Random Forest",

        "quantum_engine":
            "Qiskit"
            if QISKIT_AVAILABLE
            else "Unavailable"

    })


# ============================================================
# SYMPTOMS
# ============================================================

@app.route("/symptoms")
def symptoms():

    return jsonify({

        "symptoms":
            symptom_columns

    })


# ============================================================
# DOCTORS
# ============================================================

@app.route("/doctors")
def doctors():

    specialty = request.args.get(
        "specialty",
        ""
    )


    if specialty:

        filtered = [

            doctor

            for doctor in DOCTORS

            if doctor[
                "specialization"
            ].lower()
            ==
            specialty.lower()

        ]

    else:

        filtered = DOCTORS


    return jsonify({

        "doctors":
            filtered

    })


# ============================================================
# PREDICTION
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        # ----------------------------------------------------
        # PREDICTION TIMESTAMP
        # ----------------------------------------------------

        prediction_datetime = (
            datetime.now(
                timezone.utc
            )
            .isoformat()
        )


        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({

                "success": False,

                "error":
                    "Invalid JSON request."

            }), 400


        selected_symptoms = data.get(
            "symptoms",
            []
        )


        if not isinstance(
            selected_symptoms,
            list
        ):

            return jsonify({

                "success": False,

                "error":
                    "Symptoms must be provided as a list."

            }), 400


        if len(selected_symptoms) == 0:

            return jsonify({

                "success": False,

                "error":
                    "Please select at least one symptom."

            }), 400


        # ----------------------------------------------------
        # BUILD INPUT VECTOR
        # ----------------------------------------------------

        input_data = {

            symptom: 0

            for symptom in symptom_columns

        }


        matched_symptoms = []


        for symptom in selected_symptoms:

            normalized = normalize_symptom(
                symptom
            )


            if normalized in symptom_map:

                actual_column = (
                    symptom_map[
                        normalized
                    ]
                )


                input_data[
                    actual_column
                ] = 1


                matched_symptoms.append(
                    actual_column
                )


        if not matched_symptoms:

            return jsonify({

                "success": False,

                "error":
                    "Selected symptoms were not found in the dataset."

            }), 400


        input_df = pd.DataFrame(
            [input_data],
            columns=symptom_columns
        )


        # ----------------------------------------------------
        # RANDOM FOREST
        # ----------------------------------------------------

        prediction = model.predict(
            input_df
        )[0]


        probabilities = (
            model.predict_proba(
                input_df
            )[0]
        )


        classes = model.classes_


        results = sorted(

            zip(
                classes,
                probabilities
            ),

            key=lambda item:
                item[1],

            reverse=True

        )


        top_predictions = [

            {

                "disease":
                    str(disease),

                "confidence":
                    round(
                        float(probability)
                        * 100,
                        2
                    )

            }

            for disease, probability
            in results[:5]

        ]


        rf_confidence = (

            top_predictions[0][
                "confidence"
            ]

            if top_predictions

            else 0

        )


        # ----------------------------------------------------
        # QISKIT
        # ----------------------------------------------------

        input_vector = [

            int(
                input_data[column]
            )

            for column
            in symptom_columns

        ]


        quantum_result = (
            quantum_experimental_score(
                input_vector,
                rf_confidence
            )
        )


        quantum_disease = str(
            prediction
        )


        quantum_score = (
            quantum_result["score"]
        )


        # ----------------------------------------------------
        # MODEL AGREEMENT
        # ----------------------------------------------------

        difference = abs(

            rf_confidence -
            quantum_score

        )


        if difference <= 5:

            agreement = "High"

        elif difference <= 10:

            agreement = "Moderate"

        else:

            agreement = "Low"


        # ----------------------------------------------------
        # DOCTOR
        # ----------------------------------------------------

        specialty = recommend_specialty(
            prediction
        )


        recommended_doctors = [

            doctor

            for doctor in DOCTORS

            if doctor[
                "specialization"
            ].lower()
            ==
            specialty.lower()

        ]


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success":
                True,

            # Timestamp
            "prediction_datetime":
                prediction_datetime,

            "prediction_date":
                prediction_datetime,

            # Random Forest
            "disease":
                str(prediction),

            "rf_disease":
                str(prediction),

            "rf_confidence":
                rf_confidence,

            "confidence":
                rf_confidence,

            "top_predictions":
                top_predictions,

            # Qiskit
            "qiskit_disease":
                quantum_disease,

            "qiskit_score":
                quantum_score,

            "quantum_score":
                quantum_score,

            "qiskit_available":
                quantum_result[
                    "available"
                ],

            "qiskit_qubits":
                quantum_result[
                    "qubits"
                ],

            "qiskit_depth":
                quantum_result[
                    "circuit_depth"
                ],

            "quantum_signal":
                quantum_result.get(
                    "quantum_signal",
                    0
                ),

            # Comparison
            "score_difference":
                round(
                    difference,
                    2
                ),

            "model_agreement":
                agreement,

            # Symptoms
            "selected_symptoms":
                matched_symptoms,

            # Doctors
            "specialty":
                specialty,

            "doctors":
                recommended_doctors,

            # Messages
            "message":
                (
                    "Educational symptom-analysis "
                    "result. This is not a medical diagnosis."
                ),

            "quantum_message":
                (
                    "The Qiskit value is an experimental "
                    "quantum-computing score for this project. "
                    "It is not a clinically validated probability."
                )

        })


    except Exception as error:

        print(
            "Prediction error:",
            repr(error)
        )


        return jsonify({

            "success":
                False,

            "error":
                str(error)

        }), 500


# ============================================================
# EMAIL REPORT (BREVO)
# ============================================================
#
# Sends the prediction report as a branded HTML email using
# Brevo's transactional email API (https://www.brevo.com).
# Brevo's free tier includes 300 emails/day, and mail is sent
# from Brevo's own authenticated (SPF/DKIM) infrastructure,
# which is why it lands in the inbox instead of spam far more
# reliably than sending raw SMTP from a personal address.
#
# Required environment variables (set these in Vercel ->
# Project -> Settings -> Environment Variables):
#
#   BREVO_API_KEY      - your Brevo API key (free account)
#   BREVO_SENDER_EMAIL - an email address you verified as a
#                         sender inside Brevo
#   BREVO_SENDER_NAME  - optional, defaults to "QuantumDiagnose"
#
# ============================================================

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL", "")
BREVO_SENDER_NAME = os.environ.get("BREVO_SENDER_NAME", "QuantumDiagnose")


def build_report_email_html(payload):

    patient = payload.get("patient") or {}

    disease = str(payload.get("disease") or "—").replace("_", " ").title()

    rf_confidence = float(payload.get("confidence") or payload.get("rf_confidence") or 0)

    quantum_score = float(payload.get("quantum_score") or payload.get("qiskit_score") or 0)

    quantum_signal = float(payload.get("quantum_signal") or 0)

    specialty = payload.get("specialty") or "General Physician"

    doctors = payload.get("doctors") or []

    top_predictions = payload.get("top_predictions") or []

    symptoms_list = payload.get("selected_symptoms") or []

    prediction_time = payload.get("prediction_time") or datetime.now(timezone.utc).isoformat()

    symptoms_html = ", ".join(
        s.replace("_", " ").title() for s in symptoms_list
    ) or "Not recorded"

    top_rows = "".join(
        f"""
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e1e7f0;color:#182238;">
                {str(item.get('disease','')).replace('_',' ').title()}
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #e1e7f0;text-align:right;color:#315bea;font-weight:700;">
                {float(item.get('confidence',0)):.2f}%
            </td>
        </tr>
        """
        for item in top_predictions[:3]
    )

    doctor_html = ""

    if doctors:

        doctor = doctors[0]

        doctor_html = f"""
        <tr>
            <td style="padding-top:14px;color:#68748a;font-size:13px;">
                Recommended Doctor
            </td>
        </tr>
        <tr>
            <td style="padding:4px 0 0;color:#182238;font-weight:700;">
                {doctor.get('name','')} &middot; {doctor.get('specialization','')}
            </td>
        </tr>
        <tr>
            <td style="padding:2px 0 0;color:#68748a;font-size:13px;">
                {doctor.get('hospital','')}, {doctor.get('location','')}
            </td>
        </tr>
        """

    html = f"""
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:28px 12px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e1e7f0;">

        <div style="background:linear-gradient(135deg,#315bea,#4d70ef);padding:22px 28px;">
          <div style="color:#ffffff;font-size:20px;font-weight:800;">QuantumDiagnose</div>
          <div style="color:#dce6ff;font-size:12px;margin-top:2px;">AI-Assisted Symptom Analysis Report</div>
        </div>

        <div style="padding:26px 28px;">

          <p style="margin:0 0 4px;color:#68748a;font-size:12px;">Patient</p>
          <p style="margin:0 0 16px;color:#182238;font-weight:700;font-size:15px;">
            {patient.get('name','—')} &middot; {patient.get('gender','—')} &middot; Age {patient.get('age','—')}
          </p>

          <p style="margin:0 0 4px;color:#68748a;font-size:12px;">Selected Symptoms</p>
          <p style="margin:0 0 18px;color:#182238;font-size:13px;line-height:1.6;">{symptoms_html}</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border-radius:12px;padding:16px;margin-bottom:18px;">
            <tr>
              <td style="padding:6px 12px;">
                <p style="margin:0;color:#68748a;font-size:12px;">Predicted Disease (Random Forest)</p>
                <p style="margin:4px 0 0;color:#182238;font-size:19px;font-weight:800;">{disease}</p>
                <p style="margin:2px 0 0;color:#315bea;font-size:13px;font-weight:700;">{rf_confidence:.2f}% confidence</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ff;border-radius:12px;padding:16px;margin-bottom:18px;">
            <tr>
              <td style="padding:6px 12px;">
                <p style="margin:0;color:#68748a;font-size:12px;">Qiskit Experimental Score</p>
                <p style="margin:4px 0 0;color:#182238;font-size:19px;font-weight:800;">{quantum_score:.2f}%</p>
                <p style="margin:2px 0 0;color:#6548bd;font-size:12px;">Quantum signal: {quantum_signal:.2f}% &middot; Educational component, not a clinical probability</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
            {top_rows}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            {doctor_html}
          </table>

          <div style="margin-top:22px;padding:14px 16px;background:#fff8e8;border:1px solid #f4e2b5;border-radius:10px;">
            <p style="margin:0;color:#755a1d;font-size:12px;line-height:1.6;">
              <strong>Important:</strong> QuantumDiagnose is an educational and research demonstration.
              This report is not a medical diagnosis or a substitute for professional medical advice.
              Please consult a licensed physician for any health concerns.
            </p>
          </div>

          <p style="margin:18px 0 0;color:#a3adc2;font-size:11px;">
            Generated {prediction_time} &middot; QuantumDiagnose Educational Project
          </p>

        </div>
      </div>
    </div>
    """

    return html


@app.route(
    "/send-report",
    methods=["POST"]
)
def send_report():

    if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:

        return jsonify({
            "success": False,
            "error": "Email sending is not configured on the server yet."
        }), 500

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "error": "Invalid JSON request."
        }), 400

    to_email = (data.get("to_email") or "").strip()

    if not to_email or "@" not in to_email:

        return jsonify({
            "success": False,
            "error": "Please provide a valid email address."
        }), 400

    disease_label = str(data.get("disease") or "Report").replace("_", " ").title()

    html_content = build_report_email_html(data)

    payload = {
        "sender": {
            "name": BREVO_SENDER_NAME,
            "email": BREVO_SENDER_EMAIL
        },
        "to": [
            {"email": to_email}
        ],
        "subject": f"Your QuantumDiagnose Report — {disease_label}",
        "htmlContent": html_content
    }

    try:

        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers={
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=15
        )

        if response.status_code >= 300:

            print("Brevo error:", response.status_code, response.text)

            return jsonify({
                "success": False,
                "error": "The email provider rejected the request."
            }), 502

        return jsonify({
            "success": True,
            "message": f"Report sent to {to_email}."
        })

    except Exception as error:

        print("Send report error:", repr(error))

        return jsonify({
            "success": False,
            "error": "Could not send the email right now. Please try again."
        }), 500


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True

    )
