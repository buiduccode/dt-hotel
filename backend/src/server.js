require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const path = require('path');
app.use(express.static(path.join(__dirname, '../../front-end')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front-end/index.html'));
});