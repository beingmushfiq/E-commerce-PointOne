import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layout Shells
import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { StudioLayout } from '../layouts/StudioLayout';
import { VisualCmsLayout } from '../layouts/VisualCmsLayout';
import { PlatformLayout } from '../layouts/PlatformLayout';

// Storefront Pages
import { HomePage } from '../pages/Storefront/HomePage';
import { CollectionPage } from '../pages/Storefront/CollectionPage';
import { ProductDetailPage } from '../pages/Storefront/ProductDetailPage';
import { CheckoutPage } from '../pages/Storefront/CheckoutPage';
import { OrderTrackingPage } from '../pages/Storefront/OrderTrackingPage';
import { CustomerAccountPage } from '../pages/Storefront/CustomerAccountPage';

// Studio Pages
import { StudioOverview } from '../pages/Studio/StudioOverview';
import { StudioProducts } from '../pages/Studio/StudioProducts';
import { StudioOrders } from '../pages/Studio/StudioOrders';
import { StudioInventory } from '../pages/Studio/StudioInventory';
import { StudioFinance } from '../pages/Studio/StudioFinance';
import { StudioMarketing } from '../pages/Studio/StudioMarketing';
import { StudioAnalytics } from '../pages/Studio/StudioAnalytics';
import { StudioIntegrations } from '../pages/Studio/StudioIntegrations';
import { StudioSettings } from '../pages/Studio/StudioSettings';
import { StudioLogin } from '../pages/Studio/StudioLogin';
import { ThemeSelector } from '../pages/Studio/StoreDesign/ThemeSelector';
import { VisualPageEditor } from '../pages/Studio/Editor/VisualPageEditor';

// Platform Pages
import { PlatformDashboard } from '../pages/Platform/PlatformDashboard';
import { PlatformTenants } from '../pages/Platform/PlatformTenants';
import { PlatformCommercial } from '../pages/Platform/PlatformCommercial';
import { PlatformLogin } from '../pages/Platform/PlatformLogin';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ---------------------------------------------------------------------- */}
      {/* 1. STOREFRONT EXPERIENCE (Customer & Public Domain)                    */}
      {/* ---------------------------------------------------------------------- */}
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="collections/:slug" element={<CollectionPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="product/:slug" element={<ProductDetailPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders/track" element={<OrderTrackingPage />} />
        <Route path="tracking" element={<OrderTrackingPage />} />
        <Route path="account/*" element={<CustomerAccountPage />} />
        <Route path="about" element={<CollectionPage />} />
      </Route>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. STORE STUDIO EXPERIENCE (Merchant Operating Workspace)              */}
      {/* ---------------------------------------------------------------------- */}
      <Route path="/studio/login" element={<StudioLogin />} />

      <Route
        path="/studio"
        element={
          <ProtectedRoute guard="staff">
            <StudioLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudioOverview />} />
        <Route path="products" element={<StudioProducts />} />
        <Route path="categories" element={<StudioProducts />} />
        <Route path="orders" element={<StudioOrders />} />
        <Route path="customers" element={<StudioOrders />} />
        <Route path="inventory" element={<StudioInventory />} />
        <Route path="finance" element={<StudioFinance />} />
        <Route path="marketing" element={<StudioMarketing />} />
        <Route path="analytics" element={<StudioAnalytics />} />
        <Route path="ai" element={<StudioOverview />} />
        <Route path="store-design" element={<ThemeSelector />} />
        <Route path="integrations" element={<StudioIntegrations />} />
        <Route path="settings" element={<StudioSettings />} />
      </Route>

      {/* ---------------------------------------------------------------------- */}
      {/* FULL-SCREEN 3-PANEL VISUAL CMS WORKSPACE                               */}
      {/* ---------------------------------------------------------------------- */}
      <Route
        path="/studio/editor/:pageId"
        element={
          <ProtectedRoute guard="staff">
            <VisualCmsLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VisualPageEditor />} />
      </Route>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. MASTER CONTROL PANEL (SaaS Platform Operator Domain)                */}
      {/* ---------------------------------------------------------------------- */}
      <Route path="/platform/login" element={<PlatformLogin />} />

      <Route
        path="/platform"
        element={
          <ProtectedRoute guard="platform">
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PlatformDashboard />} />
        <Route path="tenants" element={<PlatformTenants />} />
        <Route path="commercial" element={<PlatformCommercial />} />
        <Route path="domains" element={<PlatformTenants />} />
        <Route path="operators" element={<PlatformDashboard />} />
        <Route path="modules" element={<PlatformDashboard />} />
        <Route path="infrastructure" element={<PlatformDashboard />} />
        <Route path="security" element={<PlatformDashboard />} />
        <Route path="support" element={<PlatformDashboard />} />
        <Route path="system" element={<PlatformDashboard />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
