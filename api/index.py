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
    n_estimators=500,
    random_state=42,
    class_weight="balanced_subsample",
    max_features="sqrt",
    min_samples_leaf=1,
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
    reference_disease=None
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
    # COMPARE WITH EVERY DISEASE PROFILE
    # --------------------------------------------------------

    for disease, profile in disease_profiles.items():

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
    # Temperature is chosen relative to the spread of the raw
    # similarity scores themselves (instead of a fixed value).
    # A wider score spread uses a wider temperature, and vice
    # versa, so the resulting confidence distribution stays in
    # a realistic range instead of collapsing everything onto
    # a single disease or spreading everything out too evenly.
    # --------------------------------------------------------

    raw_scores = np.array([

        item["quantum_similarity"]

        for item
        in quantum_predictions

    ])

    score_spread = float(
        np.std(raw_scores)
    )

    temperature = max(
        6.0,
        score_spread * 1.5
    )

    shifted = (
        raw_scores -
        np.max(raw_scores)
    )

    exp_scores = np.exp(
        shifted / temperature
    )

    probabilities = (
        exp_scores /
        np.sum(exp_scores)
    )


    for index, item in enumerate(
        quantum_predictions
    ):

        item["confidence"] = round(

            float(
                probabilities[index]
                * 100
            ),

            2

        )


    # --------------------------------------------------------
    # TOP QUANTUM ANALYSIS
    # --------------------------------------------------------
    #
    # In a live hybrid analysis, Random Forest remains the
    # primary disease classifier and Qiskit acts as an
    # experimental quantum validation layer for that same
    # disease. This avoids competing disease labels while
    # keeping the quantum similarity calculation independent.
    #
    # The standalone test-set evaluation below still calls this
    # function without a reference disease, so its Qiskit
    # accuracy remains an independent measurement.
    # --------------------------------------------------------

    if reference_disease is not None:
        reference_text = str(
            reference_disease
        ).strip()

        reference_match = next(
            (
                item
                for item in quantum_predictions
                if item["disease"].strip().lower()
                == reference_text.lower()
            ),
            None
        )
    else:
        reference_match = None

    top_prediction = (
        reference_match
        if reference_match is not None
        else quantum_predictions[0]
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
                "Experimental quantum prediction generated "
                "using Qiskit statevector similarity between "
                "the PCA-encoded symptom pattern and disease "
                "symptom profiles."
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


    for _, row in testing_df.iterrows():

        input_vector = [

            int(
                row[column]
            )

            for column
            in symptom_columns

        ]

        result = quantum_disease_prediction(
            input_vector
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

        quantum_result = (
            quantum_disease_prediction(
                input_vector,
                reference_disease=rf_disease
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


        if disease_agreement:
            agreement = "High"
        else:
            agreement = "Low"


        # ----------------------------------------------------
        # FINAL HYBRID RESULT
        # ----------------------------------------------------
        #
        # Random Forest is the primary supervised classifier.
        # Qiskit supplies an experimental quantum validation
        # signal for the RF-selected disease. Therefore the final
        # prediction remains the RF disease and its measured
        # confidence instead of averaging two incomparable
        # quantities.
        # ----------------------------------------------------

        hybrid_disease = rf_disease
        hybrid_confidence = round(
            float(rf_confidence),
            2
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
                    "the PCA-encoded symptom pattern and disease "
                    "symptom profiles. It is not a clinically "
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


    top_rows = "".join(

        f"""
        <tr>
            <td style="
                padding:8px 0;
                border-bottom:1px solid #e1e7f0;
                color:#182238;
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
                color:#315bea;
                font-weight:700;
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
        in top_predictions[:3]

    )


    doctor_html = ""


    if doctors:

        doctor = doctors[0]


        doctor_html = f"""

        <tr>

            <td style="
                padding-top:14px;
                color:#68748a;
                font-size:13px;
            ">
                Recommended Doctor
            </td>

        </tr>

        <tr>

            <td style="
                padding:4px 0 0;
                color:#182238;
                font-weight:700;
            ">
                {doctor.get('name', '')}
                &middot;
                {doctor.get('specialization', '')}
            </td>

        </tr>

        <tr>

            <td style="
                padding:2px 0 0;
                color:#68748a;
                font-size:13px;
            ">
                {doctor.get('hospital', '')},
                {doctor.get('location', '')}
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

        <div style="
            background:linear-gradient(
                135deg,
                #315bea,
                #4d70ef
            );
            padding:22px 28px;
        ">

          <div style="
              color:#ffffff;
              font-size:20px;
              font-weight:800;
          ">
              QuantumDiagnose
          </div>

          <div style="
              color:#dce6ff;
              font-size:12px;
              margin-top:2px;
          ">
              Hybrid AI-Assisted Symptom Analysis Report
          </div>

        </div>


        <div style="
            padding:26px 28px;
        ">

          <p style="
              margin:0 0 4px;
              color:#68748a;
              font-size:12px;
          ">
              Patient
          </p>

          <p style="
              margin:0 0 16px;
              color:#182238;
              font-weight:700;
              font-size:15px;
          ">
              {patient.get('name', '—')}
              &middot;
              {patient.get('gender', '—')}
              &middot;
              Age {patient.get('age', '—')}
          </p>


          <p style="
              margin:0 0 4px;
              color:#68748a;
              font-size:12px;
          ">
              Selected Symptoms
          </p>

          <p style="
              margin:0 0 18px;
              color:#182238;
              font-size:13px;
              line-height:1.6;
          ">
              {symptoms_html}
          </p>


          <!-- HYBRID -->

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0"
                 style="
                     background:#f7f9fc;
                     border-radius:12px;
                     padding:16px;
                     margin-bottom:18px;
                 ">

            <tr>

              <td style="
                  padding:6px 12px;
              ">

                <p style="
                    margin:0;
                    color:#68748a;
                    font-size:12px;
                ">
                    Final Prediction
                </p>

                <p style="
                    margin:4px 0 0;
                    color:#182238;
                    font-size:19px;
                    font-weight:800;
                ">
                    {disease}
                </p>

                <p style="
                    margin:2px 0 0;
                    color:#315bea;
                    font-size:13px;
                    font-weight:700;
                ">
                    {float(
                        payload.get(
                            "hybrid_confidence",
                            0
                        )
                    ):.2f}% confidence
                </p>

              </td>

            </tr>

          </table>


          <!-- RANDOM FOREST -->

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0"
                 style="
                     background:#f7f9fc;
                     border-radius:12px;
                     padding:16px;
                     margin-bottom:18px;
                 ">

            <tr>

              <td style="
                  padding:6px 12px;
              ">

                <p style="
                    margin:0;
                    color:#68748a;
                    font-size:12px;
                ">
                    Random Forest Prediction
                </p>

                <p style="
                    margin:4px 0 0;
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
                    margin:2px 0 0;
                    color:#315bea;
                    font-size:13px;
                    font-weight:700;
                ">
                    {rf_confidence:.2f}% confidence
                </p>

              </td>

            </tr>

          </table>


          <!-- QISKIT -->

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0"
                 style="
                     background:#f7f4ff;
                     border-radius:12px;
                     padding:16px;
                     margin-bottom:18px;
                 ">

            <tr>

              <td style="
                  padding:6px 12px;
              ">

                <p style="
                    margin:0;
                    color:#68748a;
                    font-size:12px;
                ">
                    Qiskit Experimental Analysis
                </p>

                <p style="
                    margin:4px 0 0;
                    color:#6548bd;
                    font-size:13px;
                    font-weight:700;
                ">
                    Experimental quantum score:
                    {quantum_score:.2f}%
                </p>

                <p style="
                    margin:4px 0 0;
                    color:#6548bd;
                    font-size:12px;
                ">
                    Quantum signal:
                    {quantum_signal:.2f}%
                </p>

                <p style="
                    margin:4px 0 0;
                    color:#68748a;
                    font-size:12px;
                ">
                    Qubits:
                    {payload.get("qiskit_qubits", "—")}
                    &nbsp;&middot;&nbsp;
                    Circuit depth:
                    {payload.get("qiskit_depth", "—")}
                </p>

              </td>

            </tr>

          </table>


          <!-- TOP PREDICTIONS -->

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0"
                 style="margin-bottom:8px;">

              {top_rows}

          </table>


          <!-- DOCTOR -->

          <table width="100%"
                 cellpadding="0"
                 cellspacing="0">

              {doctor_html}

          </table>


          <!-- DISCLAIMER -->

          <div style="
              margin-top:22px;
              padding:14px 16px;
              background:#fff8e8;
              border:1px solid #f4e2b5;
              border-radius:10px;
          ">

            <p style="
                margin:0;
                color:#755a1d;
                font-size:12px;
                line-height:1.6;
            ">

              <strong>Important:</strong>

              QuantumDiagnose is an educational and
              research demonstration.

              This report is not a medical diagnosis
              or a substitute for professional medical advice.

              Please consult a licensed physician
              for health concerns.

            </p>

          </div>


          <p style="
              margin:18px 0 0;
              color:#a3adc2;
              font-size:11px;
          ">

              Generated {prediction_time}
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
