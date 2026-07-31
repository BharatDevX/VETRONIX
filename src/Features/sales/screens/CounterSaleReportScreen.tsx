import React, { useEffect, useMemo, useRef } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  View,
  Animated,
  Easing,
} from "react-native";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppCard from "../../../components/ui/AppCard";

import { useAuthStore } from "../../auth/store/auth.store";
import { useCounterSale } from "../hooks/useCounterSale";

export default function CounterSaleReportScreen() {

    const { employee } = useAuthStore();

    const {

        reports,

        loading,

        error,

        reload

    } = useCounterSale(employee?.id ?? "");

    const totalQty = useMemo(() => {

        return reports.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

    }, [reports]);

    const totalAmount = useMemo(() => {

        return reports.reduce(
            (sum, item) => sum + item.amount,
            0
        );

    }, [reports]);

    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 380,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(contentTranslateY, {
                toValue: 0,
                duration: 380,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [reports.length]);

    return (

        <ScrollView

            contentContainerStyle={styles.container}

            showsVerticalScrollIndicator={false}

            refreshControl={

                <RefreshControl

                    refreshing={loading}

                    onRefresh={reload}

                />

            }

        >

            <ScreenHeader
                title="Counter Sale Report"
                subtitle="Overview of all counter sales"
            />

            <Animated.View
                style={{
                    opacity: contentOpacity,
                    transform: [{ translateY: contentTranslateY }],
                    gap: 12,
                }}
            >

                <View style={styles.statRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Quantity</Text>
                        <Text style={styles.statValue}>{totalQty}</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Amount</Text>
                        <Text style={styles.statValue}>₹{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {

                    error && (

                        <AppCard>

                            <Text style={styles.errorText}>

                                {error}

                            </Text>

                        </AppCard>

                    )

                }

                {

                    !error && reports.length===0 && (

                        <AppCard>

                            <Text style={styles.emptyText}>

                                No Counter Sales Found
                            </Text>

                        </AppCard>

                    )

                }

                {

                    reports.map((item)=>(

                        <AppCard key={item.id}>

                            <Text style={styles.title}>

                                {item.dealer_name}

                            </Text>

                            <View style={styles.divider} />

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Medicine</Text>
                                <Text style={styles.value}>{item.product_name}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Quantity</Text>
                                <Text style={styles.value}>{item.quantity}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Rate</Text>
                                <Text style={styles.value}>₹{item.rate}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Amount</Text>
                                <Text style={[styles.value, styles.amountValue]}>₹{item.amount}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Date</Text>
                                <Text style={styles.value}>{item.sale_date}</Text>
                            </View>

                        </AppCard>

                    ))

                }

            </Animated.View>

        </ScrollView>

    );

}

const styles = StyleSheet.create({

    container:{

        padding:20,
        paddingBottom:40,
        gap:12

    },

    statRow: {
        flexDirection: "row",
        gap: 12,
    },

    statBox: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },

    statLabel: {
        fontSize: 12.5,
        color: "#8A8F98",
        fontWeight: "500",
        marginBottom: 6,
    },

    statValue: {
        fontSize: 19,
        fontWeight: "700",
        color: "#1A1D1F",
    },

    errorText: {
        color: "#DC2626",
        fontWeight: "500",
    },

    emptyText: {
        color: "#8A8F98",
        textAlign: "center",
    },

    title:{

        fontSize:16,

        fontWeight:"700",

        color: "#1A1D1F",

        marginBottom:4

    },

    divider: {
        height: 1,
        backgroundColor: "#EEF0F4",
        marginBottom: 6,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
    },

    label: {
        fontSize: 13.5,
        color: "#6B7280",
    },

    value: {
        fontSize: 14.5,
        fontWeight: "600",
        color: "#1A1D1F",
    },

    amountValue: {
        color: "#1D9C6E",
    },

});