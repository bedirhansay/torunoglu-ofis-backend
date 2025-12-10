export interface AppConfig {
  port: number;
  globalPrefix: string;
  globalPrefixExcludes: string[];
  staticAssetsPath: string;
}

export const appConfig: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  globalPrefix: 'api',
  globalPrefixExcludes: ['/', '/api-json', '/swagger', '/redoc', '/health'],
  staticAssetsPath: 'public',
};
