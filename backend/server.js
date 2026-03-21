const app = require('./src/app');
const connectDb = require('./src/config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  const dbConnected = await connectDb();
  app.listen(PORT, () => {
    console.log(`Wandr backend running on port ${PORT}`);
    if (!dbConnected) {
      console.log('Running in limited mode: auth and saved trips require MongoDB.');
    }
  });
})();
