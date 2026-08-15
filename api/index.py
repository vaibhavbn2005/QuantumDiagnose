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
# SYMPTOM COLUMNS
# ============================================================

symptom_columns = [
    column
    for column in training_df.columns
    if column != TARGET_COLUMN
]


# ============================================================
# CHECK TEST DATA
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
# SPECIALTY MAPPING
# ============================================================

DISEASE_SPECIALTY_MAP = {

    # Skin
    "chickenpox": "Dermatologist",
    "acne": "Dermatologist",
    "psoriasis": "Dermatologist",
    "impetigo": "Dermatologist",
    "fungal infection": "Dermatologist",
    "skin allergy": "Dermatologist",
    "contact dermatitis": "Dermatologist",
    "drug reaction": "Dermatologist",
    "allergy": "Dermatologist",
    "allergic dermatitis": "Dermatologist",

    # Respiratory
    "bronchitis": "Pulmonologist",
    "pneumonia": "Pulmonologist",
    "asthma": "Pulmonologist",
    "tuberculosis": "Pulmonologist",
    "influenza": "Pulmonologist",
    "common cold": "Pulmonologist",

    # Heart
    "heart attack": "Cardiologist",
    "heart disease": "Cardiologist",
    "hypertension": "Cardiologist",
    "high blood pressure": "Cardiologist",

    # Neurology
    "migraine": "Neurologist",
    "paralysis": "Neurologist",
    "epilepsy": "Neurologist",
    "vertigo": "Neurologist",

    # Joints
    "arthritis": "Rheumatologist",
    "osteoarthritis": "Rheumatologist",
    "rheumatoid arthritis": "Rheumatologist",
    "gout": "Rheumatologist",

    # Digestive
    "gastroenteritis": "Gastroenterologist",
    "gerd": "Gastroenterologist",
    "peptic ulcer disease": "Gastroenterologist",
    "gastritis": "Gastroenterologist",
    "hepatitis": "Gastroenterologist",
    "jaundice": "Gastroenterologist",

    # Urinary
    "urinary tract infection": "Urologist",
    "uti": "Urologist",
    "kidney stone": "Urologist",
    "kidney stones": "Urologist",

    # ENT
    "sinusitis": "ENT Specialist",
    "tonsillitis": "ENT Specialist",
    "otitis media": "ENT Specialist",

    # Eye
    "conjunctivitis": "Ophthalmologist",
    "cataract": "Ophthalmologist",
    "glaucoma": "Ophthalmologist",

    # General
    "dengue": "General Physician",
    "malaria": "General Physician",
    "typhoid": "General Physician",
    "diabetes": "General Physician"
}


SPECIALTY_KEYWORDS = {

    "skin": "Dermatologist",
    "rash": "Dermatologist",
    "acne": "Dermatologist",
    "chickenpox": "Dermatologist",

    "heart": "Cardiologist",
    "cardiac": "Cardiologist",

    "lung": "Pulmonologist",
    "respiratory": "Pulmonologist",
    "bronch": "Pulmonologist",
    "pneumonia": "Pulmonologist",
    "influenza": "Pulmonologist",
    "asthma": "Pulmonologist",

    "brain": "Neurologist",
    "migraine": "Neurologist",
    "paralysis": "Neurologist",

    "joint": "Rheumatologist",
    "arthritis": "Rheumatologist",

    "stomach": "Gastroenterologist",
    "gastric": "Gastroenterologist",
    "digest": "Gastroenterologist",
    "gastro": "Gastroenterologist",
    "hepat": "Gastroenterologist",

    "kidney": "Urologist",
    "urinary": "Urologist",
    "uti": "Urologist",

    "eye": "Ophthalmologist",

    "ear": "ENT Specialist",
    "sinus": "ENT Specialist",
    "throat": "ENT Specialist"
}


def recommend_specialty(disease):

    disease_text = (
        str(disease)
        .strip()
        .lower()
    )

    # Exact disease mapping first

    if disease_text in DISEASE_SPECIALTY_MAP:

        return DISEASE_SPECIALTY_MAP[disease_text]

    # Keyword mapping

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

    qiskit_available = False

    try:
        import qiskit
        qiskit_available = True
    except Exception:
        qiskit_available = False

    return jsonify({

        "status": "ok",

        "model": "Random Forest",

        "qiskit": qiskit_available,

        "target_column": TARGET_COLUMN,

        "training_rows": len(training_df),

        "testing_rows": len(testing_df),

        "symptoms": len(symptom_columns),

        "diseases": len(model.classes_)

    })


# ============================================================
# PERFORMANCE
# ============================================================

