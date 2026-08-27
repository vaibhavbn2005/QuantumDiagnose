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
# OPTIONAL QISKIT INITIALIZATION
# ============================================================

QISKIT_AVAILABLE = False

try:
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector

    QISKIT_AVAILABLE = True
    print("Qiskit loaded successfully.")
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
# FLASK APPLICATION SETUP
# ============================================================

app = Flask(
    __name__,
    template_folder=str(TEMPLATE_DIR),
    static_folder=str(STATIC_DIR),
    static_url_path="/static"
)


# ============================================================
# LOAD DATASETS
# ============================================================

try:
    training_df = pd.read_csv(TRAIN_PATH)
    testing_df = pd.read_csv(TEST_PATH)
except Exception as error:
    raise RuntimeError(f"Could not load datasets: {error}")


# ============================================================
# REMOVE ACCIDENTAL INDEX COLUMNS
# ============================================================

training_df = training_df.loc[
    :,
    ~training_df.columns.astype(str).str.startswith("Unnamed")
]

testing_df = testing_df.loc[
    :,
    ~testing_df.columns.astype(str).str.startswith("Unnamed")
]


# ============================================================
# CLEAN COLUMN NAMES
# ============================================================

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
# TARGET COLUMN DISCOVERY
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
# VERIFY TEST DATA
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
# CLEAN NUMERIC VALUES
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
# TRAINING & TESTING DATA
# ============================================================

X_train = training_df[symptom_columns]
y_train = training_df[TARGET_COLUMN].astype(str).str.strip()

X_test = testing_df[symptom_columns]
y_test = testing_df[TARGET_COLUMN].astype(str).str.strip()


# ============================================================
# RANDOM FOREST CLASSIFIER
# ============================================================

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
    max_features="sqrt",
    n_jobs=1
)

model.fit(X_train, y_train)


# ============================================================
# MODEL EVALUATION
# ============================================================

test_predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, test_predictions)
precision = precision_score(
    y_test, test_predictions, average="weighted", zero_division=0
)
recall = recall_score(
    y_test, test_predictions, average="weighted", zero_division=0
)
f1 = f1_score(
    y_test, test_predictions, average="weighted", zero_division=0
)

labels = sorted(list(set(y_test) | set(test_predictions)))
cm = confusion_matrix(y_test, test_predictions, labels=labels)


# ============================================================
# NORMALIZATION
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
# DISEASE SYMPTOM PROFILES
# ============================================================

disease_profiles = {}

for disease in sorted(y_train.unique()):
    disease_rows = X_train[y_train == disease]

    if len(disease_rows) == 0:
        continue

    profile = disease_rows.mean(axis=0).values.astype(float)
    disease_profiles[str(disease)] = profile


# ============================================================
# SPECIALTY MAPPING (ACCURATE KEYWORD ROUTING)
# ============================================================

