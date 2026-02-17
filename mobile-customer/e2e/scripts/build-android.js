const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const androidDir = path.join(projectRoot, 'android');

function run(command, cwd = projectRoot) {
  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
}

function findMainActivityFile(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findMainActivityFile(fullPath);
      if (nested) {
        return nested;
      }
      continue;
    }
    if (entry.name === 'MainActivity.kt' || entry.name === 'MainActivity.java') {
      return fullPath;
    }
  }
  return null;
}

function ensureDetoxAndroidSetup() {
  const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`AndroidManifest.xml not found at ${manifestPath}`);
  }

  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android:usesCleartextTraffic=')) {
    manifest = manifest.replace('<application ', '<application android:usesCleartextTraffic="true" ');
    fs.writeFileSync(manifestPath, manifest, 'utf8');
  }

  const settingsGradlePath = path.join(androidDir, 'settings.gradle');
  if (!fs.existsSync(settingsGradlePath)) {
    throw new Error(`settings.gradle not found at ${settingsGradlePath}`);
  }

  let settingsGradle = fs.readFileSync(settingsGradlePath, 'utf8');
  if (!settingsGradle.includes("include ':detox'")) {
    settingsGradle += `\ninclude ':detox'\nproject(':detox').projectDir = new File(rootProject.projectDir, '../node_modules/detox/android/detox')\n`;
    fs.writeFileSync(settingsGradlePath, settingsGradle, 'utf8');
  }

  const gradlePath = path.join(androidDir, 'app', 'build.gradle');
  if (!fs.existsSync(gradlePath)) {
    throw new Error(`build.gradle not found at ${gradlePath}`);
  }

  let gradle = fs.readFileSync(gradlePath, 'utf8');

  gradle = gradle.replaceAll('.getParentFile().getAbsoluteFile()', '.getParentFile().getCanonicalFile()');

  if (!gradle.includes('testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"')) {
    gradle = gradle.replace(
      /(versionName\s+"[^"]+"\s*\n)/,
      `$1        testBuildType System.getProperty("testBuildType", "debug")\n        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"\n`,
    );
  }

  if (!gradle.includes("missingDimensionStrategy 'detox', 'full'")) {
    gradle = gradle.replace(
      'testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"\n',
      `testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"\n        missingDimensionStrategy 'detox', 'full'\n`,
    );
  }

  gradle = gradle.replaceAll('androidTestImplementation("com.wix:detox:+")', 'androidTestImplementation(project(":detox"))');
  gradle = gradle.replaceAll('androidTestImplementation("androidx.test:runner:1.6.2")\n', '');
  gradle = gradle.replaceAll('androidTestImplementation("androidx.test:core:1.6.1")\n', '');
  gradle = gradle.replaceAll('androidTestImplementation("androidx.test:rules:1.6.1")\n', '');
  gradle = gradle.replaceAll('androidTestImplementation("androidx.test:runner:1.5.2")\n', '');

  if (!gradle.includes('androidTestImplementation(project(":detox"))')) {
    gradle = gradle.replace(
      /dependencies\s*\{\s*\n/,
      `dependencies {\n    androidTestImplementation(project(":detox"))\n`,
    );
  }

  fs.writeFileSync(gradlePath, gradle, 'utf8');

  const mainJavaRoot = path.join(androidDir, 'app', 'src', 'main', 'java');
  const mainActivityPath = findMainActivityFile(mainJavaRoot);
  if (!mainActivityPath) {
    throw new Error(`MainActivity file not found under ${mainJavaRoot}`);
  }

  const activitySource = fs.readFileSync(mainActivityPath, 'utf8');
  const packageMatch = activitySource.match(/^\s*package\s+([A-Za-z0-9_.]+)/m);
  if (!packageMatch) {
    throw new Error(`Unable to detect package declaration in ${mainActivityPath}`);
  }

  const packageName = packageMatch[1];
  const packageDir = packageName.replace(/\./g, path.sep);
  const androidTestDir = path.join(androidDir, 'app', 'src', 'androidTest', 'java', packageDir);
  fs.mkdirSync(androidTestDir, { recursive: true });

  const detoxTestPath = path.join(androidTestDir, 'DetoxTest.java');
  const detoxTestSource = `package ${packageName};

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
  @Rule
  public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

  @Test
  public void runDetoxTests() {
    DetoxConfig config = new DetoxConfig();
    config.idlePolicyConfig.masterTimeoutSec = 90;
    Detox.runTests(mActivityRule, config);
  }
}
`;

  fs.writeFileSync(detoxTestPath, detoxTestSource, 'utf8');
}

run('npx expo prebuild --platform android');
ensureDetoxAndroidSetup();

const gradleWrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const wrapperPath = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

if (!fs.existsSync(wrapperPath)) {
  throw new Error(`Gradle wrapper not found at ${wrapperPath}`);
}

run(`${gradleWrapper} :app:assembleRelease :app:assembleAndroidTest -DtestBuildType=release`, androidDir);
