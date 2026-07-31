import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./../Features/auth/screens/SplashScreen";
import LoginScreen from "./../Features/auth/screens/LoginScreen";
import HomeScreen from "../Features/home/screens/HomeScreen";
import AttendanceScreen from "../Features/attendance/screens/AttendanceScreen";
import DoctorMeetingPlanScreen from "../Features/doctor/screens/DoctorMeetingPlanScreen";
import DoctorMeetingOutcomeScreen from "../Features/doctor/screens/DoctorMeetingOutcomeScreen";
import DoctorVisitScreen from "../Features/doctor/screens/DoctorVisitScreen";
import DealerMeetingPlanScreen from "../Features/dealer/screens/DealerMeetingPlanScreen";
import DealerVisitScreen from "../Features/dealer/screens/DealerVisitScreen";
import DealerMeetingOutcomeScreen from "../Features/dealer/screens/DealerMeetingOutcomeScreen";
import SalesEntryScreen from "../Features/sales/screens/SalesEntryScreen";
import CounterSaleReportScreen from "../Features/sales/screens/CounterSaleReportScreen";
import DoctorWiseSalesReportScreen from "../Features/sales/screens/DoctorWiseSalesReportScreen";
import SecondarySalesReportScreen from "../Features/sales/screens/SecondarySalesReportScreen";
import IncentiveDashboardScreen from "../Features/sales/screens/IncentiveDashboardScreen";
import EndWorkScreen from "@/Features/work/screens/EndWorkScreen";
import StartWorkScreen from "@/Features/work/screens/StartWorkScreen";
import DailyProgressScreen from "../Features/daily-progress/screens/DailyProgressScreen";
import MonthlyTourProgrammeScreen from "../Features/monthlyTourProgramme/screens/MonthlyTourProgrammeScreen"
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Attendance: undefined;
  DoctorMeetingPlan: undefined;
  DoctorMeetingOutcome: undefined;
  DoctorVisit: undefined;
  DealerMeetingPlan: undefined;
  DealerVisit: undefined;

DealerMeetingOutcome: undefined;
SalesEntry: undefined;
CounterSaleReport: undefined;
DoctorWiseSalesReport: undefined;
SecondarySalesReport: undefined;
IncentiveDashboard: undefined;
StartWork: undefined;
EndWork: undefined;
DailyProgress: undefined;
MonthlyTourProgramme: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen
          name="Attendance"
          component={AttendanceScreen}
        />
        <Stack.Screen
          name="MonthlyTourProgramme"
          component={MonthlyTourProgrammeScreen}
        />
        <Stack.Screen
          name="DoctorMeetingPlan"
          component={DoctorMeetingPlanScreen}
        />
        <Stack.Screen
          name="DoctorMeetingOutcome"
          component={DoctorMeetingOutcomeScreen}
        />
        <Stack.Screen
          name="DoctorVisit"
          component={DoctorVisitScreen}
        />
        <Stack.Screen
  name="DealerMeetingPlan"
  component={DealerMeetingPlanScreen}
/>
<Stack.Screen
    name="DealerVisit"
    component={DealerVisitScreen}
/>

<Stack.Screen
    name="DealerMeetingOutcome"
    component={DealerMeetingOutcomeScreen}
/>
<Stack.Screen
    name="SalesEntry"
    component={SalesEntryScreen}
/>
<Stack.Screen

    name="CounterSaleReport"

    component={CounterSaleReportScreen}

/>
<Stack.Screen

name="DoctorWiseSalesReport"

component={DoctorWiseSalesReportScreen}

/>
<Stack.Screen

name="SecondarySalesReport"

component={SecondarySalesReportScreen}

/>
<Stack.Screen

name="IncentiveDashboard"

component={IncentiveDashboardScreen}

/>
<Stack.Screen
    name="StartWork"
    component={StartWorkScreen}
/>

<Stack.Screen
    name="EndWork"
    component={EndWorkScreen}
/>
<Stack.Screen
    name="DailyProgress"
    component={DailyProgressScreen}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}