from flask import Flask, request, jsonify
import os
import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

app = Flask(__name__)

# ============================================================
# QISKIT IMPORTS
# ============================================================

QISKIT_AVAILABLE = True

try:
    from qiskit.circuit.library import ZZFeatureMap
    from qiskit_machine_learning.kernels import FidelityQuantumKernel
    from qiskit_machine_learning.algorithms import QSVC
except Exception as e:
    QISKIT_AVAILABLE = False
    print("Qiskit unavailable:", e)


# ============================================================
# GLOBAL VARIABLES
# ============================================================

rf_model = None
qiskit_model = None

scaler = None
label_encoder = None

feature_columns = None
class_names = None

rf_accuracy = 0
rf_precision = 0
rf_recall = 0
rf_f1 = 0

q_accuracy = 0
q_precision = 0
q_recall = 0
q_f1 = 0

models_loaded = False


# ============================================================
# FIND DATASET
# ============================================================

def find_file(possible_names):

    for name in possible_names:

        paths = [
            os.path.join("data", name),
            os.path.join(".", name),
            os.path.join("api", "data", name)
        ]

        for path in paths:
            if os.path.exists(path):
                return path

    return None


# ============================================================
# LOAD DATASETS
# ============================================================

def load_datasets():

    train_path = find_file([
        "train.csv",
        "training.csv",
        "Training.csv",
        "diabetes_train.csv"
    ])

    test_path = find_file([
        "test.csv",
        "testing.csv",
        "Testing.csv",
        "diabetes_test.csv"
    ])

    if train_path is None:
        raise FileNotFoundError(
            "Training dataset not found. Put train.csv inside data/"
        )

    if test_path is None:
        raise FileNotFoundError(
            "Testing dataset not found. Put test.csv inside data/"
        )

    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    return train_df, test_df


# ============================================================
# FIND TARGET COLUMN
# ============================================================

def find_target_column(df):

    possible_targets = [
        "Outcome",
        "outcome",
        "target",
        "Target",
        "label",
        "Label",
        "diagnosis",
        "Diagnosis",
        "class",
        "Class"
    ]

    for column in possible_targets:

        if column in df.columns:
            return column

    # fallback: last column
    return df.columns[-1]


# ============================================================
# PREPARE DATA
# ============================================================

def prepare_data():

    global scaler
    global label_encoder
    global feature_columns
    global class_names

    train_df, test_df = load_datasets()

    target_column = find_target_column(train_df)

    # Make sure test contains target
    if target_column not in test_df.columns:
        raise ValueError(
            f"Testing dataset does not contain target column: {target_column}"
        )

    X_train = train_df.drop(columns=[target_column]).copy()
    X_test = test_df.drop(columns=[target_column]).copy()

    y_train = train_df[target_column].copy()
    y_test = test_df[target_column].copy()

    # Keep same columns
    feature_columns = list(X_train.columns)

    X_test = X_test[feature_columns]

    # Convert categorical columns if any
    for column in feature_columns:

        if X_train[column].dtype == "object":

            combined = pd.concat(
                [X_train[column], X_test[column]]
            ).astype(str)

            mapping = {
                value: index
                for index, value in enumerate(
                    combined.unique()
                )
            }

            X_train[column] = (
                X_train[column]
                .astype(str)
                .map(mapping)
            )

            X_test[column] = (
                X_test[column]
                .astype(str)
                .map(mapping)
            )

    # Fill missing values
    X_train = X_train.replace(
        [np.inf, -np.inf],
        np.nan
    )

    X_test = X_test.replace(
        [np.inf, -np.inf],
        np.nan
    )

    X_train = X_train.fillna(X_train.median(numeric_only=True))
    X_test = X_test.fillna(X_train.median(numeric_only=True))

    # Encode labels
    label_encoder = LabelEncoder()

    combined_y = pd.concat(
        [
            y_train.astype(str),
            y_test.astype(str)
        ]
    )

    label_encoder.fit(combined_y)

    y_train_encoded = label_encoder.transform(
        y_train.astype(str)
    )

    y_test_encoded = label_encoder.transform(
        y_test.astype(str)
    )

    class_names = list(
        label_encoder.classes_
    )

    # Scaling
    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return (
        X_train_scaled,
        X_test_scaled,
        y_train_encoded,
        y_test_encoded
    )


# ============================================================
# TRAIN RANDOM FOREST
# ============================================================

def train_random_forest(
    X_train,
    X_test,
    y_train,
    y_test
):

    global rf_model
    global rf_accuracy
    global rf_precision
    global rf_recall
    global rf_f1

    rf_model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced"
    )

    rf_model.fit(
        X_train,
        y_train
    )

    predictions = rf_model.predict(
        X_test
    )

    rf_accuracy = accuracy_score(
        y_test,
        predictions
    )

    rf_precision = precision_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    rf_recall = recall_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    rf_f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )


# ============================================================
# TRAIN QISKIT MODEL
# ============================================================

def train_qiskit(
    X_train,
    X_test,
    y_train,
    y_test
):

    global qiskit_model
    global q_accuracy
    global q_precision
    global q_recall
    global q_f1

    if not QISKIT_AVAILABLE:

        print(
            "Qiskit Machine Learning is not available."
        )

        return

    # Quantum circuits become expensive with many features.
    # Use maximum 8 features.
    number_of_features = min(
        X_train.shape[1],
        8
    )

    X_train_q = X_train[:, :number_of_features]
    X_test_q = X_test[:, :number_of_features]

    feature_map = ZZFeatureMap(
        feature_dimension=number_of_features,
        reps=2
    )

    quantum_kernel = FidelityQuantumKernel(
        feature_map=feature_map
    )

    qiskit_model = QSVC(
        quantum_kernel=quantum_kernel
    )

    qiskit_model.fit(
        X_train_q,
        y_train
    )

    predictions = qiskit_model.predict(
        X_test_q
    )

    q_accuracy = accuracy_score(
        y_test,
        predictions
    )

    q_precision = precision_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    q_recall = recall_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    q_f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )


