import json, sqlite3, pathlib, time, os, hashlib
data = json.load(open('mock_pairs.json'))
pathlib.Path('storage').mkdir(exist_ok=True)
con = sqlite3.connect('storage/mc.db')
con.executescript(open('storage/init.sql').read())          # schema from scaffold
for p in data:
    pair_id = p['node_from'] + '-' + p['node_to']
    h = p['history']
    con.execute("""INSERT OR REPLACE INTO pair_data
        (pair_id,last_fail_time,last_success_time,success_amt_sat,fail_amt_sat)
        VALUES (?,?,?,?,?)""",
        (pair_id, h['fail_time']*1000, h['success_time']*1000,
         h['success_amt_sat'], h['fail_amt_sat']))
con.commit()
print("[✓] Inserted", len(data), "rows into storage/mc.db")
