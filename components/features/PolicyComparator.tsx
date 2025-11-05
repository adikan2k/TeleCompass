"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GitCompare, Check, X, AlertCircle, Loader2, Download } from "lucide-react";
import writeXlsxFile from "write-excel-file";

interface StateData {
  id: string;
  name: string;
  abbreviation: string;
  policiesCount: number;
  factsCount: number;
}

interface ComparisonValue {
  state: string;
  value: string;
  confidence: number;
  pageNumber?: number;
}

interface ComparisonField {
  field: string;
  values: ComparisonValue[];
}

interface ComparisonCategory {
  category: string;
  fields: ComparisonField[];
}

export default function PolicyComparator() {
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await fetch("/api/states");
      const data = await response.json();
      
      if (data.success) {
        setStates(
          data.states
            .filter((state: StateData) => state.policiesCount > 0)
            .sort((a: StateData, b: StateData) => b.factsCount - a.factsCount)
        );
      } else {
        setError("Failed to load states");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoadingStates(false);
    }
  };

  const toggleState = (stateName: string) => {
    setSelectedStates(prev => {
      if (prev.includes(stateName)) {
        return prev.filter(s => s !== stateName);
      } else if (prev.length < 3) {
        return [...prev, stateName];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (selectedStates.length < 2) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateNames: selectedStates }),
      });

      const data = await response.json();

      if (data.success) {
        setComparison(data.comparison);
      } else {
        setError(data.error || "Comparison failed");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getValueIcon = (value: string) => {
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes("allowed") || lowerValue.includes("yes") || lowerValue.includes("permitted")) {
      return <Check className="w-4 h-4 text-green-600" />;
    }
    if (lowerValue.includes("not allowed") || lowerValue.includes("no") || lowerValue.includes("prohibited")) {
      return <X className="w-4 h-4 text-red-600" />;
    }
    if (lowerValue.includes("not specified") || lowerValue.includes("unclear")) {
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
    return null;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredStates = useMemo(() => {
    if (!searchTerm.trim()) return states;
    return states.filter((state) =>
      state.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, states]);

  const formatLabel = (value: string) =>
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const findValueForState = (values: ComparisonValue[], stateName: string) =>
    values.find((value) => value.state === stateName);

  const exportRows = useMemo(() => {
    if (comparison.length === 0 || selectedStates.length < 2) return [];

    return comparison.flatMap((category) =>
      category.fields.flatMap((field) =>
        selectedStates.map((stateName) => {
          const stateValue = findValueForState(field.values, stateName);
          return {
            category: formatLabel(category.category),
            field: formatLabel(field.field),
            state: stateName,
            value: stateValue?.value ?? "Not available",
            confidence: stateValue ? Math.round(stateValue.confidence * 100) : 0,
            page: stateValue?.pageNumber ?? "",
          };
        })
      )
    );
  }, [comparison, selectedStates]);

  const handleExportCSV = () => {
    if (exportRows.length === 0) return;

    const header = ["Category", "Field", "State", "Value", "Confidence (%)", "Page"];
    const csvContent = [
      header,
      ...exportRows.map((row) => [
        row.category,
        row.field,
        row.state,
        row.value,
        row.confidence.toString(),
        row.page?.toString() ?? "",
      ]),
    ]
      .map((row) =>
        row
          .map((cell) => {
            const safeCell = cell?.toString() ?? "";
            if (safeCell.includes("\"") || safeCell.includes(",")) {
              return `"${safeCell.replace(/"/g, '""')}"`;
            }
            return safeCell;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `telecompass-comparison-${selectedStates.join("-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) return;

    const headerRow = [
      { value: "Category", fontWeight: "bold" },
      { value: "Field", fontWeight: "bold" },
      { value: "State", fontWeight: "bold" },
      { value: "Value", fontWeight: "bold" },
      { value: "Confidence (%)", fontWeight: "bold" },
      { value: "Page", fontWeight: "bold" },
    ];

    const dataRows = exportRows.map((row) => [
      { value: row.category },
      { value: row.field },
      { value: row.state },
      { value: row.value },
      { value: row.confidence },
      { value: row.page ?? "" },
    ]);

    void writeXlsxFile([headerRow, ...dataRows], {
      fileName: `telecompass-comparison-${selectedStates.join("-")}.xlsx`,
      sheet: "Comparison",
    });
  };

  if (loadingStates) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading states...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Policy Comparator
          </CardTitle>
          <CardDescription>
            Compare telehealth policies across up to 3 states side-by-side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
                <h4 className="text-sm font-medium">
                  Select states to compare (2-3 states):
                </h4>
                <Input
                  placeholder="Search states..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="sm:w-64"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto mt-3">
                {filteredStates.map((state) => (
                  <Button
                    key={state.id}
                    variant={selectedStates.includes(state.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleState(state.name)}
                    disabled={!selectedStates.includes(state.name) && selectedStates.length >= 3}
                    className="justify-between"
                  >
                    <span className="truncate">{state.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {state.factsCount}
                    </Badge>
                  </Button>
                ))}
                {filteredStates.length === 0 && (
                  <div className="col-span-full text-sm text-muted-foreground">
                    No states match "{searchTerm}".
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selected ({selectedStates.length}): {selectedStates.join(", ") || "None"}
              </p>
            </div>

            <Button
              onClick={handleCompare}
              disabled={selectedStates.length < 2 || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Comparing...
                </>
              ) : (
                "Compare Policies"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {comparison.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Comparison Results: {selectedStates.join(" vs ")}
          </h3>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={exportRows.length === 0}
              className="inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={exportRows.length === 0}
              className="inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </Button>
          </div>

          {comparison.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {category.category.replace("_", " ")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border px-3 py-2 text-left w-56">{formatLabel(category.category)}</th>
                        {selectedStates.map((state) => (
                          <th key={state} className="border px-3 py-2 text-left">
                            {state}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {category.fields.map((field) => (
                        <tr key={field.field} className="align-top">
                          <td className="border px-3 py-2 font-medium align-top">
                            {formatLabel(field.field)}
                          </td>
                          {selectedStates.map((state) => {
                            const value = findValueForState(field.values, state);
                            return (
                              <td key={state} className="border px-3 py-2">
                                <div className="space-y-1">
                                  <div className="flex items-start gap-2">
                                    {value?.value ? getValueIcon(value.value) : null}
                                    <span className="text-sm text-muted-foreground">
                                      {value?.value ?? "Not available"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className={getConfidenceColor(value?.confidence ?? 0)}>
                                      {value ? `${Math.round(value.confidence * 100)}% confidence` : "—"}
                                    </span>
                                    {value?.pageNumber && <span>Pg. {value.pageNumber}</span>}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && comparison.length === 0 && selectedStates.length >= 2 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Click "Compare Policies" to see the comparison</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
