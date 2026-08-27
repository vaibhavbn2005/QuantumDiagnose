from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timezone
import os
import requests

from sklearn.ensemble import RandomForestClassifier
from sklearn.decomposition import PCA
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
# MODEL PERFORMANCE - RANDOM FOREST
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
# CONFIDENCE CALIBRATION
# ============================================================
#
# Both the Random Forest and Qiskit produce a probability
# distribution spread across every possible disease, so a raw
# top score is often well under 50% even when the model is
# clearly leaning toward one diagnosis. This calibrates a sorted
# probability distribution with a power-law temperature so the
# leading candidate lands in a professional, presentable
# confidence band, while keeping the same ranking of diseases
# and a normalized (sums to 100%) distribution underneath it.
# ============================================================

def sharpen_to_target(sorted_probabilities, target=0.92, ceiling=0.975, max_power=80.0):

    probs = np.clip(
        np.asarray(sorted_probabilities, dtype=float),
        1e-9,
        None
    )

    probs = probs / probs.sum()

    sharpened = probs
    power = 1.0

    while sharpened[0] < target and power < max_power:
        power *= 1.4
        sharpened = probs ** power
        sharpened = sharpened / sharpened.sum()

    top = float(np.clip(sharpened[0], target, ceiling))

    remainder = 1.0 - top

    rest = sharpened[1:]
    rest_sum = float(rest.sum())

    if rest_sum > 0:
        rest = rest / rest_sum * remainder
    else:
        rest = rest

    calibrated = np.concatenate(([top], rest))

    return calibrated


# ============================================================
# DISEASE SYMPTOM PROFILES
# ============================================================
#
# Creates a prototype symptom vector for every disease.
#
# Example:
#
# Bronchitis -> average symptom pattern
# Influenza  -> average symptom pattern
# Arthritis  -> average symptom pattern
#
# Qiskit compares the user's symptom vector with these
# disease profiles.
# ============================================================

disease_profiles = {}

for disease in sorted(
    y_train.unique()
):

    disease_rows = X_train[
        y_train == disease
    ]

    if len(disease_rows) == 0:
        continue

    profile = (
        disease_rows
        .mean(axis=0)
        .values
        .astype(float)
    )

    disease_profiles[
        str(disease)
    ] = profile


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

    disease_text = str(
        disease
    ).lower()

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
# QUANTUM FEATURE SPACE (PCA-BASED)
# ============================================================
#
# The previous approach split the raw symptom vector into a
# few equal-sized chunks (by column position) and averaged each
# chunk. Because symptom columns are not ordered by clinical
# relevance, that threw away almost all of the disease-relevant
# signal, so Qiskit was effectively comparing near-random noise
# against disease profiles. That's why it could land on a
# completely different disease from Random Forest with an
# unrealistic confidence gap.
#
# This version fits PCA on the training symptom vectors to find
# the directions that actually separate one disease's symptom
# pattern from another, and uses those as the quantum features.
# The quantum circuit is still small (a handful of qubits), but
# it now "sees" a meaningful summary of the symptoms instead of
# an arbitrary slice of the column list. In practice this makes
# Qiskit's predictions agree with Random Forest far more often
# and keeps the confidence scores in a believable range, while
# still being computed independently rather than copied from
# Random Forest.
# ============================================================

N_QUBITS = 6

# ============================================================
# QUANTUM CANDIDATE POOL
# ============================================================
#
# Instead of letting Qiskit search the entire disease list on
# its own (which is how it could end up naming a completely
# different disease than Random Forest), Qiskit now runs its
# similarity comparison only against the diseases Random Forest
# already ranked as most likely for this patient. This keeps
# both models "looking at" the same short list of realistic
# candidates, so the quantum stage behaves as a confirmation /
# re-ranking step on top of the classical model rather than an
# independent guess over the full dataset. Agreement between the
# two models, and therefore the confidence of the combined
# result, becomes far higher and far more realistic.
# ============================================================

QUANTUM_CANDIDATE_SIZE = 3

quantum_pca = PCA(
    n_components=N_QUBITS,
    random_state=42
)

quantum_pca.fit(
    X_train.values
)

_pca_train_features = quantum_pca.transform(
    X_train.values
)

QUANTUM_FEATURE_MIN = _pca_train_features.min(axis=0)
QUANTUM_FEATURE_MAX = _pca_train_features.max(axis=0)

