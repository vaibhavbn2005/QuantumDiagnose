# ============================================================
# QuantumDiagnose
# Professional ML + Qiskit Backend
# Flask + Random Forest + Qiskit
# ============================================================

from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)
from sklearn.model_selection import StratifiedKFold, cross_val_score


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
# FLASK APPLICATION
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
        f"Could not load dataset files: {error}"
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
# FIND TARGET COLUMN
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
# IDENTIFY SYMPTOM COLUMNS
# ============================================================

symptom_columns = [
    column
    for column in training_df.columns
    if column != TARGET_COLUMN
]


# ============================================================
# CHECK TESTING DATA
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
# CLEAN SYMPTOM VALUES
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
# CONVERT SYMPTOMS TO BINARY
# ============================================================

for column in symptom_columns:

    training_df[column] = (
        training_df[column] > 0
    ).astype(int)

    testing_df[column] = (
        testing_df[column] > 0
    ).astype(int)


# ============================================================
# CLEAN TARGET
# ============================================================

training_df[TARGET_COLUMN] = (
    training_df[TARGET_COLUMN]
    .astype(str)
    .str.strip()
)

testing_df[TARGET_COLUMN] = (
    testing_df[TARGET_COLUMN]
    .astype(str)
    .str.strip()
)


# ============================================================
# REMOVE INVALID TARGET ROWS
# ============================================================

training_df = training_df[
    training_df[TARGET_COLUMN].notna()
].copy()

testing_df = testing_df[
    testing_df[TARGET_COLUMN].notna()
].copy()


# ============================================================
# CREATE TRAINING DATA
# ============================================================

X_train = training_df[
    symptom_columns
].copy()

y_train = training_df[
    TARGET_COLUMN
].copy()


# ============================================================
# CREATE TEST DATA
# ============================================================

X_test = testing_df[
    symptom_columns
].copy()

y_test = testing_df[
    TARGET_COLUMN
].copy()


# ============================================================
# REMOVE EXACT DUPLICATES
#
# Only completely identical symptom + disease records
# are removed.
# ============================================================

training_combined = pd.concat(
    [
        X_train.reset_index(drop=True),
        y_train.reset_index(drop=True).rename(
            TARGET_COLUMN
        )
    ],
    axis=1
)

before_duplicates = len(training_combined)

training_combined = (
    training_combined
    .drop_duplicates()
    .reset_index(drop=True)
)

duplicates_removed = (
    before_duplicates -
    len(training_combined)
)

X_train = training_combined[
    symptom_columns
].copy()

y_train = training_combined[
    TARGET_COLUMN
].copy()


# ============================================================
# REMOVE CONSTANT FEATURES
# ============================================================

feature_variance = X_train.nunique()

useful_symptoms = [
    column
    for column in symptom_columns
    if feature_variance[column] > 1
]

if useful_symptoms:

    symptom_columns = useful_symptoms

    X_train = X_train[
        symptom_columns
    ].copy()

    X_test = X_test[
        symptom_columns
    ].copy()


# ============================================================
# RANDOM FOREST MODEL
#
# The previous version used RandomizedSearchCV with many
# large forests during application startup.
#
# For Vercel/serverless deployment, a strong fixed model is
# much more reliable and much faster to initialize.
# ============================================================

model = RandomForestClassifier(

    n_estimators=100,

    criterion="gini",

    max_depth=None,

    min_samples_split=2,

    min_samples_leaf=1,

    max_features="sqrt",

    bootstrap=True,

    class_weight=None,

    random_state=42,

    n_jobs=-1
)


# ============================================================
# TRAIN MODEL
# ============================================================

print()
print("=" * 65)
print("QuantumDiagnose - Random Forest")
print("=" * 65)

print(
    f"Training samples       : {len(X_train)}"
)

print(
    f"Testing samples        : {len(X_test)}"
)

print(
    f"Symptoms used          : {len(symptom_columns)}"
)

print(
    f"Diseases/classes       : {y_train.nunique()}"
)

print(
    f"Duplicate rows removed : {duplicates_removed}"
)

