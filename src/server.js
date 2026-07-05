const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const { CoupleService } = require('./services/coupleService');
const app = require('./app');
const { config } = require('./config/env');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_couple', (coupleId) => {
        socket.join(coupleId);
        console.log(`Socket ${socket.id} joined couple room: ${coupleId}`);
    });

    socket.on('typing', ({ coupleId, userId }) => {
        socket.to(coupleId).emit('partner_typing', { userId });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Export io to be used in services if needed
app.set('io', io);

// Daily cleanup tasks
cron.schedule('0 0 * * *', () => {
    console.log('Running daily breakup checks...');
    CoupleService.checkBreakups();
});

server.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});