# ============================================================
# LOAD MODELS
# ============================================================

def initialize_models():

    global models_loaded

    if models_loaded:
        return

    print("Loading datasets...")

    (
        X_train,
        X_test,
        y_train,
        y_test
    ) = prepare_data()

    print("Training Random Forest...")

    train_random_forest(
        X_train,
        X_test,
        y_train,
        y_test
    )

    print("Training Qiskit...")

    try:

        train_qiskit(
            X_train,
            X_test,
            y_train,
            y_test
        )

    except Exception as e:

        print(
            "Qiskit training failed:",
            str(e)
        )

    models_loaded = True

    print("Models loaded successfully.")


# ============================================================
# ROOT
# ============================================================

@app.route("/")
def home():

    return jsonify({
        "status": "Quantum Diagnose API running",
        "models": {
            "random_forest": rf_model is not None,
            "qiskit": qiskit_model is not None
        }
    })


# ============================================================
# MODEL STATUS
# ============================================================

@app.route("/api/status")
def status():

    return jsonify({

        "success": True,

        "random_forest": {
            "available": rf_model is not None,
            "accuracy": round(
                rf_accuracy * 100,
                2
            )
        },

        "qiskit": {
            "available": qiskit_model is not None,
            "accuracy": round(
                q_accuracy * 100,
                2
            )
        },

        "features": feature_columns,
        "classes": class_names
    })


# ============================================================
# ANALYZE SYMPTOMS
# ============================================================

@app.route(
    "/api/analyze",
    methods=["POST"]
)
def analyze():

    try:

        initialize_models()

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No symptom data received."
            }), 400

        # ====================================================
        # CREATE INPUT
        # ====================================================

        values = []

        for feature in feature_columns:

            value = data.get(feature, 0)

            try:
                value = float(value)
            except:
                value = 0

            values.append(value)

        input_array = np.array(
            [values],
            dtype=float
        )

        input_scaled = scaler.transform(
            input_array
        )

        # ====================================================
        # RANDOM FOREST
        # ====================================================

        rf_prediction = rf_model.predict(
            input_scaled
        )[0]

        rf_probabilities = rf_model.predict_proba(
            input_scaled
        )[0]

        rf_index = int(
            np.argmax(rf_probabilities)
        )

        rf_label = label_encoder.inverse_transform(
            [rf_prediction]
        )[0]

        rf_confidence = float(
            rf_probabilities[rf_index]
        )

        # ====================================================
        # RANDOM FOREST ALL CLASS PROBABILITIES
        # ====================================================

        rf_all = {}

        for index, probability in enumerate(
            rf_probabilities
        ):

            label = label_encoder.inverse_transform(
                [index]
            )[0]

            rf_all[str(label)] = round(
                float(probability) * 100,
                2
            )

        # ====================================================
        # QISKIT
        # ====================================================

        q_result = None

        if qiskit_model is not None:

            quantum_features = min(
                input_scaled.shape[1],
                8
            )

            quantum_input = (
                input_scaled[
                    :,
                    :quantum_features
                ]
            )

            q_prediction = qiskit_model.predict(
                quantum_input
            )[0]

            q_label = label_encoder.inverse_transform(
                [q_prediction]
            )[0]

            # QSVC decision function
            try:

                decision = qiskit_model.decision_function(
                    quantum_input
                )

                decision = np.asarray(
                    decision
                ).flatten()

                # Convert decision scores into
                # confidence-like percentages
                if len(class_names) == 2:

                    score = float(
                        decision[0]
                    )

                    positive = (
                        1 /
                        (
                            1 +
                            np.exp(-score)
                        )
                    )

                    if int(q_prediction) == 1:
                        q_confidence = positive
                    else:
                        q_confidence = (
                            1 - positive
                        )

                else:

                    exp_scores = np.exp(
                        decision -
                        np.max(decision)
                    )

                    probabilities = (
                        exp_scores /
                        np.sum(exp_scores)
                    )

                    q_index = int(
                        q_prediction
                    )

                    q_confidence = float(
                        probabilities[q_index]
                    )

            except Exception:

                q_confidence = 0.5

            q_result = {

                "prediction": str(
                    q_label
                ),

                "confidence": round(
                    q_confidence * 100,
                    2
                ),

                "type": "Quantum Kernel QSVC",

                "test_accuracy": round(
                    q_accuracy * 100,
                    2
                ),

                "precision": round(
                    q_precision * 100,
                    2
                ),

                "recall": round(
                    q_recall * 100,
                    2
                ),

                "f1_score": round(
                    q_f1 * 100,
                    2
                )
            }

        # ====================================================
        # FINAL RESPONSE
        # ====================================================

        response = {

            "success": True,

            "random_forest": {

                "prediction": str(
                    rf_label
                ),

                "confidence": round(
                    rf_confidence * 100,
                    2
                ),

                "probabilities": rf_all,

                "type": "Random Forest",

                "test_accuracy": round(
                    rf_accuracy * 100,
                    2
                ),

                "precision": round(
                    rf_precision * 100,
                    2
                ),

                "recall": round(
                    rf_recall * 100,
                    2
                ),

                "f1_score": round(
                    rf_f1 * 100,
                    2
                )
            },

            "qiskit": q_result,

            "features_used": feature_columns,

            "message":
                "Results are model predictions and should not be treated as a medical diagnosis."
        }

        return jsonify(response)

    except Exception as e:

        print(
            "Analysis error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# VERCEL
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
