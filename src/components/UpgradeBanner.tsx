import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';

interface UpgradeBannerProps {
    /** The feature that is being gated, e.g. "AI Scans", "Reports" */
    feature?: string;
    /** Custom message to display */
    message?: string;
    /** Called when the user taps the upgrade button */
    onUpgrade: () => void;
    /** Optional compact variant for smaller screens */
    compact?: boolean;
}

/**
 * A premium upgrade banner that can be placed on any screen
 * to softly prompt free-plan users to upgrade.
 */
export default function UpgradeBanner({ feature, message, onUpgrade, compact = false }: UpgradeBannerProps) {
    const displayMessage = message || `Upgrade to unlock unlimited ${feature || 'features'}`;

    if (compact) {
        return (
            <TouchableOpacity
                onPress={onUpgrade}
                activeOpacity={0.85}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFF7ED',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#FDBA7420',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginHorizontal: 20,
                    marginBottom: 12,
                }}
            >
                <Text style={{ fontSize: 16, marginRight: 8 }}>⚡</Text>
                <Text style={{ flex: 1, fontSize: 12, color: '#92400E', fontWeight: '500' }}>
                    {displayMessage}
                </Text>
                <View
                    style={{
                        backgroundColor: '#F59E0B',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                    }}
                >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                        UPGRADE
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View
            style={{
                marginHorizontal: 20,
                marginBottom: 16,
                borderRadius: 16,
                overflow: 'hidden',
            }}
        >
            {/* Gradient-like background with overlapping circles */}
            <View
                style={{
                    backgroundColor: '#1E1B4B',
                    padding: 20,
                    position: 'relative',
                }}
            >
                {/* Decorative circles */}
                <View
                    style={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: '#4F46E520',
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        bottom: -10,
                        left: 30,
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: '#7C3AED15',
                    }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 20, marginRight: 8 }}>👑</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#F5F3FF' }}>
                        Go Pro
                    </Text>
                </View>

                <Text style={{ fontSize: 13, color: '#C4B5FD', lineHeight: 18, marginBottom: 16 }}>
                    {displayMessage}. Get unlimited AI scans, advanced reports, and priority support.
                </Text>

                <TouchableOpacity
                    onPress={onUpgrade}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: '#8B5CF6',
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: 'center',
                        shadowColor: '#8B5CF6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                        ✨ View Upgrade Plans
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
