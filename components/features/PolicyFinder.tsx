"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, MapPin, Star } from "lucide-react";
import { truncateText } from "@/lib/utils";

interface SearchResult {
  id: string;
  snippet: string;
  fullContent: string;
  pageNumber: number;
  state: string;
  policyTitle: string;
  relevanceScore: number;
}

const exampleQueries = [
  "Does Florida allow audio-only telehealth visits?",
  "What are California consent requirements for telehealth?",
  "Which states reimburse for remote patient monitoring?",
  "What modifiers are required for Medicaid telehealth billing?",
];

export default function PolicyFinder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const performSearch = async (searchText: string) => {
    const trimmed = searchText.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, topK: 10 }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(query);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Policy Search
          </CardTitle>
          <CardDescription>
            Search across all state telehealth policies using semantic AI search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="e.g., 'consent requirements for live video calls'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="mr-1">Try:</span>
            {exampleQueries.map((example) => (
              <Button
                key={example}
                type="button"
                variant="secondary"
                size="sm"
                className="h-auto px-3 py-2 text-left"
                disabled={loading}
                onClick={() => {
                  void performSearch(example);
                }}
              >
                {example}
              </Button>
            ))}
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

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Found {results.length} relevant results
          </h3>
          
          {results.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{result.state}</span>
                      <FileText className="w-4 h-4 ml-2" />
                      <span>Page {result.pageNumber}</span>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {Math.round(result.relevanceScore * 100)}% match
                    </Badge>
                  </div>
                  
                  <p className="text-sm font-medium text-muted-foreground">
                    {truncateText(result.policyTitle, 80)}
                  </p>
                  
                  <p className="text-sm leading-relaxed">
                    {result.snippet}
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedResult(result);
                      setShowDialog(true);
                    }}
                  >
                    View Full Context
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No results found for "{query}"</p>
            <p className="text-sm mt-2">
              Try different keywords or check your spelling
            </p>
          </CardContent>
        </Card>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedResult?.policyTitle ?? "Policy Context"}
            </DialogTitle>
            {selectedResult && (
              <DialogDescription className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedResult.state}</span>
                  <FileText className="w-4 h-4" />
                  <span>Page {selectedResult.pageNumber}</span>
                  <Badge variant="secondary" className="ml-auto flex items-center gap-1 w-fit">
                    <Star className="w-3 h-3" />
                    {Math.round(selectedResult.relevanceScore * 100)}% match
                  </Badge>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {selectedResult?.fullContent ?? "Full content unavailable."}
              </p>
            </div>
          </ScrollArea>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
