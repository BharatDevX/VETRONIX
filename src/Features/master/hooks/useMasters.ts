import { useEffect, useState } from "react";

import {
  getDealers,
  getDoctors,
  getProducts,
} from "../services/master.service";
import { any } from "zod";

export function useMasters() {
  const [doctors, setDoctors] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadMasters() {
    try {
      const [doctorData, dealerData, productData] =
        await Promise.all([
          getDoctors(),
          getDealers(),
          getProducts(),
        ]);

      setDoctors(doctorData as any);
      setDealers(dealerData as any);
      setProducts(productData as any);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMasters();
  }, []);

  return {
    loading,
    doctors,
    dealers,
    products,
    reload: loadMasters,
  };
}