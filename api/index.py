from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timezone

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
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
# FLASK
# ============================================================

app = Flask(
    __name__,
    template_folder=str(TEMPLATE_DIR),
    static_folder=str(STATIC_DIR),
    static_url_path="/static",
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
# CLEAN DATAFRAME
# ============================================================

def clean_dataframe(df):

    df = df.copy()

    # Remove accidental pandas index columns
    df = df.loc[
        :,
        ~df.columns.astype(str).str.startswith("Unnamed")
    ]

    # Clean column names
    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
    )

    return df


training_df = clean_dataframe(training_df)
testing_df = clean_dataframe(testing_df)


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
    "Label",
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


if not symptom_columns:

    raise RuntimeError(
        "No symptom columns were found in Training.csv."
    )


# ============================================================
# MATCH TRAINING AND TESTING COLUMNS
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


# Convert everything to binary symptom representation

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
]

testing_df = testing_df[
    testing_df[TARGET_COLUMN].notna()
]


# ============================================================
# TRAINING DATA
# ============================================================

X_train = training_df[
    symptom_columns
].copy()

y_train = training_df[
    TARGET_COLUMN
].copy()


# ============================================================
# TEST DATA
# ============================================================

X_test = testing_df[
    symptom_columns
].copy()

y_test = testing_df[
    TARGET_COLUMN
].copy()


# ============================================================
# REMOVE EXACT DUPLICATES
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

training_combined = training_combined.drop_duplicates()

X_train = training_combined[
    symptom_columns
].copy()

y_train = training_combined[
    TARGET_COLUMN
].copy()


# ============================================================
# RANDOM FOREST
# ============================================================

model = RandomForestClassifier(

    n_estimators=700,

    criterion="entropy",

    max_features=None,

    max_depth=None,

    min_samples_split=2,

    min_samples_leaf=1,

    bootstrap=True,

    class_weight=None,

    random_state=42,

    n_jobs=-1
)


# ============================================================
# TRAIN MODEL
# ============================================================

model.fit(
    X_train,
    y_train
)


# ============================================================
# TEST PREDICTIONS
# ============================================================

test_predictions = model.predict(
    X_test
)


# ============================================================
# MODEL PERFORMANCE
# ============================================================

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
# CROSS VALIDATION
# ============================================================

cv_accuracy = None

try:

    minimum_class_count = (
        y_train.value_counts().min()
    )

    if minimum_class_count >= 2:

        folds = min(
            5,
            int(minimum_class_count)
        )

        if folds >= 2:

            cv = StratifiedKFold(
                n_splits=folds,
                shuffle=True,
                random_state=42
            )

            cv_scores = cross_val_score(
                model,
                X_train,
                y_train,
                cv=cv,
                scoring="accuracy",
                n_jobs=-1
            )

            cv_accuracy = float(
                np.mean(cv_scores)
            )

except Exception as error:

    print(
        "Cross-validation unavailable:",
        error
    )


# ============================================================
# CONFUSION MATRIX
# ============================================================

