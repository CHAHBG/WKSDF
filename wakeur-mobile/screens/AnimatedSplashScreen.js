import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const SENTENCES = [
    "Bien gérer sa boutique",
    "Toppato sa njaay",
    "Manage your shop"
];

const DURATION = 2000; // Time per sentence

export default function AnimatedSplashScreen({ onFinish }) {
    const [index, setIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity 0

    useEffect(() => {
        // Start the animation sequence
        animateText();
    }, [index]);

    const animateText = () => {
        // Fade In
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.delay(1000), // Hold
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start(() => {
            // Animation finished
            if (index < SENTENCES.length - 1) {
                setIndex(index + 1);
            } else {
                // End of sequence
                if (onFinish) onFinish();
            }
        });
    };

    return (
        <View style={styles.container}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.brandName}>Ness</Text>
            </View>

            {/* Animated Text Section */}
            <View style={styles.textContainer}>
                <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
                    {SENTENCES[index]}
                </Animated.Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    brandName: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#0047AB', // Deep blue
        letterSpacing: 1,
    },
    textContainer: {
        height: 50, // Fixed height to prevent partial layout shifts
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: '500',
        color: '#4B5563', // Gray-600
        fontStyle: 'italic',
    }
});