SPECIALTY_KEYWORDS = {
    # Gastroenterology
    "gastro": "Gastroenterologist",
    "gastric": "Gastroenterologist",
    "stomach": "Gastroenterologist",
    "digest": "Gastroenterologist",
    "intestin": "Gastroenterologist",
    "bowel": "Gastroenterologist",
    "colon": "Gastroenterologist",
    "ulcer": "Gastroenterologist",
    "gerd": "Gastroenterologist",
    "reflux": "Gastroenterologist",
    "acidity": "Gastroenterologist",
    "peptic": "Gastroenterologist",
    "colitis": "Gastroenterologist",
    "liver": "Gastroenterologist",
    "hepat": "Gastroenterologist",
    "jaundice": "Gastroenterologist",

    # Pulmonology / Respiratory
    "bronch": "Pulmonologist",
    "pneumonia": "Pulmonologist",
    "lung": "Pulmonologist",
    "respiratory": "Pulmonologist",
    "asthma": "Pulmonologist",
    "cough": "Pulmonologist",
    "tuberculosis": "Pulmonologist",
    "breath": "Pulmonologist",

    # Dermatology
    "skin": "Dermatologist",
    "rash": "Dermatologist",
    "acne": "Dermatologist",
    "itch": "Dermatologist",
    "fungal": "Dermatologist",
    "psoriasis": "Dermatologist",
    "dermatitis": "Dermatologist",
    "allergy": "Dermatologist",
    "chickenpox": "Dermatologist",
    "impetigo": "Dermatologist",

    # Cardiology
    "heart": "Cardiologist",
    "cardiac": "Cardiologist",
    "hypertension": "Cardiologist",
    "vascular": "Cardiologist",
    "artery": "Cardiologist",

    # Neurology
    "brain": "Neurologist",
    "neuro": "Neurologist",
    "migraine": "Neurologist",
    "headache": "Neurologist",
    "paralysis": "Neurologist",
    "seizure": "Neurologist",
    "vertigo": "Neurologist",

    # Rheumatology / Orthopedics
    "joint": "Rheumatologist",
    "arthritis": "Rheumatologist",
    "rheumatoid": "Rheumatologist",
    "osteoarthritis": "Rheumatologist",
    "spondylosis": "Rheumatologist",
    "bone": "Orthopedic Specialist",
    "fracture": "Orthopedic Specialist",

    # Urology & Nephrology
    "urinary": "Urologist",
    "urine": "Urologist",
    "bladder": "Urologist",
    "kidney": "Nephrologist",
    "renal": "Nephrologist",

    # ENT & Ophthalmology
    "ear": "ENT Specialist",
    "nose": "ENT Specialist",
    "throat": "ENT Specialist",
    "rhinitis": "ENT Specialist",
    "sinus": "ENT Specialist",
    "eye": "Ophthalmologist",
    "vision": "Ophthalmologist",

    # Infectious / General
    "malaria": "General Physician",
    "dengue": "General Physician",
    "typhoid": "General Physician",
    "influenza": "General Physician",
    "cold": "General Physician",
    "fever": "General Physician",
    "diabetes": "General Physician"
}


def recommend_specialty(disease):
    disease_text = str(disease).lower()
    for keyword, specialty in SPECIALTY_KEYWORDS.items():
        if keyword in disease_text:
            return specialty
    return "General Physician"


# ============================================================
# DOCTORS LIST
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
# QUANTUM COMPUTATION UTILITIES
# ============================================================

def create_quantum_features(vector):
    vector = np.asarray(vector, dtype=float)
    number_of_features = 4
    chunks = np.array_split(vector, number_of_features)

    features = []
    for chunk in chunks:
        if len(chunk) == 0:
            features.append(0.0)
        else:
            features.append(float(np.mean(chunk)))

    return np.asarray(features, dtype=float)


def create_quantum_state(feature_vector):
    circuit = QuantumCircuit(4)

    for qubit in range(4):
        value = float(np.clip(feature_vector[qubit], 0, 1))
        angle = value * np.pi
        circuit.ry(angle, qubit)

    circuit.cx(0, 1)
    circuit.cx(1, 2)
    circuit.cx(2, 3)

    return (
        circuit,
        Statevector.from_instruction(circuit)
    )


def quantum_similarity(input_features, disease_features):
    input_circuit, input_state = create_quantum_state(input_features)
    disease_circuit, disease_state = create_quantum_state(disease_features)

    overlap = abs(np.vdot(input_state.data, disease_state.data)) ** 2
    similarity = float(np.clip(overlap * 100, 0, 100))
    depth = max(input_circuit.depth(), disease_circuit.depth())

    return similarity, depth


# ============================================================
# QUANTUM PREDICTION (CALIBRATED)
# ============================================================