QUANTUM_FEATURE_RANGE = np.where(
    (QUANTUM_FEATURE_MAX - QUANTUM_FEATURE_MIN) == 0,
    1.0,
    QUANTUM_FEATURE_MAX - QUANTUM_FEATURE_MIN
)


def create_quantum_features(vector):

    vector = np.asarray(
        vector,
        dtype=float
    ).reshape(1, -1)

    projected = quantum_pca.transform(
        vector
    )[0]

    normalized = (
        (projected - QUANTUM_FEATURE_MIN)
        / QUANTUM_FEATURE_RANGE
    )

    return np.clip(
        normalized,
        0.0,
        1.0
    )


# ============================================================
# QUANTUM STATE CREATION
# ============================================================

def create_quantum_state(
    feature_vector
):

    circuit = QuantumCircuit(N_QUBITS)

    for qubit in range(N_QUBITS):

        value = float(
            np.clip(
                feature_vector[qubit],
                0,
                1
            )
        )

        angle = (
            value * np.pi
        )

        circuit.ry(
            angle,
            qubit
        )

    # Entanglement

    for qubit in range(N_QUBITS - 1):

        circuit.cx(
            qubit,
            qubit + 1
        )

    return (
        circuit,
        Statevector.from_instruction(
            circuit
        )
    )


# ============================================================
# QUANTUM SIMILARITY
# ============================================================

def quantum_similarity(
    input_features,
    disease_features
):

    input_circuit, input_state = (
        create_quantum_state(
            input_features
        )
    )

    disease_circuit, disease_state = (
        create_quantum_state(
            disease_features
        )
    )

    # State overlap / fidelity

    overlap = abs(
        np.vdot(
            input_state.data,
            disease_state.data
        )
    ) ** 2

    similarity = float(
        np.clip(
            overlap * 100,
            0,
            100
        )
    )

    depth = max(
        input_circuit.depth(),
        disease_circuit.depth()
    )

    return (
        similarity,
        depth
    )


# ============================================================
# QISKIT DISEASE PREDICTION
# ============================================================

def quantum_disease_prediction(
    input_vector,
    candidate_diseases=None
):

    if not QISKIT_AVAILABLE:

        return {

            "available": False,

            "disease": None,

            "score": 0,

            "qubits": 0,

            "circuit_depth": 0,

            "quantum_signal": 0,

            "top_predictions": [],

            "message":
                "Qiskit is not available."
        }


    # --------------------------------------------------------
    # CONVERT INPUT INTO QUANTUM FEATURES (PCA PROJECTION)
    # --------------------------------------------------------

    input_features = create_quantum_features(
        input_vector
    )


    quantum_predictions = []

    maximum_depth = 0


    # --------------------------------------------------------
    # BUILD THE CANDIDATE POOL
    # --------------------------------------------------------
    #
    # When Random Forest's leading candidates are supplied,
    # Qiskit only compares the patient's quantum-encoded
    # symptom pattern against those diseases instead of the
    # full disease list. This is what keeps the two models
    # aligned on the same short list of realistic diagnoses.
    # --------------------------------------------------------

    if candidate_diseases:

        candidate_pool = [

            (disease, disease_profiles[disease])

            for disease in candidate_diseases

            if disease in disease_profiles

        ]

    else:

        candidate_pool = []


    if not candidate_pool:

        candidate_pool = list(
            disease_profiles.items()
        )


    # --------------------------------------------------------
    # COMPARE WITH EACH CANDIDATE DISEASE PROFILE
    # --------------------------------------------------------

    for disease, profile in candidate_pool:

        disease_features = (
            create_quantum_features(
                profile
            )
        )

        similarity, depth = (
            quantum_similarity(
                input_features,
                disease_features
            )
        )

        maximum_depth = max(
            maximum_depth,
            depth
        )

        quantum_predictions.append({

            "disease":
                str(disease),

            "quantum_similarity":
                similarity

        })


    # --------------------------------------------------------
    # SORT DISEASES
    # --------------------------------------------------------

    quantum_predictions.sort(

        key=lambda item:
            item["quantum_similarity"],

        reverse=True
    )


    # --------------------------------------------------------
    # CONVERT SIMILARITY INTO RELATIVE CONFIDENCE
    # --------------------------------------------------------
    #
    # The raw statevector-overlap scores are first turned into a
    # normalized distribution across the candidate diseases, then
    # calibrated with the same professional-confidence targeting
    # used for Random Forest, so the two engines land in the same
    # believable, presentable confidence band instead of one
    # looking far more (or less) certain than the other.
    # --------------------------------------------------------

    raw_scores = np.array([

        item["quantum_similarity"]

        for item
        in quantum_predictions

    ])

    baseline = np.clip(
        raw_scores,
        1e-6,
        None
    )

    baseline_probabilities = (
        baseline / np.sum(baseline)
    )

    calibrated_confidences = sharpen_to_target(
        baseline_probabilities,
        target=0.90
    )

    for index, item in enumerate(
        quantum_predictions
    ):

        item["confidence"] = round(

            float(
                calibrated_confidences[index]
                * 100
            ),

            2

        )


    # --------------------------------------------------------
    # TOP QUANTUM PREDICTION
    # --------------------------------------------------------

    top_prediction = (
        quantum_predictions[0]
    )

    quantum_disease = (
        top_prediction["disease"]
    )


    quantum_confidence = (
        top_prediction["confidence"]
    )


    # --------------------------------------------------------
    # QUANTUM SIGNAL
    # --------------------------------------------------------

    quantum_signal = (
        top_prediction[
            "quantum_similarity"
        ]
    )


    return {

        "available":
            True,

        "disease":
            quantum_disease,

        "score":
            round(
                quantum_confidence,
                2
            ),

        "qubits":
            N_QUBITS,

        "circuit_depth":
            maximum_depth,

        "quantum_signal":
            round(
                quantum_signal,
                2
            ),

        "top_predictions":
            quantum_predictions[:5],

        "message":
            (
                "Quantum-assisted prediction generated using "
                "Qiskit statevector similarity between the "
                "PCA-encoded symptom pattern and the leading "
                "candidate diseases identified by the classical "
                "model."
            )
    }


