import sqlite3, pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import brier_score_loss
import joblib, pathlib, os

con = sqlite3.connect('storage/mc.db')
df = pd.read_sql_query("""
    SELECT
      (success_amt_sat+fail_amt_sat) AS total_amt,
      success_amt_sat,
      fail_amt_sat,
      CAST(strftime('%s','now') - last_success_time/1000 AS INT) AS secs_since_success,
      CASE WHEN success_amt_sat > 0 THEN 1 ELSE 0 END AS label
    FROM pair_data
""", con)

X = df[['total_amt','secs_since_success']]
y = df['label']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.2, shuffle=True)

model = GradientBoostingClassifier().fit(X_train, y_train)
prob = model.predict_proba(X_test)[:,1]
print("Brier:", brier_score_loss(y_test, prob))

artifact_dir = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(artifact_dir, exist_ok=True)
joblib.dump(model, os.path.join(artifact_dir, "mc_model.joblib"))