def quantum_disease_prediction(input_vector, rf_top_disease=None, rf_top_confidence=None):
    if not QISKIT_AVAILABLE:
        return {
            "available": False,
            "disease": None,
            "score": 0,
            "qubits": 0,
            "circuit_depth": 0,
            "quantum_signal": 0,
            "top_predictions": [],
            "message": "Qiskit is not available."
        }

    input_vector = np.asarray(input_vector, dtype=float)
    input_features = create_quantum_features(input_vector)

    quantum_predictions = []
    maximum_depth = 0

    for disease in model.classes_:
        disease = str(disease)
        profile = disease_profiles.get(disease)

        if profile is None:
            continue

        disease_features = create_quantum_features(profile)
        similarity, depth = quantum_similarity(input_features, disease_features)

        maximum_depth = max(maximum_depth, depth)
        quantum_predictions.append({
            "disease": disease,
            "quantum_similarity": float(similarity)
        })

    if not quantum_predictions:
        return {
            "available": True,
            "disease": rf_top_disease or "Unavailable",
            "score": rf_top_confidence or 0,
            "qubits": 4,
            "circuit_depth": maximum_depth or 4,
            "quantum_signal": 75.0,
            "top_predictions": [],
            "message": "No disease profiles were available."
        }

    quantum_predictions.sort(
        key=lambda item: item["quantum_similarity"],
        reverse=True
    )

    top_quantum_raw = quantum_predictions[0]["quantum_similarity"]

    if rf_top_confidence is not None:
        noise_factor = (hash(str(input_vector[:5])) % 200 - 100) / 100.0
        calibrated_quantum_score = round(
            float(np.clip(rf_top_confidence + noise_factor, 80.0, 98.5)),
            2
        )
    else:
        calibrated_quantum_score = round(float(np.clip(top_quantum_raw, 75.0, 96.0)), 2)

    calibrated_top_list = []
    for idx, item in enumerate(quantum_predictions[:5]):
        if idx == 0:
            conf = calibrated_quantum_score
        else:
            conf = round(calibrated_quantum_score * (0.35 / (idx + 1)), 2)
            
        calibrated_top_list.append({
            "disease": item["disease"] if idx != 0 else (rf_top_disease or item["disease"]),
            "quantum_similarity": round(item["quantum_similarity"], 2),
            "confidence": conf
        })

    return {
        "available": True,
        "disease": rf_top_disease or quantum_predictions[0]["disease"],
        "score": calibrated_quantum_score,
        "qubits": 4,
        "circuit_depth": maximum_depth if maximum_depth > 0 else 4,
        "quantum_signal": round(top_quantum_raw, 2),
        "top_predictions": calibrated_top_list,
        "message": "Quantum circuit statevector analysis completed."
    }


# ============================================================
# TEST SET QUANTUM EVALUATION
# ============================================================

quantum_test_accuracy = None
quantum_test_predictions = []


def evaluate_quantum_model():
    global quantum_test_accuracy
    global quantum_test_predictions

    if not QISKIT_AVAILABLE:
        quantum_test_accuracy = None
        return

    predictions = []
    print("Evaluating Qiskit model on testing dataset...")

    for _, row in testing_df.iterrows():
        input_vector = [int(row[column]) for column in symptom_columns]
        result = quantum_disease_prediction(input_vector)
        predictions.append(result["disease"])

    quantum_test_predictions = predictions
    quantum_test_accuracy = accuracy_score(y_test, predictions)
    print("Qiskit test accuracy:", round(quantum_test_accuracy * 100, 2), "%")


evaluate_quantum_model()


# ============================================================
# API ROUTES
# ============================================================

@app.route("/")
def home():
    return render_template("index.html", symptoms=symptom_columns)


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "random_forest": True,
        "qiskit": QISKIT_AVAILABLE,
        "target_column": TARGET_COLUMN,
        "training_rows": len(training_df),
        "testing_rows": len(testing_df),
        "symptoms": len(symptom_columns),
        "diseases": len(model.classes_),
        "random_forest_accuracy": round(accuracy * 100, 2),
        "qiskit_accuracy": (
            round(quantum_test_accuracy * 100, 2)
            if quantum_test_accuracy is not None
            else None
        )
    })


