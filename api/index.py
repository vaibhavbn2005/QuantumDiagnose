from flask import Flask, render_template, request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

TRAINING_PATH = BASE_DIR / "data" / "Training.csv"
TESTING_PATH = BASE_DIR / "data" / "Testing.csv"

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
# LOAD DATASETS
# ============================================================

training_df = pd.read_csv(TRAINING_PATH)
testing_df = pd.read_csv(TESTING_PATH)


# ============================================================
# CLEAN DATASET
# ============================================================

TARGET_COLUMN = "prognosis"

# Remove unwanted automatically generated columns
training_df = training_df.drop(
    columns=["Unnamed: 133"],
    errors="ignore"
)

testing_df = testing_df.drop(
    columns=["Unnamed: 133"],
    errors="ignore"
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
# TRAINING DATA
# ============================================================

X_train = training_df[symptom_columns]
y_train = training_df[TARGET_COLUMN]


# ============================================================
# TESTING DATA
# ============================================================

X_test = testing_df[symptom_columns]
y_test = testing_df[TARGET_COLUMN]


# ============================================================
# RANDOM FOREST MODEL
# ============================================================

model = RandomForestClassifier(
    n_estimators=500,
    random_state=42,
    n_jobs=-1
)

model.fit(
    X_train,
    y_train
)


# ============================================================
# MODEL ACCURACY
# ============================================================

test_accuracy = model.score(
    X_test,
    y_test
)


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
                "error": "No request data received."
            }), 400


        if "symptoms" not in data:

            return jsonify({
                "error": "No symptoms provided."
            }), 400


        selected_symptoms = data["symptoms"]


        if not isinstance(
            selected_symptoms,
            list
        ):

            return jsonify({
                "error": "Symptoms must be a list."
            }), 400


        if not selected_symptoms:

            return jsonify({
                "error":
                    "Please select at least one symptom."
            }), 400


        # ====================================================
        # CREATE INPUT VECTOR
        # ====================================================

        input_data = {
            symptom: 0
            for symptom in symptom_columns
        }


        # ====================================================
        # SET SELECTED SYMPTOMS
        # ====================================================

        valid_symptoms = []

        for symptom in selected_symptoms:

            if symptom in input_data:

                input_data[symptom] = 1

                valid_symptoms.append(symptom)


        if not valid_symptoms:

            return jsonify({
                "error":
                    "None of the selected symptoms "
                    "were recognized by the model."
            }), 400


        # ====================================================
        # CREATE DATAFRAME
        # ====================================================

        input_df = pd.DataFrame(
            [input_data],
            columns=symptom_columns
        )


        # ====================================================
        # PREDICTION
        # ====================================================

        prediction = model.predict(
            input_df
        )[0]


        # ====================================================
        # PREDICTION PROBABILITIES
        # ====================================================

        probabilities = model.predict_proba(
            input_df
        )[0]

        classes = model.classes_


        # ====================================================
        # SORT PREDICTIONS
        # ====================================================

        results = sorted(
            zip(
                classes,
                probabilities
            ),
            key=lambda item: item[1],
            reverse=True
        )


        # ====================================================
        # TOP 5 PREDICTIONS
        # ====================================================

        top_predictions = []

        for disease, probability in results[:5]:

            top_predictions.append({

                "disease":
                    disease,

                "confidence":
                    round(
                        float(probability) * 100,
                        2
                    )

            })


        # ====================================================
        # PRIMARY CONFIDENCE
        # ====================================================

        confidence = (
            top_predictions[0]["confidence"]
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "disease":
                prediction,

            "confidence":
                confidence,

            "top_predictions":
                top_predictions,

            "selected_symptoms":
                valid_symptoms,

            "model_accuracy":
                round(
                    test_accuracy * 100,
                    2
                ),

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
            error
        )

        return jsonify({

            "error":
                str(error)

        }), 500


# ============================================================
# MODEL PERFORMANCE
# ============================================================

@app.route("/model-performance")
def model_performance():

    return jsonify({

        "model":
            "Random Forest",

        "training_samples":
            len(training_df),

        "testing_samples":
            len(testing_df),

        "number_of_symptoms":
            len(symptom_columns),

        "number_of_diseases":
            y_train.nunique(),

        "accuracy":
            round(
                test_accuracy * 100,
                2
            )

    })


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
