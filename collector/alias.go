package main

import (
	context "context"
	"fmt"
	lnrpc "github.com/lightningnetwork/lnd/lnrpc"
)

// getNodeAlias fetches the alias for a node pubkey using lnrpc.LightningClient
func getNodeAlias(ctx context.Context, client lnrpc.LightningClient, pubkey string) (string, error) {
	resp, err := client.GetNodeInfo(ctx, &lnrpc.NodeInfoRequest{PubKey: pubkey})
	if err != nil {
		return "", fmt.Errorf("GetNodeInfo failed: %w", err)
	}
	return resp.Node.Alias, nil
}