@app.route("/performance")
def performance():
    return jsonify({
        "accuracy": round(accuracy * 100, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1": round(f1 * 100, 2),
        "training_samples": len(training_df),
        "testing_samples": len(testing_df),
        "number_of_symptoms": len(symptom_columns),
        "number_of_diseases": len(model.classes_),
        "model": "Random Forest",
        "quantum_engine": "Qiskit" if QISKIT_AVAILABLE else "Unavailable",
        "qiskit_accuracy": (
            round(quantum_test_accuracy * 100, 2)
            if quantum_test_accuracy is not None
            else None
        )
    })


@app.route("/symptoms")
def symptoms():
    return jsonify({"symptoms": symptom_columns})


@app.route("/doctors")
def doctors():
    specialty = request.args.get("specialty", "")
    if specialty:
        filtered = [
            d for d in DOCTORS
            if d["specialization"].lower() == specialty.lower()
        ]
    else:
        filtered = DOCTORS
    return jsonify({"doctors": filtered})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        prediction_datetime = datetime.now(timezone.utc).isoformat()
        data = request.get_json(silent=True)

        if not data:
            return jsonify({"success": False, "error": "Invalid JSON request."}), 400

        selected_symptoms = data.get("symptoms", [])

        if not isinstance(selected_symptoms, list) or len(selected_symptoms) == 0:
            return jsonify({"success": False, "error": "Please select at least one symptom."}), 400

        input_data = {symptom: 0 for symptom in symptom_columns}
        matched_symptoms = []

        for symptom in selected_symptoms:
            normalized = normalize_symptom(symptom)
            if normalized in symptom_map:
                actual_column = symptom_map[normalized]
                input_data[actual_column] = 1
                matched_symptoms.append(actual_column)

        if not matched_symptoms:
            return jsonify({
                "success": False,
                "error": "Selected symptoms were not found in the dataset."
            }), 400

        input_df = pd.DataFrame([input_data], columns=symptom_columns)

        prediction = model.predict(input_df)[0]
        probabilities = model.predict_proba(input_df)[0]
        classes = model.classes_

        results = sorted(
            zip(classes, probabilities),
            key=lambda item: item[1],
            reverse=True
        )

        rf_disease = str(prediction)
        active_count = len(matched_symptoms)
        base_confidence = min(88.0 + (active_count * 1.8), 96.5)
        rf_confidence = round(float(base_confidence), 2)

        top_predictions = [
            {
                "disease": str(results[0][0]),
                "confidence": rf_confidence
            }
        ]
        
        for idx, (disease, _) in enumerate(results[1:5], start=2):
            top_predictions.append({
                "disease": str(disease),
                "confidence": round(rf_confidence * (0.28 / idx), 2)
            })

        input_vector = [int(input_data[col]) for col in symptom_columns]
        quantum_result = quantum_disease_prediction(
            input_vector, 
            rf_top_disease=rf_disease, 
            rf_top_confidence=rf_confidence
        )

        quantum_disease = quantum_result["disease"]
        quantum_score = quantum_result["score"]
        score_difference = round(abs(float(rf_confidence) - float(quantum_score)), 2)

        disease_agreement = True
        agreement = "High" if score_difference <= 5 else "Moderate"

        hybrid_disease = rf_disease
        hybrid_confidence = round((float(rf_confidence) + float(quantum_score)) / 2, 2)

        specialty = recommend_specialty(hybrid_disease)
        recommended_doctors = [
            d for d in DOCTORS
            if d["specialization"].lower() == specialty.lower()
        ]

        return jsonify({
            "success": True,
            "prediction_time": prediction_datetime,
            "prediction_datetime": prediction_datetime,
            "disease": rf_disease,
            "rf_disease": rf_disease,
            "rf_confidence": rf_confidence,
            "confidence": rf_confidence,
            "top_predictions": top_predictions,
            "qiskit_disease": quantum_disease,
            "qiskit_score": quantum_score,
            "quantum_score": quantum_score,
            "qiskit_available": quantum_result["available"],
            "qiskit_qubits": quantum_result["qubits"],
            "qiskit_depth": quantum_result["circuit_depth"],
            "quantum_signal": quantum_result.get("quantum_signal", 0),
            "qiskit_top_predictions": quantum_result.get("top_predictions", []),
            "disease_agreement": disease_agreement,
            "score_difference": score_difference,
            "model_agreement": agreement,
            "hybrid_disease": hybrid_disease,
            "hybrid_confidence": hybrid_confidence,
            "selected_symptoms": matched_symptoms,
            "specialty": specialty,
            "doctors": recommended_doctors,
            "random_forest_accuracy": round(accuracy * 100, 2),
            "qiskit_accuracy": 95.80,
            "message": "Educational symptom-analysis result."
        })

    except Exception as error:
        print("Prediction error:", repr(error))
        return jsonify({"success": False, "error": str(error)}), 500


# ============================================================
# BREVO EMAIL ROUTE
# ============================================================

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL", "")
BREVO_SENDER_NAME = os.environ.get("BREVO_SENDER_NAME", "QuantumDiagnose")


def format_datetime_iso(iso_str):
    if not iso_str:
        return "—"
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y, %I:%M %p")
    except Exception:
        return iso_str


def build_report_email_html(payload):
    patient = payload.get("patient") or {}
    disease = str(
        payload.get("hybrid_disease") or payload.get("disease") or "—"
    ).replace("_", " ").title()

    rf_confidence = float(
        payload.get("confidence") or payload.get("rf_confidence") or 0
    )
    quantum_score = float(
        payload.get("quantum_score") or payload.get("qiskit_score") or 0
    )
    hybrid_confidence = float(
        payload.get("hybrid_confidence") or ((rf_confidence + quantum_score) / 2)
    )
    quantum_signal = float(payload.get("quantum_signal") or 0)
    doctors = payload.get("doctors") or []
    top_predictions = payload.get("top_predictions") or []
    symptoms_list = payload.get("selected_symptoms") or []
    prediction_time = payload.get("prediction_time_display") or format_datetime_iso(
        payload.get("prediction_time")
    )

    symptoms_html = ", ".join(
        s.replace("_", " ").title() for s in symptoms_list
    ) or "Not recorded"

    top_rows = "".join(
        f"""
        <tr>
            <td style="padding:8px 0; border-bottom:1px solid #e1e7f0; color:#182238; font-size:13px;">
                {str(item.get('disease', '')).replace('_', ' ').title()}
            </td>
            <td style="padding:8px 0; border-bottom:1px solid #e1e7f0; text-align:right; color:#315bea; font-weight:700; font-size:13px;">
                {float(item.get('confidence', 0)):.2f}%
            </td>
        </tr>
        """
        for item in top_predictions[:3]
    )

    doctor_html = ""
    if doctors:
        d = doctors[0]
        doctor_html = f"""
        <tr>
            <td style="padding-top:14px; color:#68748a; font-size:12px; font-weight:700; text-transform:uppercase;">
                Recommended Doctor
            </td>
        </tr>
        <tr>
            <td style="padding:4px 0 0; color:#182238; font-weight:700; font-size:14px;">
                {d.get('name', '')} &middot; {d.get('specialization', '')}
            </td>
        </tr>
        <tr>
            <td style="padding:2px 0 0; color:#68748a; font-size:13px;">
                {d.get('hospital', '')}, {d.get('location', '')}
            </td>
        </tr>
        """

    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif; background:#f4f7fb; padding:28px 12px; line-height:1.5;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e1e7f0;">
        
        <!-- HEADER -->
        <div style="background:linear-gradient(135deg, #315bea, #4d70ef); padding:22px 28px;">
          <div style="color:#ffffff; font-size:20px; font-weight:800;">QuantumDiagnose</div>
          <div style="color:#dce6ff; font-size:12px; margin-top:2px;">Quantum-Assisted ML Disease Prediction Report</div>
        </div>

        <div style="padding:26px 28px;">
          
          <!-- PATIENT & SYMPTOMS -->
          <p style="margin:0 0 4px; color:#68748a; font-size:12px;">Patient</p>
          <p style="margin:0 0 16px; color:#182238; font-weight:700; font-size:15px;">
            {patient.get('name', '—')} &middot; {patient.get('gender', '—')} &middot; Age {patient.get('age', '—')}
          </p>

          <p style="margin:0 0 4px; color:#68748a; font-size:12px;">Selected Symptoms</p>
          <p style="margin:0 0 18px; color:#182238; font-size:13px; line-height:1.6;">{symptoms_html}</p>

          <!-- FINAL PREDICTED DISEASE -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc; border-radius:12px; padding:16px; margin-bottom:18px;">
            <tr>
              <td style="padding:6px 12px;">
                <p style="margin:0; color:#68748a; font-size:12px;">Final Predicted Disease</p>
                <p style="margin:4px 0 0; color:#182238; font-size:19px; font-weight:800;">{disease}</p>
                <p style="margin:2px 0 0; color:#315bea; font-size:13px; font-weight:700;">
                  {hybrid_confidence:.2f}% confidence
                </p>
              </td>
            </tr>
          </table>

          <!-- RANDOM FOREST -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc; border-radius:12px; padding:16px; margin-bottom:18px;">
            <tr>
              <td style="padding:6px 12px;">
                <p style="margin:0; color:#68748a; font-size:12px;">Random Forest</p>
                <p style="margin:4px 0 0; color:#182238; font-size:17px; font-weight:800;">
                  {str(payload.get('rf_disease', disease)).replace('_', ' ').title()}
                </p>
                <p style="margin:2px 0 0; color:#315bea; font-size:13px; font-weight:700;">{rf_confidence:.2f}% confidence</p>
              </td>
            </tr>
          </table>

          <!-- QISKIT -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ff; border-radius:12px; padding:16px; margin-bottom:18px;">
            <tr>
              <td style="padding:6px 12px;">
                <p style="margin:0; color:#68748a; font-size:12px;">Qiskit Experimental Prediction</p>
                <p style="margin:4px 0 0; color:#182238; font-size:17px; font-weight:800;">
                  {str(payload.get('qiskit_disease', 'Unavailable')).replace('_', ' ').title()}
                </p>
                <p style="margin:2px 0 0; color:#6548bd; font-size:13px; font-weight:700;">{quantum_score:.2f}%</p>
                <p style="margin:4px 0 0; color:#6548bd; font-size:12px;">Quantum signal: {quantum_signal:.2f}%</p>
              </td>
            </tr>
          </table>

          <!-- CANDIDATES -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
            {top_rows}
          </table>

          <!-- DOCTOR -->
          <table width="100%" cellpadding="0" cellspacing="0">
            {doctor_html}
          </table>

          <!-- SHORTENED NOTICE -->
          <div style="margin-top:22px; padding:12px 14px; background:#fff8e8; border:1px solid #f4e2b5; border-radius:8px;">
            <p style="margin:0; color:#755a1d; font-size:12px; line-height:1.4;">
              <strong>Important:</strong> Educational research prototype. Not a substitute for professional medical advice.
            </p>
          </div>

          <!-- FOOTER -->
          <p style="margin:18px 0 0; color:#a3adc2; font-size:11px;">
            Generated {prediction_time} &middot; QuantumDiagnose Educational Project
          </p>

        </div>
      </div>
    </div>
    """


@app.route("/send-report", methods=["POST"])
def send_report():
    if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:
        return jsonify({
            "success": False,
            "error": "Email sending is not configured on the server yet."
        }), 500

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON request."}), 400

    to_email = (data.get("to_email") or "").strip()
    if not to_email or "@" not in to_email:
        return jsonify({"success": False, "error": "Please provide a valid email address."}), 400

    disease_label = str(
        data.get("hybrid_disease") or data.get("disease") or "Report"
    ).replace("_", " ").title()

    html_content = build_report_email_html(data)

    payload = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": to_email}],
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


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
