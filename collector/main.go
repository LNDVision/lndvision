package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	_ "modernc.org/sqlite"

	macaroons "github.com/lightningnetwork/lnd/macaroons"
	gmacaroon "gopkg.in/macaroon.v2"
	routerrpc "github.com/lightningnetwork/lnd/lnrpc/routerrpc"
	lnrpc "github.com/lightningnetwork/lnd/lnrpc"
)


const (
	lndAddr   = "localhost:10009"
	tlsCert   = "/home/USER/.lnd/tls.cert"
	macaroon  = "/home/USER/.lnd/data/chain/bitcoin/mainnet/admin.macaroon"
	dbPath    = "storage/mc.db"
	pollEvery = 5 * time.Minute
)

func main() {
	creds, err := loadTLS(tlsCert)
	if err != nil {
		log.Fatal(err)
	}

	macBytes, err := os.ReadFile(macaroon)
	if err != nil {
		log.Fatalf("cannot read macaroon: %v", err)
	}
	mac := &gmacaroon.Macaroon{}
	if err := mac.UnmarshalBinary(macBytes); err != nil {
		log.Fatalf("cannot decode macaroon: %v", err)
	}
	macCred, err := macaroons.NewMacaroonCredential(mac)
	if err != nil {
		log.Fatalf("cannot create macaroon credential: %v", err)
	}

	conn, err := grpc.Dial(
		lndAddr,
		grpc.WithTransportCredentials(creds),
		grpc.WithPerRPCCredentials(macCred),
	)
	if err != nil {
		log.Fatal(err)
	}
	client := routerrpc.NewRouterClient(conn)
	lightning := lnrpc.NewLightningClient(conn)

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	// Ensure alias cache table exists
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS node_alias (
		pubkey TEXT PRIMARY KEY,
		alias TEXT
	)`)

	ticker := time.NewTicker(pollEvery)
	for {
		if err := poll(ctx, client, lightning, db); err != nil {
			log.Println("poll:", err)
		}
		<-ticker.C
	}
}


func poll(ctx context.Context, c routerrpc.RouterClient, lightning lnrpc.LightningClient, db *sql.DB) error {
	resp, err := c.QueryMissionControl(ctx, &routerrpc.QueryMissionControlRequest{})
	if err != nil {
		return fmt.Errorf("QueryMissionControl failed: %w", err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("db.Begin failed: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
        INSERT INTO pair_data
        (pair_id,last_fail_time,last_success_time,success_amt_sat,fail_amt_sat)
        VALUES (?,?,?,?,?)
        ON CONFLICT(pair_id) DO UPDATE SET
          last_fail_time=excluded.last_fail_time,
          last_success_time=excluded.last_success_time,
          success_amt_sat=excluded.success_amt_sat,
          fail_amt_sat=excluded.fail_amt_sat
    `)
	if err != nil {
		return fmt.Errorf("tx.Prepare failed: %w", err)
	}
	defer stmt.Close()

	for _, p := range resp.Pairs {
		fromPub := hex.EncodeToString(p.NodeFrom)
		toPub := hex.EncodeToString(p.NodeTo)
		id := fromPub + "-" + toPub
		h := p.History
		failMs := h.FailTime * 1000 // convert sec → ms for DB
		successMs := h.SuccessTime * 1000

		// Cache aliases for both nodes
		for _, pub := range []string{fromPub, toPub} {
			var alias string
			db.QueryRow(`SELECT alias FROM node_alias WHERE pubkey = ?`, pub).Scan(&alias)
			if alias == "" {
				alias, err := getNodeAlias(ctx, lightning, pub)
				if err == nil && alias != "" {
					_, _ = db.Exec(`INSERT OR REPLACE INTO node_alias(pubkey, alias) VALUES (?, ?)`, pub, alias)
				}
			}
		}

		_, err := stmt.Exec(id, failMs, successMs, h.SuccessAmtSat, h.FailAmtSat)
		if err != nil {
			return fmt.Errorf("stmt.Exec failed for pair %s: %w", id, err)
		}
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("tx.Commit failed: %w", err)
	}
	return nil
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
