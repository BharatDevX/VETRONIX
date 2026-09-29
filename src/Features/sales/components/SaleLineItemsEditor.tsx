import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import AppCard from "../../../components/ui/AppCard";
import AppInput from "../../../components/ui/AppInput";
import AppMultiSelect from "../../../components/ui/AppMultiSelect";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import type { SaleLineItem } from "../types/fieldSales.types";

type Product = {
  id: string;
  product_name: string;
  pack_size?: number | string | null;
  pack_uom?: string | null;
  box_size?: number | string | null;
  box_uom?: string | null;
  packaging_options?: Array<{ pack_size: number; pack_uom: string; box_size: number; box_uom: string }> | null;
};

interface Props {
  products: Product[];
  lines: SaleLineItem[];
  onChange: (lines: SaleLineItem[]) => void;
  showPackSize?: boolean;
  manualQuantity?: boolean;
  allowDuplicateProducts?: boolean;
}

const BOX_OPTIONS = Array.from({ length: 100 }, (_, index) => ({
  id: String(index + 1),
  label: `${index + 1} ${index === 0 ? "Box" : "Boxes"}`,
}));

function numeric(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function variantsFor(product: Product) {
  if (Array.isArray(product.packaging_options) && product.packaging_options.length) {
    return product.packaging_options.map((variant, index) => ({ ...variant, id: `${product.id}-${index}` }));
  }
  return [{
    pack_size: numeric(product.pack_size),
    pack_uom: String(product.pack_uom ?? "").trim(),
    box_size: numeric(product.box_size),
    box_uom: String(product.box_uom ?? "").trim(),
    id: product.id,
  }];
}

function packLabel(product: Product) {
  const size = numeric(product.pack_size);
  return `${size % 1 === 0 ? size.toFixed(0) : size} ${String(product.pack_uom ?? "").trim()}`.trim();
}

function productKey(name: string) {
  return name.trim().toLowerCase();
}

export default function SaleLineItemsEditor({
  products,
  lines,
  onChange,
  showPackSize = false,
  manualQuantity = false,
  allowDuplicateProducts = false,
}: Props) {
  const productOptions = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((product) => {
      const key = productKey(product.product_name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((product) => ({ id: product.product_name.trim(), product_name: product.product_name.trim() }));
  }, [products]);

  const selectedProductKeys = lines.map((line) => (line.product_name ?? "").trim()).filter(Boolean);

  function updateLine(index: number, patch: Partial<SaleLineItem>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function handleProductsChange(keys: string[]) {
    const selected = Array.from(new Set((keys ?? []).filter(Boolean)));
    const nextLines: SaleLineItem[] = selected.map((selectedKey, index) => {
      const existing = lines.find((line) => productKey(line.product_name ?? "") === productKey(selectedKey));
      const selectedProduct = products.find((product) => productKey(product.product_name) === productKey(selectedKey));
      return existing
        ? {
            ...existing,
            product_id: existing.product_id || selectedProduct?.id || "",
            product_name: existing.product_name || selectedProduct?.product_name?.trim() || selectedKey,
          }
        : {
            id: `${Date.now()}-${index}-${selectedKey}`,
            product_id: selectedProduct?.id ?? "",
            product_name: selectedProduct?.product_name?.trim() ?? selectedKey,
            pack_size: "",
            box_count: 0,
            quantity: 0,
            rate: 0,
          };
    });
    onChange(nextLines);
  }

  return (
    <View>
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Medicines</Text>
          <Text style={styles.subtitle}>
            {manualQuantity
              ? "Select medicines, choose pack size, quantity and rate."
              : "Select medicines, choose pack size and number of boxes, then enter the rate."}
          </Text>
        </View>
        <View style={styles.countPill}><Text style={styles.countText}>{lines.length}</Text></View>
      </View>

      <AppCard>
        {allowDuplicateProducts ? (
          <AppSearchDropdown
            label="Add Medicine"
            data={productOptions}
            labelField="product_name"
            valueField="id"
            value=""
            placeholder="Select medicine to add"
            onChange={(item) => {
              const selectedKey = String(item?.id ?? "").trim();
              if (!selectedKey) return;

              const selectedProduct = products.find(
                (product) => productKey(product.product_name) === productKey(selectedKey),
              );
              if (!selectedProduct) return;

              const blankIndex = lines.findIndex(
                (line) => !line.product_id && !String(line.product_name ?? "").trim(),
              );

              const newLine: SaleLineItem = {
                id: `${Date.now()}-${Math.random()}-${selectedKey}`,
                product_id: selectedProduct.id,
                product_name: selectedProduct.product_name.trim(),
                pack_size: "",
                box_count: 0,
                quantity: manualQuantity ? 1 : 0,
                rate: 0,
              };

              if (blankIndex >= 0) {
                onChange(
                  lines.map((line, index) =>
                    index === blankIndex ? { ...line, ...newLine } : line,
                  ),
                );
              } else {
                onChange([...lines, newLine]);
              }
            }}
          />
        ) : (
          <AppMultiSelect
            label="Medicine"
            data={productOptions}
            labelField="product_name"
            valueField="id"
            value={selectedProductKeys}
            onChange={handleProductsChange}
          />
        )}
      </AppCard>

      {lines.map((line, index) => {
        const sourceProduct = products.find((item) => productKey(item.product_name) === productKey(line.product_name ?? ""));
        const variants = sourceProduct ? variantsFor(sourceProduct) : [];
        const selectedVariant = variants.find((item) => packLabel(item) === String(line.pack_size ?? "").trim());
        const capacityPerBox = numeric(selectedVariant?.box_size);
        const amount = Number(line.quantity || 0) * Number(line.rate || 0);
        const packOptions = variants.map((item) => ({
          id: packLabel(item),
          label: `${packLabel(item)}${item.box_size ? ` • ${item.box_size} ${String(item.box_uom ?? "").trim()}` : ""}`,
        }));

        return (
          <AppCard key={line.id}>
            <View style={styles.lineHeader}>
              <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
              <Text style={styles.lineTitle}>{line.product_name ?? `Medicine ${index + 1}`}</Text>
            </View>

            {showPackSize && (
              <AppSearchDropdown
                label="Pack Size"
                data={packOptions}
                labelField="label"
                valueField="id"
                value={line.pack_size || ""}
                onChange={(item) => {
                  const variant = variants.find((product) => packLabel(product) === item.id);
                  updateLine(index, {
                    product_id: sourceProduct?.id ?? "",
                    pack_size: item.id,
                    ...(manualQuantity ? {} : { quantity: Number(line.box_count || 0) * numeric(variant?.box_size) }),
                  });
                }}
              />
            )}

            {manualQuantity ? (
              <AppInput
                label="Quantity"
                placeholder="Enter quantity"
                value={line.quantity ? String(line.quantity) : ""}
                keyboardType="numeric"
                onChangeText={(text) => updateLine(index, { quantity: Number(text) || 0 })}
              />
            ) : (
              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <AppSearchDropdown
                    label="Box"
                    data={BOX_OPTIONS}
                    labelField="label"
                    valueField="id"
                    value={line.box_count ? String(line.box_count) : ""}
                    onChange={(item) => {
                      const boxCount = numeric(item.id);
                      updateLine(index, { box_count: boxCount, quantity: boxCount * capacityPerBox });
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <AppInput label="Quantity" placeholder="Auto" value={line.quantity ? String(line.quantity) : ""} editable={false} />
                </View>
              </View>
            )}

            <AppInput
              label="Rate"
              placeholder="Enter rate (₹)"
              value={line.rate ? String(line.rate) : ""}
              keyboardType="numeric"
              onChangeText={(text) => updateLine(index, { rate: Number(text) || 0 })}
            />

            {!manualQuantity && (
              <View style={styles.capacityNote}>
                <Text style={styles.capacityText}>
                  {selectedVariant
                    ? `1 box = ${selectedVariant.box_size} ${String(selectedVariant.box_uom ?? "").trim()} • Quantity is calculated automatically.`
                    : "Select a pack size to load its box capacity."}
                </Text>
              </View>
            )}

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>₹{amount.toFixed(2)}</Text>
            </View>
          </AppCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "800", color: "#16324F" },
  subtitle: { marginTop: 3, fontSize: 12, color: "#8697A8" },
  countPill: { minWidth: 30, height: 30, paddingHorizontal: 9, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF5FC" },
  countText: { fontSize: 12, fontWeight: "800", color: "#0F76AE" },
  lineHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  number: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#EAF5FC", alignItems: "center", justifyContent: "center" },
  numberText: { fontSize: 12, fontWeight: "800", color: "#0F76AE" },
  lineTitle: { flex: 1, marginLeft: 9, fontSize: 14, fontWeight: "800", color: "#243B53" },
  twoCol: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  capacityNote: { marginTop: 2, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#F4F8FC" },
  capacityText: { fontSize: 11, color: "#718096" },
  amountRow: { marginTop: 2, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#F4F8FC", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amountLabel: { fontSize: 13, fontWeight: "700", color: "#5F7182" },
  amountValue: { fontSize: 16, fontWeight: "800", color: "#0F76AE" },
});
