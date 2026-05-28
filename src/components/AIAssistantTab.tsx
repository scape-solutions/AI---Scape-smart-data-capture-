import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Check, Edit2 } from 'lucide-react';
import { ProjectState } from '../types';
import ReactMarkdown from 'react-markdown';

interface AIAssistantTabProps {
  currentProject: ProjectState;
  setCurrentProject: (p: ProjectState) => void;
  sendMessageToAssistant: (msg: string) => Promise<void>;
  isGeneratingReport: boolean;
  saveProject: () => Promise<ProjectState | null>;
}

export function AIAssistantTab({ currentProject, setCurrentProject, sendMessageToAssistant, isGeneratingReport, saveProject }: AIAssistantTabProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll til bunden af chatten når der kommer nye beskeder
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentProject.chatHistory]);

  const handleSend = () => {
    if (!input.trim() || isGeneratingReport) return;
    sendMessageToAssistant(input);
    setInput("");
  };

  const extractJSON = (text: string) => {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) { return null; }
    }
    return null;
  };

  const stripJSONFromText = (text: string) => {
    return text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '').trim();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="p-4 bg-white border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <Bot className="w-6 h-6 mr-2 text-primary" />
          AI Auto-fill Assistant
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Describe your project in your own words. I will analyze the text and propose updates to your questionnaire fields.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {(!currentProject.chatHistory || currentProject.chatHistory.length === 0) && (
          <div className="text-center mt-10 text-slate-400">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Start by describing your project.</p>
            <p className="text-sm">E.g., "We need to pick metal cylinders from a bin using a Kuka robot..."</p>
          </div>
        )}

        {currentProject.chatHistory?.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const jsonProposal = !isUser ? extractJSON(msg.text) : null;
          const cleanText = !isUser ? stripJSONFromText(msg.text) : msg.text;

          return (
            <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-start max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-primary text-white ml-3' : 'bg-slate-200 text-slate-600 mr-3'}`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-xl shadow-sm ${isUser ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'}`}>
                  {cleanText && (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{cleanText}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposed Changes Card */}
              {jsonProposal && (
                <div className="ml-11 mt-2 w-[85%]">
                  <ProposedChangesCard 
                    proposal={jsonProposal} 
                    currentProject={currentProject}
                    setCurrentProject={setCurrentProject}
                    saveProject={saveProject}
                  />
                </div>
              )}
            </div>
          );
        })}

        {isGeneratingReport && (
          <div className="flex items-start">
             <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 mr-3">
                <Bot className="w-4 h-4" />
             </div>
             <div className="p-4 bg-white rounded-xl rounded-tl-none border border-slate-200 shadow-sm flex space-x-2 items-center">
               <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
               <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
               <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <textarea
            className="flex-1 border border-slate-300 rounded-lg p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            placeholder="Type your message..."
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isGeneratingReport || !input.trim()}
            className="p-4 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposedChangesCard({ proposal, currentProject, setCurrentProject, saveProject }: any) {
  const [editedProposal, setEditedProposal] = useState(proposal);
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = async () => {
    const updatedProject = { ...currentProject };
    
    if (editedProposal.generalResponses) {
      updatedProject.generalResponses = {
        ...updatedProject.generalResponses,
        ...editedProposal.generalResponses
      };
    }

    if (editedProposal.parts && Array.isArray(editedProposal.parts)) {
      editedProposal.parts.forEach((aiPart: any, idx: number) => {
        if (!updatedProject.parts[idx]) {
           // We shouldn't automatically create completely new parts just yet without full structure, 
           // but we can try if needed. For now assume modifying existing parts.
           updatedProject.parts[idx] = { responses: {}, images: [] };
        }
        updatedProject.parts[idx].responses = {
          ...updatedProject.parts[idx].responses,
          ...aiPart.responses
        };
      });
    }

    setCurrentProject(updatedProject);
    await saveProject(); // Save changes to DB immediately
    setIsApplied(true);
  };

  if (isApplied) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-center shadow-sm">
        <Check className="w-5 h-5 mr-2" />
        <span className="font-medium">Changes applied successfully.</span>
      </div>
    );
  }

  // Render editable inputs for every key in the proposal
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-amber-100 p-3 flex justify-between items-center border-b border-amber-200">
        <h3 className="font-semibold text-amber-900 text-sm flex items-center">
          <Edit2 className="w-4 h-4 mr-2" />
          Proposed Updates
        </h3>
        <button 
          onClick={handleApply}
          className="bg-primary text-white text-xs px-3 py-1.5 rounded hover:bg-primary/90 transition-colors shadow-sm font-medium"
        >
          Apply Changes
        </button>
      </div>
      <div className="p-4 space-y-4">
        {editedProposal.generalResponses && Object.entries(editedProposal.generalResponses).map(([key, value]) => (
          <div key={key} className="text-sm">
            <label className="block text-amber-800 font-medium mb-1">General: {key}</label>
            <div className="flex space-x-2">
               <div className="flex-1 bg-white border border-slate-200 text-slate-500 p-2 rounded line-through opacity-70">
                 {currentProject.generalResponses[key] || <span className="italic">Empty</span>}
               </div>
               <input 
                 className="flex-1 border border-amber-300 p-2 rounded focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-amber-900 bg-white"
                 value={value as string}
                 onChange={(e) => {
                    const newProp = {...editedProposal};
                    newProp.generalResponses[key] = e.target.value;
                    setEditedProposal(newProp);
                 }}
               />
            </div>
          </div>
        ))}

        {editedProposal.parts && editedProposal.parts.map((part: any, pIdx: number) => (
          part.responses && Object.entries(part.responses).map(([key, value]) => (
            <div key={`part-${pIdx}-${key}`} className="text-sm">
              <label className="block text-amber-800 font-medium mb-1">Part {pIdx + 1}: {key}</label>
              <div className="flex space-x-2">
                 <div className="flex-1 bg-white border border-slate-200 text-slate-500 p-2 rounded line-through opacity-70">
                   {currentProject.parts[pIdx]?.responses[key] || <span className="italic">Empty</span>}
                 </div>
                 <input 
                   className="flex-1 border border-amber-300 p-2 rounded focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-amber-900 bg-white"
                   value={value as string}
                   onChange={(e) => {
                      const newProp = {...editedProposal};
                      newProp.parts[pIdx].responses[key] = e.target.value;
                      setEditedProposal(newProp);
                   }}
                 />
              </div>
            </div>
          ))
        ))}
      </div>
    </div>
  );
}