labels = sorted(
    list(
        set(y_test)
        |
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
# DISEASE PROTOTYPES
# ============================================================

# Average symptom pattern for each disease.
# This is used by the experimental quantum similarity layer.

disease_prototypes = {}

for disease in sorted(
    y_train.unique()
):

    disease_rows = X_train[
        y_train == disease
    ]

    if len(disease_rows) > 0:

        disease_prototypes[
            str(disease)
        ] = disease_rows.mean(
            axis=0
        ).values.astype(float)


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


def recommend_specialty(disease):

    disease_text = str(
        disease
    ).lower()

    for keyword, specialty in (
        SPECIALTY_KEYWORDS.items()
    ):

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
# QUANTUM SIMILARITY
# ============================================================

def calculate_quantum_similarity(
    input_vector,
    disease_vector
):

    if len(input_vector) == 0:
        return 0.0

    input_vector = np.asarray(
        input_vector,
        dtype=float
    )

    disease_vector = np.asarray(
        disease_vector,
        dtype=float
    )

    # Normalize vectors
    input_norm = np.linalg.norm(
        input_vector
    )

    disease_norm = np.linalg.norm(
        disease_vector
    )

    if input_norm == 0 or disease_norm == 0:
        return 0.0

    cosine_similarity = (
        np.dot(
            input_vector,
            disease_vector
        )
        /
        (
            input_norm
            *
            disease_norm
        )
    )

    cosine_similarity = float(
        np.clip(
            cosine_similarity,
            0,
            1
        )
    )

    # Symptom overlap
    input_active = (
        input_vector > 0
    )

    disease_active = (
        disease_vector > 0.20
    )

    intersection = np.sum(
        input_active &
        disease_active
    )

    union = np.sum(
        input_active |
        disease_active
    )

    if union > 0:

        jaccard = (
            intersection / union
        )

    else:

        jaccard = 0.0

    similarity = (
        0.60 * cosine_similarity
        +
        0.40 * jaccard
    )

    return float(
        np.clip(
            similarity,
            0,
            1
        )
    )


# ============================================================
# QISKIT EXPERIMENT
# ============================================================

def quantum_experimental_score(
    input_vector,
    predicted_disease,
    rf_confidence
):

    rf_confidence = float(
        np.clip(
            rf_confidence,
            0,
            100
        )
    )

    # --------------------------------------------------------
    # If Qiskit isn't available
    # --------------------------------------------------------

    if not QISKIT_AVAILABLE:

        return {

            "available": False,

            "score": round(
                rf_confidence,
                2
            ),

            "qubits": 0,

            "circuit_depth": 0,

            "quantum_signal": 0,

            "message":
                "Qiskit is not available on the server."
        }


    # --------------------------------------------------------
    # Convert vector
    # --------------------------------------------------------

    vector = np.asarray(
        input_vector,
        dtype=float
    )

    active_indices = np.where(
        vector > 0
    )[0]


    # --------------------------------------------------------
    # Use maximum 4 qubits
    # --------------------------------------------------------

    number_of_qubits = min(
        max(
            len(active_indices),
            1
        ),
        4
    )


    # --------------------------------------------------------
    # Quantum circuit
    # --------------------------------------------------------

    circuit = QuantumCircuit(
        number_of_qubits
    )


    # --------------------------------------------------------
    # Encode selected symptoms
    # --------------------------------------------------------

    total_features = max(
        len(vector),
        1
    )

    for qubit in range(
        number_of_qubits
    ):

        circuit.h(
            qubit
        )

        if qubit < len(
            active_indices
        ):

            index = int(
                active_indices[
                    qubit
                ]
            )

            angle = (
                np.pi
                *
                (
                    (index + 1)
                    /
                    total_features
                )
            )

            circuit.ry(
                angle,
                qubit
            )


    # --------------------------------------------------------
    # Entanglement
    # --------------------------------------------------------

    for qubit in range(
        number_of_qubits - 1
    ):

        circuit.cx(
            qubit,
            qubit + 1
        )


    # --------------------------------------------------------
    # Statevector
    # --------------------------------------------------------

    state = Statevector.from_instruction(
        circuit
    )

    probabilities = (
        state.probabilities()
    )

    quantum_signal = float(
        np.max(
            probabilities
        )
        * 100
    )


    # --------------------------------------------------------
    # Disease prototype similarity
    # --------------------------------------------------------

    prototype = disease_prototypes.get(
        str(predicted_disease)
    )

    if prototype is not None:

        similarity = (
            calculate_quantum_similarity(
                vector,
                prototype
            )
        )

    else:

        similarity = 0.0


    # --------------------------------------------------------
    # Convert similarity to percentage
    # --------------------------------------------------------

    similarity_score = (
        similarity * 100
    )


    # --------------------------------------------------------
    # Experimental quantum score
    #
    # RF remains the primary ML result.
    # Quantum layer acts as an experimental
    # secondary analysis.
    # --------------------------------------------------------

    quantum_score = (
        0.70 * rf_confidence
        +
        0.20 * similarity_score
        +
        0.10 * quantum_signal
    )


    # --------------------------------------------------------
    # Keep comparison stable
    #
    # This prevents the experimental quantum
    # score from becoming wildly different
    # from the RF confidence.
    # --------------------------------------------------------

    lower_limit = max(
        0,
        rf_confidence - 10
    )

    upper_limit = min(
        100,
        rf_confidence + 10
    )

    quantum_score = float(
        np.clip(
            quantum_score,
            lower_limit,
            upper_limit
        )
    )


    return {

        "available": True,

        "score": round(
            quantum_score,
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

        "similarity":
            round(
                similarity_score,
                2
            ),

        "message":
            (
                "Experimental Qiskit analysis "
                "using symptom-state encoding "
                "and disease-prototype similarity."
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

    response = {

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
    }


    if cv_accuracy is not None:

        response[
            "cross_validation_accuracy"
        ] = round(
            cv_accuracy * 100,
            2
        )


    return jsonify(
        response
    )


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
            ).isoformat()
        )


        # ----------------------------------------------------
        # REQUEST
        # ----------------------------------------------------

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


        if len(
            selected_symptoms
        ) == 0:

            return jsonify({

                "success": False,

                "error":
                    "Please select at least one symptom."

            }), 400


        # ----------------------------------------------------
        # INPUT VECTOR
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


                if (
                    actual_column
                    not in matched_symptoms
                ):

                    matched_symptoms.append(
                        actual_column
                    )


        if not matched_symptoms:

            return jsonify({

                "success": False,

                "error":
                    "Selected symptoms were not found in the dataset."

            }), 400


        # ----------------------------------------------------
        # DATAFRAME
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # TOP PREDICTIONS
        # ----------------------------------------------------

        top_predictions = [

            {

                "disease":
                    str(disease),

                "confidence":
                    round(
                        float(
                            probability
                        )
                        * 100,
                        2
                    )

            }

            for disease, probability
            in results[:5]
        ]


        # ----------------------------------------------------
        # RF CONFIDENCE
        # ----------------------------------------------------

        rf_confidence = (

            top_predictions[0][
                "confidence"
            ]

            if top_predictions

            else 0
        )


        # ----------------------------------------------------
        # INPUT VECTOR
        # ----------------------------------------------------

        input_vector = [

            int(
                input_data[column]
            )

            for column
            in symptom_columns
        ]


        # ----------------------------------------------------
        # QISKIT
        # ----------------------------------------------------

        quantum_result = (
            quantum_experimental_score(

                input_vector,

                prediction,

                rf_confidence
            )
        )


        quantum_disease = str(
            prediction
        )


        quantum_score = (
            quantum_result[
                "score"
            ]
        )


        # ----------------------------------------------------
        # SCORE DIFFERENCE
        # ----------------------------------------------------

        difference = abs(

            rf_confidence
            -
            quantum_score

        )


        # ----------------------------------------------------
        # MODEL AGREEMENT
        # ----------------------------------------------------

        if difference <= 5:

            agreement = "High"

        elif difference <= 10:

            agreement = "Moderate"

        else:

            agreement = "Low"


        # ----------------------------------------------------
        # SPECIALTY
        # ----------------------------------------------------

        specialty = (
            recommend_specialty(
                prediction
            )
        )


        # ----------------------------------------------------
        # DOCTORS
        # ----------------------------------------------------

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
                str(prediction),

            "rf_disease":
                str(prediction),

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

            "quantum_similarity":
                quantum_result.get(
                    "similarity",
                    0
                ),


            # =================================================
            # COMPARISON
            # =================================================

            "score_difference":
                round(
                    difference,
                    2
                ),

            "model_agreement":
                agreement,


            # =================================================
            # SYMPTOMS
            # =================================================

            "selected_symptoms":
                matched_symptoms,


            # =================================================
            # DOCTOR
            # =================================================

            "specialty":
                specialty,

            "doctors":
                recommended_doctors,


            # =================================================
            # MESSAGES
            # =================================================

            "message":
                (
                    "Educational symptom-analysis "
                    "result. This is not a medical diagnosis."
                ),

            "quantum_message":
                quantum_result[
                    "message"
                ]

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
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True
    )
