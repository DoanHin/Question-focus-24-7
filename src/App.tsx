/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Conversation, UserProfile, ServerConfig } from './types';
import {
  getStoredUser,
  saveStoredUser,
  getStoredConversations,
  saveStoredConversations,
  generateTitleFromMessage,
} from './services/storageService';
import { sendChatMessage, getServerConfig, AIServiceError } from './services/aiService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { AuthScreen } from './components/AuthScreen';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    appName: 'QUESTION FOCUS 24/7',
    model: 'gemini-3.8-flash',
    hasApiKey: true,
    status: 'ok',
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch server config on mount
  useEffect(() => {
    getServerConfig().then((cfg) => {
      setServerConfig(cfg);
    });
  }, []);

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      const stored = getStoredConversations(user.id);
      setConversations(stored);
      if (stored.length > 0) {
        setActiveId(stored[0].id);
      } else {
        setActiveId(null);
      }
    } else {
      setConversations([]);
      setActiveId(null);
    }
  }, [user?.id]);

  // Persist conversations
  useEffect(() => {
    if (user) {
      saveStoredConversations(user.id, conversations);
    }
  }, [conversations, user?.id]);

  // Scroll to bottom when messages change or loading state toggles
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading, activeId]);

  // Active conversation object
  const activeConversation = conversations.find((c) => c.id === activeId) || null;
  const currentMessages = activeConversation ? activeConversation.messages : [];

  const handleSelectUser = (selectedUser: UserProfile) => {
    setUser(selectedUser);
    saveStoredUser(selectedUser);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    saveStoredUser(null);
    setConversations([]);
    setActiveId(null);
  };

  const handleNewConversation = () => {
    setActiveId(null);
    setErrorMessage(null);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    let targetConvId = activeId;
    let updatedConversations = [...conversations];

    // If no active conversation, create one now
    if (!targetConvId) {
      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        title: generateTitleFromMessage(text),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage],
      };
      targetConvId = newConv.id;
      updatedConversations = [newConv, ...conversations];
      setActiveId(targetConvId);
      setConversations(updatedConversations);
    } else {
      // Append user message to active conversation
      updatedConversations = updatedConversations.map((c) => {
        if (c.id === targetConvId) {
          const isFirstMessage = c.messages.length === 0;
          return {
            ...c,
            title: isFirstMessage ? generateTitleFromMessage(text) : c.title,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      });
      setConversations(updatedConversations);
    }

    // Prepare full conversation history for API call
    const currentConv = updatedConversations.find((c) => c.id === targetConvId);
    const messagesHistory = currentConv ? currentConv.messages : [userMessage];

    setIsLoading(true);

    try {
      const assistantReply = await sendChatMessage(messagesHistory, targetConvId);

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: assistantReply,
        timestamp: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              updatedAt: Date.now(),
              messages: [...c.messages, aiMessage],
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      console.error('Error handling AI response:', err);
      const friendlyMessage =
        err instanceof AIServiceError
          ? err.message
          : 'Question Focus hiện chưa kết nối được với AI. Vui lòng thử lại sau.';
      setErrorMessage(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // If user has not chosen mode yet, show login screen
  if (!user) {
    return <AuthScreen onSelectUser={handleSelectUser} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800">
      {/* ChatGPT-style Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setErrorMessage(null);
        }}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        user={user}
        onLogout={handleLogout}
        onOpenAuthModal={() => setShowAuthModal(true)}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        modelName={serverConfig.model}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewConversation}
          title={activeConversation?.title || ''}
          user={user}
        />

        {/* Global Error Banner if AI fails */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                if (currentMessages.length > 0) {
                  const lastMsg = currentMessages[currentMessages.length - 1];
                  if (lastMsg.role === 'user') {
                    handleSendMessage(lastMsg.content);
                  }
                }
              }}
              className="text-xs font-medium text-red-800 hover:text-red-950 flex items-center gap-1 underline px-1 py-0.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Thử lại
            </button>
          </div>
        )}

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {currentMessages.length === 0 ? (
            <EmptyState onSelectSuggestion={handleSendMessage} />
          ) : (
            <div className="flex flex-col py-3 max-w-4xl w-full mx-auto">
              {currentMessages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} user={user} />
              ))}

              {/* Thinking Indicator (aligned to the left matching AI responses) */}
              {isLoading && (
                <div className="w-full flex justify-start my-2 sm:my-3 px-2 sm:px-4">
                  <div className="max-w-[92%] sm:max-w-[85%] md:max-w-[80%] flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 border border-sky-200/80 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4 text-sky-600 animate-spin" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 text-slate-600 text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span>Question Focus đang suy nghĩ gợi ý...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

      {/* Auth Modal (if user wants to log in with Google from guest mode) */}
      {showAuthModal && (
        <AuthScreen
          isModal
          onClose={() => setShowAuthModal(false)}
          onSelectUser={handleSelectUser}
        />
      )}
    </div>
  );
}
