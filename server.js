const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const { PORT } = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static dashboard files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`QR attendance service running on http://localhost:${PORT}`);
});
