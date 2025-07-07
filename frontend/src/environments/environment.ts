export const environment = {
  production: false,
  apiUrl: 'https://a6bb-197-136-183-18.ngrok-free.app/',
  frontendUrl: 'http://localhost:4200',
  appName: 'SkillSpark',
  version: '1.0.0',
  maxImageUpload: 10,
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  features: {
    enableAnalytics: false,
    enableErrorReporting: false,
    enablePerformanceMonitoring: false,
  },
  auth: {
    tokenKey: 'skillspark_token',
    refreshTokenKey: 'skillspark_refresh_token',
  },
};
