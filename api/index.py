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


# Remove accidental pandas index columns

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
    "disease",
    "Disease",
    "Prognosis"
]

for column in possible_targets:

    if column in training_df.columns:

        TARGET_COLUMN = column
        break


if TARGET_COLUMN is None:

    raise RuntimeError(
        "Could not find target column. "
        f"Training columns: {list(training_df.columns)}"
    )


# ============================================================
# FIND SYMPTOM COLUMNS
# ============================================================

symptom_columns = [
    column
    for column in training_df.columns
    if column != TARGET_COLUMN
]


# ============================================================
# MAKE TRAINING AND TESTING COLUMNS MATCH
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
# MODEL EVALUATION
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


# Confusion matrix

labels = sorted(
    list(
        set(y_test)
        | set(test_predictions)
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

    "heart": "Cardiologist",
    "cardiac": "Cardiologist",

    "lung": "Pulmonologist",
    "respiratory": "Pulmonologist",
    "bronch": "Pulmonologist",

    "brain": "Neurologist",
    "migraine": "Neurologist",

    "joint": "Rheumatologist",
    "arthritis": "Rheumatologist",

    "stomach": "Gastroenterologist",
    "gastric": "Gastroenterologist",
    "digest": "Gastroenterologist",

    "kidney": "Nephrologist",
    "urinary": "Urologist",

    "eye": "Ophthalmologist",

    "ear": "ENT Specialist",

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
# DUMMY DOCTORS
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
    }
]


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

        "model": "Random Forest",

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
# MODEL PERFORMANCE
# ============================================================

@app.route("/performance")
def performance():

    return jsonify({

        "accuracy":
            round(accuracy * 100, 2),

        "precision":
            round(precision * 100, 2),

        "recall":
            round(recall * 100, 2),

        "f1":
            round(f1 * 100, 2),

        "training_samples":
            len(training_df),

        "testing_samples":
            len(testing_df),

        "number_of_symptoms":
            len(symptom_columns),

        "number_of_diseases":
            len(model.classes_),

        "model":
            "Random Forest"

    })


# ============================================================
# SYMPTOMS
# ============================================================

@app.route("/symptoms")
def symptoms():

    return jsonify({
        "symptoms": symptom_columns
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

            if doctor["specialization"].lower()
            == specialty.lower()

        ]

    else:

        filtered = DOCTORS


    return jsonify({
        "doctors": filtered
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

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({
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
                "error":
                    "Symptoms must be provided as a list."
            }), 400


        if len(selected_symptoms) == 0:

            return jsonify({
                "error":
                    "Please select at least one symptom."
            }), 400


        # Create empty vector

        input_data = {
            symptom: 0
            for symptom in symptom_columns
        }


        matched_symptoms = []


        # Match symptoms

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

                matched_symptoms.append(
                    actual_column
                )


        if not matched_symptoms:

            return jsonify({

                "error":
                    "Selected symptoms were not "
                    "found in the training dataset."

            }), 400


        # DataFrame

        input_df = pd.DataFrame(
            [input_data],
            columns=symptom_columns
        )


        # Prediction

        prediction = model.predict(
            input_df
        )[0]


        probabilities = model.predict_proba(
            input_df
        )[0]


        classes = model.classes_


        # Sort

        results = sorted(
            zip(
                classes,
                probabilities
            ),
            key=lambda item:
                item[1],
            reverse=True
        )


        # Top 5

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


        confidence = (
            top_predictions[0]["confidence"]
            if top_predictions
            else 0
        )


        # Specialist

        specialty = recommend_specialty(
            prediction
        )


        # Doctors

        recommended_doctors = [

            doctor
            for doctor in DOCTORS

            if doctor["specialization"].lower()
            == specialty.lower()

        ]


        return jsonify({

            "success": True,

            "disease":
                str(prediction),

            "confidence":
                confidence,

            "top_predictions":
                top_predictions,

            "selected_symptoms":
                matched_symptoms,

            "specialty":
                specialty,

            "doctors":
                recommended_doctors,

            "model":
                "Random Forest",

            "message":
                (
                    "This is an educational "
                    "machine-learning prediction "
                    "and is not a medical diagnosis."
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
# QUANTUM ANALYSIS
# ============================================================

@app.route(
    "/quantum",
    methods=["POST"]
)
def quantum_analysis():

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({
                "error":
                    "No quantum input received."
            }), 400


        selected_symptoms = data.get(
            "symptoms",
            []
        )


        if not selected_symptoms:

            return jsonify({
                "error":
                    "Select symptoms first."
            }), 400


        # ----------------------------------------------------
        # QISKIT
        # ----------------------------------------------------

        try:

            from qiskit import QuantumCircuit

        except ImportError:

            return jsonify({

                "error":
                    "Qiskit is not installed on the server.",

                "message":
                    "Install qiskit in requirements.txt."

            }), 500


        # Use at most 4 qubits for a lightweight demonstration

        number_of_qubits = min(
            max(len(selected_symptoms), 1),
            4
        )


        circuit = QuantumCircuit(
            number_of_qubits,
            number_of_qubits
        )


        # Encode selected symptoms

        for index in range(
            number_of_qubits
        ):

            circuit.h(index)


            if index < len(
                selected_symptoms
            ):

                circuit.ry(
                    np.pi / 2,
                    index
                )


        circuit.measure(
            range(number_of_qubits),
            range(number_of_qubits)
        )


        # ----------------------------------------------------
        # EXPERIMENTAL QUANTUM SCORE
        # ----------------------------------------------------

        # This is intentionally an experimental
        # quantum feature representation.
        #
        # It should NOT be described as a
        # clinically validated quantum diagnosis.

        quantum_score = round(
            min(
                len(selected_symptoms)
                / max(len(symptom_columns), 1),
                1
            ) * 100,
            2
        )


        return jsonify({

            "success": True,

            "model":
                "Qiskit Quantum Analysis",

            "qubits":
                number_of_qubits,

            "circuit_depth":
                circuit.depth(),

            "circuit":

                str(circuit),

            "quantum_score":
                quantum_score,

            "interpretation":
                (
                    "Experimental quantum feature "
                    "encoding completed. This quantum "
                    "component is a research/educational "
                    "demonstration and is not a "
                    "medical diagnosis."
                )

        })


    except Exception as error:

        print(
            "Quantum error:",
            repr(error)
        )

        return jsonify({

            "success": False,

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
