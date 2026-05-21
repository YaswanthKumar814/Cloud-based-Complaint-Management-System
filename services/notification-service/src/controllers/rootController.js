export function getRoot(_req, res) {
  res.json({
    success: true,
    message: 'Notification Service Running',
    service: 'notification-service',
  });
}
