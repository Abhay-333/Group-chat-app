import { LogOut, Search, Users } from "lucide-react";
import { useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const ChatSidebar = ({ chats, activeChat, onSelectChat, onRefresh }) => {
  const { logout, user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState("");

  const searchUsers = async (value) => {
    setQuery(value);
    setError("");

    if (!value.trim()) {
      setResults([]);
      return;
    }

    const { data } = await api.get(`/auth/users?q=${encodeURIComponent(value)}`);
    setResults(data);
  };

  const startPrivateChat = async (member) => {
    const { data } = await api.post("/chats/private", { userId: member._id });
    setQuery("");
    setResults([]);
    onRefresh(data);
    onSelectChat(data);
  };

  const toggleMember = (member) => {
    setSelectedMembers((current) => {
      const exists = current.some((item) => item._id === member._id);
      return exists ? current.filter((item) => item._id !== member._id) : [...current, member];
    });
  };

  const createGroup = async () => {
    try {
      setError("");
      const { data } = await api.post("/chats/groups", {
        name: groupName,
        memberIds: selectedMembers.map((member) => member._id)
      });
      setGroupName("");
      setSelectedMembers([]);
      setQuery("");
      setResults([]);
      onRefresh(data);
      onSelectChat(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create group");
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroup) {
      return chat.name;
    }

    return chat.members.find((member) => member._id !== user.id && member._id !== user._id)?.name || "Private chat";
  };

  return (
    <aside className="chat-sidebar">
      <header className="sidebar-header">
        <div>
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
        </div>
        <button className="icon-button" onClick={logout} type="button" title="Logout" aria-label="Logout">
          <LogOut size={18} />
        </button>
      </header>

      <div className="search-box">
        <Search size={17} />
        <input value={query} onChange={(event) => searchUsers(event.target.value)} placeholder="Search users" />
      </div>

      {results.length > 0 && (
        <section className="search-results">
          {results.map((member) => (
            <button key={member._id} type="button" onClick={() => startPrivateChat(member)}>
              <span className={member.isOnline ? "status-dot online" : "status-dot"} />
              <span>{member.name}</span>
              <small>{member.email}</small>
            </button>
          ))}
        </section>
      )}

      <section className="group-box">
        <div className="section-title">
          <Users size={17} />
          <span>Create group</span>
        </div>
        <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" />
        {results.length > 0 && (
          <div className="member-picker">
            {results.map((member) => (
              <label key={member._id}>
                <input
                  type="checkbox"
                  checked={selectedMembers.some((item) => item._id === member._id)}
                  onChange={() => toggleMember(member)}
                />
                {member.name}
              </label>
            ))}
          </div>
        )}
        {selectedMembers.length > 0 && <small>{selectedMembers.length} selected</small>}
        {error && <p className="form-error">{error}</p>}
        <button className="secondary-button" type="button" onClick={createGroup} disabled={!groupName || selectedMembers.length < 2}>
          Create group
        </button>
      </section>

      <nav className="chat-list">
        {chats.map((chat) => (
          <button
            className={activeChat?._id === chat._id ? "chat-item active" : "chat-item"}
            key={chat._id}
            type="button"
            onClick={() => onSelectChat(chat)}
          >
            <span>{getChatName(chat)}</span>
            <small>{chat.lastMessage?.content || `${chat.members.length} member${chat.members.length > 1 ? "s" : ""}`}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default ChatSidebar;
