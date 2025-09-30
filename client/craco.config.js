const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
    configure: (webpackConfig) => {
      // Disable TypeScript type checking for faster builds
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
      
      // Optimize build performance
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      return webpackConfig;
    },
  },
  typescript: {
    enableTypeChecking: false
  }
};