#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
bin="$root/.tools/gitleaks"
version=8.30.1

if [ ! -x "$bin" ]; then
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)
  case "$os" in
    linux) platform=linux ;;
    darwin) platform=darwin ;;
    *)
      echo "gitleaks: unsupported OS $os" >&2
      exit 1
      ;;
  esac
  case "$arch" in
    x86_64 | amd64) cpu=x64 ;;
    arm64 | aarch64) cpu=arm64 ;;
    *)
      echo "gitleaks: unsupported arch $arch" >&2
      exit 1
      ;;
  esac
  mkdir -p "$root/.tools"
  archive="$root/.tools/gitleaks.tar.gz"
  url="https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_${platform}_${cpu}.tar.gz"
  curl -fsSL -o "$archive" "$url"
  tar -xzf "$archive" -C "$root/.tools" gitleaks
  chmod +x "$bin"
  rm -f "$archive"
fi

exec "$bin" protect --staged --redact --no-banner
