import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ScrollView,
} from 'react-native';
import { COLORS, SUPPORTED_LANGUAGES } from '../constants';
import { useAppStore } from '../store/useAppStore';

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
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 }}>
                <Text
                    style={{
                        fontSize: 22,
                        fontWeight: '700',
                        color: COLORS.text,
                    }}
                >
                    Choose Language / भाषा चुनें
                </Text>
            </View>

            {/* Language List */}
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
            >
                {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = selected === lang.code;
                    return (
                        <TouchableOpacity
                            key={lang.code}
                            onPress={() => setSelected(lang.code)}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: isSelected ? COLORS.successLight : COLORS.card,
                                borderRadius: 12,
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                                marginBottom: 12,
                                borderWidth: isSelected ? 2 : 1,
                                borderColor: isSelected ? COLORS.success : COLORS.border,
                            }}
                        >
                            {/* Flag */}
                            <View
                                style={{
                                    width: 36,
                                    height: 24,
                                    backgroundColor: '#FF9933',
                                    borderRadius: 4,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 16,
                                    overflow: 'hidden',
                                }}
                            >
                                <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.white }}>
                                    {lang.flag}
                                </Text>
                            </View>

                            {/* Language Names */}
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: '600',
                                        color: COLORS.text,
                                    }}
                                >
                                    {lang.label}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        color: COLORS.textMuted,
                                        marginTop: 2,
                                    }}
                                >
                                    {lang.labelEn}
                                </Text>
                            </View>

                            {/* Check */}
                            {isSelected && (
                                <View
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: COLORS.success,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '700' }}>
                                        ✓
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Continue Button */}
            <View style={{ padding: 24, paddingBottom: 40 }}>
                <TouchableOpacity
                    onPress={handleContinue}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: COLORS.success,
                        paddingVertical: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        shadowColor: COLORS.success,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <Text
                        style={{ color: COLORS.white, fontSize: 17, fontWeight: '700' }}
                    >
                        Continue →
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
