import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
    TextInput,
    Animated,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    Platform,
} from 'react-native';
import { COLORS } from '../constants';
import { processVoice } from '../api/ai';

interface VoiceInputScreenProps {
    navigation: any;
}

export default function VoiceInputScreen({ navigation }: VoiceInputScreenProps) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');

    const inputRef = useRef<TextInput>(null);

    // ── Animated values ──────────────────────────────────────────────────────
    const ring1Scale = useRef(new Animated.Value(1)).current;
    const ring2Scale = useRef(new Animated.Value(1)).current;
    const ring3Scale = useRef(new Animated.Value(1)).current;
    const ring1Opacity = useRef(new Animated.Value(0)).current;
    const ring2Opacity = useRef(new Animated.Value(0)).current;
    const ring3Opacity = useRef(new Animated.Value(0)).current;
    const micPulse = useRef(new Animated.Value(1)).current;
    const processButtonGlow = useRef(new Animated.Value(0)).current;

    const rippleAnimRef = useRef<Animated.CompositeAnimation | null>(null);
    const micPulseRef = useRef<Animated.CompositeAnimation | null>(null);
    const processGlowRef = useRef<Animated.CompositeAnimation | null>(null);

    // ── Ripple animation ─────────────────────────────────────────────────────
    const startRipple = useCallback(() => {
        ring1Scale.setValue(1);
        ring2Scale.setValue(1);
        ring3Scale.setValue(1);
        ring1Opacity.setValue(0.5);
        ring2Opacity.setValue(0.35);
        ring3Opacity.setValue(0.2);

        const makeRing = (scale: Animated.Value, opacity: Animated.Value, delay: number, baseOpacity: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 2.2, duration: 1500, useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: baseOpacity, duration: 0, useNativeDriver: true }),
                    ]),
                ])
            );

        rippleAnimRef.current = Animated.parallel([
            makeRing(ring1Scale, ring1Opacity, 0, 0.5),
            makeRing(ring2Scale, ring2Opacity, 400, 0.35),
            makeRing(ring3Scale, ring3Opacity, 800, 0.2),
        ]);
        rippleAnimRef.current.start();
    }, [ring1Scale, ring2Scale, ring3Scale, ring1Opacity, ring2Opacity, ring3Opacity]);

    const stopRipple = useCallback(() => {
        rippleAnimRef.current?.stop();
        Animated.parallel([
            Animated.timing(ring1Opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(ring3Opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();
    }, [ring1Opacity, ring2Opacity, ring3Opacity]);

    // ── Mic pulse ────────────────────────────────────────────────────────────
    const startMicPulse = useCallback(() => {
        micPulseRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(micPulse, { toValue: 1.1, duration: 600, useNativeDriver: true }),
                Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        micPulseRef.current.start();
    }, [micPulse]);

    const stopMicPulse = useCallback(() => {
        micPulseRef.current?.stop();
        Animated.timing(micPulse, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }, [micPulse]);

    // ── Process button glow ──────────────────────────────────────────────────
    useEffect(() => {
        if (transcript.trim() && !isListening && !isProcessing) {
            processGlowRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(processButtonGlow, { toValue: 1, duration: 800, useNativeDriver: false }),
                    Animated.timing(processButtonGlow, { toValue: 0, duration: 800, useNativeDriver: false }),
                ])
            );
            processGlowRef.current.start();
        } else {
            processGlowRef.current?.stop();
            processButtonGlow.setValue(0);
        }
    }, [transcript, isListening, isProcessing]);

    // ── Mic button handler ───────────────────────────────────────────────────
    const handleMicPress = () => {
        if (isProcessing) return;

        if (isListening) {
            // Stop listening
            setIsListening(false);
            stopRipple();
            stopMicPulse();
            Keyboard.dismiss();
        } else {
            // Start listening — focus the visible TextInput to bring up keyboard with mic
            setIsListening(true);
            startRipple();
            startMicPulse();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // When the keyboard is dismissed externally, stop listening state
    useEffect(() => {
        const sub = Keyboard.addListener('keyboardDidHide', () => {
            if (isListening) {
                setIsListening(false);
                stopRipple();
                stopMicPulse();
            }
        });
        return () => sub.remove();
    }, [isListening, stopRipple, stopMicPulse]);

    // ── Process transcript (ORIGINAL LOGIC — UNCHANGED) ─────────────────────
    const processTextTranscript = async () => {
        if (!transcript.trim()) {
            Alert.alert('Error', 'Please enter a transaction first');
            return;
        }

        setIsProcessing(true);
        try {
            console.log('Processing transcript:', transcript);

            const result = await processVoice({
                transcript: transcript.trim()
            });

            if (result.error) {
                console.error('Text processing error:', result.error);
                Alert.alert('Error', result.error);
                return;
            }

            if (result.data && result.data.length > 0) {
                const voiceData = result.data[0];
                console.log('Voice processing result:', voiceData);

                const confidence = voiceData.confidence || 0;
                if (confidence >= 40) {
                    navigation.navigate('ReviewOCR', {
                        receiptData: voiceData,
                        transcript: voiceData.rawText
                    });
                } else {
                    navigation.navigate('ManualEntry', {
                        preFilledData: voiceData,
                        highlightFields: true
                    });
                }
            } else {
                Alert.alert('Error', 'No data received from voice processing');
            }

        } catch (error) {
            console.error('Text processing error:', error);
            Alert.alert('Error', 'Failed to process text. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Derived ──────────────────────────────────────────────────────────────
    const hasTranscript = transcript.trim().length > 0;
    const showProcess = hasTranscript && !isListening && !isProcessing;

    const processButtonBg = processButtonGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.primary, '#3B7BF7'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Voice Input</Text>
                <View style={{ width: 42 }} />
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
                {isListening ? '🎤  Listening… tap the keyboard mic to dictate' : 'Tap the mic button, then use keyboard mic to speak'}
            </Text>

            {/* ── Center section ── */}
            <View style={styles.centerSection}>

                {/* Ripple rings + Mic button */}
                <View style={styles.micContainer}>
                    {/* Ring 3 (outermost) */}
                    <Animated.View style={[styles.ring, {
                        transform: [{ scale: ring3Scale }],
                        opacity: ring3Opacity,
                        borderColor: COLORS.primary,
                    }]} />
                    {/* Ring 2 */}
                    <Animated.View style={[styles.ring, {
                        transform: [{ scale: ring2Scale }],
                        opacity: ring2Opacity,
                        borderColor: COLORS.primary,
                    }]} />
                    {/* Ring 1 */}
                    <Animated.View style={[styles.ring, {
                        transform: [{ scale: ring1Scale }],
                        opacity: ring1Opacity,
                        borderColor: COLORS.primary,
                    }]} />

                    {/* Mic Button */}
                    <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                        <TouchableOpacity
                            onPress={handleMicPress}
                            disabled={isProcessing}
                            activeOpacity={0.85}
                            style={[
                                styles.micButton,
                                isListening && styles.micButtonActive,
                            ]}
                        >
                            <Text style={styles.micIcon}>🎤</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Label */}
                <Text style={[styles.stateLabel, isListening && { color: COLORS.primary, fontWeight: '600' }]}>
                    {isListening ? 'Tap to stop' : 'Tap to start'}
                </Text>

                {/* Transcript Input Card */}
                <View style={styles.transcriptCard}>
                    <Text style={styles.transcriptLabel}>Transaction Details</Text>
                    <TextInput
                        ref={inputRef}
                        style={styles.transcriptInput}
                        placeholder="Tap mic above, then use keyboard 🎤 to speak…"
                        placeholderTextColor={COLORS.textMuted}
                        value={transcript}
                        onChangeText={setTranscript}
                        multiline
                        editable={!isProcessing}
                        textAlignVertical="top"
                    />
                </View>

                {/* Processing indicator */}
                {isProcessing && (
                    <View style={styles.processingRow}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.processingText}>Processing with AI…</Text>
                    </View>
                )}

                {/* Process button */}
                {showProcess && (
                    <Animated.View style={[styles.processButtonWrapper, {
                        shadowColor: COLORS.primary,
                        shadowRadius: 12,
                        shadowOpacity: 0.35,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 8,
                    }]}>
                        <TouchableOpacity onPress={processTextTranscript} activeOpacity={0.8}>
                            <Animated.View style={[styles.processButton, { backgroundColor: processButtonBg }]}>
                                <Text style={styles.processButtonText}>⚡  Process Transaction</Text>
                            </Animated.View>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>

            {/* Example phrases */}
            <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Try saying</Text>
                <View style={styles.examplesRow}>
                    {['Ram ko 500 diya', 'Raju se 200 liya', 'Sita ne 100 diya'].map((phrase) => (
                        <TouchableOpacity
                            key={phrase}
                            style={styles.exampleChip}
                            activeOpacity={0.7}
                            onPress={() => {
                                setTranscript(phrase);
                                setIsListening(false);
                                stopRipple();
                                stopMicPulse();
                                Keyboard.dismiss();
                            }}
                        >
                            <Text style={styles.exampleChipText}>"{phrase}"</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

const MIC_SIZE = 76;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 56 : 46,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        color: COLORS.text,
        fontSize: 20,
        lineHeight: 22,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '700',
    },
    subtitle: {
        color: COLORS.textMuted,
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 32,
        paddingVertical: 12,
    },
    centerSection: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 20,
    },
    micContainer: {
        width: MIC_SIZE * 2.6,
        height: MIC_SIZE * 2.6,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    ring: {
        position: 'absolute',
        width: MIC_SIZE,
        height: MIC_SIZE,
        borderRadius: MIC_SIZE / 2,
        borderWidth: 2,
    },
    micButton: {
        width: MIC_SIZE,
        height: MIC_SIZE,
        borderRadius: MIC_SIZE / 2,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 2.5,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    micButtonActive: {
        backgroundColor: COLORS.primary,
        shadowOpacity: 0.5,
        shadowRadius: 16,
    },
    micIcon: {
        fontSize: 30,
    },
    stateLabel: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginTop: -10,
    },
    transcriptCard: {
        width: '100%',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    transcriptLabel: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    transcriptInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: COLORS.text,
        backgroundColor: COLORS.background,
        minHeight: 80,
        maxHeight: 140,
        textAlignVertical: 'top',
    },
    processingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    processingText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    processButtonWrapper: {
        borderRadius: 14,
        width: '100%',
    },
    processButton: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    processButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    examplesContainer: {
        paddingBottom: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    examplesTitle: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    examplesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    exampleChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
    },
    exampleChipText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '500',
    },
});
