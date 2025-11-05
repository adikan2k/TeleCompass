"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Brain, Quote, HelpCircle, CheckCircle } from "lucide-react";

const exampleQuestions = [
  "Can providers prescribe controlled substances via telehealth in Texas?",
  "What consent is required before telehealth visits in California?",
  "Does Florida allow audio-only telehealth for Medicaid?",
  "Are remote patient monitoring devices reimbursed in New York?",
];

interface Citation {
  content: string;
  pageNumber: number;
  stateName: string;
  policyTitle: string;
}

interface QAResponse {
  answer: string;
  confidence: number;
  citations: Citation[];
  suggestedQueries?: string[];
}

interface ConversationEntry {
  question: string;
  response: QAResponse;
}

export default function QAInterface() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askQuestion = async (prompt: string) => {
    const trimmedQuestion = prompt.trim();
    if (!trimmedQuestion) return;

    setLoading(true);
    setError("");

    try {
      const history = conversation.flatMap((entry) => [
        { role: "user", content: entry.question },
        { role: "assistant", content: entry.response.answer },
      ]);

      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuestion, history }),
      });

      const data = await res.json();

      if (data.success) {
        setConversation((prev) => [
          ...prev,
          {
            question: trimmedQuestion,
            response: {
              answer: data.answer,
              confidence: data.confidence,
              citations: data.citations ?? [],
              suggestedQueries: data.suggestedQueries,
            },
          },
        ]);
        setQuestion("");
      } else {
        setError(data.error || "Failed to get answer");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await askQuestion(question);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="w-3 h-3" />;
    if (confidence >= 0.6) return <HelpCircle className="w-3 h-3" />;
    return <HelpCircle className="w-3 h-3" />;
  };

  const hasConversation = conversation.length > 0;
  const conversationHistory = useMemo(
    () =>
      conversation.map((entry, index) => ({
        ...entry,
        label: `Exchange ${index + 1}`,
        isLatest: index === conversation.length - 1,
      })),
    [conversation]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Ask Questions
          </CardTitle>
          <CardDescription>
            Get AI-powered answers about telehealth policies with citations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="e.g., 'Can I prescribe controlled substances via telehealth in Texas?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Ask"}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="mr-1">Try:</span>
            {exampleQuestions.map((example) => (
              <Button
                key={example}
                type="button"
                variant="secondary"
                size="sm"
                className="h-auto px-3 py-2 text-left"
                disabled={loading}
                onClick={() => {
                  setQuestion(example);
                  void askQuestion(example);
                }}
              >
                {example}
              </Button>
            ))}
          </div>
          {hasConversation && (
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConversation([])}
                disabled={loading}
              >
                Clear conversation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {hasConversation && (
        <div className="space-y-6">
          {conversationHistory.map(({ question: q, response: answer, label, isLatest }, idx) => (
            <div key={idx} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{q}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Answer
                    </CardTitle>
                    <Badge className={`${getConfidenceColor(answer.confidence)} flex items-center gap-1`}>
                      {getConfidenceIcon(answer.confidence)}
                      {Math.round(answer.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer.answer}</p>
                </CardContent>
              </Card>

              {answer.citations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Quote className="w-5 h-5" />
                      Citations ({answer.citations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {answer.citations.map((citation, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span className="font-medium">[{index + 1}]</span>
                            <span>{citation.stateName}</span>
                            <span>•</span>
                            <span>Page {citation.pageNumber}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{citation.content.substring(0, 200)}...</p>
                          <p className="text-xs text-muted-foreground mt-1">{citation.policyTitle}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {isLatest && answer.suggestedQueries && answer.suggestedQueries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      Suggested Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {answer.suggestedQueries.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="h-auto p-3 text-left justify-start"
                          onClick={() => setQuestion(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && !hasConversation && !question && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ask a question to get started</p>
            <p className="text-sm mt-2">
              I'll search through all telehealth policies to find the answer
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
