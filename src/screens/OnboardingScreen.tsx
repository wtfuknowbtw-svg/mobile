import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        titleHi: 'हिसाब रखें',
        titleEn: 'Keep Track',
        subtitleHi: 'अपना सारा हिसाब-किताब एक जगह रखें',
        subtitleEn: 'Track all credit/debit in one place',
        icon: '📒',
        backgroundColor: COLORS.white,
    },
    {
        id: '2',
        titleHi: 'ग्राहक जोड़ें',
        titleEn: 'Add Customers',
        subtitleHi: 'ग्राहकों को जोड़ें और उनका बकाया देखें',
        subtitleEn: 'Manage customers and track their balances',
        icon: '👥',
        backgroundColor: COLORS.white,
    },
    {
        id: '3',
        titleHi: 'WhatsApp रिमाइंडर',
        titleEn: 'WhatsApp Reminders',
        subtitleHi: 'पेमेंट के लिए WhatsApp पर रिमाइंडर भेजें',
        subtitleEn: 'Send professional payment reminders easily',
        icon: '📱',
        backgroundColor: COLORS.white,
    },
];

interface OnboardingScreenProps {
    navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
    const { language } = useAppStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            navigation.navigate('OTPLogin');
        }
    };

    const handleSkip = () => {
        navigation.navigate('OTPLogin');
    };

    const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
        <View style={styles.slide}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.title}>{language === 'hi' ? item.titleHi : item.titleEn}</Text>
            <Text style={styles.subtitle}>{language === 'hi' ? item.subtitleHi : item.subtitleEn}</Text>
        </View>
    );

    const nextButtonText = currentIndex === SLIDES.length - 1 
        ? (language === 'hi' ? 'शुरू करें' : 'Get Started')
        : (language === 'hi' ? 'आगे बढ़ें' : 'Next');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={styles.skipText}>{language === 'hi' ? 'छोड़ें' : 'Skip'}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
            />

            <View style={styles.footer}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>

                {/* Next/Get Started Button */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{nextButtonText}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    skipText: {
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    icon: {
        fontSize: 100,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 26,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.border,
        marginHorizontal: 5,
    },
    activeDot: {
        width: 24,
        backgroundColor: COLORS.primary,
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },
});
