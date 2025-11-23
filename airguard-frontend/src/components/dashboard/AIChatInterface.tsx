"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Mic, MicOff } from "lucide-react";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLoading?: boolean;
}

interface AIChatInterfaceProps {
  onSendMessage?: (message: string) => Promise<string>;
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  showCapabilities?: boolean;
  showQuickActions?: boolean;
}

export default function AIChatInterface({
  onSendMessage,
  initialMessage = "Hello! I'm your AI assistant. How can I help you today?",
  placeholder = "Type your message here...",
  className = "",
  showCapabilities = true,
  showQuickActions = true,
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: initialMessage,
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateDefaultResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return "Hello! How can I help you today?";
    } else if (lowerInput.includes("thank")) {
      return "You're welcome! I'm here to help. Feel free to ask me anything.";
    } else if (lowerInput.includes("help")) {
      return "I can help you with various tasks. Could you please be more specific about what you need assistance with?";
    } else {
      return "I understand you're asking about '" + userInput + "'. I'm here to help with your questions and tasks. Could you please provide more specific details?";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      let aiResponse: string;
      
      if (onSendMessage) {
        // Use custom message handler if provided
        aiResponse = await onSendMessage(currentInput);
      } else {
        // Use default response logic
        aiResponse = generateDefaultResponse(currentInput);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        content: initialMessage,
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // In a real implementation, this would integrate with Web Speech API
    if (!isListening) {
      // Start listening
      console.log("Starting voice input...");
    } else {
      // Stop listening
      console.log("Stopping voice input...");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const quickActions = [
    { label: "Help", action: () => setInputValue("I need help") },
    { label: "Settings", action: () => setInputValue("Show me the settings") },
    { label: "Status", action: () => setInputValue("What's the current status?") },
    { label: "Report", action: () => setInputValue("Generate a report") },
  ];

  return (
    <div className={`bg-ag-black/40 border border-ag-green/20 rounded-xl backdrop-blur-sm h-[calc(100vh-280px)] flex flex-col ${className}`}>
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
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full bg-ag-black/40 border border-ag-green/20 rounded-xl px-4 py-3 text-ag-white placeholder-ag-white/40 resize-none focus:outline-none focus:border-ag-green/40 focus:ring-1 focus:ring-ag-green/20 transition-all"
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
              disabled={isLoading}
            />
          </div>
          
          {/* Voice Input Button */}
          <button
            onClick={toggleVoiceInput}
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-ag-white/10 hover:bg-ag-white/20 text-ag-white"
            }`}
            title={isListening ? "Stop voice input" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          
          {/* Send Button */}
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
        {showQuickActions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="px-3 py-1 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/10 rounded-full text-xs text-ag-white/70 hover:text-ag-white transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Capabilities Info */}
      {showCapabilities && (
        <div className="border-t border-ag-green/20 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-ag-green" />
            <h3 className="text-ag-white font-medium text-sm">AI Assistant Capabilities</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-ag-white/70">
            <div>• Natural language processing</div>
            <div>• Context-aware responses</div>
            <div>• Voice input support</div>
            <div>• Real-time assistance</div>
          </div>
        </div>
      )}
    </div>
  );
} 