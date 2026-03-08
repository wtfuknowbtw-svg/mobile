import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { COLORS } from '../constants';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { processOCR } from '../api/ai';

interface CameraScanScreenProps {
    navigation: any;
}

export default function CameraScanScreen({ navigation }: CameraScanScreenProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [flashOn, setFlashOn] = useState<'off' | 'on'>('off');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const flashOpacity = useRef(new Animated.Value(0)).current;

    // Request gallery permissions on mount
    React.useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                console.log('Gallery permission not granted');
            }
        })();
    }, []);

    const triggerFlashEffect = () => {
        setShowFlash(true);
        flashOpacity.setValue(1);
        
        // Fade out flash
        Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowFlash(false);
        });
    };

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

        try {
            console.log('Taking picture...');
            const photo = await cameraRef.takePictureAsync({
                base64: true,
                quality: 0.8,
                skipProcessing: false,
            });

            console.log('Photo taken, base64 length:', photo.base64?.length || 0);

            if (photo && photo.base64) {
                // Store photo data for setTimeout callback
                const photoBase64 = photo.base64;
                const photoUri = photo.uri || '';
                
                // Trigger camera effects
                triggerFlashEffect();
                
                // Show captured image for 1 second
                setCapturedImage(photoUri);
                
                // Wait 1 second to show the captured image
                setTimeout(() => {
                    setCapturedImage(null);
                    setIsProcessing(true);
                    
                    // Process the image
                    processImageOCR(photoBase64, photoUri);
                }, 1000);
            } else {
                Alert.alert("Error", "Failed to capture photo. Please try again.");
            }
        } catch (error) {
            console.error("Camera error:", error);
            Alert.alert("Camera Error", `Failed to capture photo: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
        }
    };

    const handleGalleryPick = async () => {
        try {
            // Request permissions first
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.status !== 'granted') {
                Alert.alert("Permission Required", "Please grant gallery permission to select photos.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setIsProcessing(true);
                const asset = result.assets[0];
                
                if (asset.base64) {
                    await processImageOCR(asset.base64, asset.uri || '');
                } else {
                    Alert.alert("Error", "Could not process image. Please try again.");
                }
            }
        } catch (error) {
            console.error("Gallery error:", error);
            Alert.alert("Gallery Error", "Failed to pick image from gallery. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const processImageOCR = async (base64: string, uri: string) => {
        try {
            console.log('Starting OCR processing...');
            const result = await processOCR({ base64Image: base64 });

            if (result.error) {
                console.error('OCR Error:', result.error);
                Alert.alert("OCR Error", `Failed to process image: ${result.error}`);
                return;
            }

            if (result.data && result.data.length > 0) {
                console.log('OCR Success:', result.data[0]);
                navigation.navigate('ReviewOCR', {
                    receiptData: result.data[0],
                    imageUrl: uri
                });
            } else {
                Alert.alert("No Data", "Could not extract transaction data from this image. Please try a clearer photo with better lighting.");
            }
        } catch (error) {
            console.error('Processing Error:', error);
            Alert.alert("Processing Error", `Failed to process the image: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
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
                            <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 }}>
                                <Text style={{ fontSize: 16, color: COLORS.white, fontWeight: '700', textAlign: 'center' }}>
                                    📸 Scan Any Document
                                </Text>
                                <Text style={{ fontSize: 13, color: '#ccc', marginTop: 4, textAlign: 'center' }}>
                                    Bills • Receipts • Invoices • Registers
                                </Text>
                            </View>
                        </View>
                    )}
                    {isProcessing && (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
                            <ActivityIndicator size="large" color={COLORS.success} />
                            <Text style={{ fontSize: 16, color: COLORS.white, fontWeight: '600', marginTop: 12 }}>
                                🤖 AI is Reading...
                            </Text>
                            <Text style={{ fontSize: 13, color: '#ccc', marginTop: 4, textAlign: 'center' }}>
                                Extracting text & amounts
                            </Text>
                        </View>
                    )}
                </CameraView>
                
                {/* Flash Effect Overlay */}
                {showFlash && (
                    <Animated.View 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: '#ffffff',
                            opacity: flashOpacity,
                            zIndex: 10,
                        }}
                    />
                )}
                
                {/* Captured Image Preview */}
                {capturedImage && (
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#000',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 5,
                    }}>
                        <Text style={{ 
                            fontSize: 18, 
                            color: COLORS.white, 
                            fontWeight: '600',
                            marginBottom: 20 
                        }}>
                            ✅ Photo Captured!
                        </Text>
                        <ActivityIndicator size="small" color={COLORS.success} />
                    </View>
                )}
            </View>

            {/* Tips */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 12,
                    marginTop: 16,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ fontSize: 11, color: '#ccc' }}>💡 Good lighting</Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ fontSize: 11, color: '#ccc' }}>📐 Flat surface</Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ fontSize: 11, color: '#ccc' }}>🔍 Clear text</Text>
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
                    {capturedImage ? "📸 Captured!" : isProcessing ? "🤖 Processing..." : "📸 Tap to capture"}
                </Text>
                <TouchableOpacity
                    onPress={handleCapture}
                    disabled={isProcessing || capturedImage !== null}
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
                            backgroundColor: capturedImage || isProcessing ? COLORS.border : COLORS.success,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {(isProcessing || capturedImage) && <ActivityIndicator color={COLORS.white} />}
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
                    onPress={handleGalleryPick}
                    disabled={isProcessing}
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
