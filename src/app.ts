import express from 'express';
import cors from 'cors';
import credentialsRoutes from './routes/identity.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/credentials', credentialsRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});