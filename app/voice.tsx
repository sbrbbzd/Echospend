
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { parseExpenseInput } from '../services/geminiService';
import { useAppContext } from '../contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Mic, Square } from 'lucide-react-native';

// Helper for base64 encoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Components ---

const RecordingIndicator = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: 'rgba(30, 0, 60, 0.4)',
      borderWidth: 1,
      borderColor: 'rgba(124, 58, 237, 0.3)'
    }}>
      <Animated.View style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D946EF',
        opacity
      }} />
      <Text style={{
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#A78BFA',
        textTransform: 'uppercase'
      }}>
        RECORDING
      </Text>
    </View>
  );
};

const FormattedTranscript = ({ text }: { text: string }) => {
  // Simple regex to find amounts ($X.XX) and assume "for [Item]" structure for demo
  // We split by spaces for simplicity in this demo, or use a regex splitter

  if (!text) return null;

  // Regex to match currency (e.g. $20, $34.50)
  const currencyRegex = /(\$\d+(?:\.\d{2})?)/g;

  const parts = text.split(currencyRegex);

  return (
    <Text style={{
      fontSize: 32,
      fontWeight: '500',
      lineHeight: 44,
      textAlign: 'center',
      color: '#fff'
    }}>
      {parts.map((part, index) => {
        if (part.match(currencyRegex)) {
          return (
            <Text key={index} style={{
              color: '#D946EF', // Fuchsia/Purple for amount
              textShadowColor: 'rgba(217, 70, 239, 0.5)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
              fontWeight: '600'
            }}>
              {part}
            </Text>
          );
        }
        // Check for "for ..." to underline the category/item
        // This is a naive implementation for visual demo purposes
        if (part.includes(' for ')) {
          const subParts = part.split(' for ');
          return (
            <Text key={index}>
              {subParts[0]}
              {subParts.length > 1 && (
                <>
                  {' for '}
                  <Text style={{ textDecorationLine: 'underline', textDecorationColor: '#A78BFA' }}>
                    {subParts.slice(1).join(' for ')}
                  </Text>
                </>
              )}
            </Text>
          )
        }

        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

const AudioVisualizer = ({ isRecording }: { isRecording: boolean }) => {
  // Use Animated values for bars
  const bars = useRef([...Array(5)].map(() => new Animated.Value(4))).current;

  useEffect(() => {
    if (!isRecording) {
      bars.forEach(bar => bar.setValue(4));
      return;
    }

    const anims = bars.map((bar, i) => {
      // Create a random infinite loop for each bar with different durations
      const duration = 400 + Math.random() * 400;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 15 + Math.random() * 30, // Random height
            duration: duration,
            useNativeDriver: false, // height layout prop
            easing: Easing.inOut(Easing.ease)
          }),
          Animated.timing(bar, {
            toValue: 4,
            duration: duration,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease)
          })
        ])
      );
    });

    Animated.parallel(anims).start();

    return () => {
      bars.forEach(bar => bar.stopAnimation());
    };
  }, [isRecording]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50 }}>
      {bars.map((height, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: height,
            borderRadius: 3,
            backgroundColor: '#6366f1', // Indigo-500
            shadowColor: '#6366f1',
            shadowOpacity: 0.5,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 0 },
            opacity: isRecording ? 1 : 0.3
          }}
        />
      ))}
    </View>
  );
};

// --- Main Screen ---

