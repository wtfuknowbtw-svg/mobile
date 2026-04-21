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
    ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../constants';
import { processVoiceAudio } from '../api/ai';

interface VoiceInputScreenProps {
    navigation: any;
}

const LANGUAGES = [
    { label: 'Hindi', code: 'hi' },
    { label: 'Marathi', code: 'mr' },
    { label: 'Telugu', code: 'te' },
    { label: 'Kannada', code: 'kn' },
    { label: 'English', code: 'en' },
];

export default function VoiceInputScreen({ navigation }: VoiceInputScreenProps) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [selectedLang, setSelectedLang] = useState('hi');
    const [recording, setRecording] = useState<Audio.Recording | null>(null);

    // ── Animated values ──────────────────────────────────────────────────────
    const ring1Scale = useRef(new Animated.Value(1)).current;
    const ring2Scale = useRef(new Animated.Value(1)).current;
    const ring3Scale = useRef(new Animated.Value(1)).current;
    const ring1Opacity = useRef(new Animated.Value(0)).current;
    const ring2Opacity = useRef(new Animated.Value(0)).current;
    const ring3Opacity = useRef(new Animated.Value(0)).current;
    const micPulse = useRef(new Animated.Value(1)).current;

    const rippleAnimRef = useRef<Animated.CompositeAnimation | null>(null);
    const micPulseRef = useRef<Animated.CompositeAnimation | null>(null);

    // ── Ripple animation ─────────────────────────────────────────────────────
    const startRipple = useCallback(() => {
        ring1Scale.setValue(1); ring2Scale.setValue(1); ring3Scale.setValue(1);
        ring1Opacity.setValue(0.5); ring2Opacity.setValue(0.35); ring3Opacity.setValue(0.2);

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
    }, []);

    const stopRipple = useCallback(() => {
        rippleAnimRef.current?.stop();
        Animated.parallel([
            Animated.timing(ring1Opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(ring3Opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();
    }, []);

    const startMicPulse = useCallback(() => {
        micPulseRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(micPulse, { toValue: 1.1, duration: 600, useNativeDriver: true }),
                Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        micPulseRef.current.start();
    }, []);

    const stopMicPulse = useCallback(() => {
        micPulseRef.current?.stop();
        Animated.timing(micPulse, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }, []);

    // ── Recording Handlers ───────────────────────────────────────────────────
    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permission denied', 'We need microphone access to record audio.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            
            setRecording(recording);
            setIsListening(true);
            startRipple();
            startMicPulse();
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Could not start recording');
        }
    }

    async function stopRecording() {
        if (!recording) return;

        setIsListening(false);
        stopRipple();
        stopMicPulse();
        setRecording(null);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (uri) {
                uploadAudio(uri);
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
        }
    }

    const uploadAudio = async (uri: string) => {
        setIsProcessing(true);
        try {
            const result = await processVoiceAudio(uri, selectedLang);
            
            if (result.error) {
                Alert.alert('Error', result.error);
                return;
            }

            setTranscript(result.transcript || '');
            
            // Navigate to Manual Entry with extracted data
            if (result.customer) {
                navigation.navigate('ManualEntry', {
                    prefilledData: {
                        customerName: result.customer === 'Unknown' ? '' : result.customer,
                        itemName: 'Voice Entry',
                        price: Number(result.amount) || 0,
                        type: result.type === 'cash' ? 'cash' : 'credit',
                    }
                });
            }

        } catch (error) {
            Alert.alert('Error', 'Failed to process voice. Try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMicPress = () => {
        if (isProcessing) return;
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Voice Input</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Language Selection */}
                <View style={styles.langContainer}>
                    <Text style={styles.langLabel}>Select Language</Text>
                    <View style={styles.langRow}>
                        {LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.langChip,
                                    selectedLang === lang.code && styles.langChipActive,
                                ]}
                                onPress={() => setSelectedLang(lang.code)}
                            >
                                <Text style={[
                                    styles.langChipText,
                                    selectedLang === lang.code && styles.langChipTextActive
                                ]}>
                                    {lang.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Mic Section */}
                <View style={styles.centerSection}>
                    <View style={styles.micContainer}>
                        <Animated.View style={[styles.ring, { transform: [{ scale: ring3Scale }], opacity: ring3Opacity, borderColor: COLORS.primary }]} />
                        <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity, borderColor: COLORS.primary }]} />
                        <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity, borderColor: COLORS.primary }]} />

                        <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                            <TouchableOpacity
                                onPress={handleMicPress}
                                disabled={isProcessing}
                                style={[styles.micButton, isListening && styles.micButtonActive]}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.micIcon}>{isListening ? '⏹️' : '🎤'}</Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <Text style={[styles.stateLabel, isListening && { color: COLORS.primary, fontWeight: '600' }]}>
                        {isListening ? 'Listening... Tap to stop' : 'Tap to start recording'}
                    </Text>

                    {transcript ? (
                        <View style={styles.transcriptCard}>
                            <Text style={styles.transcriptLabel}>Transcribed Text</Text>
                            <Text style={styles.transcriptText}>{transcript}</Text>
                        </View>
                    ) : null}

                    {isProcessing && (
                        <View style={styles.processingRow}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.processingText}>Sarvam AI is transcribing...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.examplesContainer}>
                    <Text style={styles.examplesTitle}>Try saying</Text>
                    <Text style={styles.exampleText}>"Ramesh ko 500 udhar diya"</Text>
                    <Text style={styles.exampleText}>"Manoj se 200 cash mila"</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const MIC_SIZE = 80;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 16,
        paddingBottom: 15,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
    backArrow: { color: COLORS.text, fontSize: 20 },
    headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 20 },
    langContainer: { marginBottom: 30 },
    langLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
    langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    langChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    langChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    langChipText: { fontSize: 12, color: COLORS.textMuted },
    langChipTextActive: { color: '#fff', fontWeight: '600' },
    centerSection: { alignItems: 'center', gap: 25, marginVertical: 20 },
    micContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', width: MIC_SIZE, height: MIC_SIZE, borderRadius: MIC_SIZE / 2, borderWidth: 2 },
    micButton: {
        width: MIC_SIZE, height: MIC_SIZE, borderRadius: MIC_SIZE / 2, backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
    },
    micButtonActive: { backgroundColor: '#f44336' },
    micIcon: { fontSize: 30, color: '#fff' },
    stateLabel: { color: COLORS.textMuted, fontSize: 14 },
    transcriptCard: { width: '100%', backgroundColor: COLORS.card, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: COLORS.border },
    transcriptLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 5, fontWeight: '600' },
    transcriptText: { fontSize: 16, color: COLORS.text, lineHeight: 22 },
    processingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    processingText: { color: COLORS.primary, fontWeight: '500' },
    examplesContainer: { marginTop: 40, alignItems: 'center' },
    examplesTitle: { fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    exampleText: { fontSize: 14, color: COLORS.text, fontStyle: 'italic', marginBottom: 5 }
});

