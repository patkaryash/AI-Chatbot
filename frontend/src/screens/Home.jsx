import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { createSocket } from "../config/socket";

function uniqueById(items) {
  return Array.from(new Map(items.map((item) => [item._id, item])).values());
}

function sortChats(chats) {
  return [...chats].sort((a, b) => {
    const aTime = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt).getTime();
    const bTime = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt).getTime();
    return bTime - aTime;
  });
}

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function displayDeveloper(user) {
  return user?.name || user?.email || "Developer";
}

const MessageStatusTick = ({ status }) => {
  if (status === 'sent' || !status) {
    return (
      <svg viewBox="0 0 16 15" width="14" height="14" fill="currentColor" className="text-blue-200/70">
        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267c.174.182.46.199.647.033L15.07 3.825a.365.365 0 0 0-.06-.509z" />
      </svg>
    );
  }
  
  if (status === 'delivered') {
    return (
      <svg viewBox="0 0 16 15" width="14" height="14" fill="currentColor" className="text-blue-200/70">
        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267c.174.182.46.199.647.033L15.07 3.825a.365.365 0 0 0-.06-.509z" />
        <path d="M10.605 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.261 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267c.174.182.46.199.647.033L10.665 3.825a.365.365 0 0 0-.06-.509z" />
      </svg>
    );
  }

  if (status === 'read') {
    return (
      <svg viewBox="0 0 16 15" width="14" height="14" fill="currentColor" className="text-blue-400">
        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267c.174.182.46.199.647.033L15.07 3.825a.365.365 0 0 0-.06-.509z" />
        <path d="M10.605 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.261 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267c.174.182.46.199.647.033L10.665 3.825a.365.365 0 0 0-.06-.509z" />
      </svg>
    );
  }
  
  return null;
};

