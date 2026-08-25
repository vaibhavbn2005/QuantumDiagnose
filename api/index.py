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
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True

    )
