import express from 'express';
import dotenv from 'dotenv';
import storeRoutes from './routes/storeRoutes';
import reservationRoutes from './routes/reservationRoutes';
import reservationTypeRoutes from './routes/reservationTypeRoutes';

dotenv.config();
// 必要に応じて staffs や storeBusinessHours などのルートを追加

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// ルートマウント
app.use('/api/stores', storeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reservation-type', reservationTypeRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
