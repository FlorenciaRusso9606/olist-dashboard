import { app } from './app';

const PORT = process.env.BACKEND_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`KPIs:   http://localhost:${PORT}/api/kpis?from=2017-01-01&to=2018-12-31`);
});