/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import CommissionForm from './components/CommissionForm';
import ProgressTracker from './components/ProgressTracker';
import AdminPortal from './components/AdminPortal';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/commission" element={<CommissionForm />} />
          <Route path="/track" element={<ProgressTracker />} />
          <Route path="/admin" element={<AdminPortal />} />
        </Routes>
      </Layout>
    </Router>
  );
}