const MessageItem = memo(({ item, currentUser, onContextMenu, onReply, onDelete, showHeader = true }) => {
  const senderId = item.sender?._id || item.sender;
  const isMine = senderId === currentUser?.id || senderId === currentUser?._id;
  const isAi = item.role === "ai";

  const alignmentClass = isMine ? "ml-auto flex-row-reverse" : "";

  let bubbleClass;
  if (item.isDeleted) {
    bubbleClass = isMine
      ? "bg-bubble-sent/40 text-blue-200 italic border border-blue-500/20"
      : isAi
        ? "border border-accent/20 bg-accent/5 text-slate-500 italic"
        : "border border-subtle bg-surface-hover/50 text-slate-500 italic";
  } else {
    bubbleClass = isMine
      ? "bg-bubble-sent text-white shadow-bubble-glow"
      : isAi
        ? "border border-accent/30 bg-accent/10 text-accent/10"
        : "border border-subtle bg-bubble-received text-slate-100";
  }

  return (
    <div className={`group/msg relative flex items-start gap-2 ${alignmentClass} animate-slide-up mb-1`}>
      {/* Avatar placeholder for received messages */}
      {!isMine && showHeader && (
        <div className="w-8 h-8 rounded-full bg-surface-hover border border-subtle flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 mt-1">
          {isAi ? "AI" : (item.sender?.name?.[0] || item.sender?.email?.[0] || "U").toUpperCase()}
        </div>
      )}
      {!isMine && !showHeader && <div className="w-8 h-8 shrink-0" />}

      <article
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${bubbleClass}`}
        onContextMenu={(e) => onContextMenu(e, item)}
      >
        {item.replyTo && !item.isDeleted && (
          <div className={`mb-2 rounded border-l-[3px] ${isMine ? "border-white/40 bg-black/10" : "border-accent bg-surface-hover/80"} px-3 py-1.5 text-xs`}>
            <span className="font-semibold text-slate-300">
              {item.replyTo.role === "ai" ? "AI assistant" : displayDeveloper(item.replyTo.sender)}
            </span>
            <p className={`mt-0.5 truncate ${item.replyTo.isDeleted ? "italic text-slate-500" : "text-slate-400"}`}>
              {item.replyTo.isDeleted ? "This message was deleted" : item.replyTo.content}
            </p>
          </div>
        )}

        {showHeader && (
          <div className={`mb-0.5 flex items-baseline gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
            <span className="text-xs font-semibold text-slate-300">
              {isAi ? "AI assistant" : isMine ? "You" : displayDeveloper(item.sender)}
            </span>
            <span className="text-[10px] text-text-muted font-mono">{formatTime(item.createdAt)}</span>
          </div>
        )}
        
        <p className="whitespace-pre-wrap break-words">{item.content}</p>
        
        {isAi && item.provider && !item.isDeleted && (
          <p className="mt-2 text-[10px] uppercase tracking-wider font-mono text-accent">
            {item.provider}
          </p>
        )}

        {/* Inline timestamp for grouped messages or sent messages */}
        <div className={`mt-1 flex items-center gap-1 text-[10px] text-text-muted ${isMine ? "justify-end" : "justify-start"}`}>
          {!showHeader && <span>{formatTime(item.createdAt)}</span>}
          {isMine && !item.isDeleted && <MessageStatusTick status={item.status} />}
        </div>
      </article>

      {!item.isDeleted && (
        <div className="flex shrink-0 items-center gap-1 self-center opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100">
          <button
            className="rounded-full p-1.5 text-text-secondary transition hover:bg-surface-hover hover:text-white"
            onClick={() => onReply(item)}
            title="Reply"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
            </svg>
          </button>
          {isMine && (
            <button
              className="rounded-full p-1.5 text-text-secondary transition hover:bg-red-500/10 hover:text-red-400"
              onClick={() => onDelete(item._id)}
              title="Delete"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
});

const Home = () => {
  const token = useMemo(() => localStorage.getItem("authToken"), []);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const activeChatIdRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [socketStatus, setSocketStatus] = useState("offline");
  const [presenceMap, setPresenceMap] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const activeChat = chats.find((chat) => chat._id === activeChatId);

  useEffect(() => {
    if (isAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingStatus, isAutoScroll]);

  function handleScroll() {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAutoScroll(isNearBottom);
  }

  function mergeChat(chat) {
    setChats((currentChats) => sortChats(uniqueById([chat, ...currentChats])));
  }

  function updateChatSummary(update) {
    setChats((currentChats) => sortChats(currentChats.map((chat) => (
      chat._id === update.chatId
        ? { ...chat, lastMessage: update.lastMessage, updatedAt: update.updatedAt }
        : chat
    ))));
  }

  function appendMessage(incomingMessage) {
    setMessages((currentMessages) => {
      if (currentMessages.some((item) => item._id === incomingMessage._id)) {
        return currentMessages;
      }

      return [...currentMessages, incomingMessage];
    });
  }

  function softDeleteMessage(messageId) {
    setMessages((currentMessages) =>
      currentMessages.map((item) =>
        item._id === messageId
          ? { ...item, isDeleted: true, content: "This message was deleted" }
          : item
      )
    );
  }

  // Remove a chat from local state and clear active view if needed
  function removeChat(chatId) {
    setChats((currentChats) => currentChats.filter((c) => c._id !== chatId));
    setActiveChatId((current) => (current === chatId ? "" : current));
    setMessages((current) => (activeChatIdRef.current === chatId ? [] : current));
  }

  function deleteChat(chatId) {
    if (!window.confirm("Delete this chat? It will be removed from your sidebar.")) return;

    axios
      .delete(`/chat/${chatId}`)
      .then(() => {
        removeChat(chatId);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Unable to delete chat.");
      });
  }

  function getOtherDeveloper(chat) {
    return chat?.participants?.find((participant) => participant._id !== currentUser?.id && participant._id !== currentUser?._id);
  }

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    Promise.all([
      axios.get("/users/profile"),
      axios.get("/requests/pending"),
      axios.get("/chat"),
    ])

      .then(([profileRes, developersRes, chatsRes]) => {
        if (!isMounted) return;

        setCurrentUser(profileRes.data.user);
        localStorage.setItem("authUser", JSON.stringify(profileRes.data.user));
        setPendingRequests(developersRes.data.requests || []); // developersRes here is actually requestsRes, reusing variable
        setChats(sortChats(chatsRes.data.chats || []));

      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          navigate("/login");
          return;
        }

        setError(err.response?.data?.error || "Unable to load your chat workspace.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => setSocketStatus("live"));
    socket.on("disconnect", () => setSocketStatus("offline"));
    socket.on("connect_error", (err) => {
      setSocketStatus("offline");
      setError(err.message || "Real-time connection failed.");
    });
    socket.on("chat:created", mergeChat);
    socket.on("chat:updated", updateChatSummary);
    socket.on("request:new", (request) => {
      setPendingRequests((prev) => [request, ...prev]);
    });
    socket.on("message:new", (incomingMessage) => {
      if (incomingMessage.chat === activeChatIdRef.current) {
        appendMessage(incomingMessage);
        
        // Mark as read if the chat is currently open and we didn't send it
        const senderId = incomingMessage.sender?._id || incomingMessage.sender;
        if (senderId !== currentUser?.id && senderId !== currentUser?._id) {
          socket.emit("messages:mark_read", { messageIds: [incomingMessage._id], chatId: incomingMessage.chat });
        }
      } else {
        // Mark as delivered if the chat is not open but we received it
        const senderId = incomingMessage.sender?._id || incomingMessage.sender;
        if (senderId !== currentUser?.id && senderId !== currentUser?._id) {
          socket.emit("messages:mark_delivered", { messageIds: [incomingMessage._id], chatId: incomingMessage.chat });
        }
      }
    });
    
    socket.on("messages:status_update", ({ messageIds, status }) => {
      setMessages((currentMessages) =>
        currentMessages.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, status } : msg
        )
      );
    });
    socket.on("message:deleted", ({ messageId }) => {
      softDeleteMessage(messageId);
    });
    socket.on("chat:deleted", ({ chatId }) => {
      removeChat(chatId);
    });
    
    // Request initial online users
    socket.emit("presence:request_sync", (onlineUsers) => {
      setPresenceMap((prev) => {
        const next = { ...prev };
        onlineUsers.forEach((id) => {
          next[id] = { isOnline: true };
        });
        return next;
      });
    });

    socket.on("presence:update", ({ userId, isOnline, lastSeen }) => {
      setPresenceMap((prev) => ({
        ...prev,
        [userId]: { isOnline, lastSeen },
      }));
    });

    socket.on("typing:start", ({ chatId, userId }) => {
      setTypingStatus((prev) => ({ ...prev, [chatId]: userId }));
    });

    socket.on("typing:stop", ({ chatId, userId }) => {
      setTypingStatus((prev) => (prev[chatId] === userId ? { ...prev, [chatId]: null } : prev));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId || !token) {
      setMessages([]);
      return undefined;
    }

    const socket = socketRef.current;
    let isMounted = true;

    socket?.emit("chat:join", { chatId: activeChatId }, (response) => {
      if (!response?.ok) {
        setError(response?.error || "Unable to join the chat room.");
      }
    });

    axios
      .get(`/chat/${activeChatId}/messages`)
      .then((res) => {
        if (isMounted) {
          const loadedMessages = res.data.messages || [];
          setMessages(loadedMessages);
          
          // Find unread messages from others and mark them as read
          const unreadIds = loadedMessages
            .filter((msg) => {
              const senderId = msg.sender?._id || msg.sender;
              const isMine = senderId === currentUser?.id || senderId === currentUser?._id;
              return !isMine && msg.status !== 'read';
            })
            .map((msg) => msg._id);
            
          if (unreadIds.length > 0 && socket) {
            socket.emit("messages:mark_read", { messageIds: unreadIds, chatId: activeChatId });
          }
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Unable to load chat history.");
      });

    return () => {
      isMounted = false;
      socket?.emit("chat:leave", { chatId: activeChatId });
    };
  }, [activeChatId, token]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        axios.get(`/users/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => {
            setSearchResults(res.data.users || []);
          })
          .catch(err => console.error("Search error:", err))
          .finally(() => setIsSearching(false));
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  function sendRequest(receiverId) {
    setError("");
    axios.post("/requests/send", { receiverId })
      .then(() => {
        // Optimistic UI or just toast
        alert("Request sent successfully!");
        setSearchQuery("");
        setSearchResults([]);
      })
      .catch(err => {
        setError(err.response?.data?.error || "Unable to send request.");
      });
  }

  function acceptRequest(requestId) {
    axios.post(`/requests/${requestId}/accept`)
      .then(res => {
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
        if (res.data.chat) {
          mergeChat(res.data.chat);
          setActiveChatId(res.data.chat._id);
        }
        setShowNotifications(false);
      })
      .catch(err => setError(err.response?.data?.error || "Unable to accept request."));
  }

  function rejectRequest(requestId) {
    axios.post(`/requests/${requestId}/reject`)
      .then(() => {
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      })
      .catch(err => setError(err.response?.data?.error || "Unable to reject request."));
  }

  function sendMessage(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || !activeChatId || isSending) return;

    const clientMessageId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const payload = {
      chatId: activeChatId,
      content: trimmedMessage,
      clientMessageId,
      replyTo: replyingTo?._id || null,
    };

    setError("");
    setIsSending(true);
    setMessage("");
    setReplyingTo(null);

    // Clear typing timeout and explicitly stop typing
    clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit("typing:stop", { chatId: activeChatId });

    if (socketRef.current?.connected) {
      socketRef.current.emit("message:send", payload, (response) => {
        setIsSending(false);
        if (!response?.ok) {
          setError(response?.error || "Unable to send message.");
          setMessage(trimmedMessage);
        }
      });
      return;
    }

    axios
      .post(`/chat/${activeChatId}/messages`, {
        message: trimmedMessage,
        clientMessageId,
      })
      .then((res) => {
        (res.data.messages || []).forEach(appendMessage);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Unable to send message.");
        setMessage(trimmedMessage);
      })
      .finally(() => {
        setIsSending(false);
      });
  }

  const handleDeleteMessage = useCallback((messageId) => {
    setContextMenu(null);
    if (!window.confirm("Delete this message?")) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit("message:delete", { messageId }, (response) => {
        if (!response?.ok) {
          setError(response?.error || "Unable to delete message.");
        }
      });
      return;
    }

    axios
      .delete(`/chat/${activeChatId}/messages/${messageId}`)
      .then(() => {
        softDeleteMessage(messageId);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Unable to delete message.");
      });
  }, [activeChatId]);

  const handleReplyToMessage = useCallback((msg) => {
    setContextMenu(null);
    setReplyingTo(msg);
    messageInputRef.current?.focus();
  }, []);

  const handleMessageContextMenu = useCallback((event, msg) => {
    event.preventDefault();
    const senderId = msg.sender?._id || msg.sender;
    const isMine = senderId === currentUser?.id || senderId === currentUser?._id;
    if (msg.isDeleted) return;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      message: msg,
      isMine,
    });
  }, [currentUser]);

  function logout() {
    axios.post("/users/logout").finally(() => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      navigate("/login");
    });
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">DevChat AI</p>
          <h1 className="mt-3 text-3xl font-bold">Sign in to open your developer chats.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Create one account per developer, start a direct chat, and use @ai inside the same thread.
          </p>
          <div className="mt-6 flex gap-3">
            <Link className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500" to="/login">
              Login
            </Link>
            <Link className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-white" to="/register">
              Register
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen bg-base text-text-primary flex flex-col overflow-hidden font-sans">
      <section className="mx-auto flex h-full w-full max-w-screen-2xl flex-col px-0 sm:px-4 py-0 sm:py-4 overflow-hidden">
        
        {/* Navbar */}
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-subtle bg-base/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent font-mono">DevChat AI</p>
              <h1 className="text-lg font-semibold text-text-primary">Developer Platform</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            {socketStatus === "live" ? (
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium">Live sync</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-medium">Offline</span>
              </div>
            )}
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface">
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                {displayDeveloper(currentUser)?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs font-medium text-text-primary">
                {displayDeveloper(currentUser)}
              </span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center rounded-full p-2 text-text-secondary transition hover:bg-surface-hover hover:text-white"
                title="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {pendingRequests.length > 0 && (
                  <span className="absolute 1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-black border-2 border-base">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-subtle bg-surface shadow-xl z-50 overflow-hidden animate-fade-in">
                  <div className="border-b border-subtle px-4 py-3 text-sm font-semibold text-white bg-surface-hover">
                    Pending Requests
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {pendingRequests.length === 0 ? (
                      <p className="px-2 py-4 text-center text-sm text-text-secondary">No pending requests</p>
                    ) : (
                      pendingRequests.map(req => (
                        <div key={req._id} className="mb-2 flex items-center justify-between rounded-lg border border-subtle bg-base p-3 transition hover:bg-surface-hover">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="truncate text-sm font-medium text-text-primary">{req.sender?.name}</p>
                            <p className="truncate text-xs text-text-muted">{req.sender?.email}</p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button onClick={() => acceptRequest(req._id)} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-80">Accept</button>
                            <button onClick={() => rejectRequest(req._id)} className="rounded-md border border-subtle px-3 py-1.5 text-xs text-text-secondary transition hover:bg-surface-hover hover:text-white">Reject</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={logout} className="rounded-full p-2 text-text-secondary transition hover:bg-red-500/10 hover:text-red-400" title="Logout" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </header>

        {error && (
          <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="grid flex-1 gap-0 sm:gap-6 py-0 sm:py-2 lg:grid-cols-[22rem_minmax(0,1fr)] overflow-hidden min-h-0 px-0 sm:px-6">
          <aside className="flex min-h-0 flex-col rounded-none sm:rounded-xl border-0 sm:border border-subtle bg-surface overflow-hidden shadow-2xl">
            <div className="shrink-0 border-b border-subtle p-4 relative bg-base/90 backdrop-blur-md z-50">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-mono" htmlFor="search">
                Find developers
              </label>
              <div className="mt-3 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  id="search"
                  autoComplete="off"
                  placeholder="Search by username..."
                  className="w-full rounded-full border border-subtle bg-surface-hover py-2 pl-9 pr-4 text-sm text-white outline-none transition focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-text-muted"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results Dropdown */}
              {searchQuery.trim().length >= 2 && (
                <div className="absolute left-4 right-4 top-[95px] z-50 max-h-60 overflow-y-auto rounded-xl border border-subtle bg-surface shadow-2xl backdrop-blur-md animate-fade-in">
                  {isSearching ? (
                    <div className="p-4 text-sm text-text-secondary text-center">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-sm text-text-secondary text-center">No users found</div>
                  ) : (
                    searchResults.map((user) => {
                      // Don't show users we already have a chat with
                      const alreadyInChat = chats.some(c => 
                        c.participants.some(p => p._id === user._id)
                      );
                      if (alreadyInChat) return null;

                      return (
                        <div key={user._id} className="flex items-center justify-between border-b border-subtle p-3 last:border-b-0 hover:bg-surface-hover transition">
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                              {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                            </div>
                            <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
                          </div>
                          <button
                            onClick={() => sendRequest(user._id)}
                            className="ml-2 shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-80"
                          >
                            Connect
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-[1px]">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-5 h-5 border-2 border-text-muted border-t-accent rounded-full animate-spin"></div>
                </div>
              ) : chats.length === 0 ? (
                <p className="px-4 py-8 text-sm leading-relaxed text-text-secondary text-center">
                  No conversations yet.<br />Search for a developer above to start.
                </p>
              ) : (
                chats.map((chat) => {
                  const otherDeveloper = getOtherDeveloper(chat);
                  const isActive = chat._id === activeChatId;
                  const isOnline = presenceMap[otherDeveloper?._id]?.isOnline;

                  return (
                    <button
                      className={`group relative w-full rounded-lg px-3 py-3 text-left transition duration-150 flex gap-3 items-center ${isActive ? "bg-surface-hover before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-accent" : "hover:bg-surface-hover/50"}`}
                      key={chat._id}
                      onClick={() => setActiveChatId(chat._id)}
                      type="button"
                    >
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${isActive ? "bg-accent text-black" : "bg-accent/10 text-accent group-hover:bg-accent/20"}`}>
                          {(displayDeveloper(otherDeveloper)?.[0] || "U").toUpperCase()}
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-surface" title="Online" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="truncate text-sm font-semibold text-text-primary">
                            {displayDeveloper(otherDeveloper)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="shrink-0 text-[10px] text-text-muted font-mono">
                              {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                            </span>
                            {/* Trash icon — visible on hover */}
                            <span
                              className="hidden shrink-0 cursor-pointer rounded p-1 text-text-muted transition hover:bg-red-500/20 hover:text-red-400 group-hover:inline-flex"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChat(chat._id);
                              }}
                              role="button"
                              tabIndex={0}
                              title="Delete chat"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </span>
                        </div>
                        <p className="truncate text-xs text-text-secondary pr-4">
                          {chat.lastMessage?.content || "Open thread"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col rounded-none sm:rounded-xl border-0 sm:border border-subtle bg-surface overflow-hidden shadow-2xl relative">
            {/* Ambient Background Glow for chat area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="shrink-0 border-b border-subtle px-6 py-4 bg-base/50 backdrop-blur-md z-10">
              <div className="flex items-center gap-3 text-lg font-bold text-text-primary">
                {activeChat ? displayDeveloper(getOtherDeveloper(activeChat)) : "Select a conversation"}
                {activeChat && presenceMap[getOtherDeveloper(activeChat)?._id]?.isOnline && (
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Online" />
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5 font-mono">
                {activeChat ? (
                  presenceMap[getOtherDeveloper(activeChat)?._id]?.isOnline 
                    ? "Online now" 
                    : `Last seen: ${formatTime(presenceMap[getOtherDeveloper(activeChat)?._id]?.lastSeen || getOtherDeveloper(activeChat)?.lastSeen) || 'Unknown'}`
                ) : "Choose a thread from the sidebar to load history."}
              </p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 sm:px-8 py-6 relative z-10">
              {!activeChat && (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-surface-hover border border-subtle flex items-center justify-center mb-6 shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-accent">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">DevChat AI is ready</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Create or open a chat to start real-time messaging. Use <span className="text-accent font-mono bg-accent/10 px-1 rounded">@ai</span> in the composer for an assistant reply shared with everyone in the thread.
                  </p>
                </div>
              )}

              {activeChat && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm leading-relaxed text-text-secondary bg-surface-hover px-4 py-2 rounded-full border border-subtle">
                    No messages yet. Send a message or try <span className="text-accent font-mono">@ai explain this project architecture</span>
                  </p>
                </div>
              )}

              {messages.map((item, index) => {
                const prevItem = messages[index - 1];
                const showHeader = !prevItem || 
                  (prevItem.sender?._id || prevItem.sender) !== (item.sender?._id || item.sender) ||
                  (new Date(item.createdAt) - new Date(prevItem.createdAt)) > 5 * 60 * 1000;

                return (
                  <MessageItem
                    key={item._id}
                    item={item}
                    currentUser={currentUser}
                    onContextMenu={handleMessageContextMenu}
                    onReply={handleReplyToMessage}
                    onDelete={handleDeleteMessage}
                    showHeader={showHeader}
                  />
                );
              })}

              {activeChat && typingStatus[activeChatId] === 'ai-assistant' && (
                <div className="flex animate-pulse items-center gap-2 text-xs font-mono text-accent bg-accent/10 w-fit px-3 py-1.5 rounded-full mt-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  AI assistant is typing...
                </div>
              )}
              {activeChat && typingStatus[activeChatId] === getOtherDeveloper(activeChat)?._id && (
                <div className="flex animate-pulse items-center gap-2 text-xs font-mono text-text-muted bg-surface-hover w-fit px-3 py-1.5 rounded-full mt-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
                  {displayDeveloper(getOtherDeveloper(activeChat))} is typing...
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>

            <form onSubmit={sendMessage} className="shrink-0 border-t border-subtle p-4 sm:p-6 bg-base/80 backdrop-blur-md z-20">
              {/* Reply preview bar */}
              {replyingTo && (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 backdrop-blur shadow-lg animate-fade-in relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
                  <div className="min-w-0 flex-1 pl-1">
                    <p className="text-xs font-bold text-accent mb-1">
                      Replying to {replyingTo.role === "ai" ? "AI assistant" : displayDeveloper(replyingTo.sender)}
                    </p>
                    <p className="truncate text-sm text-text-secondary">
                      {replyingTo.content}
                    </p>
                  </div>
                  <button
                    className="shrink-0 rounded-full p-1.5 text-text-muted transition hover:bg-surface-hover hover:text-white"
                    onClick={() => setReplyingTo(null)}
                    type="button"
                    title="Cancel reply"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="relative flex items-center group">
                <input
                  ref={messageInputRef}
                  className="w-full rounded-full border border-subtle bg-surface pl-5 pr-14 py-3.5 text-sm text-text-primary outline-none transition duration-200 placeholder:text-text-muted focus:border-accent focus:bg-base focus:shadow-[0_0_15px_rgba(0,255,153,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!activeChat || isSending}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    if (!activeChatId || !socketRef.current?.connected) return;
                    
                    socketRef.current.emit("typing:start", { chatId: activeChatId });
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                      socketRef.current.emit("typing:stop", { chatId: activeChatId });
                    }, 2000);
                  }}
                  placeholder={activeChat ? "Message, or use @ai explain, /summarize, /fix" : "Open a chat to send a message"}
                  value={message}
                />
                <button
                  className="absolute right-2 rounded-full bg-accent p-2 text-black transition-all hover:scale-105 hover:bg-[#00e68a] disabled:scale-100 disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-text-muted"
                  disabled={!activeChat || !message.trim() || isSending}
                  type="submit"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {/* Context menu for right-click on messages */}
            {contextMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setContextMenu(null)}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                />
                <div
                  className="fixed z-50 min-w-[160px] rounded-xl border border-subtle bg-surface/90 backdrop-blur-xl p-1 shadow-2xl animate-fade-in"
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-medium text-text-primary transition hover:bg-surface-hover hover:text-accent"
                    onClick={() => handleReplyToMessage(contextMenu.message)}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
                    </svg>
                    Reply
                  </button>
                  {contextMenu.isMine && (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                      onClick={() => handleDeleteMessage(contextMenu.message._id)}
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
};

export default Home;
