from flask import Flask, request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "data" / "Training.csv"


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)


# ============================================================
# LOAD DATASET
# ============================================================

try:
    df = pd.read_csv(DATA_PATH)

    # Remove accidental spaces from column names
    df.columns = df.columns.str.strip()

except Exception as error:
    raise RuntimeError(
        f"Could not load Training.csv: {error}"
    )


# ============================================================
# FIND TARGET COLUMN
# ============================================================

possible_targets = [
    "disease",
    "Disease",
    "prognosis",
    "Prognosis",
    "diagnosis",
    "Diagnosis"
]

TARGET_COLUMN = None

for column in possible_targets:
    if column in df.columns:
        TARGET_COLUMN = column
        break


if TARGET_COLUMN is None:

    raise RuntimeError(
        "Target column not found. "
        "Expected one of: disease, prognosis, diagnosis. "
        f"Available columns: {list(df.columns)}"
    )


# ============================================================
# SYMPTOM COLUMNS
# ============================================================

symptom_columns = [
    column
    for column in df.columns
    if column != TARGET_COLUMN
]


# ============================================================
# CLEAN DATA
# ============================================================

# Convert symptom columns to numeric values
for column in symptom_columns:

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    ).fillna(0)


# Remove rows with missing target
df = df.dropna(
    subset=[TARGET_COLUMN]
)


# ============================================================
# TRAINING DATA
# ============================================================

X = df[symptom_columns]

y = df[TARGET_COLUMN]


# ============================================================
# RANDOM FOREST MODEL
# ============================================================

model = RandomForestClassifier(
    n_estimators=500,
    random_state=42,
    class_weight="balanced",
    max_features="sqrt",
    n_jobs=1
)

model.fit(X, y)


# ============================================================
# HOME
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "QuantumDiagnose ML API is running",
        "target_column": TARGET_COLUMN,
        "number_of_symptoms": len(symptom_columns),
        "number_of_diseases": len(model.classes_)
    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "model": "Random Forest",
        "target_column": TARGET_COLUMN
    })


# ============================================================
# GET SYMPTOMS
# ============================================================

@app.route("/symptoms", methods=["GET"])
def get_symptoms():

    return jsonify({
        "symptoms": symptom_columns
    })


# ============================================================
# PREDICTION
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        # ----------------------------------------------------
        # READ JSON
        # ----------------------------------------------------

        data = request.get_json(
            silent=True
        )

        if data is None:

            return jsonify({
                "error": "Invalid JSON request."
            }), 400


        # ----------------------------------------------------
        # CHECK SYMPTOMS
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # NORMALIZE SYMPTOMS
        # ----------------------------------------------------

        selected_symptoms = [
            str(symptom).strip()
            for symptom in selected_symptoms
        ]


        # ----------------------------------------------------
        # CREATE INPUT VECTOR
        # ----------------------------------------------------

        input_data = {
            symptom: 0
            for symptom in symptom_columns
        }


        # ----------------------------------------------------
        # SET SELECTED SYMPTOMS = 1
        # ----------------------------------------------------

        valid_symptoms = []

        for symptom in selected_symptoms:

            if symptom in input_data:

                input_data[symptom] = 1

                valid_symptoms.append(
                    symptom
                )


        if len(valid_symptoms) == 0:

            return jsonify({
                "error":
                    "None of the selected symptoms "
                    "exist in the training dataset.",
                "available_symptoms":
                    symptom_columns
            }), 400


        # ----------------------------------------------------
        # CREATE DATAFRAME
        # ----------------------------------------------------

        input_df = pd.DataFrame(
            [input_data],
            columns=symptom_columns
        )


        # ----------------------------------------------------
        # PREDICTION
        # ----------------------------------------------------

        prediction = model.predict(
            input_df
        )[0]


        # ----------------------------------------------------
        # PROBABILITIES
        # ----------------------------------------------------

        probabilities = model.predict_proba(
            input_df
        )[0]


        classes = model.classes_


        # ----------------------------------------------------
        # SORT ALL PREDICTIONS
        # ----------------------------------------------------

        results = sorted(
            zip(
                classes,
                probabilities
            ),
            key=lambda x: x[1],
            reverse=True
        )


        # ----------------------------------------------------
        # TOP 5 PREDICTIONS
        # ----------------------------------------------------

        top_predictions = []


        for disease, probability in results[:5]:

            top_predictions.append({

                "disease":
                    str(disease),

                "confidence":
                    round(
                        float(probability) * 100,
                        2
                    )

            })


        # ----------------------------------------------------
        # MAIN CONFIDENCE
        # ----------------------------------------------------

        confidence = round(
            float(probabilities.max()) * 100,
            2
        )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "disease":
                str(prediction),

            "confidence":
                confidence,

            "selected_symptoms":
                valid_symptoms,

            "top_predictions":
                top_predictions,

            "message":
                (
                    "This is an educational "
                    "machine-learning prediction "
                    "and should not be used as "
                    "a medical diagnosis."
                )

        })


    except Exception as error:

        print(
            "Prediction error:",
            str(error)
        )

        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# ============================================================
# VERCEL ENTRY POINT
# ============================================================

# Vercel will automatically use the Flask
# application object named "app".
