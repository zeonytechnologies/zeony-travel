const { withProjectBuildGradle, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withMappls = (config) => {
  config = withProjectBuildGradle(config, async (config) => {
    const buildGradle = config.modResults.contents;
    
    // Check if mappls maven is already added
    if (!buildGradle.includes('maven.mappls.com/repository/mappls/')) {
      config.modResults.contents = buildGradle.replace(
        /allprojects\s*\{\s*repositories\s*\{/g,
        "allprojects {\n  repositories {\n    maven { url 'https://maven.mappls.com/repository/mappls/' }"
      );
    }
    
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const appPath = path.join(config.modRequest.platformProjectRoot, 'app');
      if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath, { recursive: true });
      }
      
      const olfPath = path.join(appPath, 'mappls.a.olf');
      const confPath = path.join(appPath, 'mappls.a.conf');
      
      // Mappls Gradle plugin expects these files to exist
      if (!fs.existsSync(olfPath)) fs.writeFileSync(olfPath, 'dummy');
      if (!fs.existsSync(confPath)) fs.writeFileSync(confPath, 'dummy');
      
      return config;
    },
  ]);

  return config;
};

module.exports = withMappls;
