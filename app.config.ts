import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "com.reiz_buh.algebrawls.dev";
  if (IS_PREVIEW) return "com.reiz_buh.algebrawls.preview";
  return "com.reiz_buh.algebrawls";
};

const getAppName = () => {
  if (IS_DEV) return "algebrawls (Dev)";
  if (IS_PREVIEW) return "algebrawls (Preview)";
  return "algebrawls";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "algebrawls",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logos/Logo1.png",
  scheme: "algebrawls",
  userInterfaceStyle: "automatic",
  updates: {
    url: "https://u.expo.dev/f7ea3bec-3838-41a9-ae10-1f5a6ea7c266",
    fallbackToCacheTimeout: 0,
    checkAutomatically: "ON_LOAD",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  ios: {
    icon: "./assets/images/logos/Logo1.png",
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/logos/Logo1.png",
    },
    predictiveBackGestureEnabled: false,
    package: getUniqueIdentifier(),
  },
  web: {
    output: "static",
    favicon: "./assets/images/logos/Logo1.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        android: {
          image: "./assets/images/logos/Logo1.png",
          imageWidth: 76,
        },
      },
    ],
    "expo-image",
    "expo-font",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "f7ea3bec-3838-41a9-ae10-1f5a6ea7c266",
    },
  },
});
