import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { parseExpenseInput } from '../services/geminiService';

interface VoiceInputProps {
  onAdd: (expense: any) => void;
}

// Helper for base64 encoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const VoiceInput: React.FC<VoiceInputProps> = () => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("Tap the mic to start...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const transcriptionBuffer = useRef<string>("");
  const isComponentMounted = useRef<boolean>(true);

  const cleanupAudio = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    setIsProcessing(true);

    if (sessionRef.current) {
      try {
        sessionRef.current = null;
      } catch (e) {}
    }

    await cleanupAudio();

    // Small delay to let final transcription chunks settle in state
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!isComponentMounted.current) return;

    const finalTranscript = transcriptionBuffer.current || transcript;
    
    const ignoredStates = ["Listening...", "Tap the mic to start...", "I didn't catch that. Please try again.", "Could not access microphone or connect to AI."];
    if (finalTranscript && !ignoredStates.includes(finalTranscript)) {
      try {
        const result = await parseExpenseInput(finalTranscript);
        if (result && isComponentMounted.current) {
          router.push({ pathname: '/review', params: { parsedData: JSON.stringify(result), originalText: finalTranscript } });
          return;
        }
      } catch (err) {
        console.error("Parsing failed:", err);
      }
    }
    
    if (isComponentMounted.current) {
      setIsProcessing(false);
      setTranscript("I didn't catch that. Please try again.");
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    
    try {
      setErrorState(null);
      setIsRecording(true);
      setTranscript("Connecting...");
      transcriptionBuffer.current = "";

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!audioContextRef.current || !streamRef.current || audioContextRef.current.state === 'closed') return;
            setTranscript("Listening...");
            
            try {
              const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                if (!audioContextRef.current || audioContextRef.current.state !== 'running') return;

                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmData = new Uint8Array(int16.buffer);
                
                sessionPromise.then((session) => {
                  if (session && isComponentMounted.current) {
                    session.sendRealtimeInput({
                      media: {
                        data: encode(pcmData),
                        mimeType: 'audio/pcm;rate=16000',
                      },
                    });
                  }
                }).catch(() => {});
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current.destination);
            } catch (err) {
              console.error("Error setting up audio processing:", err);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription && isComponentMounted.current) {
              const text = message.serverContent.inputTranscription.text;
              transcriptionBuffer.current += text;
              setTranscript(transcriptionBuffer.current);
            }
          },
          onerror: (e: any) => {
            console.error("Live API Error:", e);
            if (isComponentMounted.current) {
              setIsRecording(false);
              const isUnavailable = e?.message?.toLowerCase().includes('unavailable') || e?.error?.message?.toLowerCase().includes('unavailable');
              setErrorState(isUnavailable ? "Service is currently busy. Please try again in a moment." : "An error occurred with the AI connection.");
              setTranscript("Connection failed.");
              cleanupAudio();
            }
          },
          onclose: () => console.log("Live API Closed"),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: "You are a transcription assistant. Transcribe the user's voice input accurately.",
        },
      });

      const session = await sessionPromise;
      if (isComponentMounted.current && session) {
        sessionRef.current = session;
      } else if (session) {
        try { (session as any).close(); } catch(e) {}
      }
    } catch (err: any) {
      console.error("Recording start error:", err);
      if (isComponentMounted.current) {
        setIsRecording(false);
        const isUnavailable = err?.message?.toLowerCase().includes('unavailable');
        setErrorState(isUnavailable ? "AI service is currently unavailable. Let's try again." : "Could not access microphone.");
        setTranscript("Setup failed.");
      }
      await cleanupAudio();
    }
  };

  useEffect(() => {
    isComponentMounted.current = true;
    startRecording();
    return () => {
      isComponentMounted.current = false;
      cleanupAudio();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      
      <div className="px-6 pt-12 flex justify-between items-center">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 text-text-sub hover:bg-gray-100 rounded-full transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-gray-100 shadow-sm">
            <span className="relative flex size-2">
              <span className="recording-pulse absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-danger"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-text-sub">Recording</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
        <div className="space-y-6">
          <h1 className={`text-3xl font-medium leading-tight transition-all duration-500 ${isRecording ? 'scale-105' : 'scale-100'}`}>
            "{isProcessing ? "Analyzing..." : transcript}"
          </h1>
          
          {errorState && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-4">
              <p className="text-red-800 text-sm font-medium">{errorState}</p>
              <button 
                onClick={startRecording}
                className="mt-3 px-6 py-2 bg-red-600 text-white text-xs font-bold rounded-full shadow-sm active:scale-95 transition-transform"
              >
                Retry Connection
              </button>
            </div>
          )}

          {!isRecording && !isProcessing && !errorState && (
             <button 
                onClick={startRecording}
                className="text-primary font-semibold underline underline-offset-4 active:opacity-70 transition-opacity"
              >
                Tap to re-record
              </button>
          )}
        </div>
      </div>

      <div className="pb-16 px-8 flex flex-col items-center">
        <div className="flex items-end justify-center gap-1.5 h-16 mb-12">
          {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
            <div 
              key={i}
              className={`w-1.5 rounded-full bg-primary transition-all duration-300 ${isRecording ? 'animate-pulse' : 'opacity-20'}`}
              style={{ 
                height: isRecording ? `${Math.random() * 40 + 10}px` : '4px',
                transition: 'height 0.1s ease-in-out'
              }}
            ></div>
          ))}
        </div>

        {isRecording ? (
          <button 
            onClick={stopRecording}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#111827] text-white shadow-lg active:scale-95 transition-all"
          >
            <div className="size-3 bg-danger rounded-sm animate-pulse"></div>
            <span className="font-semibold text-sm">Done Speaking</span>
          </button>
        ) : isProcessing ? (
           <div className="flex flex-col items-center gap-2">
             <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <span className="text-xs text-text-sub font-medium">Parsing details...</span>
           </div>
        ) : (
          <button 
            onClick={startRecording}
            className="size-20 rounded-full bg-primary text-white flex items-center justify-center shadow-glow active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-4xl">mic</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceInput;