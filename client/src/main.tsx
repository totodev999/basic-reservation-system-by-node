import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';

import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Start from './pages/start/Start';
import ReservationType from './pages/type/ReservationType';
import Base from './pages/Base';
import Store from './pages/store/Store';
import Reservation from './pages/reservation/Reservation';
// import Base from './pages/Base';

const root = document.getElementById('root');
console.log('root', root);

createRoot(root!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Base />}>
          <Route path="/" element={<Start />} />
          <Route path="/type" element={<ReservationType />} />
          <Route path="/store" element={<Store />} />
          <Route path="/reservation" element={<Reservation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
