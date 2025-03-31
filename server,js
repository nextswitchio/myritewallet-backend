// server.js
const io = require('socket.io')(server);
io.on('connection', (socket) => {
  socket.join(`approver_${socket.user.id}`);
});

// When approval state changes
io.to(`approver_${approverId}`).emit('approval_update', {
  caseId,
  newStatus
});