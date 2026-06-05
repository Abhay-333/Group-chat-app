import { useCallback, useEffect, useState } from "react";
import api from "./api/client";
import AuthForm from "./components/AuthForm";
import ChatSidebar from "./components/ChatSidebar";
import ChatWindow from "./components/ChatWindow";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { getSocket } from "./socket/socket";

const ChatApp = () => {
  const { loading, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const loadChats = useCallback(async (selectedChat) => {
    const { data } = await api.get("/chats");
    const nextChats = selectedChat
      ? [selectedChat, ...data.filter((chat) => chat._id !== selectedChat._id)]
      : data;

    setChats(nextChats);
  }, []);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [loadChats, user]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    const refreshPresence = ({ userId, lastSeen }) => {
      setChats((current) =>
        current.map((chat) => ({
          ...chat,
          members: chat.members.map((member) =>
            member._id === userId ? { ...member, isOnline: !lastSeen, lastSeen: lastSeen || member.lastSeen } : member
          )
        }))
      );
    };

    socket.on("user:online", refreshPresence);
    socket.on("user:offline", refreshPresence);

    return () => {
      socket.off("user:online", refreshPresence);
      socket.off("user:offline", refreshPresence);
    };
  }, [user]);

  const upsertChat = (chat) => {
    setChats((current) => [chat, ...current.filter((item) => item._id !== chat._id)]);
  };

  const updateLastMessage = (message) => {
    setChats((current) =>
      current.map((chat) => (chat._id === message.chat || chat._id === message.chat?._id ? { ...chat, lastMessage: message } : chat))
    );
  };

  if (loading) {
    return <main className="loading-screen">Loading...</main>;
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <main className="app-shell">
      <ChatSidebar chats={chats} activeChat={activeChat} onSelectChat={setActiveChat} onRefresh={upsertChat} />
      <ChatWindow chat={activeChat} onMessage={updateLastMessage} />
    </main>
  );
};

const App = () => (
  <AuthProvider>
    <ChatApp />
  </AuthProvider>
);

export default App;
