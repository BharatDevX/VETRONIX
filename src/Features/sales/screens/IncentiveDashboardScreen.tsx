import React, { useEffect, useRef } from "react";
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import ReportSummaryCard from "../../../components/report/ReportSummaryCard";
import { useAuthStore } from "../../auth/store/auth.store";
import { useIncentive } from "../hooks/useIncentive";

export default function IncentiveDashboardScreen() {

    const { employee } = useAuthStore();

    const {

        dashboard,

        loading,

        error,

        reload

    } = useIncentive(employee?.id ?? "");

    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(16)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;

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
    }, []);

    useEffect(() => {
        if (!dashboard) return;

        Animated.timing(progressWidth, {
            toValue: Math.min(dashboard.achievement, 100),
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [dashboard?.achievement]);

    if(!dashboard){

        return null;

    }

    const remaining=Math.max(

        dashboard.target-dashboard.achieved,

        0

    );

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

                title="Incentive Dashboard"
                subtitle="Track your target and earnings"

            />

            <Animated.View
                style={{
                    opacity: contentOpacity,
                    transform: [{ translateY: contentTranslateY }],
                    gap: 12,
                }}
            >

                {

                    error && (

                        <ReportSummaryCard

                            title="Error"

                            value={error}

                        />

                    )

                }

                <View style={styles.row}>

                    <View style={styles.rowItem}>
                        <ReportSummaryCard

                            title="Target"

                            value={`₹${dashboard.target}`}

                        />
                    </View>

                    <View style={styles.rowItem}>
                        <ReportSummaryCard

                            title="Achieved"

                            value={`₹${dashboard.achieved}`}

                        />
                    </View>

                </View>

                <View style={styles.row}>

                    <View style={styles.rowItem}>
                        <ReportSummaryCard

                            title="Achievement"

                            value={`${dashboard.achievement.toFixed(1)} %`}

                        />
                    </View>

                    <View style={styles.rowItem}>
                        <ReportSummaryCard

                            title="Incentive"

                            value={`₹${dashboard.incentive.toFixed(2)}`}

                        />
                    </View>

                </View>

                <View style={styles.progressContainer}>

                    <View style={styles.progressHeaderRow}>
                        <Text style={styles.heading}>

                            Target Progress

                        </Text>

                        <Text style={styles.progressPercent}>
                            {Math.min(dashboard.achievement, 100).toFixed(1)}%
                        </Text>
                    </View>

                    <View style={styles.progressBackground}>

                        <Animated.View

                            style={[

                                styles.progressFill,

                                {

                                    width: progressWidth.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ["0%", "100%"],
                                    }),

                                }

                            ]}

                        />

                    </View>

                    <View style={styles.remainingRow}>
                        <Text style={styles.remainingLabel}>

                            Remaining Target

                        </Text>

                        <Text style={styles.remainingValue}>

                            ₹{remaining}

                        </Text>
                    </View>

                </View>

            </Animated.View>

        </ScrollView>

    );

}

const styles=StyleSheet.create({

container:{

padding:20,
paddingBottom:40,
gap:12

},

row:{

flexDirection:"row",
gap:12

},

rowItem: {
    flex: 1,
},

progressContainer:{

marginTop:4,

padding:20,

backgroundColor:"#fff",

borderRadius:16,

shadowColor: "#000",
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.06,
shadowRadius: 10,
elevation:2

},

progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom:15

},

heading:{

fontSize:16,

fontWeight:"700",

color: "#1A1D1F"

},

progressPercent: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D9C6E",
},

progressBackground:{

height:12,

backgroundColor:"#F1F2F4",

borderRadius:10,

overflow:"hidden",

marginBottom:15

},

progressFill:{

height:12,

backgroundColor:"#2ecc71",
borderRadius:10

},

remainingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
},

remainingLabel: {
    fontSize: 14,
    color: "#6B7280",
},

remainingValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1D1F",
}

});