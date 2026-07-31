import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
 
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  Handshake,
  LogOut,
  PlayCircle,
  Route,
  ShoppingCart,
  SquarePen,
  Stethoscope,
  Store,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react-native";
import dayjs from "dayjs";

import Colors from "../../../theme/color";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { getTodayAttendance } from "../../attendance/services/attendance.service";
import { Attendance } from "../../attendance/types/attendance.types";
import { useAuthStore } from "../../auth/store/auth.store";
import { logout } from "../../auth/services/auth.service";
import { workService } from "../../work/services/work.service";
import { WorkSession } from "../../work/types/work.types";
import {
  MapPinned,
} from "lucide-react-native";
type HomeNavigation = NativeStackNavigationProp<RootStackParamList>;
type MenuRoute = Exclude<keyof RootStackParamList, "Splash" | "Login" | "Home">;
type IconComponent = React.ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

interface MenuItem {
  title: string;
  route: MenuRoute;
  icon: IconComponent;
}

interface MenuCardProps {
  title: string;
  icon: IconComponent;
  onPress: () => void;
}

interface StatisticCardProps {
  label: string;
  value: string;
  icon: IconComponent;
}

const HEADER_IMAGE = require("../../../../assets/images/vetronix-header.png");
const FOOTER_IMAGE = require("../../../../assets/images/vetronix-footer.png");

const MENU_ITEMS: MenuItem[] = [
  { title: "Attendance", route: "Attendance", icon: CalendarCheck },
  {
  title: "Monthly Tour Programme",
  route: "MonthlyTourProgramme",
  icon: MapPinned,
},
  { title: "Doctor Meeting Plan", route: "DoctorMeetingPlan", icon: ClipboardList },
  { title: "Doctor Meeting Outcome", route: "DoctorMeetingOutcome", icon: ClipboardCheck },
  { title: "Doctor Visit", route: "DoctorVisit", icon: Stethoscope },
  { title: "Dealer Meeting Plan", route: "DealerMeetingPlan", icon: SquarePen },
  { title: "Dealer Visit", route: "DealerVisit", icon: Store },
  { title: "Dealer Meeting Outcome", route: "DealerMeetingOutcome", icon: Handshake },
  { title: "Daily Progress", route: "DailyProgress", icon: TrendingUp },
  { title: "Sales", route: "SalesEntry", icon: ShoppingCart },
  { title: "Counter Sale Report", route: "CounterSaleReport", icon: FileBarChart },
  { title: "Doctor Wise Sales", route: "DoctorWiseSalesReport", icon: Stethoscope },
  { title: "Secondary Sales", route: "SecondarySalesReport", icon: FileBarChart },
  { title: "Incentive Dashboard", route: "IncentiveDashboard", icon: BadgeDollarSign },
  { title: "Start Work", route: "StartWork", icon: PlayCircle },
  { title: "End Work", route: "EndWork", icon: BriefcaseBusiness },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return "Good Morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "Good Evening";
  }

  return "Good Night";
}

function getAttendanceLabel(attendanceValue: Attendance | null) {
  if (!attendanceValue) {
    return "Not Marked";
  }

  switch (attendanceValue.status) {
    case "PRESENT":
      return "Present";
    case "HALF_DAY":
      return "Half Day";
    case "LEAVE":
    case "ABSENT":
      return "Leave";
    default:
      return "Not Marked";
  }
}

function getWorkStatus(session: WorkSession | null) {
  if (!session) {
    return "Not Started";
  }

  if (session.status === "completed") {
    return "Completed";
  }

  return "Started";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load dashboard.";
}

