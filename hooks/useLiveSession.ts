import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface Transcript {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    isFinal: boolean;
}

export const useLiveSession = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isTalking, setIsTalking] = useState(false); // Model is talking
    const [volume, setVolume] = useState(0);
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    
    // Refs for audio processing
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const sessionRef = useRef<any>(null); // The live session object
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    // Audio playback queue
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Connect to Gemini Live
    const connect = useCallback(async () => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("No API key found");
            return;
        }

        try {
            // Initialize Audio Contexts
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = outputCtx;
            
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputContextRef.current = inputCtx;

            const ai = new GoogleGenAI({ apiKey });

            // Establish Live Connection
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: async () => {
                        console.log('Live Session Opened');
                        setIsConnected(true);
                        
                        // Start Input Stream
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            streamRef.current = stream;
                            
                            const source = inputCtx.createMediaStreamSource(stream);
                            sourceRef.current = source;
                            
                            // Visualizer Analyzer
                            const analyzer = inputCtx.createAnalyser();
                            analyzer.fftSize = 256;
                            source.connect(analyzer);
                            
                            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                            const updateVolume = () => {
                                if (!isConnected) return; // Stop if disconnected
                                analyzer.getByteFrequencyData(dataArray);
                                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                                setVolume(avg);
                                requestAnimationFrame(updateVolume);
                            };
                            updateVolume();

                            // Audio Processing for API
                            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                            processorRef.current = processor;
                            
                            processor.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                
                                sessionPromiseRef.current?.then(session => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };
                            
                            source.connect(processor);
                            processor.connect(inputCtx.destination);

                        } catch (err) {
                            console.error("Microphone error:", err);
                        }
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Transcriptions
                        if (msg.serverContent?.outputTranscription) {
                            const text = msg.serverContent.outputTranscription.text;
                            updateTranscript('model', text, false);
                        }
                        if (msg.serverContent?.inputTranscription) {
                            const text = msg.serverContent.inputTranscription.text;
                            updateTranscript('user', text, false);
                        }
                        if (msg.serverContent?.turnComplete) {
                            // Mark last transcripts as final
                            setTranscripts(prev => prev.map(t => ({...t, isFinal: true})));
                            setIsTalking(false);
                        }

                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            setIsTalking(true);
                            const ctx = audioContextRef.current;
                            if (ctx) {
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                                
                                const source = ctx.createBufferSource();
                                source.buffer = buffer;
                                source.connect(ctx.destination);
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += buffer.duration;
                                
                                sourcesRef.current.add(source);
                                source.onended = () => {
                                    sourcesRef.current.delete(source);
                                    if (sourcesRef.current.size === 0) setIsTalking(false);
                                };
                            }
                        }
                    },
                    onclose: () => {
                        console.log("Session Closed");
                        setIsConnected(false);
                        disconnect();
                    },
                    onerror: (e) => {
                        console.error("Session Error", e);
                        disconnect();
                    }
                },
                config: {
                   responseModalities: [Modality.AUDIO],
                   inputAudioTranscription: {},
                   outputAudioTranscription: {}
                }
            });

        } catch (error) {
            console.error("Failed to connect", error);
        }
    }, []);

    const disconnect = useCallback(() => {
        setIsConnected(false);
        setIsTalking(false);
        setVolume(0);

        // Clean up Audio
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (inputContextRef.current) {
            inputContextRef.current.close();
            inputContextRef.current = null;
        }

        // Close Session
        sessionPromiseRef.current?.then(session => session.close()); // Assume close method exists or just drop ref
        sessionPromiseRef.current = null;
    }, []);

    const updateTranscript = (role: 'user' | 'model', text: string, isFinal: boolean) => {
        setTranscripts(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === role && !last.isFinal) {
                return [...prev.slice(0, -1), { ...last, text: last.text + text, isFinal }];
            } else {
                return [...prev, { role, text, isFinal, timestamp: Date.now() }];
            }
        });
    };

    // Helper functions
    function createBlob(data: Float32Array): any {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    function encode(bytes: Uint8Array) {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    }

    return {
        connect,
        disconnect,
        isConnected,
        isTalking,
        volume,
        transcripts
    };
};
