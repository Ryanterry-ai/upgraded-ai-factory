"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import {
  BusinessState, Customer, Product, Order, OrderStatus,
  placeOrder as placeOrderAction,
  updateOrderStatus as updateOrderStatusAction,
  restockProduct as restockProductAction,
  computeMetrics,
} from "./business-data-provider";

// ═══════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════

interface BusinessContextType {
  state: BusinessState;
  placeOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  restockProduct: (productId: string, quantity: number) => void;
  getCustomer: (id: string) => Customer | undefined;
  getProduct: (id: string) => Product | undefined;
  getOrdersByCustomer: (customerId: string) => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getLowStockProducts: () => Product[];
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════

export function BusinessProvider({ children, initialState }: { children: React.ReactNode; initialState: BusinessState }) {
  const [state, setState] = useState<BusinessState>(initialState);

  const placeOrder = useCallback((order: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
    setState(prev => placeOrderAction(prev, order).state);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setState(prev => updateOrderStatusAction(prev, orderId, status).state);
  }, []);

  const restockProduct = useCallback((productId: string, quantity: number) => {
    setState(prev => restockProductAction(prev, productId, quantity).state);
  }, []);

  const getCustomer = useCallback((id: string) => state.entities.customers.find(c => c.id === id), [state.entities.customers]);
  const getProduct = useCallback((id: string) => state.entities.products.find(p => p.id === id), [state.entities.products]);
  const getOrdersByCustomer = useCallback((customerId: string) => state.entities.orders.filter(o => o.customerId === customerId), [state.entities.orders]);
  const getOrdersByStatus = useCallback((status: OrderStatus) => state.entities.orders.filter(o => o.status === status), [state.entities.orders]);
  const getLowStockProducts = useCallback(() => state.entities.products.filter(p => p.stock > 0 && p.stock <= p.reorderPoint), [state.entities.products]);

  return (
    <BusinessContext.Provider value={{
      state, placeOrder, updateOrderStatus, restockProduct,
      getCustomer, getProduct, getOrdersByCustomer, getOrdersByStatus, getLowStockProducts,
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}

// Convenience hooks for specific entity access

export function useProducts() {
  const { state } = useBusiness();
  return state.entities.products;
}

export function useCustomers() {
  const { state } = useBusiness();
  return state.entities.customers;
}

export function useOrders() {
  const { state } = useBusiness();
  return state.entities.orders;
}

export function useMetrics() {
  const { state } = useBusiness();
  return state.metrics;
}

export function useInventoryAlerts() {
  const { state } = useBusiness();
  return state.entities.products.filter(p => p.stock <= p.reorderPoint);
}
