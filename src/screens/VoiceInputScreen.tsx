import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';
import { processVoice } from '../api/ai';

interface VoiceInputScreenProps {
    navigation: any;
}

export default function VoiceInputScreen({ navigation }: VoiceInputScreenProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');

    const processTextTranscript = async () => {
        if (!transcript.trim()) {
            Alert.alert('Error', 'Please enter a transaction first');
            return;
        }

        setIsProcessing(true);
        try {
            console.log('Processing transcript:', transcript);
            
            // Send transcript to voice API
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
                
                // Route based on confidence
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

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* Header */}
            <View style={{ 
                backgroundColor: COLORS.primary, 
                paddingTop: 50, 
                paddingBottom: 20,
                alignItems: 'center'
            }}>
                <Text style={{ 
                    fontSize: 24, 
                    fontWeight: '700', 
                    color: 'white',
                    marginBottom: 8
                }}>
                    Voice Input
                </Text>
                <Text style={{ 
                    fontSize: 16, 
                    color: 'rgba(255,255,255,0.8)',
                    textAlign: 'center'
                }}>
                    Type your transaction details
                </Text>
            </View>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                
                {/* Processing Indicator */}
                {isProcessing && (
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '600', 
                            color: COLORS.text,
                            marginTop: 16
                        }}>
                            Processing with AI...
                        </Text>
                    </View>
                )}

                {/* Voice Icon */}
                {!isProcessing && (
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <Text style={{ fontSize: 80 }}>🎤</Text>
                        <Text style={{ 
                            fontSize: 18, 
                            fontWeight: '600', 
                            color: COLORS.text,
                            marginTop: 16,
                            textAlign: 'center'
                        }}>
                            Voice Input Mode
                        </Text>
                        <Text style={{ 
                            fontSize: 14, 
                            color: COLORS.textMuted,
                            marginTop: 8,
                            textAlign: 'center'
                        }}>
                            Type your transaction below
                        </Text>
                    </View>
                )}
            </View>

            {/* Text Input Section */}
            <View style={{ 
                width: '100%', 
                paddingHorizontal: 20,
                paddingBottom: 40
            }}>
                <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: COLORS.text,
                    marginBottom: 12,
                    textAlign: 'center'
                }}>
                    Transaction Details:
                </Text>
                
                <TextInput
                    style={{
                        borderWidth: 2,
                        borderColor: COLORS.border,
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16,
                        color: COLORS.text,
                        backgroundColor: COLORS.card,
                        textAlignVertical: 'top',
                        minHeight: 100,
                    }}
                    placeholder="e.g., Ram ko 500 diya suji ka liye"
                    placeholderTextColor={COLORS.textMuted}
                    value={transcript}
                    onChangeText={setTranscript}
                    multiline
                    editable={!isProcessing}
                />

                <TouchableOpacity
                    onPress={processTextTranscript}
                    disabled={!transcript.trim() || isProcessing}
                    style={{
                        backgroundColor: transcript.trim() && !isProcessing ? COLORS.primary : COLORS.border,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        marginTop: 16,
                    }}
                >
                    <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '600', 
                        color: transcript.trim() && !isProcessing ? 'white' : COLORS.textMuted
                    }}>
                        Process Transaction
                    </Text>
                </TouchableOpacity>

                {/* Examples */}
                <View style={{ marginTop: 20 }}>
                    <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '600', 
                        color: COLORS.textMuted,
                        marginBottom: 8,
                        textAlign: 'center'
                    }}>
                        Examples:
                    </Text>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ 
                            fontSize: 12, 
                            color: COLORS.textMuted,
                            textAlign: 'center',
                            fontStyle: 'italic',
                            marginBottom: 4
                        }}>
                            "Ram ko 500 diya atta ka liye"
                        </Text>
                        <Text style={{ 
                            fontSize: 12, 
                            color: COLORS.textMuted,
                            textAlign: 'center',
                            fontStyle: 'italic',
                            marginBottom: 4
                        }}>
                            "Raju se 200 liya doodh"
                        </Text>
                        <Text style={{ 
                            fontSize: 12, 
                            color: COLORS.textMuted,
                            textAlign: 'center',
                            fontStyle: 'italic'
                        }}>
                            "Sita ne 100 diya tel ka liye"
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
