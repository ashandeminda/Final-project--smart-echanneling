import React, { useState } from "react";
import aiIcon from "../assets/artificial-intelligence.png";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const toConversationHistory = (messages) =>
  messages
    .filter((msg) => msg.sender === "user" || msg.sender === "ai")
    .map((msg) => {
      if (msg.sender === "user") {
        return { role: "user", content: msg.text };
      }

      if (msg.type === "card" && msg.data) {
        return {
          role: "assistant",
          content:
            msg.data.reply ||
            `${msg.data.analysis} Recommended doctor: ${msg.data.recommendedDoctor}. Severity: ${msg.data.severity}.`,
        };
      }

      return { role: "assistant", content: msg.text };
    });

function Symptomchecker() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello 👋 Describe your symptoms and I will guide you."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const currentInput = input.trim();
    const userMessage = { sender: "user", text: currentInput };
    const conversationHistory = toConversationHistory(messages);
    
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.post("/ai/check-symptoms", {
        symptoms: currentInput,
        messages: conversationHistory,
      });

      const data = response.data;

      const aiResponse = {
        sender: "ai",
        type: "card",
        data: data,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error("Symptom check failed:", err);
      const aiResponse = {
        sender: "ai",
        text: "Sorry, the AI service is temporarily unavailable. Please try again later."
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-3xl mx-auto mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-200">
          <img src={aiIcon} alt="AI" className="w-10 h-10 opacity-80" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">AI Symptom Assistant</h1>
        <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
          Describe your symptoms securely and receive smart medical guidance in seconds.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden flex flex-col h-[600px] relative">
        
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scroll-smooth">
          {messages.map((msg, index) => (
            <div key={index} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              <div 
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-5 ${
                  msg.sender === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-sm shadow-md' 
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                }`}
              >
                {/* Text message */}
                {msg.text && <p className="text-[15px] whitespace-pre-line leading-relaxed">{msg.text}</p>}

                {/* AI Structured Card */}
                {msg.type === "card" && msg.data && (
                  <div className="flex flex-col gap-5">
                    
                    {msg.data.reply && (
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Assistant Reply</span>
                        <p className="text-[15px] leading-relaxed">{msg.data.reply}</p>
                      </div>
                    )}

                    {msg.data.source && (
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Assistant Mode</span>
                        <p className="text-sm font-medium">{msg.data.source === "ai" ? "OpenAI Live" : "Fallback Mode"}</p>
                      </div>
                    )}

                    {msg.data.source === "fallback" && msg.data.reason && (
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Fallback Reason</span>
                        <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">{msg.data.reason}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200/60">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                        <span>🩺</span> Analysis
                      </span>
                      <p className="text-[15px] leading-relaxed">{msg.data.analysis}</p>
                    </div>

                    {msg.data.severity && (
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                          msg.data.severity.toLowerCase().includes('high') ? 'bg-rose-50 border-rose-200 text-rose-700' :
                          msg.data.severity.toLowerCase().includes('medium') ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          ⚠️ {msg.data.severity}
                        </span>
                      </div>
                    )}

                    {msg.data.possibleConditions?.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                          <span>🔍</span> Possible Conditions
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.data.possibleConditions.map((c, i) => (
                            <span key={i} className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-[13px] font-semibold">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.data.homeRemedies?.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                          <span>💊</span> Home Remedies
                        </span>
                        <ul className="list-disc pl-5 space-y-1.5 text-sm">
                          {msg.data.homeRemedies.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl mt-2 flex flex-col">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Recommended Specialist</span>
                      <strong className="text-emerald-900 text-lg">👨‍⚕️ {msg.data.recommendedDoctor}</strong>
                    </div>

                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex w-full justify-start">
               <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm p-5 shadow-sm flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                 <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                 <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex flex-col gap-4">
          <div className="flex gap-3 relative">
            <input
              type="text"
              placeholder="Type your symptoms here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
              className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl py-3.5 px-5 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium"
            />
            <button 
              onClick={handleSend} 
              disabled={loading}
              className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              Send
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <span>⚠</span> For informational purposes only. Consult a doctor for medical advice.
            </span>
            <button
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 text-xs font-bold py-2 px-5 rounded-full transition-colors whitespace-nowrap"
              onClick={() => navigate("/hospitals")}
            >
              Book Appointment →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Symptomchecker;
