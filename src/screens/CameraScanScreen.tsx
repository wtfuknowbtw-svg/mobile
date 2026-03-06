import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { COLORS } from '../constants';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { processOCR } from '../api/ai';

interface CameraScanScreenProps {
    navigation: any;
}

export default function CameraScanScreen({ navigation }: CameraScanScreenProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [flashOn, setFlashOn] = useState<'off' | 'on'>('off');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <Text style={{ textAlign: 'center', color: COLORS.text, marginBottom: 20 }}>
                    We need your permission to show the camera
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    style={{ backgroundColor: COLORS.primary, padding: 15, borderRadius: 10 }}
                >
                    <Text style={{ color: COLORS.white }}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleCapture = async () => {
        if (!cameraRef || isProcessing) return;

        setIsProcessing(true);
        try {
            const photo = await cameraRef.takePictureAsync({
                base64: true,
                quality: 0.5,
            });

            if (photo?.base64) {
                const result = await processOCR({ base64Image: photo.base64 });

                if (result.error) {
                    Alert.alert("OCR Error", result.error);
                    return;
                }

                if (result.data && result.data.length > 0) {
                    navigation.navigate('ReviewOCR', {
                        receiptData: result.data[0],
                        imageUrl: photo.uri
                    });
                } else {
                    Alert.alert("No Data", "Could not extract transaction data from this image.");
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to capture or process image.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

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
                    <Text style={{ fontSize: 16, color: COLORS.white }}>←</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>📷</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
                        Scan Paper / Register
                    </Text>
                </View>
                <Text style={{ fontSize: 18, color: COLORS.white }}>•••</Text>
            </View>

            {/* Camera Preview */}
            <View
                style={{
                    flex: 1,
                    marginHorizontal: 24,
                    marginTop: 20,
                    borderRadius: 16,
                    backgroundColor: '#1a1a1a',
                    borderWidth: 2,
                    borderColor: COLORS.success,
                    borderStyle: 'dashed',
                    overflow: 'hidden',
                }}
            >
                <CameraView
                    ref={(ref) => setCameraRef(ref)}
                    style={{ flex: 1 }}
                    facing="back"
                    enableTorch={flashOn === 'on'}
                >
                    {/* Corner guides */}
                    <View style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderTopWidth: 3, borderLeftWidth: 3, borderColor: COLORS.success, borderTopLeftRadius: 4 }} />
                    <View style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderTopWidth: 3, borderRightWidth: 3, borderColor: COLORS.success, borderTopRightRadius: 4 }} />
                    <View style={{ position: 'absolute', bottom: 20, left: 20, width: 40, height: 40, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: COLORS.success, borderBottomLeftRadius: 4 }} />
                    <View style={{ position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderBottomWidth: 3, borderRightWidth: 3, borderColor: COLORS.success, borderBottomRightRadius: 4 }} />

                    {/* Overlay Info */}
                    {!isProcessing && (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                            <Text style={{ fontSize: 15, color: COLORS.white, fontWeight: '600', textAlign: 'center' }}>
                                Point at paper register
                            </Text>
                            <Text style={{ fontSize: 13, color: '#999', marginTop: 4, textAlign: 'center' }}>
                                Make sure text is readable
                            </Text>
                        </View>
                    )}
                </CameraView>
            </View>

            {/* Tips */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 16,
                    marginTop: 16,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ fontSize: 12, color: '#999' }}>💡 Tip: Hold steady</Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ fontSize: 12, color: '#999' }}>✂ Auto-crop</Text>
                </View>
            </View>

            {/* Capture Button */}
            <View
                style={{
                    alignItems: 'center',
                    paddingVertical: 30,
                }}
            >
                <Text
                    style={{
                        fontSize: 11,
                        color: '#666',
                        marginBottom: 16,
                        letterSpacing: 1,
                    }}
                >
                    {isProcessing ? "Analyzing with AI..." : "Tap to capture"}
                </Text>
                <TouchableOpacity
                    onPress={handleCapture}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        borderWidth: 4,
                        borderColor: COLORS.white,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: isProcessing ? COLORS.border : COLORS.success,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {isProcessing && <ActivityIndicator color={COLORS.white} />}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 16,
                    paddingBottom: 40,
                }}
            >
                <TouchableOpacity
                    style={{
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#444',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                >
                    <Text style={{ fontSize: 14, marginRight: 6 }}>🖼️</Text>
                    <Text
                        style={{ fontSize: 14, color: COLORS.white, fontWeight: '600' }}
                    >
                        Gallery
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setFlashOn(flashOn === 'on' ? 'off' : 'on')}
                    style={{
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: flashOn === 'on' ? COLORS.orange : '#444',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: flashOn === 'on' ? COLORS.orangeLight : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <Text style={{ fontSize: 14, marginRight: 6 }}>⚡</Text>
                    <Text
                        style={{
                            fontSize: 14,
                            color: flashOn === 'on' ? COLORS.orange : COLORS.white,
                            fontWeight: '600',
                        }}
                    >
                        Flash
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
