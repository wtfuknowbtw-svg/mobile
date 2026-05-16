import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { COLORS, SUPPORTED_LANGUAGES } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

const { width } = Dimensions.get('window');

interface LanguageSelectScreenProps {
    navigation: any;
}

export default function LanguageSelectScreen({
    navigation,
}: LanguageSelectScreenProps) {
    const { language, setLanguage } = useAppStore();
    const [selected, setSelected] = useState(language);

    const handleContinue = () => {
        setLanguage(selected);
        navigation.navigate('OTPLogin');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    {selected === 'hi' ? 'भाषा चुनें' : 'Select Language'}
                </Text>
                <Text style={styles.subtitle}>
                    {selected === 'hi' ? 'अपनी भाषा चुनें' : 'Choose your language'}
                </Text>
            </View>

            {/* Language List */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = selected === lang.code;
                    return (
                        <TouchableOpacity
                            key={lang.code}
                            onPress={() => setSelected(lang.code)}
                            activeOpacity={0.8}
                            style={[
                                styles.card,
                                isSelected && styles.selectedCard
                            ]}
                        >
                            {/* Flag Emoji */}
                            <Text style={styles.flagEmoji}>
                                {lang.flag || (lang.code === 'hi' ? '🇮🇳' : '🇺🇸')}
                            </Text>

                            {/* Language Names */}
                            <View style={styles.labelContainer}>
                                <Text style={styles.labelNative}>
                                    {lang.label}
                                </Text>
                                <Text style={styles.labelEn}>
                                    {lang.labelEn}
                                </Text>
                            </View>

                            {/* Radio Button */}
                            <View style={[
                                styles.radio,
                                isSelected && styles.radioActive
                            ]}>
                                {isSelected && (
                                    <View style={styles.radioInner} />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleContinue}
                    activeOpacity={0.85}
                    style={styles.continueBtn}
                >
                    <Text style={styles.continueBtnText}>
                        {selected === 'hi' ? 'जारी रखें' : 'Continue'} →
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: 80,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.primary, // Deep Blue
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 8,
        fontWeight: '500',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    selectedCard: {
        backgroundColor: '#F0F4F8', // Light blue background
        borderColor: COLORS.primary,
        borderLeftWidth: 4,
    },
    flagEmoji: {
        fontSize: 32,
        marginRight: 20,
    },
    labelContainer: {
        flex: 1,
    },
    labelNative: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    labelEn: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 2,
        fontWeight: '500',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CED4DA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: COLORS.primary,
    },
    radioInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.primary,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    continueBtn: {
        backgroundColor: COLORS.primary, // Deep Blue
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
});
