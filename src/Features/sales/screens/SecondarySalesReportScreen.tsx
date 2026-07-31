import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  Text,
  View,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";

import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";

import ReportSummaryCard from "../../../components/report/ReportSummaryCard";
import ReportListCard from "../../../components/report/ReportListCard";
import ReportEmptyState from "../../../components/report/ReportEmptyState";
import ReportSearchBar from "../../../components/report/ReportSearchBar";
import ReportDateFilter from "../../../components/report/ReportDateFilter";

import { useAuthStore } from "../../auth/store/auth.store";
import { useSecondarySales } from "../hooks/useSecondarySales";

export default function SecondarySalesReportScreen() {

    const { employee } = useAuthStore();

    const [search,setSearch]=useState("");

    const [date,setDate]=useState(

        dayjs().format("YYYY-MM-DD")

    );

    const {

        reports,

        loading,

        error,

        reload

    } = useSecondarySales(employee?.id ?? "", date);

    const filteredReports=useMemo(()=>{

        return reports.filter(item=>

            item.dealer_name

            .toLowerCase()

            .includes(search.toLowerCase())

        );

    },[reports,search]);

    const totalQty=useMemo(()=>{

        return filteredReports.reduce(

            (sum,item)=>

            sum+Number(item.total_quantity),

            0

        );

    },[filteredReports]);

    const totalAmount=useMemo(()=>{

        return filteredReports.reduce(

            (sum,item)=>

            sum+Number(item.total_amount),

            0

        );

    },[filteredReports]);

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
    }, [filteredReports.length]);

    return(

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

                title="Secondary Sales"
                subtitle="Search and filter dealer sales"

            />

            <Animated.View
                style={{
                    opacity: contentOpacity,
                    transform: [{ translateY: contentTranslateY }],
                    gap: 12,
                }}
            >

                <View style={styles.filterCard}>
                    <ReportSearchBar

                        value={search}

                        onChangeText={setSearch}

                    />

                    <View style={{ marginTop: 10 }}>
                        <ReportDateFilter

                            value={date}

                            onChange={setDate}

                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.rowItem}>
                        <ReportSummaryCard

                            title="Total Quantity"

                            value={totalQty}

                        />
                    </View>

                    <View style={styles.rowItem}>
                        <ReportSummaryCard

                            title="Total Sales"

                            value={`₹${totalAmount.toFixed(2)}`}

                        />
                    </View>
                </View>

                {

                    error &&
                    <ReportEmptyState

                        message={error}

                    />

                }

                {

                    !error && filteredReports.length===0 &&
                    <ReportEmptyState

                        message="No Sales Found"

                    />

                }

                {

                    filteredReports.map((item,index)=>(

                        <ReportListCard

                            key={index}

                            title={item.dealer_name}

                        >

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Product</Text>
                                <Text style={styles.value}>{item.product_name}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Quantity</Text>
                                <Text style={styles.value}>{item.total_quantity}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Amount</Text>
                                <Text style={[styles.value, styles.amountValue]}>₹{item.total_amount}</Text>
                            </View>

                        </ReportListCard>

                    ))

                }

            </Animated.View>

        </ScrollView>

    );

}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
        gap: 12,
    },

    filterCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },

    row: {
        flexDirection: "row",
        gap: 12,
    },

    rowItem: {
        flex: 1,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 4,
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