import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Settings, Mic, Keyboard, LayoutGrid } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIcon } from './utils/categoryIcons';
import EditExpenseModal from '../components/EditExpenseModal';
import { getAvatarById } from '../components/ProfileEditModal';
import { Expense } from '../types';


const Dashboard: React.FC = () => {
  const { expenses, categories, updateExpense, deleteExpense, formatAmount, currencySymbol } = useAppContext();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

  // Get user's avatar
  const userAvatar = getAvatarById(user?.avatar || 'happy');
  const AvatarComponent = userAvatar.component;

  // Get user's first name for greeting
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setModalVisible(true);
  };

  const handleSaveExpense = async (updatedData: any) => {
    if (editingExpense) {
      await updateExpense({
        ...editingExpense,
        amount: updatedData.amount,
        category: updatedData.category,
        description: updatedData.item || updatedData.description,
        // maintain other fields
      });
    }
    setModalVisible(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expense: any) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteExpense(expense.id);
            setModalVisible(false);
            setEditingExpense(null);
          }
        }
      ]
    );
  };

  const totalSpent = expenses.filter(e => !e.isIncome).reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = expenses.filter(e => e.isIncome).reduce((acc, curr) => acc + curr.amount, 0);

  // Dynamic Budget: Starts at 0, increases with income.
  const availableBalance = totalIncome - totalSpent;

  // Circle SVG properties
  const size = 220;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Progress Logic
  // If Total Income is 0, and we spent 0, progress is 0.
  // If Total Income is 0, and we spent something, progress is 100 (danger).
  const percentSpent = totalIncome === 0
    ? (totalSpent > 0 ? 1 : 0)
    : (totalSpent / totalIncome);

  // Cap at 1 (100%)
  const displayPercent = Math.min(1, Math.max(0, percentSpent));

  // Dash offset: 
  // Full circle (offset 0) = 100% remaining? No, verify design.
  // Usually strokeDashoffset = circumference * (1 - percentFilled).
  // We want to show "Amount Left".
  // So if 100% left (0 spent), bar should be full?
  // User request: "show zero for the first time, then if user will ad income it must show in budget section"
  // Let's assume the bar represents "Available %".
  // If income $1000, spent $0 -> Available 100% -> Full Circle.
  // If income $1000, spent $500 -> Available 50% -> Half Circle.

  const percentAvailable = totalIncome === 0 ? 0 : Math.max(0, (totalIncome - totalSpent) / totalIncome);
  const dashOffset = circumference * (1 - percentAvailable);

  // Animation values
  const rotation = useSharedValue(0);
  const scalePing = useSharedValue(1);
  const opacityPing = useSharedValue(0.5);

  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 10000, easing: Easing.linear }), -1);

    scalePing.value = withRepeat(withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }), -1);
    opacityPing.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1);
  }, []);

  const spinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const pingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scalePing.value }],
      opacity: opacityPing.value,
    };
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Main Background Gradient */}
      <LinearGradient
        colors={['#0f172a', '#2e1065', '#020617']}
        locations={[0, 0.4, 1]}
        style={{ flex: 1 }}
      >
        {/* Header - Fixed at Top */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <View style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                borderWidth: 2,
                borderColor: userAvatar.color,
                backgroundColor: `${userAvatar.color}15`,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: userAvatar.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              }}>
                <AvatarComponent size={36} color={userAvatar.color} />
              </View>
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22d3ee', borderWidth: 2, borderColor: '#0f172a' }} />
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.5 }}>Hello, {firstName}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => router.push('/categories')}>
              <LayoutGrid size={24} color="#94a3b8" fill="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Settings size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>


        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* Budget Card */}
          <View style={{ marginHorizontal: 24, marginTop: 10 }}>
            {/* Glassmorphic/Dark Card Background */}
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.6)', 'rgba(15, 23, 42, 0.8)']}
              style={{ borderRadius: 32, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 30 }}>AVAILABLE BALANCE</Text>

              {/* Circular Progress */}
              <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
                <View style={{ width: size, height: size }}>
                  <Svg width={size} height={size}>
                    <Defs>
                      <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#22d3ee" stopOpacity="1" />
                        <Stop offset="1" stopColor="#d946ef" stopOpacity="1" />
                      </SvgLinearGradient>
                    </Defs>
                    {/* Background Track */}
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="#1e293b"
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    {/* Progress Arc */}
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="url(#grad)" // Use the gradient def
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      rotation="-90"
                      origin={`${size / 2}, ${size / 2}`}
                    />
                  </Svg>

                  {/* Center Content */}
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -1 }}>{formatAmount(availableBalance)}</Text>
                    <LinearGradient
                      colors={['#818cf8', '#c084fc']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>LEFT</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>

              {/* Stats Footer */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>SPENT</Text>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{formatAmount(totalSpent)}</Text>
                </View>
                <View style={{ width: 1, height: 40, backgroundColor: '#334155' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>INCOME</Text>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{formatAmount(totalIncome)}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Voice Action Button */}
          <View style={{ alignItems: 'center', marginTop: 5, marginBottom: 0 }}>
            <View style={{ position: 'relative', width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>

              {/* Ping Effect Ring */}
              <Animated.View style={[styles.pingRing, pingStyle]}>
                <View style={{ width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#fff', opacity: 0.2 }} />
              </Animated.View>

              {/* Main Gradient Button */}
              <TouchableOpacity
                onPress={() => router.push('/voice')}
                activeOpacity={0.8}
                style={{ zIndex: 10 }}
              >
                <LinearGradient
                  colors={['#d946ef', '#22d3ee']} // neon-purple to neon-cyan
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#22d3ee', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 15 }}
                >
                  <Mic size={36} color="#fff" fill="transparent" strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={{ marginTop: 5, color: '#22d3ee', fontSize: 16, fontWeight: '500', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}>"Add {currencySymbol}12 for lunch"</Text>

            <TouchableOpacity
              onPress={() => router.push('/manual')}
              style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Keyboard size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={{ color: '#94a3b8', fontWeight: '600', fontSize: 14 }}>Manual Entry</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <View style={{ marginTop: 30, paddingHorizontal: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={{ color: '#22d3ee', fontWeight: '600', fontSize: 13 }}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              {expenses.slice(0, 5).map(expense => (
                <TouchableOpacity
                  key={expense.id}
                  onPress={() => handleEditExpense(expense)}
                >
                  <LinearGradient
                    colors={['#1e293b', '#0f172a']} // Dark card gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#1e293b' }}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}>
                      {getCategoryIcon(expense.category, 24, categories.find(c => c.name === expense.category)?.color || '#38bdf8')}
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{expense.description}</Text>
                      <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{expense.time} • {expense.category}</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                      {formatAmount(expense.isIncome ? expense.amount : -expense.amount, { showSign: true })}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
              {expenses.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>No expenses yet</Text>
              )}
            </View>
          </View>

        </ScrollView>
      </LinearGradient>
      <EditExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        initialData={editingExpense}
      />
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  spinRing: {
    position: 'absolute',
    width: 128, // 32 * 4 = 128 roughly matches w-32
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pingRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    zIndex: 0,
  }
});

