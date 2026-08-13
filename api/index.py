from flask import Flask, render_template, request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "data" / "Training.csv"
TEMPLATE_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"


# ============================================================
# FLASK APP
# ============================================================

app = Flask(
    __name__,
    template_folder=str(TEMPLATE_DIR),
    static_folder=str(STATIC_DIR),
    static_url_path="/static"
)


# ============================================================
# LOAD DATASET
# ============================================================

try:
    df = pd.read_csv(DATA_PATH)

    # Remove unwanted pandas index columns
    df = df.loc[
        :,
        ~df.columns.astype(str).str.startswith("Unnamed")
    ]

    # Remove spaces from column names
    df.columns = df.columns.astype(str).str.strip()

except Exception as error:
    print("Dataset loading error:", error)
    raise


# ============================================================
# FIND TARGET COLUMN
# ============================================================

# Your dataset uses "prognosis".
# These alternatives make the code more robust.

possible_targets = [
    "prognosis",
    "disease",
    "Disease",
    "Prognosis"
]

TARGET_COLUMN = None

for column in possible_targets:
    if column in df.columns:
        TARGET_COLUMN = column
        break


if TARGET_COLUMN is None:
    raise ValueError(
        "Target column not found. "
        f"Available columns: {list(df.columns)}"
    )


print("Target column:", TARGET_COLUMN)


# ============================================================
# PREPARE DATA
# ============================================================

symptom_columns = [
    column
    for column in df.columns
    if column != TARGET_COLUMN
]


# Convert symptom values to numeric
for column in symptom_columns:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    ).fillna(0)


X = df[symptom_columns]

y = df[TARGET_COLUMN].astype(str).str.strip()


# ============================================================
# TRAIN RANDOM FOREST
# ============================================================

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
    n_jobs=1
)

model.fit(X, y)


print("Model trained successfully.")
print("Number of symptoms:", len(symptom_columns))
print("Number of diseases:", len(model.classes_))


# ============================================================
# SYMPTOM NAME NORMALIZATION
# ============================================================

def normalize_name(name):

    return (
        str(name)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )


# Map normalized symptom names to actual dataset column names

symptom_map = {
    normalize_name(column): column
    for column in symptom_columns
}


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():

    return render_template(
        "index.html",
        symptoms=symptom_columns
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():

    return jsonify({
        "status": "ok",
        "model": "Random Forest",
        "symptoms": len(symptom_columns),
        "diseases": len(model.classes_)
    })


# ============================================================
# PREDICTION
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        # ----------------------------------------------------
        # GET JSON
        # ----------------------------------------------------

        data = request.get_json(silent=True)

        if data is None:

            return jsonify({
                "error": "Invalid JSON request."
            }), 400


        # ----------------------------------------------------
        # GET SELECTED SYMPTOMS
        # ----------------------------------------------------

        selected_symptoms = data.get("symptoms", [])


        if not isinstance(
            selected_symptoms,
            list
        ):

            return jsonify({
                "error": "Symptoms must be a list."
            }), 400


        if len(selected_symptoms) == 0:

            return jsonify({
                "error":
                    "Please select at least one symptom."
            }), 400


        # ----------------------------------------------------
        # CREATE EMPTY INPUT
        # ----------------------------------------------------

        input_data = {
            symptom: 0
            for symptom in symptom_columns
        }


        # ----------------------------------------------------
        # ADD SELECTED SYMPTOMS
        # ----------------------------------------------------

        matched_symptoms = []
        unknown_symptoms = []

        for symptom in selected_symptoms:

            normalized = normalize_name(symptom)

            if normalized in symptom_map:

                actual_column = symptom_map[normalized]

                input_data[actual_column] = 1

                matched_symptoms.append(
                    actual_column
                )

            else:

                unknown_symptoms.append(
                    symptom
                )


        # ----------------------------------------------------
        # MAKE DATAFRAME
        # ----------------------------------------------------

        input_df = pd.DataFrame(
            [input_data],
            columns=symptom_columns
        )


        # ----------------------------------------------------
        # PREDICT
        # ----------------------------------------------------

        prediction = model.predict(input_df)[0]

        probabilities = model.predict_proba(
            input_df
        )[0]

        classes = model.classes_


        # ----------------------------------------------------
        # SORT RESULTS
        # ----------------------------------------------------

        results = sorted(
            zip(
                classes,
                probabilities
            ),
            key=lambda item: item[1],
            reverse=True
        )


        # ----------------------------------------------------
        # TOP 5 PREDICTIONS
        # ----------------------------------------------------

        top_predictions = []

        for disease, probability in results[:5]:

            top_predictions.append({

                "disease": str(disease),

                "confidence": round(
                    float(probability) * 100,
                    2
                )

            })


        # ----------------------------------------------------
        # TOP CONFIDENCE
        # ----------------------------------------------------

        confidence = (
            top_predictions[0]["confidence"]
            if top_predictions
            else 0
        )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "disease": str(prediction),

            "confidence": confidence,

            "top_predictions":
                top_predictions,

            "selected_symptoms":
                matched_symptoms,

            "unknown_symptoms":
                unknown_symptoms,

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
# VERCEL / LOCAL
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