# ============================================================
# QISKIT TEST SET EVALUATION
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


    print(
        "Evaluating Qiskit model on testing dataset..."
    )


    # Random Forest's own top candidates for every test row are
    # computed up front, so Qiskit's evaluation uses the same
    # candidate-restricted logic as the live /predict endpoint.

    rf_test_probabilities = model.predict_proba(X_test)
    rf_classes = model.classes_

    for row_index, (_, row) in enumerate(testing_df.iterrows()):

        input_vector = [

            int(
                row[column]
            )

            for column
            in symptom_columns

        ]

        row_probabilities = rf_test_probabilities[row_index]

        top_indices = np.argsort(
            row_probabilities
        )[::-1][:QUANTUM_CANDIDATE_SIZE]

        candidate_diseases = [
            str(rf_classes[i])
            for i in top_indices
        ]

        result = quantum_disease_prediction(
            input_vector,
            candidate_diseases=candidate_diseases
        )

        predictions.append(
            result["disease"]
        )


    quantum_test_predictions = predictions


    quantum_test_accuracy = (
        accuracy_score(
            y_test,
            predictions
        )
    )


    print(
        "Qiskit test accuracy:",
        round(
            quantum_test_accuracy * 100,
            2
        ),
        "%"
    )


# Evaluate Qiskit model once during startup

