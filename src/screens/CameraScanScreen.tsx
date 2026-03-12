import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert,
    Animated,
    ImageBackground,
    Dimensions,
    Modal,
} from 'react-native';
import { COLORS } from '../constants';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { processOCR } from '../api/ai';
import i18n from '../i18n';

const { width, height } = Dimensions.get('window');

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
    const [errorModal, setErrorModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        messageHindi: string;
    }>({
        visible: false,
        title: '',
        message: '',
        messageHindi: '',
    });
    const flashOpacity = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    // Request gallery permissions on mount
    React.useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                console.log('Gallery permission not granted');
            }
        })();
    }, []);

    // Start scanning line animation
    useEffect(() => {
        if (!isProcessing) {
            // Scanning line animation - continuous loop
            const scanAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            );
            scanAnimation.start();

            // Corner glow animation
            const glowAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.3,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            );
            glowAnimation.start();

            return () => {
                scanAnimation.stop();
                glowAnimation.stop();
            };
        }
    }, [isProcessing]);

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

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.7,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const handleError = (error: any) => {
        console.error('OCR Error:', error);
        
        let title = i18n.t('errors.somethingWrong');
        let message = i18n.t('errors.somethingWrongMessage');
        let messageHindi = i18n.t('errors.somethingWrongMessage');
        
        const errorMessage = error?.message || error?.toString() || '';
        
        if (errorMessage.includes('Network request failed')) {
            title = i18n.t('errors.noInternet');
            message = i18n.t('errors.noInternetMessage');
            messageHindi = i18n.t('errors.noInternetMessage');
        } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
            title = i18n.t('errors.aiBusy');
            message = i18n.t('errors.aiBusyMessage');
            messageHindi = i18n.t('errors.aiBusyMessage');
        } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server')) {
            title = i18n.t('errors.serverError');
            message = i18n.t('errors.serverErrorMessage');
            messageHindi = i18n.t('errors.serverErrorMessage');
        }
        
        setErrorModal({
            visible: true,
            title,
            message,
            messageHindi,
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
                    {i18n.t('permissions.cameraMessage')}
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    style={{ backgroundColor: COLORS.primary, padding: 15, borderRadius: 10 }}
                >
                    <Text style={{ color: COLORS.white }}>{i18n.t('permissions.grantPermission')}</Text>
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

            if (photo && photo.base64) {
                console.log('Photo taken, base64 length:', photo.base64.length);
                // Store photo data for setTimeout callback
                const photoBase64 = photo.base64;
                const photoUri = photo.uri || '';
                
                // Trigger camera effects
                triggerFlashEffect();
                
                // Show captured image and start processing
                setCapturedImage(photoUri);
                setIsProcessing(true);
                
                // Start pulse animation
                startPulseAnimation();
                
                // Process the image after a brief delay
                setTimeout(() => {
                    processImageOCR(photoBase64, photoUri);
                }, 500);
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
                setErrorModal({
                    visible: true,
                    title: i18n.t('errors.permissionRequired'),
                    message: i18n.t('errors.galleryPermissionMessage'),
                    messageHindi: i18n.t('errors.galleryPermissionMessage'),
                });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setIsProcessing(true);
                const asset = result.assets[0];
                
                if (asset.base64) {
                    setCapturedImage(asset.uri || '');
                    startPulseAnimation();
                    await processImageOCR(asset.base64, asset.uri || '');
                } else {
                    setErrorModal({
                        visible: true,
                        title: i18n.t('errors.imageError'),
                        message: i18n.t('errors.imageErrorMessage'),
                        messageHindi: i18n.t('errors.imageErrorMessage'),
                    });
                }
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsProcessing(false);
            setCapturedImage(null);
        }
    };

    const processImageOCR = async (base64: string, uri: string) => {
        try {
            console.log('📸 Starting OCR processing...');
            console.log('📸 Image URI:', uri);
            console.log('📸 Base64 length:', base64.length);
            
            const result = await processOCR({ base64Image: base64 });
            
            console.log('🎯 OCR Result from processOCR:', result);
            console.log('🎯 OCR Result Data:', result.data);
            console.log('🎯 OCR Result Error:', result.error);
            console.log('🎯 OCR Data Length:', result.data?.length);

            if (result.error) {
                throw new Error(result.error);
            }

            if (result.data && result.data.length > 0) {
                const transactionData = result.data[0];
                console.log('✅ OCR Success! Transaction Data:', transactionData);
                console.log('✅ Transaction Fields:', Object.keys(transactionData || {}));
                console.log('✅ Customer Name:', transactionData.customerName);
                console.log('✅ Item Name:', transactionData.itemName);
                console.log('✅ Price:', transactionData.price);
                console.log('✅ Type:', transactionData.type);
                console.log('✅ Confidence:', transactionData.confidence || 'undefined');
                
                // Check confidence level
                if ((transactionData.confidence || 0) < 40) {
                    console.log('⚠️ Low confidence detected, navigating to ManualEntry with pre-filled data');
                    navigation.navigate('ManualEntry', {
                        prefilledData: {
                            customerName: transactionData.customerName || '',
                            itemName: transactionData.itemName || '',
                            price: transactionData.price || 0,
                            type: transactionData.type || 'credit'
                        }
                    });
                } else {
                    navigation.navigate('ReviewOCR', {
                        receiptData: transactionData,
                        imageUrl: uri
                    });
                }
            } else {
                throw new Error("Could not extract transaction data from this image. Please try a clearer photo with better lighting.");
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsProcessing(false);
            setCapturedImage(null);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
            <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

            {/* Top Header */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 52,
                paddingHorizontal: 24,
                paddingBottom: 20,
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 18, color: '#ffffff', fontWeight: '500' }}>←</Text>
                    </View>
                </TouchableOpacity>
                
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffffff' }}>
                        {i18n.t('camera.documentScanner')}
                    </Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                        {i18n.t('camera.positionDocument')}
                    </Text>
                </View>

                <View style={{ width: 40 }} />
            </View>

            {/* Camera Preview / Captured Image */}
            <View style={{ flex: 1, marginHorizontal: 24, borderRadius: 20, overflow: 'hidden' }}>
                {isProcessing && capturedImage ? (
                    // Show captured image as background during processing
                    <ImageBackground
                        source={{ uri: capturedImage }}
                        style={{ flex: 1 }}
                        resizeMode="cover"
                    >
                        {/* Dark overlay */}
                        <View style={{ 
                            flex: 1, 
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            {/* AI Reading text with pulse animation */}
                            <Animated.View style={{ opacity: pulseAnim }}>
                                <ActivityIndicator size="large" color="#00ff88" />
                                <Text style={{ 
                                    fontSize: 18, 
                                    color: '#ffffff', 
                                    fontWeight: '600', 
                                    marginTop: 20,
                                    textAlign: 'center'
                                }}>
                                    {i18n.t('camera.aiProcessing')}
                                </Text>
                                <Text style={{ 
                                    fontSize: 14, 
                                    color: 'rgba(255,255,255,0.7)', 
                                    marginTop: 8, 
                                    textAlign: 'center' 
                                }}>
                                    {i18n.t('camera.extractingText')}
                                </Text>
                            </Animated.View>
                        </View>
                    </ImageBackground>
                ) : (
                    // Show live camera feed with premium viewfinder
                    <CameraView
                        ref={(ref) => setCameraRef(ref)}
                        style={{ flex: 1 }}
                        facing="back"
                        enableTorch={flashOn === 'on'}
                    >
                        {/* Corner brackets with glow animation */}
                        <Animated.View style={{ 
                            position: 'absolute', 
                            top: 20, 
                            left: 20,
                            opacity: glowAnim
                        }}>
                            <View style={{
                                width: 50,
                                height: 50,
                                borderTopWidth: 4,
                                borderLeftWidth: 4,
                                borderColor: '#00ff88',
                                borderTopLeftRadius: 2,
                            }} />
                        </Animated.View>
                        <Animated.View style={{ 
                            position: 'absolute', 
                            top: 20, 
                            right: 20,
                            opacity: glowAnim
                        }}>
                            <View style={{
                                width: 50,
                                height: 50,
                                borderTopWidth: 4,
                                borderRightWidth: 4,
                                borderColor: '#00ff88',
                                borderTopRightRadius: 2,
                            }} />
                        </Animated.View>
                        <Animated.View style={{ 
                            position: 'absolute', 
                            bottom: 120, 
                            left: 20,
                            opacity: glowAnim
                        }}>
                            <View style={{
                                width: 50,
                                height: 50,
                                borderBottomWidth: 4,
                                borderLeftWidth: 4,
                                borderColor: '#00ff88',
                                borderBottomLeftRadius: 2,
                            }} />
                        </Animated.View>
                        <Animated.View style={{ 
                            position: 'absolute', 
                            bottom: 120, 
                            right: 20,
                            opacity: glowAnim
                        }}>
                            <View style={{
                                width: 50,
                                height: 50,
                                borderBottomWidth: 4,
                                borderRightWidth: 4,
                                borderColor: '#00ff88',
                                borderBottomRightRadius: 2,
                            }} />
                        </Animated.View>

                        {/* Animated scanning line */}
                        <Animated.View
                            style={{
                                position: 'absolute',
                                left: 40,
                                right: 40,
                                height: 2,
                                backgroundColor: '#00ff88',
                                borderRadius: 1,
                                transform: [
                                    {
                                        translateY: scanLineAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [60, height - 200],
                                        }),
                                    },
                                ],
                                shadowColor: '#00ff88',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.6,
                                shadowRadius: 4,
                                elevation: 4,
                            }}
                        />

                        {/* Center guide text */}
                        <View style={{ 
                            position: 'absolute', 
                            bottom: 100, 
                            left: 0, 
                            right: 0, 
                            alignItems: 'center' 
                        }}>
                            <View style={{
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderRadius: 24,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                            }}>
                                <Text style={{ 
                                    fontSize: 14, 
                                    color: '#ffffff', 
                                    fontWeight: '500',
                                    textAlign: 'center' 
                                }}>
                                    {i18n.t('camera.alignDocument')}
                                </Text>
                            </View>
                        </View>
                    </CameraView>
                )}

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
            </View>

            {/* Bottom Control Bar - Glass Effect */}
            <View style={{
                marginHorizontal: 24,
                marginBottom: 40,
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                paddingVertical: 20,
                paddingHorizontal: 24,
            }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    {/* Gallery Button */}
                    <TouchableOpacity
                        onPress={handleGalleryPick}
                        disabled={isProcessing}
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <View style={{ position: 'relative' }}>
                            {/* Gallery icon - multiple photos */}
                            <View style={{
                                width: 24,
                                height: 24,
                                backgroundColor: '#ffffff',
                                borderRadius: 4,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <View style={{
                                    width: 16,
                                    height: 16,
                                    backgroundColor: '#0a0a0a',
                                    borderRadius: 2,
                                }} />
                            </View>
                            {/* Small photo stack indicator */}
                            <View style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 12,
                                height: 12,
                                backgroundColor: '#00ff88',
                                borderRadius: 6,
                                borderWidth: 2,
                                borderColor: '#0a0a0a',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <View style={{
                                    width: 4,
                                    height: 4,
                                    backgroundColor: '#0a0a0a',
                                    borderRadius: 2,
                                }} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Capture Button */}
                    <TouchableOpacity
                        onPress={handleCapture}
                        disabled={isProcessing}
                        activeOpacity={0.8}
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: '#ffffff',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 4,
                            borderColor: '#00ff88',
                            shadowColor: '#00ff88',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="large" color="#00ff88" />
                        ) : (
                            <View style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: '#00ff88',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <View style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#ffffff',
                                }} />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Flash Button */}
                    <TouchableOpacity
                        onPress={() => setFlashOn(flashOn === 'on' ? 'off' : 'on')}
                        disabled={isProcessing}
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            backgroundColor: flashOn === 'on' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ 
                            fontSize: 24, 
                            color: flashOn === 'on' ? '#00ff88' : '#ffffff' 
                        }}>
                            ⚡
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Custom Error Modal */}
            <Modal
                visible={errorModal.visible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setErrorModal({ ...errorModal, visible: false })}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end',
                }}>
                    <View style={{
                        backgroundColor: '#1a1a1a',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: 24,
                        paddingBottom: 40,
                    }}>
                        {/* Error Icon */}
                        <View style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: 'rgba(255,59,48,0.1)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16,
                            alignSelf: 'center',
                        }}>
                            <Text style={{ fontSize: 32 }}>⚠️</Text>
                        </View>

                        {/* Error Title */}
                        <Text style={{
                            fontSize: 20,
                            fontWeight: '700',
                            color: '#ffffff',
                            textAlign: 'center',
                            marginBottom: 8,
                        }}>
                            {errorModal.title}
                        </Text>

                        {/* Error Messages */}
                        <Text style={{
                            fontSize: 16,
                            color: 'rgba(255,255,255,0.8)',
                            textAlign: 'center',
                            marginBottom: 8,
                            lineHeight: 22,
                        }}>
                            {errorModal.message}
                        </Text>
                        
                        <Text style={{
                            fontSize: 16,
                            color: 'rgba(255,255,255,0.6)',
                            textAlign: 'center',
                            marginBottom: 24,
                            lineHeight: 22,
                        }}>
                            {errorModal.messageHindi}
                        </Text>

                        {/* Action Buttons */}
                        <View style={{
                            flexDirection: 'row',
                            gap: 12,
                        }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#00ff88',
                                    paddingVertical: 16,
                                    paddingHorizontal: 24,
                                    borderRadius: 12,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={() => setErrorModal({ ...errorModal, visible: false })}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#000000',
                                }}>
                                    {i18n.t('common.tryAgain')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    paddingVertical: 16,
                                    paddingHorizontal: 24,
                                    borderRadius: 12,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={() => {
                                    setErrorModal({ ...errorModal, visible: false });
                                    navigation.navigate('ManualEntry');
                                }}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#ffffff',
                                }}>
                                    {i18n.t('common.enterManually')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
