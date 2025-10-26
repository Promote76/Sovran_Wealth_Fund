module.exports = {
  IELA_ENABLED: process.env.AXIOM_FEATURE_IELA === 'true',
  ALLOW_PUBLISH: process.env.ALLOW_PUBLISH === 'true',
  TWILIO_WEBHOOK_ENABLED: Boolean(process.env.TWILIO_WEBHOOK_SECRET)
};
