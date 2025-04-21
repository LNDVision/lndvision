package main

import (
    "context"
    "database/sql"
    "testing"
)

type mockRouter struct{}

type mockPair struct {
    id string
    lastFailTime int64
    lastSuccessTime int64
    successAmtSat int64
    failAmtSat int64
}

func (m *mockRouter) QueryMissionControl(ctx context.Context) ([]mockPair, error) {
    return []mockPair{
        {"A-B", 1000, 2000, 10, 20},
        {"B-C", 1100, 2100, 0, 30},
    }, nil
}

func pollMock(ctx context.Context, c *mockRouter, db *sql.DB) error {
    pairs, err := c.QueryMissionControl(ctx)
    if err != nil { return err }
    tx, _ := db.Begin()
    stmt, _ := tx.Prepare(`
        INSERT INTO pair_data
        (pair_id,last_fail_time,last_success_time,success_amt_sat,fail_amt_sat)
        VALUES (?,?,?,?,?)
        ON CONFLICT(pair_id) DO UPDATE SET
          last_fail_time=?,
          last_success_time=?,
          success_amt_sat=?,
          fail_amt_sat=?`)
    for _, p := range pairs {
        _, _ = stmt.Exec(p.id,
            p.lastFailTime, p.lastSuccessTime,
            p.successAmtSat, p.failAmtSat,
            p.lastFailTime, p.lastSuccessTime,
            p.successAmtSat, p.failAmtSat)
    }
    return tx.Commit()
}

func TestPollMock(t *testing.T) {
    db, _ := sql.Open("sqlite", ":memory:")
    db.Exec(`CREATE TABLE pair_data (pair_id TEXT PRIMARY KEY, last_fail_time INTEGER, last_success_time INTEGER, success_amt_sat INTEGER, fail_amt_sat INTEGER)`)
    mock := &mockRouter{}
    if err := pollMock(context.Background(), mock, db); err != nil {
        t.Fatal(err)
    }
    var n int
    db.QueryRow(`SELECT COUNT(*) FROM pair_data`).Scan(&n)
    if n != 2 { t.Fatalf("expected 2 rows, got %d", n) }
}
