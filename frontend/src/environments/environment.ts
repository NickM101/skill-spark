export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
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
