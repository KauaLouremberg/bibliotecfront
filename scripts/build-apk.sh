#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

JAVA17="/usr/lib/jvm/java-17-openjdk"
if [[ ! -d "$JAVA17" ]]; then
  echo "JDK 17 não encontrado. Instale com:"
  echo "  sudo pacman -S jdk17-openjdk"
  exit 1
fi

export JAVA_HOME="$JAVA17"
export PATH="$JAVA_HOME/bin:$PATH"

echo "Java: $(java -version 2>&1 | head -1)"

if [[ ! -d android ]]; then
  echo "Gerando projeto Android (expo prebuild)..."
  npx expo prebuild --platform android
fi

cd android
./gradlew assembleRelease

APK=$(find app/build/outputs/apk/release -name 'Acervo-release.apk' -o -name 'app-release.apk' 2>/dev/null | head -1)
if [[ -n "$APK" ]]; then
  echo ""
  echo "APK gerado: $APK"
else
  echo "Build concluído. Verifique app/build/outputs/apk/release/"
fi
