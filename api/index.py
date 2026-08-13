from flask import Flask, render_template, request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

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

df = pd.read_csv(DATA_PATH)


# ============================================================
# DATA PREPARATION
# ============================================================

target_column = "disease"

symptom_columns = [
    column
    for column in df.columns
    if column != target_column
]


X = df[symptom_columns]

y = df[target_column]


# ============================================================
# TRAIN RANDOM FOREST
# ============================================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

model.fit(X, y)


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
# PREDICTION
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "error":
                    "No request data received."
            }), 400


        if "symptoms" not in data:

            return jsonify({
                "error":
                    "No symptoms provided."
            }), 400


        selected_symptoms = data["symptoms"]


        if not selected_symptoms:

            return jsonify({
                "error":
                    "Please select at least one symptom."
            }), 400


        # ----------------------------------------------------
        # Create input
        # ----------------------------------------------------

        input_data = {
            symptom: 0
            for symptom in symptom_columns
        }


        # ----------------------------------------------------
        # Set selected symptoms to 1
        # ----------------------------------------------------

        for symptom in selected_symptoms:

            if symptom in input_data:

                input_data[symptom] = 1


        input_df = pd.DataFrame(
            [input_data]
        )


        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        prediction = model.predict(input_df)[0]

        probabilities = model.predict_proba(input_df)[0]

        classes = model.classes_


        # ----------------------------------------------------
        # Sort predictions
        # ----------------------------------------------------

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
        # Top 5
        # ----------------------------------------------------

        top_predictions = [

            {
                "disease":
                    disease,

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


        confidence = top_predictions[0]["confidence"]


        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return jsonify({

            "disease":
                prediction,

            "confidence":
                confidence,

            "top_predictions":
                top_predictions,

            "message":
                (
                    "This is an educational "
                    "ML prediction and should "
                    "not be used as a medical "
                    "diagnosis."
                )

        })


    except Exception as error:

        print(
            "Prediction error:",
            error
        )

        return jsonify({

            "error":
                str(error)

        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():

    return jsonify({

        "status":
            "ok"

    })


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