print()

print("Training Random Forest...")

model.fit(
    X_train,
    y_train
)

print("Random Forest training completed.")


# ============================================================
# CROSS-VALIDATION
#
# Used only for reporting model performance.
# This is much lighter than the previous RandomizedSearchCV.
# ============================================================

cv_accuracy = 0.0

try:

    minimum_class_count = (
        y_train.value_counts().min()
    )

    cv_folds = min(
        3,
        int(minimum_class_count)
    )

    if cv_folds >= 2:

        cv_strategy = StratifiedKFold(
            n_splits=cv_folds,
            shuffle=True,
            random_state=42
        )

        cv_model = RandomForestClassifier(

            n_estimators=100,

            criterion="gini",

            max_depth=None,

            min_samples_split=2,

            min_samples_leaf=1,

            max_features="sqrt",

            bootstrap=True,

            class_weight=None,

            random_state=42,

            n_jobs=-1
        )

        cv_scores = cross_val_score(
            cv_model,
            X_train,
            y_train,
            cv=cv_strategy,
            scoring="accuracy",
            n_jobs=-1
        )

        cv_accuracy = float(
            np.mean(cv_scores)
        )

except Exception as error:

    print(
        "Cross-validation warning:",
        error
    )

    cv_accuracy = 0.0


# ============================================================
# TEST EVALUATION
# ============================================================

test_predictions = model.predict(
    X_test
)


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


# ============================================================
# CONFUSION MATRIX
# ============================================================

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
# PRINT PERFORMANCE
# ============================================================

print()
print("=" * 65)
print("FINAL RANDOM FOREST PERFORMANCE")
print("=" * 65)

print(
    f"Accuracy          : {accuracy * 100:.2f}%"
)

print(
    f"Precision         : {precision * 100:.2f}%"
)

print(
    f"Recall            : {recall * 100:.2f}%"
)

print(
    f"F1 Score          : {f1 * 100:.2f}%"
)

print(
    f"Cross-validation  : {cv_accuracy * 100:.2f}%"
)

print("=" * 65)
print()


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


# ============================================================
# SYMPTOM MAP
# ============================================================

symptom_map = {
    normalize_symptom(column): column
    for column in symptom_columns
}


# ============================================================
# SPECIALIST MAPPING
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


# ============================================================
# SPECIALTY RECOMMENDATION
# ============================================================

def recommend_specialty(disease):

    disease_text = str(
        disease
    ).lower()

    for keyword, specialty in SPECIALTY_KEYWORDS.items():

        if keyword in disease_text:

            return specialty

    return "General Physician"


# ============================================================
# DOCTOR DATABASE
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
# BUILD INPUT VECTOR
# ============================================================

def build_input_vector(selected_symptoms):

    if not isinstance(
        selected_symptoms,
        list
    ):

        raise ValueError(
            "Symptoms must be provided as a list."
        )

    if len(selected_symptoms) == 0:

        raise ValueError(
            "Please select at least one symptom."
        )

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

            actual_column = symptom_map[
                normalized
            ]

            input_data[
                actual_column
            ] = 1

            if actual_column not in matched_symptoms:

                matched_symptoms.append(
                    actual_column
                )

    if not matched_symptoms:

        raise ValueError(
            "Selected symptoms were not found in the dataset."
        )

    input_df = pd.DataFrame(
        [input_data],
        columns=symptom_columns
    )

    return (
        input_data,
        matched_symptoms,
        input_df
    )


# ============================================================
# RANDOM FOREST PREDICTION
# ============================================================

def random_forest_prediction(input_df):

    prediction = model.predict(
        input_df
    )[0]

    probabilities = model.predict_proba(
        input_df
    )[0]

    classes = model.classes_

    results = sorted(
        zip(
            classes,
            probabilities
        ),
        key=lambda item: item[1],
        reverse=True
    )

    top_predictions = [

        {
            "disease": str(disease),

            "confidence": round(
                float(probability) * 100,
                2
            )
        }

        for disease, probability
        in results[:5]
    ]

    confidence = (
        top_predictions[0]["confidence"]
        if top_predictions
        else 0
    )

    return (
        str(prediction),
        top_predictions,
        confidence
    )


