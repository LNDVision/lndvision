import sqlite3, pandas as pd, time
con = sqlite3.connect('storage/mc.db')

while True:
    df = pd.read_sql_query("""
        SELECT
          pair_id,
          success_amt_sat,
          fail_amt_sat,
          CAST(strftime('%s','now') - last_success_time/1000 AS INT) AS secs_since_success,
          CASE WHEN success_amt_sat+fail_amt_sat=0 THEN NULL
               ELSE CAST(success_amt_sat AS FLOAT)/(success_amt_sat+fail_amt_sat) END AS success_rate
        FROM pair_data
    """, con)

    df['success_rate'] = pd.to_numeric(df['success_rate'], errors='coerce')
    worst = df.nsmallest(10, 'success_rate')
    print("\n=== Worst 10 pairs ===")
    print(worst[['pair_id','success_rate']])
    time.sleep(60*10)   # rerun every 10 min
