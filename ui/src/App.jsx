import React, { useState, useEffect } from "react";
import axios from "axios";
import "./dashboard.css";
import Layout from "./components/Layout";
import FiltersPanel from "./components/FiltersPanel";
import PairsTable from "./components/PairsTable";
import PairDetailPanel from "./components/PairDetailPanel";
import NotificationBadge from "./components/NotificationBadge";
import PredictionTool from "./components/PredictionTool";
import Charts from "./components/Charts";

function App() {
  const [pairs, setPairs] = useState([]);
  const [filters, setFilters] = useState({ search: "", minSuccessRate: "", maxFailures: "" });
  const [selectedPair, setSelectedPair] = useState(null);
  const [problemCount, setProblemCount] = useState(0);

  useEffect(() => {
    axios.get("/api/pairs").then((r) => {
      setPairs(r.data);
      setSelectedPair(null);
    });
  }, []);

  // Filtering logic
  const filteredPairs = pairs.filter((p) => {
    const searchMatch =
      !filters.search ||
      (p.alias && p.alias.toLowerCase().includes(filters.search.toLowerCase())) ||
      (p.pair_id && p.pair_id.toLowerCase().includes(filters.search.toLowerCase()));
    const minRateMatch =
      !filters.minSuccessRate ||
      (p.success_rate !== null && p.success_rate !== undefined && p.success_rate * 100 >= Number(filters.minSuccessRate));
    const maxFailuresMatch =
      !filters.maxFailures ||
      (p.fail_amt_sat !== undefined && p.fail_amt_sat <= Number(filters.maxFailures));
    return searchMatch && minRateMatch && maxFailuresMatch;
  });

  // Problematic channels: success rate < 20%
  useEffect(() => {
    setProblemCount(pairs.filter((p) => p.success_rate !== null && p.success_rate < 0.2).length);
  }, [pairs]);

  const handleClearFilters = () => setFilters({ search: "", minSuccessRate: "", maxFailures: "" });

  return (
    <Layout
      filters={
        <FiltersPanel
          filters={filters}
          onChange={setFilters}
          onClear={handleClearFilters}
        />
      }
      table={
        <>
          <Charts
            data={filteredPairs.map(p => p.rate !== undefined ? p.rate : (p.success_rate || 0))}
            type="distribution"
            label="Success Rate Distribution"
          />
          <PairsTable
            pairs={filteredPairs}
            onSelect={setSelectedPair}
            selectedPairId={selectedPair ? selectedPair.pair_id : null}
          />
        </>
      }
      detail={
        <>
          <PairDetailPanel pair={selectedPair} />
          {selectedPair && (
            <>
              <Charts
                data={selectedPair ? [selectedPair.success_amt_sat || 0, selectedPair.fail_amt_sat || 0] : []}
                type="bar"
                label="Success vs Fail (sat)"
              />
              <PredictionTool pairId={selectedPair.pair_id} />
            </>
          )}
        </>
      }
      notification={
        <NotificationBadge
          count={problemCount}
          label={"channels < 20% success"}
          onClick={() => setFilters(f => ({ ...f, minSuccessRate: "", maxFailures: "", search: "" }))}
        />
      }
    />
  );
}
export default App;
  