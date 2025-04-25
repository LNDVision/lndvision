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
          p.pair_id,
          p.success_amt_sat,
          p.fail_amt_sat,
          CASE WHEN p.success_amt_sat+p.fail_amt_sat=0 THEN NULL
               ELSE CAST(p.success_amt_sat AS FLOAT)/(p.success_amt_sat+p.fail_amt_sat) END AS success_rate,
          p.pair_id as pair_id_str,
          substr(p.pair_id, 1, instr(p.pair_id, '-')-1) as from_pubkey,
          substr(p.pair_id, instr(p.pair_id, '-')+1) as to_pubkey,
          a1.alias as from_alias,
          a2.alias as to_alias
        FROM pair_data p
        LEFT JOIN node_alias a1 ON a1.pubkey = substr(p.pair_id, 1, instr(p.pair_id, '-')-1)
        LEFT JOIN node_alias a2 ON a2.pubkey = substr(p.pair_id, instr(p.pair_id, '-')+1)
    """, con)
    con.close()
    out = []
    for _, row in df.iterrows():
        out.append({
            "id": row["pair_id"],
            "rate": row["success_rate"] if row["success_rate"] is not None else 0.0,
            "from_pubkey": row["from_pubkey"],
            "to_pubkey": row["to_pubkey"],
            "from_alias": row["from_alias"],
            "to_alias": row["to_alias"]
        })
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
