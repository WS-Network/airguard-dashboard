"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import { Send, Bot, User, Loader2, Sparkles, Settings, Trash2, AlertCircle } from "lucide-react";
import { settingsApi } from "@/services/api";
import { useRouter } from "next/navigation";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLoading?: boolean;
}

export default function AIChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasApiKeys, setHasApiKeys] = useState<boolean | null>(null);
  const [isCheckingSettings, setIsCheckingSettings] = useState(true);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [debugTokenExp, setDebugTokenExp] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [externalOpenAIKey, setExternalOpenAIKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInputValue, setKeyInputValue] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkApiKeys();
  }, []);

  useEffect(() => {
    // Debug: Show current access token and expiration
    if (process.env.NODE_ENV === "development") {
      const token = localStorage.getItem("accessToken");
      setDebugToken(token);
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload & { exp?: number }>(token);
          if (decoded.exp) {
            const expDate = new Date(decoded.exp * 1000);
            setDebugTokenExp(expDate.toLocaleString());
          }
        } catch {
          setDebugTokenExp("Invalid token");
        }
      }
    }
  }, []);

  const checkApiKeys = async () => {
    try {
      setIsCheckingSettings(true);
      const response = await settingsApi.getUserSettings();
      
      if (response.success && response.data) {
        const settings = response.data;
        const hasOpenAI = settings.openaiApiKey && settings.openaiApiKey.trim() !== '';
        const hasAnthropic = settings.anthropicApiKey && settings.anthropicApiKey.trim() !== '';
        
        setHasApiKeys(hasOpenAI || hasAnthropic);
        
        // Set initial message based on API key availability
        if (hasOpenAI || hasAnthropic) {
          setMessages([{
            id: "1",
            content: "Hello! I'm your AI assistant. I can help you with questions about Airguard, network management, troubleshooting, and more. How can I assist you today?",
            sender: "ai",
            timestamp: new Date(),
          }]);
        } else {
          setMessages([{
            id: "1",
            content: "To use the AI assistant, you need to configure your API keys first. Please go to Settings to add your OpenAI or Anthropic API key.",
            sender: "ai",
            timestamp: new Date(),
          }]);
        }
      } else {
        setHasApiKeys(false);
        setMessages([{
          id: "1",
          content: "To use the AI assistant, you need to configure your API keys first. Please go to Settings to add your OpenAI or Anthropic API key.",
          sender: "ai",
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
      setHasApiKeys(false);
      setMessages([{
        id: "1",
        content: "Unable to check your API key settings. Please make sure you're logged in and try refreshing the page.",
        sender: "ai",
        timestamp: new Date(),
      }]);
    } finally {
      setIsCheckingSettings(false);
    }
  };

  // Add a function to validate the OpenAI key format (basic check)
  const validateOpenAIKey = (key: string) => {
    return key.startsWith("sk-") && key.length > 40;
  };

  // Helper to build OpenAI messages from chat history
  const buildOpenAIMessages = () => {
    return messages
      .filter(m => m.sender === "user" || m.sender === "ai")
      .map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    // If user provided an external key, use it for OpenAI requests
    if (externalOpenAIKey) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${externalOpenAIKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              ...buildOpenAIMessages(),
              { role: "user", content: userMessage.content },
            ],
            max_tokens: 512,
            temperature: 0.7,
          }),
        });
        if (!openaiRes.ok) {
          let errorMsg = "OpenAI API error";
          try {
            const err = await openaiRes.json();
            errorMsg = err.error?.message || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }
        const data = await openaiRes.json();
        const aiContent = data.choices?.[0]?.message?.content?.trim() || "[No response from OpenAI]";
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiContent,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (err: unknown) {
        let errorMsg = "OpenAI API error";
        if (err instanceof Error) {
          errorMsg = err.message;
        } else if (typeof err === "string") {
          errorMsg = err;
        }
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: `OpenAI API error: ${errorMsg}`,
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
      return;
    }

    // Check if API keys are available
    if (!hasApiKeys) {
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'd love to help you, but I need an API key to function. Please go to Settings and configure your OpenAI or Anthropic API key to start chatting with me!",
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // TODO: Here you would make an actual API call to your AI service
    // For now, show a message that the feature needs implementation
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "AI functionality is ready to be implemented! Your API keys are configured. You can now connect this chat to your preferred AI service (OpenAI, Anthropic, etc.) to provide intelligent responses.",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      setIsTyping(false);
    }, 1500);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (hasApiKeys) {
      setMessages([
        {
          id: "1",
          content: "Hello! I'm your AI assistant. I can help you with questions about Airguard, network management, troubleshooting, and more. How can I assist you today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          id: "1",
          content: "To use the AI assistant, you need to configure your API keys first. Please go to Settings to add your OpenAI or Anthropic API key.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSettingsClick = () => {
    router.push("/dashboard/manage");
  };

  if (isCheckingSettings) {
    return (
      <>
        <Sidebar />
        <div className="ag-main-content min-h-screen bg-gradient-to-br from-ag-black via-ag-black to-ag-black/95 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8 mt-12 lg:mt-0">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-6 h-6 animate-spin text-ag-green" />
                  <span className="text-ag-white">Checking your AI settings...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="ag-main-content min-h-screen bg-gradient-to-br from-ag-black via-ag-black to-ag-black/95 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Debug Panel */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-4 p-3 bg-ag-black/60 border border-ag-green/30 rounded text-xs text-ag-white/80">
              <div><b>Debug: Access Token</b></div>
              <div className="break-all">{debugToken || "No token in localStorage"}</div>
              <div><b>Token Expiration:</b> {debugTokenExp || "N/A"}</div>
            </div>
          )}
          {/* Header */}
          <div className="mb-6 sm:mb-8 mt-12 lg:mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-ag-white text-center md:text-left mb-2">
                  AI Assistant
                </h1>
                <p className="text-ag-white/60 text-sm sm:text-base text-center md:text-left">
                  Get help with Airguard, network management, and troubleshooting
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearChat}
                  className="p-2 text-ag-white/60 hover:text-ag-white hover:bg-ag-green/10 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-ag-white/60 hover:text-ag-white hover:bg-ag-green/10 rounded-lg transition-colors"
                  title="Chat settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-ag-black/40 border border-ag-green/20 rounded-xl backdrop-blur-sm h-[calc(100vh-280px)] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] lg:max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.sender === "user"
                        ? "bg-ag-green/20 text-ag-white border border-ag-green/30"
                        : "bg-ag-white/5 text-ag-white border border-ag-white/10"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {message.sender === "ai" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-ag-green to-ag-green/60 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-ag-black" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-ag-white/80">
                            {message.sender === "user" ? "You" : "AI Assistant"}
                          </span>
                          <span className="text-xs text-ag-white/40">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                      {message.sender === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-ag-blue to-ag-blue/60 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-ag-black" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] lg:max-w-[70%] rounded-2xl px-4 py-3 bg-ag-white/5 text-ag-white border border-ag-white/10">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-ag-green to-ag-green/60 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-ag-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-ag-white/80">
                            AI Assistant
                          </span>
                          <span className="text-xs text-ag-white/40">
                            {formatTime(new Date())}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Loader2 className="w-4 h-4 animate-spin text-ag-green" />
                          <span className="text-sm text-ag-white/60">AI is typing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-ag-green/20 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about Airguard, network management, troubleshooting..."
                    className="w-full bg-ag-black/40 border border-ag-green/20 rounded-xl px-4 py-3 text-ag-white placeholder-ag-white/40 resize-none focus:outline-none focus:border-ag-green/40 focus:ring-1 focus:ring-ag-green/20 transition-all"
                    rows={1}
                    style={{ minHeight: "48px", maxHeight: "120px" }}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3 bg-gradient-to-r from-ag-green to-ag-green/80 hover:from-ag-green/90 hover:to-ag-green/70 disabled:from-ag-white/10 disabled:to-ag-white/5 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-ag-black" />
                  ) : (
                    <Send className="w-5 h-5 text-ag-black" />
                  )}
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {hasApiKeys ? (
                  <>
                    <button
                      onClick={() => setInputValue("How do I check my network health?")}
                      className="px-3 py-1 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/10 rounded-full text-xs text-ag-white/70 hover:text-ag-white transition-colors"
                    >
                      Network Health
                    </button>
                    <button
                      onClick={() => setInputValue("Help me troubleshoot connection issues")}
                      className="px-3 py-1 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/10 rounded-full text-xs text-ag-white/70 hover:text-ag-white transition-colors"
                    >
                      Troubleshooting
                    </button>
                    <button
                      onClick={() => setInputValue("How do I set up a new device?")}
                      className="px-3 py-1 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/10 rounded-full text-xs text-ag-white/70 hover:text-ag-white transition-colors"
                    >
                      Device Setup
                    </button>
                    <button
                      onClick={() => setInputValue("What security features does Airguard provide?")}
                      className="px-3 py-1 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/10 rounded-full text-xs text-ag-white/70 hover:text-ag-white transition-colors"
                    >
                      Security
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSettingsClick}
                    className="px-4 py-2 bg-ag-green/20 hover:bg-ag-green/30 border border-ag-green/50 rounded-lg text-sm text-ag-white font-medium transition-colors flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configure API Keys</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Status Info */}
          <div className="mt-6 p-4 bg-ag-black/20 border border-ag-green/20 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              {hasApiKeys ? (
                <Sparkles className="w-5 h-5 text-ag-green" />
              ) : (
                <AlertCircle className="w-5 h-5 text-ag-orange" />
              )}
              <h3 className="text-ag-white font-medium">
                {hasApiKeys ? "AI Assistant Ready" : "AI Configuration Required"}
              </h3>
            </div>
            {hasApiKeys ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-ag-white/70">
                <div>• Network health monitoring and analysis</div>
                <div>• Device setup and configuration guidance</div>
                <div>• Troubleshooting and problem resolution</div>
                <div>• Performance optimization recommendations</div>
                <div>• Security feature explanations</div>
                <div>• Real-time system status updates</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-ag-white/70">
                  To enable AI chat functionality, you need to configure your API keys:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-ag-white/60">
                  <div>• OpenAI (GPT-3.5, GPT-4)</div>
                  <div>• Anthropic (Claude)</div>
                </div>
                <button
                  onClick={handleSettingsClick}
                  className="mt-3 px-4 py-2 bg-ag-green hover:bg-ag-green/90 text-ag-black font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Go to Settings</span>
                </button>
              </div>
            )}
          </div>

          {/* External OpenAI Key UI */}
          <div className="mt-6 p-4 bg-ag-black/20 border border-ag-green/20 rounded-xl">
            <h3 className="text-ag-white font-medium mb-3">Use External OpenAI API Key</h3>
            {externalOpenAIKey ? (
              <div className="flex items-center gap-2 bg-ag-green/10 border border-ag-green/40 rounded p-2">
                <span className="text-xs text-ag-green font-mono">Using external OpenAI key: <span className="font-bold">{externalOpenAIKey.slice(0, 8)}...{externalOpenAIKey.slice(-4)}</span></span>
                <button
                  className="ml-2 px-2 py-1 text-xs bg-ag-green/30 rounded hover:bg-ag-green/50"
                  onClick={() => { setExternalOpenAIKey(""); setKeyInputValue(""); setShowKeyInput(false); }}
                >
                  Clear Key
                </button>
              </div>
            ) : (
              <>
                {showKeyInput ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={e => {
                      e.preventDefault();
                      if (!validateOpenAIKey(keyInputValue)) {
                        setKeyError("Invalid OpenAI API key format");
                        return;
                      }
                      setExternalOpenAIKey(keyInputValue);
                      setShowKeyInput(false);
                      setKeyError(null);
                    }}
                  >
                    <input
                      type="text"
                      className="px-2 py-1 rounded border border-ag-green/40 bg-ag-black/40 text-ag-white text-xs font-mono w-64"
                      placeholder="Paste your OpenAI API key (sk-...)"
                      value={keyInputValue}
                      onChange={e => { setKeyInputValue(e.target.value); setKeyError(null); }}
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 text-xs bg-ag-green/30 rounded hover:bg-ag-green/50"
                    >
                      Use Key
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-ag-white/10 rounded hover:bg-ag-white/20"
                      onClick={() => { setShowKeyInput(false); setKeyInputValue(""); setKeyError(null); }}
                    >
                      Cancel
                    </button>
                    {keyError && <span className="text-xs text-red-400 ml-2">{keyError}</span>}
                  </form>
                ) : (
                  <button
                    className="px-3 py-1 text-xs bg-ag-green/20 rounded hover:bg-ag-green/40 border border-ag-green/40"
                    onClick={() => setShowKeyInput(true)}
                  >
                    Use External OpenAI API Key
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 