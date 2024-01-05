// Підключення необхідних бібліотек
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

require('dotenv').config();


const app = express();
const port = process.env.PORT;

// Підключення до бази даних MongoDB
mongoose.connect(process.env.MONGODB_CONNECT_URI);

// Визначення схеми користувача в базі даних
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

// Створення моделі користувача на основі схеми
const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());

app.use(cors({ origin: 'http://localhost:4200' }));

// Функція для генерації JWT токена на основі даних користувача
function generateToken(user) {
    return jwt.sign({ id: user._id, email: user.email, password: user.password }, 'your-secret-key', { expiresIn: '24h' });
}

// Обробник запиту POST для створення нового користувача
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: 'Користувач з таким email вже існує' });
        }

        const newUser = new User({
            name,
            email,
            password,
        });

        await newUser.save();

        const token = generateToken(newUser);
        res.status(201).json({ message: 'Користувач успішно доданий!', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// Обробник запиту POST для авторизації користувача за допомогою JWT токена
app.post('/api/users/login', async (req, res) => {
    try {
        let user;

        if (req.body.token) {
            const { token } = req.body;
            const decodedToken = jwt.verify(token, 'your-secret-key');
            user = await User.findOne({ email: decodedToken.email });
        } else {
            const { email, password } = req.body;

            user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ message: 'Неправильні дані авторизації' });
            }

            if (password !== user.password) {
                return res.status(401).json({ message: 'Неправильні дані авторизації' });
            }
        }

        const newToken = generateToken(user);

        res.status(200).json({ message: 'Вхід успішний', token: newToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// Прослуховування запитів на заданому порту
app.listen(port, () => {
    console.log(`Сервер запущено на порту ${port}`);
});