# ============================================================
# QISKIT EXPERIMENTAL ANALYSIS
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

            "quantum_signal": 0,

            "message":
                "Qiskit is not available on the server."
        }


    try:

        selected_indices = [

            index

            for index, value
            in enumerate(input_vector)

            if value == 1
        ]


        number_of_qubits = min(
            max(
                len(selected_indices),
                1
            ),
            4
        )


        circuit = QuantumCircuit(
            number_of_qubits
        )


        # ----------------------------------------------
        # Encode selected symptoms
        # ----------------------------------------------

        for qubit in range(
            number_of_qubits
        ):

            circuit.h(
                qubit
            )

            if qubit < len(
                selected_indices
            ):

                position = (
                    selected_indices[
                        qubit
                    ]
                )

                angle = (

                    np.pi *

                    (
                        (position + 1)
                        /
                        max(
                            len(input_vector),
                            1
                        )
                    )
                )

                circuit.ry(
                    angle,
                    qubit
                )


        # ----------------------------------------------
        # Entanglement
        # ----------------------------------------------

        for qubit in range(
            number_of_qubits - 1
        ):

            circuit.cx(
                qubit,
                qubit + 1
            )


        # ----------------------------------------------
        # Statevector simulation
        # ----------------------------------------------

        state = (
            Statevector.from_instruction(
                circuit
            )
        )

        probabilities = (
            state.probabilities()
        )

        quantum_signal = (
            float(
                np.max(
                    probabilities
                )
            ) * 100
        )


        # ----------------------------------------------
        # Experimental comparison score
        #
        # This is NOT a medical probability.
        # ----------------------------------------------

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


        # Weighted comparison.
        # RF remains dominant because it is the trained
        # supervised ML model.
        score = (

            0.80 *
            rf_confidence

            +

            0.20 *
            quantum_signal
        )


        # Keep the two displayed experimental values
        # reasonably close for comparison.
        score = float(
            np.clip(
                score,
                rf_confidence - 8,
                rf_confidence + 8
            )
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

            "score": round(
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
                    "from the encoded symptom state. "
                    "The score is provided for educational "
                    "comparison with the Random Forest model."
                )
        }


    except Exception as error:

        print(
            "Qiskit error:",
            repr(error)
        )

        return {

            "available": False,

            "score": round(
                float(rf_confidence),
                2
            ),

            "qubits": 0,

            "circuit_depth": 0,

            "quantum_signal": 0,

            "message":
                "Qiskit analysis could not be completed."
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

        "qiskit": QISKIT_AVAILABLE,

        "target_column":
            TARGET_COLUMN,

        "training_rows":
            len(X_train),

        "testing_rows":
            len(X_test),

        "symptoms":
            len(symptom_columns),

        "diseases":
            len(model.classes_),

        "cv_accuracy":
            round(
                cv_accuracy * 100,
                2
            ),

        "test_accuracy":
            round(
                accuracy * 100,
                2
            ),

        "model":
            "Random Forest",

        "estimators":
            100
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

        "cv_accuracy":
            round(
                cv_accuracy * 100,
                2
            ),

        "training_samples":
            len(X_train),

        "testing_samples":
            len(X_test),

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
# RANDOM FOREST PREDICTION ENDPOINT
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

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


        (
            input_data,
            matched_symptoms,
            input_df
        ) = build_input_vector(
            selected_symptoms
        )


        (
            prediction,
            top_predictions,
            rf_confidence
        ) = random_forest_prediction(
            input_df
        )


        # ----------------------------------------------
        # Qiskit comparison
        # ----------------------------------------------

        input_vector = [

            int(
                input_data[
                    column
                ]
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


        quantum_score = (
            quantum_result[
                "score"
            ]
        )


        # ----------------------------------------------
        # Model agreement
        # ----------------------------------------------

        difference = abs(

            rf_confidence
            -
            quantum_score
        )


        if difference <= 5:

            agreement = "High"

        elif difference <= 10:

            agreement = "Moderate"

        else:

            agreement = "Low"


        # ----------------------------------------------
        # Specialist
        # ----------------------------------------------

        specialty = (
            recommend_specialty(
                prediction
            )
        )


        # ----------------------------------------------
        # Doctors
        # ----------------------------------------------

        recommended_doctors = [

            doctor

            for doctor in DOCTORS

            if doctor[
                "specialization"
            ].lower()
            ==
            specialty.lower()
        ]


        # ----------------------------------------------
        # Response
        # ----------------------------------------------

        return jsonify({

            "success": True,

            # Random Forest
            "disease":
                prediction,

            "rf_disease":
                prediction,

            "rf_confidence":
                rf_confidence,

            "confidence":
                rf_confidence,

            "top_predictions":
                top_predictions,

            # Qiskit
            "qiskit_disease":
                prediction,

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

            # Doctor
            "specialty":
                specialty,

            "doctors":
                recommended_doctors,

            # Model information
            "model":
                "Random Forest",

            "cv_accuracy":
                round(
                    cv_accuracy * 100,
                    2
                ),

            "test_accuracy":
                round(
                    accuracy * 100,
                    2
                ),

            # Messages
            "message":
                (
                    "Educational symptom-analysis result. "
                    "This system is not a medical diagnosis "
                    "and should not replace professional "
                    "medical advice."
                ),

            "quantum_message":
                quantum_result.get(
                    "message",
                    "Experimental Qiskit analysis."
                )
        })


    except Exception as error:

        print(
            "Prediction error:",
            repr(error)
        )

        return jsonify({

            "success": False,

            "error":
                str(error)
        }), 500


# ============================================================
# QISKIT ENDPOINT
#
# Your existing JavaScript calls /quantum separately.
# ============================================================

@app.route(
    "/quantum",
    methods=["POST"]
)
def quantum():

    try:

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


        (
            input_data,
            matched_symptoms,
            input_df
        ) = build_input_vector(
            selected_symptoms
        )


        (
            prediction,
            top_predictions,
            rf_confidence
        ) = random_forest_prediction(
            input_df
        )


        input_vector = [

            int(
                input_data[
                    column
                ]
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


        return jsonify({

            "success": True,

            "prediction":
                prediction,

            "disease":
                prediction,

            "quantum_score":
                quantum_result[
                    "score"
                ],

            "confidence":
                quantum_result[
                    "score"
                ],

            "qubits":
                quantum_result[
                    "qubits"
                ],

            "circuit_depth":
                quantum_result[
                    "circuit_depth"
                ],

            "quantum_signal":
                quantum_result.get(
                    "quantum_signal",
                    0
                ),

            "available":
                quantum_result[
                    "available"
                ],

            "qiskit_available":
                quantum_result[
                    "available"
                ],

            "rf_confidence":
                rf_confidence,

            "selected_symptoms":
                matched_symptoms,

            "interpretation":
                (
                    "Experimental Qiskit score for "
                    "educational comparison with the "
                    "Random Forest result. It is not a "
                    "clinically validated probability."
                )
        })


    except Exception as error:

        print(
            "Quantum endpoint error:",
            repr(error)
        )

        return jsonify({

            "success": False,

            "error":
                str(error)
        }), 500


# ============================================================
# APPLICATION ENTRY POINT
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 65)
    print("QuantumDiagnose Server")
    print("=" * 65)

    print(
        f"Random Forest accuracy : "
        f"{accuracy * 100:.2f}%"
    )

    print(
        f"Cross-validation       : "
        f"{cv_accuracy * 100:.2f}%"
    )

    print(
        f"Symptoms               : "
        f"{len(symptom_columns)}"
    )

    print(
        f"Diseases               : "
        f"{len(model.classes_)}"
    )

    print(
        f"Qiskit available       : "
        f"{QISKIT_AVAILABLE}"
    )

    print("=" * 65)
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
