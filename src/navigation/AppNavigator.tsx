import React from "react";
// Load the native background-location task definition at app startup.
import "../services/location/LocationTrackingService";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./../Features/auth/screens/SplashScreen";
import LoginScreen from "./../Features/auth/screens/LoginScreen";
import HomeScreen from "../Features/home/screens/HomeScreen";
import AttendanceScreen from "../Features/attendance/screens/AttendanceScreen";
import AttendanceHistoryScreen from "../Features/attendance/screens/AttendanceHistoryScreen";
import DoctorMeetingPlanScreen from "../Features/doctor/screens/DoctorMeetingPlanScreen";
import DoctorVisitScreen from "../Features/doctor/screens/DoctorVisitScreen";
import DealerMeetingPlanScreen from "../Features/dealer/screens/DealerMeetingPlanScreen";
import DealerVisitScreen from "../Features/dealer/screens/DealerVisitScreen";
import SalesEntryScreen from "../Features/sales/screens/SalesEntryScreen";
import OrderFormHistoryScreen from "../Features/sales/screens/OrderFormHistoryScreen";
import SalesInvoiceEntryScreen from "../Features/sales/screens/SalesInvoiceEntryScreen";
import CounterSaleEntryScreen from "../Features/sales/screens/CounterSaleEntryScreen";
import DoctorWiseSaleEntryScreen from "../Features/sales/screens/DoctorWiseSaleEntryScreen";
import CounterSaleReportScreen from "../Features/sales/screens/CounterSaleReportScreen";
import DoctorWiseSalesReportScreen from "../Features/sales/screens/DoctorWiseSalesReportScreen";
import SecondarySalesReportScreen from "../Features/sales/screens/SecondarySalesReportScreen";
import SecondarySalesEntryScreen from "../Features/sales/screens/SecondarySalesEntryScreen";
import IncentiveDashboardScreen from "../Features/sales/screens/IncentiveDashboardScreen";
import EndWorkScreen from "@/Features/work/screens/EndWorkScreen";
import EmployeeProfileScreen from "../Features/profile/screens/EmployeeProfileScreen";
import MonthlyTourProgrammeScreen from "../Features/monthlyTourProgramme/screens/MonthlyTourProgrammeScreen"
import OrderDeliveryStatusScreen from "../Features/orderDelivery/screens/OrderDeliveryStatusScreen";
import VisitSelectionScreen from "../Features/home/screens/VisitSelectionScreen";
import FollowUpScreen from "../Features/follow-up/screens/FollowUpScreen";
import AdminNotificationsScreen from "../Features/admin-messages/screens/AdminNotificationsScreen";

import MeetingPlanSelectionScreen from "../Features/home/screens/MeetingPlanSelectionScreen";
import MonthlyMeetingPlanHistoryScreen from "../Features/home/screens/MonthlyMeetingPlanHistoryScreen";
import FarmerMeetingPlanScreen from "../Features/farmer/screens/FarmerMeetingPlanScreen";
import FarmerVisitScreen from "../Features/farmer/screens/FarmerVisitScreen";
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
    Visit: undefined;
  FollowUp: undefined;
  MeetingPlan: undefined;
  Attendance: undefined;
  DoctorMeetingPlan: undefined;
  DoctorVisit: undefined;
  DealerMeetingPlan: undefined;
  FarmerMeetingPlan: undefined;
  FarmerVisit: undefined;
  MonthlyMeetingPlanHistory: undefined;
  DealerVisit: undefined;
EmployeeProfile: undefined;
SalesEntry: undefined;
OrderFormHistory: undefined;
SalesInvoiceEntry: undefined;
CounterSaleEntry: undefined;
DoctorWiseSaleEntry: undefined;
CounterSaleReport: undefined;
DoctorWiseSalesReport: undefined;
SecondarySalesReport: undefined;
SecondarySalesEntry: undefined;
IncentiveDashboard: undefined;
AttendanceHistory: undefined;
EndWork: undefined;
MonthlyTourProgramme: undefined;
OrderDeliveryStatus: undefined;
  AdminNotifications: undefined;
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
  name="EmployeeProfile"
  component={EmployeeProfileScreen}
/>
        <Stack.Screen
          name="Visit"
          component={VisitSelectionScreen}
        />
        <Stack.Screen
          name="MeetingPlan"
          component={MeetingPlanSelectionScreen}
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
          name="AttendanceHistory"
          component={AttendanceHistoryScreen}
        />
        <Stack.Screen
          name="DoctorMeetingPlan"
          component={DoctorMeetingPlanScreen}
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
  name="FarmerMeetingPlan"
  component={FarmerMeetingPlanScreen}
/>
<Stack.Screen
  name="MonthlyMeetingPlanHistory"
  component={MonthlyMeetingPlanHistoryScreen}
/>
<Stack.Screen
    name="DealerVisit"
    component={DealerVisitScreen}
/>
<Stack.Screen
    name="FarmerVisit"
    component={FarmerVisitScreen}
/>

<Stack.Screen
    name="SalesEntry"
    component={SalesEntryScreen}
/>
<Stack.Screen
    name="OrderFormHistory"
    component={OrderFormHistoryScreen}
/>
<Stack.Screen
    name="SalesInvoiceEntry"
    component={SalesInvoiceEntryScreen}
/>
<Stack.Screen
    name="CounterSaleEntry"
    component={CounterSaleEntryScreen}
/>
<Stack.Screen
    name="DoctorWiseSaleEntry"
    component={DoctorWiseSaleEntryScreen}
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
name="SecondarySalesEntry"
component={SecondarySalesEntryScreen}
/>
<Stack.Screen

name="IncentiveDashboard"

component={IncentiveDashboardScreen}

/>


<Stack.Screen
    name="EndWork"
    component={EndWorkScreen}
/>

<Stack.Screen
    name="OrderDeliveryStatus"
    component={OrderDeliveryStatusScreen}
/>
<Stack.Screen
    name="FollowUp"
    component={FollowUpScreen}
/>
<Stack.Screen
    name="AdminNotifications"
    component={AdminNotificationsScreen}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
