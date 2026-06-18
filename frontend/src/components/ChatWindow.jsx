import { Send, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket/socket";

const ChatWindow = ({ chat, onMessage }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const title = useMemo(() => {
    if (!chat) {
      return "";
    }

    if (chat.isGroup) {
      return chat.name;
    }

    return chat.members.find((member) => member._id !== user.id && member._id !== user._id)?.name || "Private chat";
  }, [chat, user]);

  useEffect(() => {
    if (!chat) {
      return;
    }

    const loadMessages = async () => {
      try {

        const { data } = await api.get(`/chats/${chat._id}/messages`);
        setMessages(data);

        await api.patch(`/chats/${chat._id}/read`);

        getSocket()?.emit("chat:join", { chatId: chat._id });
        getSocket()?.emit("message:read", { chatId: chat._id });

      } catch (error) {
        setError(error.response?.data?.message || "Something went wrong in loading messages")
      }
    };

    loadMessages();
  }, [chat]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket || !chat) {
      return;
    }

    const addMessage = (message) => {
      if (message.chat === chat._id || message.chat?._id === chat._id) {
        setMessages((current) => [...current, message]);
        onMessage(message);
      }
    };

    const showTyping = ({ chatId, user: member }) => {
      if (chatId === chat._id && member.id !== user.id) {
        setTypingUser(member.name);
      }
    };

    const hideTyping = ({ chatId }) => {
      if (chatId === chat._id) {
        setTypingUser(null);
      }
    };

    socket.on("message:new", addMessage);
    socket.on("typing:start", showTyping);
    socket.on("typing:stop", hideTyping);

    return () => {
      socket.off("message:new", addMessage);
      socket.off("typing:start", showTyping);
      socket.off("typing:stop", hideTyping);
    };
  }, [chat, onMessage, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = (value) => {
    setContent(value);
    const socket = getSocket();
    socket?.emit("typing:start", { chatId: chat._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit("typing:stop", { chatId: chat._id }), 800);
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimer.current);
    };
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    const socket = getSocket();
    const text = content;
    setContent("");
    socket?.emit("message:send", { chatId: chat._id, content: text }, async (response) => {
      if (!response?.ok) {
        const { data } = await api.post(`/chats/${chat._id}/messages`, { content: text });
        setMessages((current) => [...current, data]);
        onMessage(data);
      }
    });
    socket?.emit("typing:stop", { chatId: chat._id });
  };

  const deleteMessage = async (messageId) => {
    await api.delete(`/chats/messages/${messageId}`);
    setMessages((current) => current.filter((message) => message._id !== messageId));
  };

  if (!chat) {
    return (
      <section className="chat-empty">
        <Send size={38} />
        <h2>Pick a chat and say hello</h2>
        <p>Your conversations will open here.</p>
      </section>
    );
  }

  return (
    <section className="chat-window">
      <header className="chat-header">
        <div>
          <h2>{title}</h2>
          <span>{chat.isGroup ? `${chat.members.length} members` : "Private conversation"}</span>
        </div>
        {chat.isGroup && (
          <div className="member-stack" title={chat.members.map((member) => member.name).join(", ")}>
            <Users size={18} />
            <span>{chat.members.length}</span>
          </div>
        )}
      </header>

      <div className="messages">
        {messages.map((message) => {
          const mine = message.sender?._id === user.id || message.sender?._id === user._id;
          return (
            <article className={mine ? "message mine" : "message"} key={message._id}>
              <div className="message-meta">
                <span>{mine ? "You" : message.sender?.name}</span>
                <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
              </div>
              <p>{message.content}</p>
              <button className="delete-button" type="button" onClick={() => deleteMessage(message._id)} title="Delete message" aria-label="Delete message">
                <Trash2 size={14} />
              </button>
            </article>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="typing-line">{typingUser ? `${typingUser} is typing...` : ""}</div>

      <form className="message-form" onSubmit={sendMessage}>
        <input value={content} onChange={(event) => handleTyping(event.target.value)} placeholder="Write a message..." />
        <button className="icon-button send-button" type="submit" title="Send" aria-label="Send">
          <Send size={18} />
        </button>
      </form>
    </section>
  );
};

export default ChatWindow;
