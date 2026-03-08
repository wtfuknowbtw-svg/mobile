import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Animated,
    Easing,
    Alert,
    TextInput,
} from 'react-native';
import { COLORS } from '../constants';
import { processOCR } from '../api/ai';
import * as Speech from 'expo-speech';

// Note: expo-speech-recognition requires a Development Client and crashes in Expo Go.
// We'll use a text input fallback for now
const isVoiceSupported = true; // Enable text input fallback

interface VoiceInputScreenProps {
    navigation: any;
}

export default function VoiceInputScreen({ navigation }: VoiceInputScreenProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [transcript, setTranscript] = useState('');
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const startRecording = async () => {
        setIsRecording(true);
        setSeconds(0);
        
        // Start pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Simulate voice recording for 3 seconds
        setTimeout(() => {
            stopRecording();
            // Set a sample transcript (in real app, this would come from speech recognition)
            setTranscript("Raja ko 2 kg daal diya 200 rupay mein");
            
            // Speak confirmation
            Speech.speak("Voice recorded successfully. Please review the transaction.", {
                language: 'en',
                pitch: 1.0,
                rate: 0.8,
            });
        }, 3000);
    };

    const stopRecording = async () => {
        setIsRecording(false);
    };

    const handleProcessVoice = async (text: string) => {
        try {
            const result = await processOCR({ transcript: text });
            if (result.data) {
                navigation.navigate('ReviewOCR', {
                    receiptData: result.data,
                    transcript: text
                });
            } else {
                Alert.alert("No Data", "Could not understand the transaction.");
            }
        } catch (e) {
            Alert.alert("Error", "Something went wrong during parsing.");
        }
    };

    // Pulse animation for mic
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
        return () => pulseAnim.stopAnimation();
    }, [isRecording]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 52,
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 16, color: COLORS.text }}>←</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>🎤</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
                        Voice Entry
                    </Text>
                </View>
                <Text style={{ fontSize: 18 }}>•••</Text>
            </View>

            {/* Hint */}
            <Text
                style={{
                    fontSize: 14,
                    color: COLORS.textMuted,
                    textAlign: 'center',
                    marginTop: 8,
                }}
            >
                Speak in Hindi, Marathi, or English
            </Text>

            {/* Mic Button */}
            <View
                style={{
                    alignItems: 'center',
                    marginTop: 40,
                    marginBottom: 20,
                }}
            >
                <Animated.View
                    style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        borderWidth: 3,
                        borderColor: COLORS.success,
                        borderStyle: 'dashed',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: [{ scale: pulseAnim }],
                    }}
                >
                    <TouchableOpacity
                        onPress={() => isRecording ? stopRecording() : startRecording()}
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: isRecording ? COLORS.danger : COLORS.successLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 36 }}>{isRecording ? '⏹' : '🎤'}</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Status */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 16,
                    }}
                >
                    {isRecording && (
                        <View
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: COLORS.danger,
                                marginRight: 8,
                            }}
                        />
                    )}
                    <Text
                        style={{
                            fontSize: 14,
                            color: isRecording ? COLORS.success : COLORS.textMuted,
                            fontWeight: '600',
                        }}
                    >
                        {isRecording ? `🎤 Recording... ${formatTime(seconds)}` : 'Tap to start recording'}
                    </Text>
                </View>

                {/* Recording Instructions */}
                {isRecording && (
                    <View style={{ marginTop: 12 }}>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center' }}>
                            Speak clearly: "Customer name item quantity amount"
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 }}>
                            Example: "Raja ko 2 kg daal diya 200 rupay mein"
                        </Text>
                    </View>
                )}
            </View>

            {/* Text Input Fallback */}
            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
                <Text
                    style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: COLORS.textMuted,
                        letterSpacing: 1,
                        marginBottom: 8,
                    }}
                >
                    OR TYPE MANUALLY
                </Text>
                <TextInput
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        fontSize: 15,
                        color: COLORS.text,
                        minHeight: 80,
                        textAlignVertical: 'top',
                    }}
                    placeholder="e.g., Raja ko 2 kg daal diya 200 rupay mein"
                    placeholderTextColor={COLORS.textMuted}
                    value={transcript}
                    onChangeText={setTranscript}
                    multiline
                />
            </View>

            {/* Process Button */}
            {transcript !== '' && (
                <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
                    <TouchableOpacity
                        onPress={() => handleProcessVoice(transcript)}
                        style={{
                            backgroundColor: COLORS.success,
                            paddingVertical: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>
                            🤖 Process with AI
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Transcript */}
            {transcript !== '' && (
                <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: COLORS.textMuted,
                            letterSpacing: 1,
                            marginBottom: 8,
                        }}
                    >
                        PREVIEW
                    </Text>
                    <View
                        style={{
                            backgroundColor: COLORS.card,
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            borderStyle: 'dashed',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: COLORS.text,
                                fontStyle: 'italic',
                                lineHeight: 22,
                            }}
                        >
                            {transcript}
                        </Text>
                    </View>
                </View>
            )}

        </View>
    );
}
