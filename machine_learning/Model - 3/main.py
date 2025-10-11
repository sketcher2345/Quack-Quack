import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeRegressor
import joblib
import os

# --- Paths ---
DATA_PATH = "Datasets/Final_data/combined_data.csv"
NEW_DATA_PATH = "Datasets/Final_data/test_data.csv"
MODEL_PATH = "Models/model.pkl"
OUTPUT_PATH = "Predictions/predicted_scores.csv"


def train_model():
    print(" Loading dataset...")
    df = pd.read_csv(DATA_PATH)

    lower_map = {c.lower(): c for c in df.columns}
    if "score" not in lower_map:
        raise KeyError(
            "Target column 'score' not found. Available columns: "
            + ", ".join(df.columns)
        )
    target_col = lower_map["score"]

    X = df.drop(columns=[target_col])
    y = df[target_col]

    print(" Training Decision Tree model (memorization mode)...")
    model = DecisionTreeRegressor(random_state=42, max_depth=None)
    model.fit(X, y)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    bundle = {"model": model, "feature_names": list(X.columns)}
    joblib.dump(bundle, MODEL_PATH)
    print(f"✅ Model saved at {MODEL_PATH}")


def predict_scores():
    print(" Loading model and new data...")
    loaded = joblib.load(MODEL_PATH)

   
    if isinstance(loaded, dict) and "model" in loaded:
        model = loaded["model"]
        feature_names = loaded.get("feature_names")
    else:
        model = loaded
        feature_names = None

    new_data_original = pd.read_csv(NEW_DATA_PATH)

    lower_map_new = {c.lower(): c for c in new_data_original.columns}
    team_col = lower_map_new.get("team")
    team_series = new_data_original[team_col].copy() if team_col else None

    X_pred = new_data_original.copy()


    if feature_names is not None:
        for col in feature_names:
            if col not in X_pred.columns:
                X_pred[col] = 0
        X_pred = X_pred[feature_names]
    else:
        model_feats = getattr(model, "feature_names_in_", None)
        if model_feats is not None:
            model_feats = list(map(str, model_feats))
            for col in model_feats:
                if col not in X_pred.columns:
                    X_pred[col] = 0
            X_pred = X_pred[model_feats]

    print(" Predicting scores...")
    predictions = model.predict(X_pred)
    try:
        predictions = np.rint(predictions).astype(int)
    except Exception:
        predictions = pd.Series(predictions).round(0).astype(int).values

    output_df = X_pred.copy()
    if team_series is not None and team_col not in output_df.columns:
        output_df.insert(0, team_col, team_series.values)
    output_df["predicted_score"] = predictions
    try:
        output_df["predicted_score"] = output_df["predicted_score"].astype(int)
    except Exception:
        pass

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    output_df.to_csv(OUTPUT_PATH, index=False)
    print(f"✅ Predictions saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    if not os.path.exists(MODEL_PATH):
        train_model()
    predict_scores()
