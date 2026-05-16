import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  disconnectTelemedicineSocket,
  getTelemedicineSocket,
} from "../api/telemedicineSocket";
import telemedicineService from "../api/telemedicineService";
import { useAuth } from "../context/useAuth";

function ChatConsultation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const session = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const qId = queryParams.get("id");

  const sessionId =
    qId ||
    session.sessionId ||
    session.appointmentNo ||
    `${session.doctor || "session"}-${session.date || "date"}-${session.time || "instant-chat"}`;
  const currentRole = user?.role === "doctor" ? "doctor" : "patient";
  const oppositeRole = currentRole === "doctor" ? "patient" : "doctor";
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionStatus, setSessionStatus] = useState("Connecting to secure chat...");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [endingSession, setEndingSession] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const appendMessage = (message) => {
    setMessages((prev) => {
      const nextMessage = {
        id: message.id || `${message.sender}-${Date.now()}-${Math.random()}`,
        sender: message.sender,
        text: message.text,
        time:
          message.time ||
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
      };

      if (prev.some((item) => String(item.id) === String(nextMessage.id))) {
        return prev;
      }

      return [...prev, nextMessage];
    });
  };

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      try {
        setLoadingHistory(true);
        const data = await telemedicineService.joinSession(sessionId, currentRole);
        if (!isActive) return;

        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setSessionEnded(data.status === "completed");
        setSessionStatus(
          data.status === "completed"
            ? "Consultation ended by doctor"
            : "Waiting for the other participant to join..."
        );
      } catch {
        if (!isActive) return;
        setSessionStatus("Unable to load this consultation");
      } finally {
        if (isActive) {
          setLoadingHistory(false);
        }
      }
    };

    loadSession();

    return () => {
      isActive = false;
    };
  }, [currentRole, sessionId]);

  useEffect(() => {
    const socket = getTelemedicineSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit("telemedicine:join", { sessionId, role: currentRole });
      if (!sessionEnded) {
        setSessionStatus("Waiting for the other participant to join...");
      }
    };

    const handleJoined = () => {
      if (!sessionEnded) {
        setSessionStatus("Secure chat is live");
      }
    };

    const handlePresence = (payload) => {
      if (payload.role !== oppositeRole || sessionEnded) return;

      setSessionStatus(
        payload.status === "joined"
          ? `${payload.name || (oppositeRole === "doctor" ? session.doctor : "Patient")} joined the chat`
          : "The other participant left the chat"
      );
    };

    const handleMessage = (payload) => {
      appendMessage({
        id: payload.id,
        sender: payload.role,
        text: payload.text,
        time: payload.time,
      });
    };

    const handleSessionEnded = () => {
      setSessionEnded(true);
      setSessionStatus("Consultation ended by doctor");
    };

    const handleError = (payload) => {
      setSessionStatus(payload?.message || "Unable to join the secure chat");
    };

    socket.on("connect", handleConnect);
    socket.on("telemedicine:joined", handleJoined);
    socket.on("telemedicine:presence", handlePresence);
    socket.on("telemedicine:chat-message", handleMessage);
    socket.on("telemedicine:session-ended", handleSessionEnded);
    socket.on("telemedicine:error", handleError);
    socket.on("connect_error", handleError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.emit("telemedicine:leave", { sessionId });
      socket.off("connect", handleConnect);
      socket.off("telemedicine:joined", handleJoined);
      socket.off("telemedicine:presence", handlePresence);
      socket.off("telemedicine:chat-message", handleMessage);
      socket.off("telemedicine:session-ended", handleSessionEnded);
      socket.off("telemedicine:error", handleError);
      socket.off("connect_error", handleError);
      disconnectTelemedicineSocket();
    };
  }, [currentRole, oppositeRole, session.doctor, sessionEnded, sessionId]);

  const sendMessage = async () => {
    if (!input.trim() || sessionEnded) return;

    const messageText = input.trim();
    const messageTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setInput("");

    try {
      socketRef.current?.emit("telemedicine:chat-message", {
        sessionId,
        text: messageText,
        time: messageTime,
      });
      setSessionStatus("Message sent");
    } catch {
      setSessionStatus("Message send failed");
    }
  };

  const handleEndConsultation = async () => {
    if (currentRole !== "doctor" || sessionEnded) {
      navigate(currentRole === "doctor" ? "/doctor-appointments" : "/myappoinment");
      return;
    }

    const confirmed = window.confirm("End this consultation for both doctor and patient?");
    if (!confirmed) return;

    try {
      setEndingSession(true);
      await telemedicineService.endSession(sessionId, currentRole);
      socketRef.current?.emit("telemedicine:end-session", { sessionId });
      setSessionEnded(true);
      setSessionStatus("Consultation ended by doctor");
    } catch {
      setSessionStatus("Unable to end the consultation");
    } finally {
      setEndingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-4">
        <button
          className="text-slate-500 hover:text-slate-800 font-bold text-sm tracking-wide transition-colors flex items-center gap-2 px-2"
          onClick={() => navigate(currentRole === "doctor" ? "/doctor-appointments" : "/myappoinment")}
        >
          <span>&larr;</span> Back
        </button>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden flex flex-col h-[80vh] min-h-[600px]">
          <div className="p-6 md:p-8 bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 leading-tight tracking-tight">Chat Consultation</h1>
              <p className="text-slate-500 font-medium">
                {session.doctor || "Doctor"} {session.specialty ? `• ${session.specialty}` : ""}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-2xl flex flex-col items-start sm:items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-0.5">Session Type</span>
              <strong className="text-sm font-bold">Instant Chat</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Hospital</span>
              <strong className="text-slate-800 text-sm font-semibold">{session.hospital || "Hospital not specified"}</strong>
            </div>
            <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Session</span>
              <strong className="text-slate-800 text-sm font-semibold">Saved until consultation ends</strong>
            </div>
            <div className="p-4 sm:p-5 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Schedule</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {session.date
                  ? session.time
                    ? `${session.date} • ${session.time}`
                    : `${session.date} • Instant chat`
                  : "Instant chat"}
              </strong>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">
            <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-3 flex justify-between items-center shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Secure Patient Chat</span>
                <strong className="text-sm text-slate-700 font-semibold">{sessionStatus}</strong>
              </div>
              <div className={`${sessionEnded ? "bg-slate-200 text-slate-700 border-slate-300" : "bg-emerald-100 text-emerald-700 border-emerald-200"} border px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sessionEnded ? "bg-slate-500" : "bg-emerald-500 animate-pulse"}`}></span>
                {sessionEnded ? "ENDED" : "LIVE"}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-20 space-y-4">
              {loadingHistory && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                  <p className="font-medium">Loading consultation history...</p>
                </div>
              )}
              {!loadingHistory && messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <span className="text-4xl mb-4">💬</span>
                  <p className="font-medium">No messages yet. Send a message to start.</p>
                </div>
              )}
              {!loadingHistory && messages.map((msg) => {
                const isOwn = msg.sender === currentRole;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col w-full ${isOwn ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] px-5 py-3.5 flex flex-col gap-1.5 shadow-sm ${
                        isOwn
                          ? "bg-slate-900 text-white rounded-[1.25rem] rounded-tr-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-[1.25rem] rounded-tl-sm"
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                      <span className="text-[10px] font-semibold text-slate-400 self-end">{msg.time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-slate-200 shrink-0">
              <div className="flex gap-3 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={sessionEnded ? "Consultation ended" : "Type your message securely..."}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl py-3.5 px-5 text-[15px] focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium shadow-sm disabled:opacity-60"
                  disabled={sessionEnded}
                />
                <button
                  onClick={sendMessage}
                  className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  disabled={sessionEnded}
                >
                  Send <span className="text-lg leading-none">↗</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-100 flex justify-center border-t border-slate-200 shrink-0">
            {currentRole === "doctor" ? (
              <button
                className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 font-bold py-2.5 px-8 rounded-full transition-colors text-sm shadow-sm disabled:opacity-60"
                onClick={handleEndConsultation}
                disabled={endingSession || sessionEnded}
              >
                {sessionEnded ? "Consultation Ended" : endingSession ? "Ending..." : "End Consultation"}
              </button>
            ) : (
              <button
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 font-bold py-2.5 px-8 rounded-full transition-colors text-sm shadow-sm"
                onClick={() => navigate("/myappoinment")}
              >
                Back to My Appointments
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatConsultation;
