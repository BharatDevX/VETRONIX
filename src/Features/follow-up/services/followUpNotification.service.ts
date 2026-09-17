import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import dayjs from "dayjs";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function prepare() {
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted) return false;
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("follow-ups", {
      name: "Follow-Up Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }
  return true;
}

export async function scheduleFollowUpReminder(params: { visitId: string; visitType: string; partyName: string; followUpDate: string }) {
  const ok = await prepare();
  if (!ok || !params.followUpDate) return;
  const triggerAt = dayjs(params.followUpDate).subtract(1, "day").hour(9).minute(0).second(0).millisecond(0);
  if (!triggerAt.isAfter(dayjs())) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter(n => n.content.data?.visitId === params.visitId).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Follow-Up Reminder",
      body: `${params.visitType} visit with ${params.partyName} is scheduled for ${dayjs(params.followUpDate).format("DD MMM YYYY")}.`,
      data: { visitId: params.visitId, visitType: params.visitType },
      ...(Platform.OS === "android" ? { channelId: "follow-ups" } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt.toDate() },
  });
}

export async function scheduleFollowUps(records: Array<{ id:string; visitType:string; partyName:string; followUpDate:string }>) {
  await Promise.all(records.map(scheduleFollowUpReminder));
}
