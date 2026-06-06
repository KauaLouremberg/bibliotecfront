const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'acervo-apk-name';

/** Define o nome do APK gerado como Acervo-release.apk / Acervo-debug.apk */
function withAcervoApkName(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) {
      return mod;
    }

    mod.modResults.contents = mod.modResults.contents.replace(
      /(androidResources \{\n        ignoreAssetsPattern[^\n]+\n    \}\n)(})/,
      `$1    // ${MARKER}
    applicationVariants.all { variant ->
        variant.outputs.all { output ->
            output.outputFileName = "Acervo-" + variant.buildType.name + ".apk"
        }
    }
$2`,
    );

    return mod;
  });
}

module.exports = withAcervoApkName;
