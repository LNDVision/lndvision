package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"encoding/hex"
	"log"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	_ "modernc.org/sqlite"

	routerrpc "github.com/lightningnetwork/lnd/lnrpc/routerrpc"
)

const (
	lndAddr   = "localhost:10009"
	tlsCert   = "/home/USER/.lnd/tls.cert"
	macaroon  = "/home/USER/.lnd/data/chain/bitcoin/mainnet/admin.macaroon"
	dbPath    = "../storage/mc.db"
	pollEvery = 5 * time.Minute
)

func main() {
	creds, err := loadTLS(tlsCert)
	if err != nil {
		log.Fatal(err)
	}

	conn, err := grpc.Dial(lndAddr, grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatal(err)
	}
	client := routerrpc.NewRouterClient(conn)

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	ticker := time.NewTicker(pollEvery)
	for {
		if err := poll(ctx, client, db); err != nil {
			log.Println("poll:", err)
		}
		<-ticker.C
	}
}

func poll(ctx context.Context, c routerrpc.RouterClient, db *sql.DB) error {
	resp, err := c.QueryMissionControl(ctx, &routerrpc.QueryMissionControlRequest{})
	if err != nil {
		return err
	}

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
	for _, p := range resp.Pairs {
		id := hex.EncodeToString(p.NodeFrom) + "-" + hex.EncodeToString(p.NodeTo)

		h := p.History
		failMs := h.FailTime * 1000 // convert sec → ms for DB
		successMs := h.SuccessTime * 1000

		_, _ = stmt.Exec(id,
			failMs, successMs,
			h.SuccessAmtSat, h.FailAmtSat,
			failMs, successMs,
			h.SuccessAmtSat, h.FailAmtSat)
	}
	return tx.Commit()
}

func loadTLS(path string) (credentials.TransportCredentials, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	cp := x509.NewCertPool()
	cp.AppendCertsFromPEM(b)
	return credentials.NewTLS(&tls.Config{RootCAs: cp}), nil
}
