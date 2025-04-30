import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Chat {
  id: string;
  product: {
    title: string;
    images: string[];
  };
  buyer: {
    full_name: string;
  };
  seller: {
    full_name: string;
  };
  last_message: {
    content: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    full_name: string;
  };
}

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (user) {
      fetchChats();
      setupRealtimeSubscription();

      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
        }
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  const setupRealtimeSubscription = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    channelRef.current = supabase.channel('messages-channel');
    
    channelRef.current
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          if (selectedChat && payload.new.chat_id === selectedChat) {
            const { data: newMessage, error } = await supabase
              .from('messages')
              .select('*, sender:profiles(full_name)')
              .eq('id', payload.new.id)
              .single();

            if (!error && newMessage) {
              setMessages(prev => [...prev, newMessage]);
              scrollToBottom();
            }
          }
          // Refresh chats to update last message
          fetchChats();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to messages channel');
        }
      });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  async function fetchChats() {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          product:products(title, images),
          buyer:profiles!buyer_id(full_name),
          seller:profiles!seller_id(full_name),
          last_message:messages(content, created_at)
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Error loading chats');
    }
  }

  async function fetchMessages(chatId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Error loading messages');
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChat || !newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    // Create optimistic message
    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      content: messageContent,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      sender: {
        full_name: user.email || 'You', // Use email as fallback
      },
    };

    // Add optimistic message to the UI
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const { error } = await supabase.from('messages').insert({
        chat_id: selectedChat,
        sender_id: user.id,
        content: messageContent,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex h-[calc(100vh-12rem)]">
        <div className="w-1/3 border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 ${
                  selectedChat === chat.id ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <img
                    src={chat.product.images[0] || 'https://via.placeholder.com/50'}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{chat.product.title}</h3>
                    <p className="text-sm text-gray-600">
                      {user?.id === chat.buyer.id
                        ? `Seller: ${chat.seller.full_name}`
                        : `Buyer: ${chat.buyer.full_name}`}
                    </p>
                    {chat.last_message && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {chat.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {formatDistanceToNow(new Date(message.created_at))} ago
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}