export default function HomeScreen() {
  const employee = useAuthStore((state) => state.employee);
  const navigation = useNavigation<HomeNavigation>();

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [workSession, setWorkSession] = useState<WorkSession | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigation.replace("Login");
  };

  const loadDashboard = useCallback(async () => {
    if (!employee) {
      return;
    }

    setDashboardLoading(true);

    try {
      const [attendanceResult, workResult] = await Promise.all([
        getTodayAttendance(employee.id),
        workService.getTodaySession(employee.id),
      ]);

      setAttendance(attendanceResult);
      setWorkSession(workResult);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setDashboardLoading(false);
    }
  }, [employee]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  if (!employee) {
    return null;
  }

  if (dashboardLoading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const attendanceLabel = getAttendanceLabel(attendance);
  const workStatusLabel = getWorkStatus(workSession);
  const totalKm = workSession?.total_km ?? 0;
  const todayLong = dayjs().format("dddd, DD MMM YYYY");
  const todayShort = dayjs().format("DD MMM YYYY");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandImageShell}>
    <Image
        source={HEADER_IMAGE}
        resizeMode="contain"
        style={styles.headerImage}
    />
</View>

        <View style={styles.welcomeCard}>
          <View style={styles.accentStrip} />
          <View style={styles.welcomeContent}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.employeeName}>{employee.full_name ?? "Employee"}</Text>
            <Text style={styles.todayText}>{todayLong}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatisticCard label="Today's Attendance" value={attendanceLabel} icon={CalendarCheck} />
          <StatisticCard label="Today's KM" value={`${totalKm} KM`} icon={Route} />
          <StatisticCard label="Work Status" value={workStatusLabel} icon={BriefcaseBusiness} />
          <StatisticCard label="Today's Date" value={todayShort} icon={CalendarDays} />
        </View>

        <View style={styles.quickActionsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>Choose an option</Text>
          </View>
          <View style={styles.sectionDivider} />
        </View>

        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <MenuCard
              key={item.route}
              title={item.title}
              icon={item.icon}
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          android_ripple={{ color: "#FEE2E2", borderless: false }}
          onPress={handleLogout}
        >
          <LogOut color={Colors.danger} size={20} strokeWidth={2.2} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <View style={styles.footerCard}>

  <View style={styles.footerRow}>

    <View style={styles.footerColumn}>
      <Text style={styles.footerHeading}>Asia</Text>
      <Text style={styles.footerSubHeading}>Head Office</Text>
      <Text style={styles.footerText}>
        H-1701, VVIP Homes{"\n"}
        Greater Noida{"\n"}
        GB Nagar{"\n"}
        U.P.-201304{"\n"}
        India
      </Text>
    </View>

    <View style={styles.footerDivider} />

    <View style={styles.footerColumn}>
      <Text style={styles.footerHeading}>Europe</Text>
      <Text style={styles.footerText}>
        Company No. 17189068{"\n"}
        4th Floor{"\n"}
        Silverstream House{"\n"}
        45 Fitzroy Street{"\n"}
        London W1T 6EB
      </Text>
    </View>

  </View>

  <View style={styles.horizontalDivider} />

  <View style={styles.footerRow}>

    <View style={styles.footerColumn}>
      <Text style={styles.footerHeading}>
        Middle East & Africa
      </Text>

      <Text style={styles.footerSubHeading}>
        C & F
      </Text>

      <Text style={styles.footerText}>
        CR No.1555374{"\n"}
        P.O. Box 124{"\n"}
        South Al Mabilah{"\n"}
        Al Seeb{"\n"}
        Muscat
      </Text>

    </View>

    <View style={styles.footerDivider} />

    <View style={styles.footerColumn}>
      <Text style={styles.footerHeading}>
        Connect
      </Text>

      <Text style={styles.footerText}>
        www.vetronix.in{"\n"}
        info@vetronix.in{"\n"}
        ISO 9001:2015{"\n"}
        Customer Care{"\n"}
        +91 9044797575
      </Text>

    </View>

  </View>

  <View style={styles.copyrightBar}>

    <Text style={styles.copyrightText}>
      © 2026 Vetronix Biotech Pvt. Ltd.
    </Text>

    <Text style={styles.copyrightText}>
      All Rights Reserved.
    </Text>

  </View>

</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatisticCard({ label, value, icon: Icon }: StatisticCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconShell}>
        <Icon color={Colors.primary} size={22} strokeWidth={2.2} />
      </View>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function MenuCard({ title, icon: Icon, onPress }: MenuCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  };

  return (
    <Pressable
      style={styles.menuPressable}
      android_ripple={{ color: "#EAF4FF", borderless: false }}
      onPress={onPress}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[styles.menuCard, { transform: [{ scale }] }]}>
        <View style={styles.menuIconShell}>
          <Icon color={Colors.primary} size={22} strokeWidth={2.1} />
        </View>
        <Text style={styles.menuTitle} numberOfLines={2}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
  },

 brandImageShell: {
  marginTop: 20,
  marginBottom: 2,
  backgroundColor: Colors.primary,
  borderRadius: 22,
  paddingVertical: 2,
  paddingHorizontal: 2,
  alignItems: "center",
  justifyContent: "center",

  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: {
    width: 0,
    height: 5,
  },
  elevation: 4,
},

 headerImage: {
  width: "100%",
  height: undefined,
  aspectRatio: 3.2,
},

  welcomeCard: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  accentStrip: {
    width: 6,
    backgroundColor: Colors.primary,
  },

  welcomeContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },

  greeting: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  employeeName: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "800",
    color: Colors.black,
  },

  todayText: {
    marginTop: 7,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.gray500,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },

  statCard: {
    width: "48%",
    minHeight: 132,
    marginBottom: 16,
    padding: 16,
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  statIconShell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF4FF",
  },

  statValue: {
    marginTop: 14,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
    color: Colors.secondary,
  },

  statLabel: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    color: Colors.gray500,
  },

  quickActionsHeader: {
    marginTop: 6,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.black,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray500,
  },

  sectionDivider: {
    height: 1,
    marginTop: 14,
    backgroundColor: Colors.border,
  },

  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  menuPressable: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },

  menuCard: {
    minHeight: 112,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D7EAFB",
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  menuIconShell: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF4FF",
  },

  menuTitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: Colors.secondary,
    textAlign: "center",
  },

  logoutButton: {
    minHeight: 52,
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  logoutButtonPressed: {
    opacity: 0.78,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.danger,
  },

 footerImageShell: {
  width: "100%",
  marginTop: 22,
  backgroundColor: Colors.white,
  borderRadius: 18,
  overflow: "hidden",
  shadowColor: Colors.black,
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
},

 footerImage: {
  width: "100%",
  height: undefined,
  aspectRatio: 5.4,
},

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  footerCard: {
  marginTop: 24,
  backgroundColor: "#FFFFFF",
  borderRadius: 22,
  overflow: "hidden",

  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: {
    width: 0,
    height: 4,
  },

  elevation: 4,
},

footerRow: {
  flexDirection: "row",
  padding: 18,
},

footerColumn: {
  flex: 1,
},

footerHeading: {
  fontSize: 15,
  fontWeight: "800",
  color: Colors.primary,
  marginBottom: 5,
},

footerSubHeading: {
  fontSize: 12,
  fontWeight: "700",
  color: "#666",
  marginBottom: 6,
},

footerText: {
  fontSize: 11,
  color: "#666",
  lineHeight: 18,
},

footerDivider: {
  width: 1,
  backgroundColor: "#E6E6E6",
  marginHorizontal: 14,
},

horizontalDivider: {
  height: 1,
  backgroundColor: "#EEEEEE",
},

copyrightBar: {
  backgroundColor: Colors.primary,
  alignItems: "center",
  paddingVertical: 14,
},

copyrightText: {
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: "600",
},
});