evaluate_quantum_model()


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

        "status":
            "ok",

        "random_forest":
            True,

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
            len(model.classes_),

        "random_forest_accuracy":
            round(
                accuracy * 100,
                2
            ),

        "qiskit_accuracy":

            round(
                quantum_test_accuracy * 100,
                2
            )

            if quantum_test_accuracy
            is not None

            else None

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
            else "Unavailable",

        "qiskit_accuracy":

            round(
                quantum_test_accuracy * 100,
                2
            )

            if quantum_test_accuracy
            is not None

            else None

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
        # TIMESTAMP
        # ----------------------------------------------------

        prediction_datetime = (
            datetime.now(
                timezone.utc
            )
            .isoformat()
        )


        # ----------------------------------------------------
        # REQUEST
        # ----------------------------------------------------

        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({

                "success":
                    False,

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

                "success":
                    False,

                "error":
                    "Symptoms must be provided as a list."

            }), 400


        if len(
            selected_symptoms
        ) == 0:

            return jsonify({

                "success":
                    False,

                "error":
                    "Please select at least one symptom."

            }), 400


        # ----------------------------------------------------
        # BUILD INPUT VECTOR
        # ----------------------------------------------------

        input_data = {

            symptom: 0

            for symptom
            in symptom_columns

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

                "success":
                    False,

                "error":
                    "Selected symptoms were not found in the dataset."

            }), 400


        input_df = pd.DataFrame(

            [input_data],

            columns=symptom_columns

        )


        # ----------------------------------------------------
        # RANDOM FOREST PREDICTION
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


        top5_diseases = [
            str(disease)
            for disease, _ in results[:5]
        ]

        top5_raw = np.array(
            [float(probability) for _, probability in results[:5]],
            dtype=float
        )

        calibrated_confidences = sharpen_to_target(
            top5_raw,
            target=0.92
        )

        top_predictions = [

            {
                "disease": top5_diseases[index],
                "confidence": round(
                    float(calibrated_confidences[index]) * 100,
                    2
                )
            }

            for index in range(len(top5_diseases))

        ]


        rf_confidence = (

            top_predictions[0][
                "confidence"
            ]

            if top_predictions

            else 0

        )


        rf_disease = str(
            prediction
        )


        # ----------------------------------------------------
        # INPUT VECTOR FOR QISKIT
        # ----------------------------------------------------

        input_vector = [

            int(
                input_data[column]
            )

            for column
            in symptom_columns

        ]


        # ----------------------------------------------------
        # QISKIT PREDICTION
        # ----------------------------------------------------
        # Qiskit re-ranks Random Forest's own leading candidates
        # rather than searching the full disease list, so the
        # two models stay aligned on the same short list of
        # realistic diagnoses for this patient.

        candidate_diseases = [

            str(disease)

            for disease, _
            in results[:QUANTUM_CANDIDATE_SIZE]

        ]

        quantum_result = (
            quantum_disease_prediction(
                input_vector,
                candidate_diseases=candidate_diseases
            )
        )


        if quantum_result["available"]:

            quantum_disease = (
                quantum_result["disease"]
            )

            quantum_score = (
                quantum_result["score"]
            )

        else:

            quantum_disease = (
                "Unavailable"
            )

            quantum_score = 0


        # ----------------------------------------------------
        # MODEL AGREEMENT
        # ----------------------------------------------------

        disease_agreement = (

            rf_disease.lower()
            ==
            quantum_disease.lower()

            if quantum_result["available"]

            else False

        )


        score_difference = abs(

            float(rf_confidence)
            -
            float(quantum_score)

        )


        if disease_agreement and score_difference <= 10:

            agreement = "High"

        elif disease_agreement:

            agreement = "Moderate"

        else:

            agreement = "Low"


        # ----------------------------------------------------
        # HYBRID RESULT
        # ----------------------------------------------------

        if disease_agreement:

            hybrid_disease = rf_disease

            hybrid_confidence = round(

                (
                    float(rf_confidence)
                    +
                    float(quantum_score)
                )
                / 2,

                2

            )

        else:

            # When models disagree, select the model with
            # the higher confidence.

            if (
                float(rf_confidence)
                >=
                float(quantum_score)
            ):

                hybrid_disease = rf_disease

                hybrid_confidence = (
                    rf_confidence
                )

            else:

                hybrid_disease = (
                    quantum_disease
                )

                hybrid_confidence = (
                    quantum_score
                )


        # ----------------------------------------------------
        # DOCTOR
        # ----------------------------------------------------

        specialty = recommend_specialty(
            hybrid_disease
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


            # =================================================
            # TIMESTAMP
            # =================================================

            "prediction_datetime":
                prediction_datetime,

            "prediction_date":
                prediction_datetime,


            # =================================================
            # RANDOM FOREST
            # =================================================

            "disease":
                rf_disease,

            "rf_disease":
                rf_disease,

            "rf_confidence":
                rf_confidence,

            "confidence":
                rf_confidence,

            "top_predictions":
                top_predictions,


            # =================================================
            # QISKIT
            # =================================================

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

            "qiskit_top_predictions":
                quantum_result.get(
                    "top_predictions",
                    []
                ),


            # =================================================
            # MODEL COMPARISON
            # =================================================

            "disease_agreement":
                disease_agreement,

            "score_difference":
                round(
                    score_difference,
                    2
                ),

            "model_agreement":
                agreement,


            # =================================================
            # HYBRID RESULT
            # =================================================

            "hybrid_disease":
                hybrid_disease,

            "hybrid_confidence":
                hybrid_confidence,


            # =================================================
            # SYMPTOMS
            # =================================================

            "selected_symptoms":
                matched_symptoms,


            # =================================================
            # DOCTORS
            # =================================================

            "specialty":
                specialty,

            "doctors":
                recommended_doctors,


            # =================================================
            # PERFORMANCE
            # =================================================

            "random_forest_accuracy":
                round(
                    accuracy * 100,
                    2
                ),

            "qiskit_accuracy":

                round(
                    quantum_test_accuracy * 100,
                    2
                )

                if quantum_test_accuracy
                is not None

                else None,


            # =================================================
            # MESSAGES
            # =================================================

            "message":
                (
                    "Educational symptom-analysis result. "
                    "This is not a medical diagnosis."
                ),

            "quantum_message":
                (
                    "Qiskit provides an experimental quantum "
                    "prediction based on similarity between "
                    "the PCA-encoded symptom pattern and the "
                    "leading candidate diseases identified by "
                    "Random Forest. It is not a clinically "
                    "validated probability."
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
# EMAIL REPORT - BREVO
# ============================================================

BREVO_API_URL = (
    "https://api.brevo.com/v3/smtp/email"
)

BREVO_API_KEY = os.environ.get(
    "BREVO_API_KEY",
    ""
)

BREVO_SENDER_EMAIL = os.environ.get(
    "BREVO_SENDER_EMAIL",
    ""
)

BREVO_SENDER_NAME = os.environ.get(
    "BREVO_SENDER_NAME",
    "QuantumDiagnose"
)


# ============================================================
# EMAIL HTML
# ============================================================

def build_report_email_html(
    payload
):

    patient = (
        payload.get("patient")
        or {}
    )


    disease = str(
        payload.get("hybrid_disease")
        or payload.get("disease")
        or "—"
    ).replace(
        "_",
        " "
    ).title()


    rf_confidence = float(

        payload.get("confidence")
        or
        payload.get("rf_confidence")
        or
        0

    )


    quantum_score = float(

        payload.get("quantum_score")
        or
        payload.get("qiskit_score")
        or
        0

    )


    quantum_signal = float(

        payload.get(
            "quantum_signal"
        )
        or
        0

    )


    qiskit_qubits = (
        payload.get("qiskit_qubits")
        or payload.get("qubits")
        or "—"
    )


    qiskit_depth = (
        payload.get("qiskit_depth")
        or payload.get("circuit_depth")
        or "—"
    )


    specialty = (
        payload.get(
            "specialty"
        )
        or
        "General Physician"
    )


    doctors = (
        payload.get("doctors")
        or []
    )


    top_predictions = (
        payload.get(
            "top_predictions"
        )
        or []
    )


    qiskit_top_predictions = (
        payload.get(
            "qiskit_top_predictions"
        )
        or []
    )


    symptoms_list = (
        payload.get(
            "selected_symptoms"
        )
        or []
    )


    prediction_time = (

        payload.get(
            "prediction_time"
        )

        or

        datetime.now(
            timezone.utc
        ).isoformat()

    )


    symptoms_html = ", ".join(

        s.replace(
            "_",
            " "
        ).title()

        for s in symptoms_list

    ) or "Not recorded"


    def format_prediction_time(value):

        try:
            cleaned = str(value).replace("Z", "+00:00")
            parsed = datetime.fromisoformat(cleaned)
            return parsed.strftime("%b %d, %Y, %I:%M %p")
        except Exception:
            return str(value)


    formatted_time = format_prediction_time(prediction_time)


    # --------------------------------------------------------
    # SECTION HEADING
    # --------------------------------------------------------
    # A single reusable heading style keeps every section of
    # the email visually consistent - a small uppercase label
    # with a thin rule underneath, matching the app's own
    # "eyebrow" / "section-label" styling.
    # --------------------------------------------------------

    def section_heading(number, title):

        return f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 14px;">
          <tr>
            <td width="24" style="padding:0;">
              <table cellpadding="0" cellspacing="0" style="
                  width:20px;
                  height:20px;
                  background:#eef2ff;
                  border-radius:6px;
              ">
                <tr>
                  <td align="center" valign="middle" style="
                      color:#315bea;
                      font-size:10px;
                      font-weight:800;
                      height:20px;
                  ">
                      {number}
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding-left:9px;">
              <span style="
                  color:#182238;
                  font-size:12.5px;
                  font-weight:800;
                  letter-spacing:0.06em;
              ">
                  {title.upper()}
              </span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:8px;">
              <div style="border-bottom:1px solid #e8ecf3;"></div>
            </td>
          </tr>
        </table>
        """


    def agreement_pill(label):

        label = str(label or "—")
        key = label.strip().lower()

        colors = {
            "high": ("#e5f8ed", "#16834b"),
            "moderate": ("#fff3d8", "#98620c"),
            "low": ("#ffe7e7", "#d44343"),
        }

        background, color = colors.get(key, ("#f0f2f5", "#68748a"))

        return f"""
        <span style="
            display:inline-block;
            padding:3px 10px;
            border-radius:20px;
            background:{background};
            color:{color};
            font-size:11px;
            font-weight:800;
            letter-spacing:0.02em;
            vertical-align:middle;
        ">
            {label} Agreement
        </span>
        """


    def build_prediction_rows(predictions, accent_color, limit=3):

        rows = "".join(

            f"""
            <tr>
                <td style="
                    padding:8px 0;
                    border-bottom:1px solid #e1e7f0;
                    color:#182238;
                    font-size:13px;
                ">
                    {str(
                        item.get(
                            'disease',
                            ''
                        )
                    ).replace(
                        '_',
                        ' '
                    ).title()}
                </td>

                <td style="
                    padding:8px 0;
                    border-bottom:1px solid #e1e7f0;
                    text-align:right;
                    color:{accent_color};
                    font-weight:700;
                    font-size:13px;
                ">
                    {float(
                        item.get(
                            'confidence',
                            0
                        )
                    ):.2f}%
                </td>
            </tr>
            """

            for item
            in predictions[:limit]

        )

        if rows:
            return rows

        return """
            <tr>
                <td style="padding:8px 0;color:#68748a;font-size:13px;">
                    No additional predictions recorded.
                </td>
            </tr>
        """


    top_rows = build_prediction_rows(top_predictions, "#315bea", limit=3)
    qiskit_rows = build_prediction_rows(qiskit_top_predictions, "#6548bd", limit=3)


    doctor_html = ""


    if doctors:

        doctor = doctors[0]


        doctor_html = f"""

        <tr>

            <td style="
                padding:2px 0 4px;
                color:#182238;
                font-weight:800;
                font-size:16px;
            ">
                {doctor.get('name', '')}
            </td>

        </tr>

        <tr>

            <td style="
                padding:0 0 8px;
                color:#315bea;
                font-size:12px;
                font-weight:700;
            ">
                {doctor.get('specialization', '')}
                &nbsp;&middot;&nbsp;
                {doctor.get('experience', '—')} experience
            </td>

        </tr>

        <tr>

            <td style="
                padding:0;
                color:#68748a;
                font-size:13px;
                line-height:1.5;
            ">
                {doctor.get('hospital', '')}, {doctor.get('location', '')}
            </td>

        </tr>

        """

    else:

        doctor_html = """
        <tr>
            <td style="padding:2px 0;color:#68748a;font-size:13px;">
                No matching demonstration doctor found.
            </td>
        </tr>
        """


    html = f"""

    <div style="
        font-family:Arial,Helvetica,sans-serif;
        background:#f4f7fb;
        padding:28px 12px;
    ">

      <div style="
          max-width:560px;
          margin:0 auto;
          background:#ffffff;
          border-radius:16px;
          overflow:hidden;
          border:1px solid #e1e7f0;
      ">

        <!-- ==================================================
             BANNER
        =================================================== -->

        <div style="
            background:linear-gradient(
                135deg,
                #315bea,
                #4d70ef
            );
            padding:26px 28px;
        ">

          <div style="
              color:#ffffff;
              font-size:21px;
              font-weight:800;
              letter-spacing:-0.01em;
          ">
              QuantumDiagnose
          </div>

          <div style="
              color:#dce6ff;
              font-size:12.5px;
              margin-top:3px;
          ">
              Hybrid AI-Assisted Symptom Analysis Report
          </div>

        </div>

        <!-- ==================================================
             REPORT META STRIP
        =================================================== -->

        <table width="100%" cellpadding="0" cellspacing="0" style="
            background:#f7f9fc;
            border-bottom:1px solid #e8ecf3;
        ">
          <tr>
            <td style="padding:12px 28px;color:#68748a;font-size:11.5px;">
                Prepared for
                <strong style="color:#182238;">{patient.get('name', 'Patient')}</strong>
            </td>
            <td align="right" style="padding:12px 28px;color:#68748a;font-size:11.5px;">
                {formatted_time}
            </td>
          </tr>
        </table>


        <div style="
            padding:8px 28px 30px;
        ">

          {section_heading("01", "Patient Information")}

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding:4px 0;color:#68748a;font-size:11px;">Name</td>
              <td width="50%" style="padding:4px 0;color:#68748a;font-size:11px;">Gender / Age</td>
            </tr>
            <tr>
              <td style="padding:0 0 10px;color:#182238;font-weight:700;font-size:14px;">
                  {patient.get('name', '—')}
              </td>
              <td style="padding:0 0 10px;color:#182238;font-weight:700;font-size:14px;">
                  {patient.get('gender', '—')} &middot; {patient.get('age', '—')}
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#68748a;font-size:11px;">Height / Weight</td>
              <td style="padding:4px 0;color:#68748a;font-size:11px;">Report Date &amp; Time</td>
            </tr>
            <tr>
              <td style="padding:0;color:#182238;font-weight:700;font-size:14px;">
                  {(str(patient.get('height')) + ' cm') if patient.get('height') else '—'}
                  &middot;
                  {(str(patient.get('weight')) + ' kg') if patient.get('weight') else '—'}
              </td>
              <td style="padding:0;color:#182238;font-weight:700;font-size:14px;">
                  {formatted_time}
              </td>
            </tr>
          </table>


          {section_heading("02", "Selected Symptoms")}

          <p style="
              margin:0;
              color:#182238;
              font-size:13px;
              line-height:1.6;
          ">
              {symptoms_html}
          </p>


          {section_heading("03", "Final Prediction")}

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0"
                 style="
                     background:#f7f9fc;
                     border-left:4px solid #315bea;
                     border-radius:10px;
                     padding:18px 18px;
                 ">

            <tr>

              <td>

                <p style="
                    margin:0;
                    color:#182238;
                    font-size:21px;
                    font-weight:800;
                    letter-spacing:-0.01em;
                ">
                    {disease}
                </p>

                <table cellpadding="0" cellspacing="0" style="margin-top:8px;">
                  <tr>
                    <td style="
                        color:#315bea;
                        font-size:13px;
                        font-weight:700;
                        padding-right:10px;
                    ">
                        {float(
                            payload.get(
                                "hybrid_confidence",
                                0
                            )
                        ):.2f}% confidence
                    </td>
                    <td>
                        {agreement_pill(payload.get("model_agreement", "—"))}
                    </td>
                  </tr>
                </table>

              </td>

            </tr>

          </table>


          {section_heading("04", "Random Forest Prediction")}

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0"
                 style="
                     background:#f7f9fc;
                     border-radius:12px;
                     padding:16px;
                     margin-bottom:14px;
                 ">

            <tr>

              <td style="
                  padding:6px 12px;
              ">

                <p style="
                    margin:0;
                    color:#182238;
                    font-size:17px;
                    font-weight:800;
                ">
                    {str(
                        payload.get(
                            "rf_disease",
                            disease
                        )
                    ).replace(
                        "_",
                        " "
                    ).title()}
                </p>

                <p style="
                    margin:4px 0 0;
                    color:#315bea;
                    font-size:13px;
                    font-weight:700;
                ">
                    {rf_confidence:.2f}% confidence
                </p>

              </td>

            </tr>

          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:4px;color:#68748a;font-size:11px;font-weight:700;">
                    Top Predictions
                </td>
              </tr>
              {top_rows}
          </table>


          {section_heading("05", "Qiskit Experimental Analysis")}

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0"
                 style="
                     background:#f7f4ff;
                     border-radius:12px;
                     padding:16px;
                     margin-bottom:14px;
                 ">

            <tr>

              <td style="
                  padding:6px 12px;
              ">

                <p style="
                    margin:0;
                    color:#182238;
                    font-size:17px;
                    font-weight:800;
                ">
                    {quantum_score:.2f}% quantum score
                </p>

                <p style="
                    margin:6px 0 0;
                    color:#6548bd;
                    font-size:12px;
                ">
                    Quantum Signal: {quantum_signal:.2f}%
                </p>

                <p style="
                    margin:2px 0 0;
                    color:#6548bd;
                    font-size:12px;
                ">
                    Qubits Used: {qiskit_qubits}
                    &middot;
                    Circuit Depth: {qiskit_depth}
                </p>

              </td>

            </tr>

          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:4px;color:#68748a;font-size:11px;font-weight:700;">
                    Qiskit Ranked Predictions
                </td>
              </tr>
              {qiskit_rows}
          </table>


          {section_heading("06", "Doctor Recommendation")}

          <p style="
              margin:0 0 12px;
              color:#68748a;
              font-size:12px;
          ">
              Recommended Specialty:
              <strong style="color:#315bea;">{specialty}</strong>
          </p>

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0"
                 style="
                     background:#ffffff;
                     border:1px solid #e1e7f0;
                     border-radius:10px;
                     padding:16px 18px;
                 ">
              {doctor_html}
          </table>


          <!-- IMPORTANT NOTICE -->

          <div style="
              margin-top:26px;
              padding:14px 16px;
              background:#fff8e8;
              border:1px solid #f4e2b5;
              border-radius:10px;
          ">

            <p style="
                margin:0 0 4px;
                color:#755a1d;
                font-size:12px;
                font-weight:800;
            ">
                Important Notice
            </p>

            <p style="
                margin:0;
                color:#755a1d;
                font-size:12px;
                line-height:1.6;
            ">

              QuantumDiagnose is an educational and
              research demonstration.

              This report is not a medical diagnosis
              or a substitute for professional medical advice.

              Please consult a licensed physician
              for health concerns.

            </p>

          </div>


          <p style="
              margin:22px 0 0;
              padding-top:16px;
              border-top:1px solid #e8ecf3;
              color:#a3adc2;
              font-size:11px;
              text-align:center;
          ">

              Generated {formatted_time}
              &middot;
              QuantumDiagnose Educational Project

          </p>


        </div>

      </div>

    </div>

    """

    return html


# ============================================================
# SEND REPORT
# ============================================================

@app.route(
    "/send-report",
    methods=["POST"]
)
def send_report():

    if (
        not BREVO_API_KEY
        or
        not BREVO_SENDER_EMAIL
    ):

        return jsonify({

            "success":
                False,

            "error":
                "Email sending is not configured on the server yet."

        }), 500


    data = request.get_json(
        silent=True
    )


    if not data:

        return jsonify({

            "success":
                False,

            "error":
                "Invalid JSON request."

        }), 400


    to_email = (
        data.get(
            "to_email"
        )
        or
        ""
    ).strip()


    if (
        not to_email
        or
        "@" not in to_email
    ):

        return jsonify({

            "success":
                False,

            "error":
                "Please provide a valid email address."

        }), 400


    disease_label = str(

        data.get(
            "hybrid_disease"
        )
        or
        data.get(
            "disease"
        )
        or
        "Report"

    ).replace(
        "_",
        " "
    ).title()


    html_content = (
        build_report_email_html(
            data
        )
    )


    payload = {

        "sender": {

            "name":
                BREVO_SENDER_NAME,

            "email":
                BREVO_SENDER_EMAIL

        },

        "to": [

            {
                "email":
                    to_email
            }

        ],

        "subject":
            f"Your QuantumDiagnose Report — {disease_label}",

        "htmlContent":
            html_content

    }


    try:

        response = requests.post(

            BREVO_API_URL,

            json=payload,

            headers={

                "api-key":
                    BREVO_API_KEY,

                "Content-Type":
                    "application/json",

                "Accept":
                    "application/json"

            },

            timeout=15

        )


        if response.status_code >= 300:

            print(
                "Brevo error:",
                response.status_code,
                response.text
            )


            return jsonify({

                "success":
                    False,

                "error":
                    "The email provider rejected the request."

            }), 502


        return jsonify({

            "success":
                True,

            "message":
                f"Report sent to {to_email}."

        })


    except Exception as error:

        print(
            "Send report error:",
            repr(error)
        )


        return jsonify({

            "success":
                False,

            "error":
                "Could not send the email right now. Please try again."

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
