import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Peer from "peerjs";
import {
  disconnectTelemedicineSocket,
  getTelemedicineSocket,
} from "../api/telemedicineSocket";
import { useAuth } from "../context/useAuth";

const CameraOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CameraOnIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const MicOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOnIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

function VideoConsultation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const session = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const qId = queryParams.get("id");

  const sessionId =
    qId ||
    session.appointmentNo ||
    `${session.doctor || "session"}-${session.date || "date"}-${session.time || "time"}`;

  const currentRole = user?.role === "doctor" ? "doctor" : "patient";
  const oppositeRole = currentRole === "doctor" ? "patient" : "doctor";

  // State
  const [peerId, setPeerId] = useState("");
  const [oppositePeerId, setOppositePeerId] = useState("");
  const [sessionStatus, setSessionStatus] = useState("Initializing connection...");
  const [isJoined, setIsJoined] = useState(false);
  
  // Media State
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [hasVideoPermission, setHasVideoPermission] = useState(null);

  // Refs
  const socketRef = useRef(null);
  const peerInstanceRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);

  // Video Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    // Generate a shorter recognizable Peer ID
    const customId = `${currentRole}-${sessionId.replace(/[^a-zA-Z0-9]/g, "")}-${Math.floor(
      Math.random() * 1000
    )}`;

    const peer = new Peer(customId, {
      debug: 1,
    });

    peer.on("open", (id) => {
      console.log(`[PeerJS] Initialized as ${currentRole} with ID:`, id);
      setPeerId(id);
      peerInstanceRef.current = peer;

      // Now socket initialization
      const socket = getTelemedicineSocket();
      socketRef.current = socket;

      socket.on("connect", () => {
        setSessionStatus("Waiting for the other participant to join...");
        socket.emit("telemedicine:video-join", { sessionId, role: currentRole, peerId: id });
      });

      socket.on("telemedicine:video-joined", (payload) => {
        setSessionStatus("Ready to connect. Awaiting camera permissions...");
        setIsJoined(true);
        if (payload.oppositePeerId) {
          setOppositePeerId(payload.oppositePeerId);
        }
      });

      socket.on("telemedicine:video-presence", (payload) => {
        if (payload.role !== oppositeRole) return;

        if (payload.status === "joined") {
          setSessionStatus(`The other participant joined.`);
          setOppositePeerId(payload.peerId);
        } else {
          setSessionStatus("The other participant left.");
          setOppositePeerId("");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
      });

      socket.on("connect_error", () => {
        setSessionStatus("Connection error with signaling server.");
      });

      if (socket.connected) {
        socket.emit("telemedicine:video-join", { sessionId, role: currentRole, peerId: id });
      }
    });

    peer.on("call", (call) => {
      console.log("[PeerJS] Receiving incoming call...");
      setSessionStatus("Call connected");

      if (localStreamRef.current) {
        call.answer(localStreamRef.current);
      } else {
        console.warn("[PeerJS] Answering call without local stream initialized yet.");
        call.answer();
      }

      callRef.current = call;

      call.on("stream", (remoteStream) => {
        console.log("[PeerJS] Received remote stream inside call event.");
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(console.error);
        }
      });

      call.on("close", () => {
        console.log("[PeerJS] Call closed (receiving side).");
      });
      
      call.on("error", (err) => {
        console.error("[PeerJS] Call error:", err);
      });
    });
    
    peer.on("error", (err) => {
      console.error("[PeerJS] Peer error:", err);
      setSessionStatus(`Connection error: ${err.type}`);
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (callRef.current) {
        callRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.emit("telemedicine:video-leave", { sessionId });
        disconnectTelemedicineSocket();
      }
      if (peerInstanceRef.current) {
        peerInstanceRef.current.destroy();
      }
    };
  }, [currentRole, oppositeRole, sessionId]);

  // Handle local media setup
  const setupMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setHasVideoPermission(true);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Mute self to prevent echo
        localVideoRef.current.play().catch(console.error);
      }
      
      setSessionStatus("Camera active. Ready for call.");

    } catch (err) {
      console.error("Media permission denied or error:", err);
      setHasVideoPermission(false);
      setSessionStatus("Camera/Microphone access denied or unavailable.");
    }
  }, []);

  useEffect(() => {
    if (isJoined) {
       setupMedia();
    }
  }, [isJoined, setupMedia]);

  // Caller Logic 
  useEffect(() => {
    // Only caller if we have local stream, opposite peer is ready, and we are not already in a call
    if (localStreamRef.current && oppositePeerId && peerInstanceRef.current && !callRef.current) {
      // Small timeout to ensure the receiver is fully initialized
      const callTimeout = setTimeout(() => {
         console.log(`[PeerJS] Initiating call to ${oppositePeerId}...`);
         setSessionStatus("Calling other participant...");
         
         const call = peerInstanceRef.current.call(oppositePeerId, localStreamRef.current);
         callRef.current = call;

         call.on("stream", (remoteStream) => {
            console.log("[PeerJS] Received remote stream inside initiate call event.");
            setSessionStatus("Call connected");
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch(console.error);
            }
         });

         call.on("close", () => {
            console.log("[PeerJS] Call closed (calling side).");
            if (remoteVideoRef.current) {
               remoteVideoRef.current.srcObject = null;
            }
         });
         
         call.on("error", (err) => {
           console.error("[PeerJS] Call error:", err);
         });

      }, 1000);

      return () => clearTimeout(callTimeout);
    }
  }, [oppositePeerId, isJoined]);

  // Media Controls
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (window.confirm("Are you sure you want to end this consultation?")) {
      navigate("/telemedicine");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 flex flex-col items-center justify-center text-white relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/30 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-6xl space-y-4 z-10 flex flex-col h-full mt-4 md:mt-8">
        
        {/* Header / Navigation */}
        <div className="flex justify-between items-center px-2 shrink-0">
          <button 
            className="text-slate-400 hover:text-white font-bold text-sm tracking-wide transition-colors flex items-center gap-2"
            onClick={() => navigate("/telemedicine")}
          >
            <span>←</span> Safe Exit
          </button>
          
          <div className="flex items-center gap-4">
             <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-2xl flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-sm font-bold text-slate-200">Session Secure</span>
             </div>
             <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-2xl">
                <span className="text-sm font-bold text-blue-400">{session.appointmentNo || "Session ID"}</span>
             </div>
          </div>
        </div>

        {/* Main Video Area Grid */}
        <div className="flex-1 min-h-[500px] w-full bg-slate-800/40 backdrop-blur-xl rounded-[2rem] border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col relative">
           
           {/* Top Status Overlay */}
           <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex justify-between items-start pointer-events-none">
              <div>
                <h2 className="text-xl font-extrabold text-white mb-1 drop-shadow-md">
                   {session.doctor || "Medical Consultation"}
                </h2>
                <p className="text-slate-200 font-medium text-sm drop-shadow-md">
                   {session.specialty || "General Checkup"}
                </p>
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                 <span className="text-xs font-bold text-slate-300 pointer-events-auto">{sessionStatus}</span>
              </div>
           </div>

           {/* Video Layout container */}
           <div className="flex-1 w-full h-full relative">
              
              {/* REMOTE VIDEO (Main Background) */}
              <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center overflow-hidden">
                {!oppositePeerId ? (
                   <div className="flex flex-col items-center animate-pulse opacity-60">
                     <span className="text-6xl mb-4">📹</span>
                     <p className="text-lg font-medium text-slate-400">Waiting for {oppositeRole}...</p>
                   </div>
                ) : (
                   <video 
                     ref={remoteVideoRef} 
                     autoPlay 
                     playsInline 
                     className="w-full h-full object-cover"
                   />
                )}
              </div>

              {/* LOCAL VIDEO (Picture-in-Picture) */}
              <div className="absolute bottom-6 right-6 w-32 md:w-48 lg:w-64 aspect-[3/4] md:aspect-video bg-slate-800 rounded-2xl border-2 border-slate-600/50 shadow-xl overflow-hidden z-20 transition-transform hover:scale-105 duration-300">
                {hasVideoPermission === false && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                       <span className="text-slate-500 font-bold text-xs text-center p-2">Camera Off</span>
                    </div>
                )}
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`}
                />
                {/* Local user label */}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
                  <span className="text-[10px] font-bold text-white">You</span>
                </div>
              </div>

           </div>

           {/* Bottom Control Bar */}
           <div className="absolute bottom-0 left-0 right-0 z-30 p-6 flex justify-center items-end pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-3 md:p-4 rounded-2xl shadow-2xl flex items-center gap-4 md:gap-6 pointer-events-auto transition-transform hover:-translate-y-1 duration-300">
                 
                 {/* Mic Toggle */}
                 <button 
                  onClick={toggleAudio}
                  className={`p-4 rounded-xl transition-all ${
                     isAudioMuted 
                       ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50" 
                       : "bg-slate-700/50 text-white hover:bg-slate-600 border border-slate-600"
                  }`}
                  title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
                 >
                   {isAudioMuted ? <MicOffIcon /> : <MicOnIcon />}
                 </button>

                 {/* End Call Button */}
                 <button 
                  onClick={endCall}
                  className="p-4 px-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg hover:shadow-red-500/25 active:scale-95 flex items-center justify-center"
                  title="End Consultation"
                 >
                   <PhoneIcon />
                 </button>

                 {/* Video Toggle */}
                 <button 
                  onClick={toggleVideo}
                  className={`p-4 rounded-xl transition-all ${
                     isVideoMuted 
                       ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50" 
                       : "bg-slate-700/50 text-white hover:bg-slate-600 border border-slate-600"
                  }`}
                  title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
                 >
                   {isVideoMuted ? <CameraOffIcon /> : <CameraOnIcon />}
                 </button>

              </div>
           </div>

        </div>

      </div>
    </div>
  );
}

export default VideoConsultation;