const VoiceInput: React.FC = () => {
  const { addExpense, categories } = useAppContext();
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
      } catch (e) { }
      audioContextRef.current = null;
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    console.log("Stopping recording...");
    setIsRecording(false);
    setIsProcessing(true);

    if (sessionRef.current) {
      try {
        sessionRef.current = null;
      } catch (e) { }
    }

    await cleanupAudio();

    // Small delay to let final transcription chunks settle in state
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!isComponentMounted.current) return;

    const finalTranscript = transcriptionBuffer.current || transcript;
    console.log("Final Transcript:", finalTranscript);

    const ignoredStates = ["Listening...", "Tap the mic to start...", "I didn't catch that. Please try again.", "Could not access microphone or connect to AI."];

    // Check if we have valid text
    if (finalTranscript && !ignoredStates.includes(finalTranscript) && finalTranscript.trim().length > 0) {
      try {
        console.log("Attempting to parse:", finalTranscript);
        // Extract category names to pass to the service
        const availableCategories = categories.map(c => c.name);
        const result = await parseExpenseInput(finalTranscript, availableCategories);
        console.log("Parse Result:", result);

        if (result && isComponentMounted.current) {
          router.push({ pathname: '/review', params: { parsedData: JSON.stringify(result), originalText: finalTranscript } });
          return;
        } else {
          console.warn("Parse result was null");
        }
      } catch (err) {
        console.error("Parsing failed:", err);
      }
    } else {
      console.log("Transcript ignored or empty. State:", finalTranscript);
    }

    if (isComponentMounted.current) {
      setIsProcessing(false);
      setTranscript("I didn't catch that. Please try again.");
    }
  };

  const startRecording = async () => {
    // Prevent multiple start calls if already recording
    if (isRecording) return;

    try {
      setErrorState(null);
      setIsRecording(true);
      setTranscript("Listening..."); // Immediate feedback
      transcriptionBuffer.current = "";

      // Check if we're in a web environment
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        setErrorState("Voice input is only available on web platforms.");
        setIsRecording(false);
        return;
      }

      // Check for HTTPS (required for getUserMedia in most browsers)
      const isLocalhost = location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.hostname === '[::1]' ||
        location.hostname.endsWith('.local');
      const isSecureContext = window.isSecureContext ||
        location.protocol === 'https:' ||
        isLocalhost;

      // AudioContext support
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        setErrorState("Your browser doesn't support audio processing.");
        setIsRecording(false);
        return;
      }

      // getUserMedia support
      const getUserMediaFn = navigator.mediaDevices?.getUserMedia ||
        (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia;

      if (!getUserMediaFn) {
        setErrorState(isSecureContext ? "Your browser doesn't support voice input." : "Voice input requires HTTPS.");
        setIsRecording(false);
        return;
      }

      // Wrapper for legacy getUserMedia
      const getUserMedia = (constraints: MediaStreamConstraints): Promise<MediaStream> => {
        if (navigator.mediaDevices?.getUserMedia) {
          return navigator.mediaDevices.getUserMedia(constraints);
        }
        return new Promise((resolve, reject) => {
          const legacyGetUserMedia = getUserMediaFn.bind(navigator);
          legacyGetUserMedia(constraints, resolve, reject);
        });
      };

      // Get media stream
      let stream: MediaStream;
      try {
        stream = await getUserMedia({ audio: true });
      } catch (mediaError: any) {
        console.error("Microphone access error:", mediaError);
        setErrorState("Could not access microphone. Please check permissions.");
        setIsRecording(false);
        await cleanupAudio();
        return;
      }

      streamRef.current = stream;

      // API Key check
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        setErrorState("API key not configured.");
        setIsRecording(false);
        await cleanupAudio();
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = inputAudioContext;

      if (inputAudioContext.state === 'suspended') {
        await inputAudioContext.resume().catch(e => console.warn("Resume failed", e));
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-dialog',
        callbacks: {
          onopen: () => {
            if (!audioContextRef.current || !streamRef.current || audioContextRef.current.state === 'closed') return;

            if (audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume().catch(() => { });
            }

            // setTranscript("Listening..."); // Already set

            try {
              const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                if (!audioContextRef.current || audioContextRef.current.state !== 'running') return;

                try {
                  const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                  const l = inputData.length;
                  const int16 = new Int16Array(l);
                  for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768; // pcm conversion
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
                  }).catch(() => { });
                } catch (e) {
                  // Silent fail for audio process error to prevent spam 
                }
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current.destination);
            } catch (err: any) {
              if (isComponentMounted.current) {
                setErrorState("Audio setup failed. Try another browser.");
                setIsRecording(false);
                cleanupAudio();
              }
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
              setErrorState("Connection unavailable or interrupted.");
              // setTranscript("Connection failed.");
              cleanupAudio();
            }
          },
          onclose: () => console.log("Live API Closed"),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: "You are a transcription assistant. Transcribe the user's voice input exactly as spoken.",
        },
      });

      const session = await sessionPromise;
      if (isComponentMounted.current && session) {
        sessionRef.current = session;
      } else if (session) {
        (session as any).close();
      }
    } catch (err: any) {
      console.error("Start recording error:", err);
      if (isComponentMounted.current) {
        setIsRecording(false);
        setErrorState("Could not start recording.");
        // setTranscript("Setup failed.");
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
    <LinearGradient
      colors={['#0f172a', '#020617', '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: 24, top: 60, padding: 8 }}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>

          {isRecording && <RecordingIndicator />}
        </View>

        {/* Main Content Area */}
        <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ minHeight: 200, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            {!isRecording && !isProcessing && transcript === "Tap the mic to start..." ? (
              <Text style={{ fontSize: 24, color: '#64748b', textAlign: 'center' }}>Tap microphone to start</Text>
            ) : (
              <FormattedTranscript text={transcript} />
            )}

            {/* Status / Error Message */}
            {isProcessing && (
              <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#A78BFA" />
                <Text style={{ color: '#A78BFA', fontSize: 16 }}>Processing...</Text>
              </View>
            )}

            {errorState && (
              <View style={{ marginTop: 24, backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' }}>
                <Text style={{ color: '#fca5a5', textAlign: 'center' }}>{errorState}</Text>
                <TouchableOpacity onPress={startRecording} style={{ marginTop: 8, alignSelf: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={{ paddingBottom: 80, alignItems: 'center', gap: 40 }}>
          {/* Visualizer */}
          <AudioVisualizer isRecording={isRecording} />

          {/* Action Button */}
          {isRecording ? (
            <TouchableOpacity
              onPress={stopRecording}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 999,
                backgroundColor: '#1f2937',
                borderWidth: 1,
                borderColor: '#374151'
              }}
            >
              <Square size={16} color="#ef4444" fill="#ef4444" />
              <Text style={{ fontWeight: '600', fontSize: 16, color: '#fff' }}>Stop Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={startRecording}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: '#D946EF',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#D946EF',
                shadowOpacity: 0.5,
                shadowRadius: 15,
                shadowOffset: { width: 0, height: 0 },
                elevation: 5
              }}
            >
              <Mic size={32} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

export default VoiceInput;