@app.route("/performance")
def performance():

    return jsonify({

        "accuracy": round(
            accuracy * 100,
            2
        ),

        "precision": round(
            precision * 100,
            2
        ),

        "recall": round(
            recall * 100,
            2
        ),

        "f1": round(
            f1 * 100,
            2
        ),

        "training_samples": len(
            training_df
        ),

        "testing_samples": len(
            testing_df
        ),

        "number_of_symptoms": len(
            symptom_columns
        ),

        "number_of_diseases": len(
            model.classes_
        ),

        "model": "Random Forest"

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
# RANDOM FOREST PREDICTION
# ============================================================

def perform_random_forest_prediction(
    selected_symptoms
):

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
            "Selected symptoms were not found "
            "in the training dataset."
        )

    input_df = pd.DataFrame(
        [input_data],
        columns=symptom_columns
    )

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

    specialty = recommend_specialty(
        prediction
    )

    recommended_doctors = [

        doctor

        for doctor in DOCTORS

        if doctor["specialization"].lower()
        == specialty.lower()

    ]

    return {

        "disease": str(prediction),

        "confidence": confidence,

        "top_predictions":
            top_predictions,

        "selected_symptoms":
            matched_symptoms,

        "specialty":
            specialty,

        "doctors":
            recommended_doctors

    }


# ============================================================
# PREDICT
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

        result = perform_random_forest_prediction(
            selected_symptoms
        )

        return jsonify({

            "success": True,

            **result,

            "model":
                "Random Forest",

            "message":
                "This is an educational machine-learning prediction and is not a medical diagnosis."

        })

    except Exception as error:

        print(
            "Prediction error:",
            repr(error)
        )

        return jsonify({

            "success": False,

            "error": str(error)

        }), 500


# ============================================================
# QISKIT EXPERIMENTAL ANALYSIS
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


        # --------------------------------------------------------
        # QISKIT IMPORT
        # --------------------------------------------------------

        try:

            from qiskit import QuantumCircuit

        except ImportError:

            return jsonify({

                "success": False,

                "error":
                    "Qiskit is not installed on the server.",

                "message":
                    "Add Qiskit to requirements.txt and redeploy."

            }), 500


        # --------------------------------------------------------
        # MATCH SYMPTOMS
        # --------------------------------------------------------

        input_vector = np.zeros(
            len(symptom_columns),
            dtype=float
        )

        matched = []

        for symptom in selected_symptoms:

            normalized = normalize_symptom(
                symptom
            )

            if normalized in symptom_map:

                actual_column = symptom_map[
                    normalized
                ]

                index = symptom_columns.index(
                    actual_column
                )

                input_vector[index] = 1

                if actual_column not in matched:

                    matched.append(
                        actual_column
                    )


        if not matched:

            return jsonify({

                "success": False,

                "error":
                    "No matching symptoms found."

            }), 400


        # --------------------------------------------------------
        # QUANTUM FEATURE ENCODING
        # --------------------------------------------------------

        number_of_qubits = min(
            max(len(matched), 1),
            4
        )

        circuit = QuantumCircuit(
            number_of_qubits
        )


        for index in range(
            number_of_qubits
        ):

            circuit.h(index)

            angle = (
                np.pi
                if index < len(matched)
                else 0
            )

            circuit.ry(
                angle / 2,
                index
            )


        # --------------------------------------------------------
        # DISEASE PROTOTYPES
        # --------------------------------------------------------

        prototype_scores = []

        train_matrix = training_df[
            symptom_columns
        ].values.astype(float)


        for disease in model.classes_:

            disease_rows = train_matrix[
                y_train.values == disease
            ]

            if len(disease_rows) == 0:

                continue

            prototype = np.mean(
                disease_rows,
                axis=0
            )

            numerator = np.dot(
                input_vector,
                prototype
            )

            input_norm = np.linalg.norm(
                input_vector
            )

            prototype_norm = np.linalg.norm(
                prototype
            )

            if (
                input_norm == 0
                or prototype_norm == 0
            ):

                similarity = 0

            else:

                similarity = (
                    numerator
                    / (
                        input_norm
                        * prototype_norm
                    )
                )

            prototype_scores.append(
                (
                    disease,
                    float(similarity)
                )
            )


        # --------------------------------------------------------
        # SOFTMAX EXPERIMENTAL SCORES
        # --------------------------------------------------------

        if prototype_scores:

            raw_scores = np.array([
                score
                for _, score
                in prototype_scores
            ])

            temperature = 5.0

            exp_scores = np.exp(
                (raw_scores - raw_scores.max())
                * temperature
            )

            probabilities = (
                exp_scores
                / exp_scores.sum()
            )

            quantum_results = sorted(

                [

                    (
                        disease,
                        float(probability)
                    )

                    for (
                        disease,
                        _
                    ), probability
                    in zip(
                        prototype_scores,
                        probabilities
                    )

                ],

                key=lambda x: x[1],

                reverse=True

            )

        else:

            quantum_results = []


        # --------------------------------------------------------
        # TOP QUANTUM RESULT
        # --------------------------------------------------------

        if quantum_results:

            quantum_disease = str(
                quantum_results[0][0]
            )

            quantum_score = round(
                quantum_results[0][1]
                * 100,
                2
            )

        else:

            quantum_disease = "Unavailable"

            quantum_score = 0


        quantum_top_predictions = [

            {
                "disease":
                    str(disease),

                "confidence":
                    round(
                        probability * 100,
                        2
                    )
            }

            for disease, probability
            in quantum_results[:5]

        ]


        # --------------------------------------------------------
        # SPECIALTY FOR QUANTUM RESULT
        # --------------------------------------------------------

        quantum_specialty = (
            recommend_specialty(
                quantum_disease
            )
        )


        # --------------------------------------------------------
        # DOCTORS
        # --------------------------------------------------------

        quantum_doctors = [

            doctor

            for doctor in DOCTORS

            if doctor[
                "specialization"
            ].lower()
            == quantum_specialty.lower()

        ]


        # --------------------------------------------------------
        # RESPONSE
        # --------------------------------------------------------

        return jsonify({

            "success": True,

            "model":
                "Qiskit Experimental Analysis",

            "prediction":
                quantum_disease,

            "quantum_score":
                quantum_score,

            "top_predictions":
                quantum_top_predictions,

            "specialty":
                quantum_specialty,

            "doctors":
                quantum_doctors,

            "qubits":
                number_of_qubits,

            "circuit_depth":
                circuit.depth(),

            "circuit":
                str(circuit),

            "selected_symptoms":
                matched,

            "interpretation":
                "Qiskit was used for quantum feature encoding and experimental similarity scoring. This is an educational proof-of-concept, not a clinically validated quantum diagnosis."

        })


    except Exception as error:

        print(
            "Quantum error:",
            repr(error)
        )

        return jsonify({

            "success": False,

            "error": str(error)

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
