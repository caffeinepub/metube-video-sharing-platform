import { useState, useEffect, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetLatestMessages, usePostMessage } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AiChatRoomPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: messages, isLoading, error } = useGetLatestMessages();
  const postMessage = usePostMessage();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!identity;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!isAuthenticated || !userProfile) {
      toast.error('Please log in to send messages');
      return;
    }

    try {
      await postMessage.mutateAsync({
        sender: userProfile.name,
        message: messageInput.trim(),
      });
      setMessageInput('');
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>AI Chat Room</CardTitle>
            <CardDescription>Please log in to access the chat room</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card className="flex flex-col h-[calc(100vh-12rem)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                AI Chat Room
              </CardTitle>
              <CardDescription>
                Chat with AI and other users in real-time
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {messages?.length || 0} messages
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {isLoading && (
              <div className="text-center text-muted-foreground py-8">
                Loading messages...
              </div>
            )}
            {error && (
              <div className="text-center text-destructive py-8">
                Failed to load messages
              </div>
            )}
            {messages && messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Be the first to say hello!
              </div>
            )}
            {messages && messages.length > 0 && (
              <>
                {messages.slice().reverse().map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.isAI ? 'bg-accent/10' : 'bg-muted/30'} p-3 rounded-lg`}
                  >
                    <div className="flex-shrink-0">
                      {msg.isAI ? (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-accent" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {msg.sender}
                        </span>
                        {msg.isAI && (
                          <Badge variant="secondary" className="text-xs">
                            AI
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(Number(msg.timestamp) / 1000000).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2 pt-4 border-t">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={postMessage.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={postMessage.isPending || !messageInput.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
