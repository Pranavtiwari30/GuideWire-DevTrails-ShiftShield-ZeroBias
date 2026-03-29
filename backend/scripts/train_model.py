"""
Features: [m1_score, m2_score, m3_score, m4_score, m5_score]
Label: 1 = legitimate claim, 0 = fraud / no disruption
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

RANDOM_SEED = 42
N_SAMPLES   = 5_000
MODEL_PATH  = "app/engine/scoring_model.joblib"


def generate_training_data(n: int, seed: int):
    rng = np.random.default_rng(seed)
    X = np.zeros((n, 5), dtype=np.float32)
    y = np.zeros(n, dtype=np.int32)

    for i in range(n):
        scenario = rng.integers(0, 5)

        if scenario == 0:
            # All 5 signals high — clear legitimate claim
            base = rng.uniform(65, 100)
            X[i] = np.clip([
                base + rng.normal(0, 5),
                base + rng.normal(0, 8),
                base + rng.normal(0, 6),
                base + rng.normal(0, 7),
                base + rng.normal(0, 5),
            ], 0, 100)
            y[i] = 1

        elif scenario == 1:
            # Disruption hit just after shift started — M4 low but rest high
            base = rng.uniform(70, 100)
            X[i] = np.clip([
                base + rng.normal(0, 5),
                base + rng.normal(0, 8),
                base + rng.normal(0, 6),
                rng.uniform(15, 45),       # M4 low — just started
                base + rng.normal(0, 5),
            ], 0, 100)
            y[i] = 1

        elif scenario == 2:
            # Fraud: bad weather but rider fully active (gaming attempt)
            X[i] = np.clip([
                rng.uniform(70, 100),  # M1 high
                rng.uniform(5,  30),   # M2 low — rider active (fraud tell)
                rng.uniform(5,  25),   # M3 low — rank unchanged (fraud tell)
                rng.uniform(60, 90),
                rng.uniform(60, 90),
            ], 0, 100)
            y[i] = 0

        elif scenario == 3:
            # Partial signals — 2-3 fire, not enough
            n_active   = rng.integers(2, 4)
            active_idx = rng.choice(5, n_active, replace=False)
            scores     = rng.uniform(5, 35, 5)
            scores[active_idx] = rng.uniform(55, 90, n_active)
            X[i] = np.clip(scores, 0, 100)
            y[i] = 0

        else:
            # No disruption — all signals low
            base = rng.uniform(0, 35)
            X[i] = np.clip([
                base + rng.normal(0, 8),
                base + rng.normal(0, 8),
                base + rng.normal(0, 8),
                base + rng.normal(0, 8),
                base + rng.normal(0, 8),
            ], 0, 100)
            y[i] = 0

    return X, y


def train():
    print("[Train] Generating synthetic training data...")
    X, y = generate_training_data(N_SAMPLES, RANDOM_SEED)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    print(f"[Train] Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"[Train] Legitimate claims in train: {y_train.mean():.2%}")

    base_clf = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        random_state=RANDOM_SEED,
    )

    clf = CalibratedClassifierCV(base_clf, method="isotonic", cv=5)
    clf.fit(X_train, y_train)

    y_pred  = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    auc     = roc_auc_score(y_test, y_proba)

    print("\n[Train] Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Fraudulent", "Legitimate"]))
    print(f"[Train] ROC-AUC: {auc:.4f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"\n[Train] Model saved → {MODEL_PATH}")


if __name__ == "__main__":
    train()