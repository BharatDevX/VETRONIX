export const VEHICLE_TYPE_OPTIONS = [
  { id: "two_wheeler", label: "Two Wheeler" },
  { id: "car", label: "Car" },
  { id: "auto_rickshaw", label: "Auto Rickshaw" },
  { id: "public_transport", label: "Public Transport" },
  { id: "walking", label: "Walking" },
  { id: "other", label: "Other" },
] as const;

export type VehicleType = (typeof VEHICLE_TYPE_OPTIONS)[number]["id"];
