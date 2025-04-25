from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib, pandas as pd
import os
import sqlite3
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model", "artifacts", "mc_model.joblib"))
model = joblib.load(MODEL_PATH)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Route(BaseModel):
    total_amt: int = Field(..., example=100000)
    secs_since_success: int = Field(..., example=3600)

@app.post("/predict")
def predict(r: Route):
    X = pd.DataFrame([r.dict()])
    prob = float(model.predict_proba(X)[0,1])
    return {"success_prob": prob}

@app.get("/pairs")
def get_pairs():
    con = sqlite3.connect(os.path.join(os.path.dirname(__file__), "..", "storage", "mc.db"))
    df = pd.read_sql_query("""
        SELECT
          pair_id,
          success_amt_sat,
          fail_amt_sat,
          CASE WHEN success_amt_sat+fail_amt_sat=0 THEN NULL
               ELSE CAST(success_amt_sat AS FLOAT)/(success_amt_sat+fail_amt_sat) END AS success_rate
        FROM pair_data
    """, con)
    con.close()
    out = []
    for _, row in df.iterrows():
        out.append({"id": row["pair_id"], "rate": row["success_rate"] if row["success_rate"] is not None else 0.0})
    import math
    def clean_nans(obj):
        if isinstance(obj, float) and math.isnan(obj):
            return None
        elif isinstance(obj, dict):
            return {k: clean_nans(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_nans(x) for x in obj]
        else:
            return obj
    out = clean_nans(out)
    return JSONResponse(content=out)
