import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Alert, View, Text, Animated, Easing } from "react-native";
import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppInput from "../../../components/ui/AppInput";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppRadioGroup from "../../../components/ui/AppRadioGroup";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import AppCard from "../../../components/ui/AppCard";

import { useMasters } from "../../master/hooks/useMasters";
import { useSales } from "../hooks/useSales";
import { useAuthStore } from "../../auth/store/auth.store";
import { SaleForm, SaleType } from "../types/sales.types";

function createInitialForm(saleDate: string): SaleForm {
  return {
    sale_type: "counter",
    doctor_id: "",
    dealer_id: "",
    product_id: "",
    sale_date: saleDate,
    quantity: 1,
    rate: 0,
  };
}

function parseNumber(value: string): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export default function SalesEntryScreen() {
  const { employee } = useAuthStore();
  const { doctors, dealers, products } = useMasters();
  const { save, saving } = useSales(employee?.id ?? "");

  const [form, setForm] = useState<SaleForm>(() => createInitialForm(dayjs().format("YYYY-MM-DD")));

  const amount = useMemo(() => {
    return Number(form.quantity || 0) * Number(form.rate || 0);
  }, [form.quantity, form.rate]);

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
  }, []);

  function updateForm(patch: Partial<SaleForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function resetForm() {
    setForm(createInitialForm(dayjs().format("YYYY-MM-DD")));
  }

  function validateForm(): string | null {
    if (!form.dealer_id?.trim()) {
      return "Please select a dealer.";
    }

    if (!form.product_id?.trim()) {
      return "Please select a medicine.";
    }

    if (form.sale_type === "doctor" && !form.doctor_id?.trim()) {
      return "Please select a doctor for doctor sales.";
    }

    if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) <= 0) {
      return "Quantity must be greater than 0.";
    }

    if (!Number.isFinite(Number(form.rate)) || Number(form.rate) <= 0) {
      return "Rate must be greater than 0.";
    }

    return null;
  }

  async function saveSale() {
    const validationMessage = validateForm();

    if (validationMessage) {
      Alert.alert("Validation", validationMessage);
      return;
    }

    try {
      const result = await save(form);

      if (result?.isUpdate) {
        Alert.alert("Success", "Existing sale updated successfully.");
      } else {
        Alert.alert("Success", "Sale saved successfully.");
      }

      resetForm();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Unable to save sale.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Sales Entry"
        subtitle="Record a new sale"
      />

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
          gap: 16,
        }}
      >

        <AppCard>
          <Text style={styles.cardTitle}>Sale Type</Text>

          <View style={{ marginTop: 10 }}>
            <AppRadioGroup
              options={[
                {
                  label: "Counter Sale",
                  value: "counter",
                },
                {
                  label: "Doctor Sale",
                  value: "doctor",
                },
              ]}
              value={form.sale_type}
              onChange={(value) =>
                updateForm({
                  sale_type: value as SaleType,
                  doctor_id: "",
                })
              }
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Sale Details</Text>

          <View style={styles.fieldGroup}>
            {form.sale_type === "doctor" && (
              <AppSearchDropdown
                label="Doctor"
                data={doctors}
                labelField="doctor_name"
                valueField="id"
                value={form.doctor_id}
                onChange={(item) =>
                  updateForm({
                    doctor_id: item.id,
                  })
                }
              />
            )}

            <AppSearchDropdown
              label="Dealer"
              data={dealers}
              labelField="dealer_name"
              valueField="id"
              value={form.dealer_id}
              onChange={(item) =>
                updateForm({
                  dealer_id: item.id,
                })
              }
            />

            <AppSearchDropdown
              label="Medicine"
              data={products}
              labelField="product_name"
              valueField="id"
              value={form.product_id}
              onChange={(item) =>
                updateForm({
                  product_id: item.id,
                })
              }
            />

            <AppDatePicker
              label="Sale Date"
              value={form.sale_date}
              onChange={(date) =>
                updateForm({
                  sale_date: date,
                })
              }
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Pricing</Text>

          <View style={styles.fieldGroup}>
            <AppInput
              label="Quantity"
              value={String(form.quantity)}
              onChangeText={(text) => updateForm({ quantity: parseNumber(text) })}
              keyboardType="numeric"
              placeholder={""}
            />

            <AppInput
              label="Rate"
              value={String(form.rate)}
              onChangeText={(text) => updateForm({ rate: parseNumber(text) })}
              keyboardType="numeric"
              placeholder={""}
            />

            <AppInput
              label="Amount"
              editable={false}
              value={String(amount.toFixed(2))}
              placeholder={""}
              onChangeText={() => undefined}
            />
          </View>
        </AppCard>

        <PrimaryButton title="Save Sale" onPress={saveSale} loading={saving} disabled={saving} />

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1D1F",
  },

  fieldGroup: {
    gap: 12,
    marginTop: 10,
  },
});