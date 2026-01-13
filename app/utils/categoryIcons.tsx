import React from 'react';
import {
    Utensils,
    Car,
    Zap,
    Film,
    ShoppingBasket,
    ShoppingBag,
    Wallet,
    Receipt,
    HelpCircle,
    Activity,
    Plane,
    Home,
    Briefcase,
    Coffee,
    Dumbbell,
    GraduationCap,
    PawPrint,
    Shirt,
    Landmark,
    Fuel
} from 'lucide-react-native';

export const availableIcons = [
    'Utensils', 'Car', 'Zap', 'Film', 'ShoppingBasket', 'ShoppingBag',
    'Wallet', 'Receipt', 'HelpCircle', 'Activity', 'Plane', 'Home',
    'Briefcase', 'Coffee', 'Dumbbell', 'GraduationCap', 'PawPrint',
    'Shirt', 'Landmark', 'Fuel'
];

// Helper to get React Component from string name
const IconMap: Record<string, any> = {
    Utensils, Car, Zap, Film, ShoppingBasket, ShoppingBag,
    Wallet, Receipt, HelpCircle, Activity, Plane, Home,
    Briefcase, Coffee, Dumbbell, GraduationCap, PawPrint,
    Shirt, Landmark, Fuel
};

import { Text } from 'react-native';

export const getCategoryIcon = (iconName: string, size: number = 24, color: string = '#fff') => {
    // Try to match by explicit icon name first
    let IconComponent = IconMap[iconName];

    // Fallback: Try to match by category name (legacy support)
    if (!IconComponent) {
        switch (iconName) {
            case 'Food': IconComponent = Utensils; break;
            case 'Transport': IconComponent = Car; break;
            case 'Utilities': IconComponent = Zap; break;
            case 'Entertainment': IconComponent = Film; break;
            case 'Groceries': IconComponent = ShoppingBasket; break;
            case 'Shopping': IconComponent = ShoppingBag; break;
            case 'Income': IconComponent = Wallet; break;
            case 'Other': IconComponent = Receipt; break;
            case 'Health': IconComponent = IconMap['Activity']; break;
            case 'Travel': IconComponent = IconMap['Plane']; break;
        }
    }

    // If still no component, check if it's an emoji or string text
    if (!IconComponent) {
        // Simple detection: If it contains non-alphanumeric chars or is a known emoji length
        // or if it's simply not in our icon map.
        // For currencies/languages, these are flags or symbols.
        return (
            <Text style={{ fontSize: size, color }}>
                {iconName || '?'}
            </Text>
        );
    }

    return <IconComponent size={size} color={color} />;
};
// Silence Expo Router warning for "page" missing default export
export default function CategoryIconsUtils() { return null; }
