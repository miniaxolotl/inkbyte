#!/usr/bin/env bash
set -euo pipefail

version="1.7.12"
platform="$(uname -s)"
architecture="$(uname -m)"

case "$platform:$architecture" in
  Linux:x86_64)
    asset="actionlint_${version}_linux_amd64.tar.gz"
    expected_sha256="8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8"
    ;;
  Linux:aarch64 | Linux:arm64)
    asset="actionlint_${version}_linux_arm64.tar.gz"
    expected_sha256="325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6"
    ;;
  Darwin:x86_64)
    asset="actionlint_${version}_darwin_amd64.tar.gz"
    expected_sha256="5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644"
    ;;
  Darwin:arm64)
    asset="actionlint_${version}_darwin_arm64.tar.gz"
    expected_sha256="aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f"
    ;;
  *)
    echo "Unsupported actionlint platform: $platform $architecture" >&2
    exit 1
    ;;
esac

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cache_directory="$repository_root/node_modules/.cache/actionlint/$version"
binary="$cache_directory/actionlint"

if [[ ! -x "$binary" ]]; then
  temporary_directory="$(mktemp -d)"
  trap 'rm -rf "$temporary_directory"' EXIT
  archive="$temporary_directory/$asset"

  curl --fail --location --silent --show-error \
    "https://github.com/rhysd/actionlint/releases/download/v${version}/${asset}" \
    --output "$archive"

  if command -v sha256sum >/dev/null 2>&1; then
    actual_sha256="$(sha256sum "$archive" | cut -d ' ' -f 1)"
  else
    actual_sha256="$(shasum -a 256 "$archive" | cut -d ' ' -f 1)"
  fi

  if [[ "$actual_sha256" != "$expected_sha256" ]]; then
    echo "actionlint checksum mismatch: expected $expected_sha256, received $actual_sha256" >&2
    exit 1
  fi

  tar -xzf "$archive" -C "$temporary_directory" actionlint
  mkdir -p "$cache_directory"
  install -m 0755 "$temporary_directory/actionlint" "$binary"
fi

"$binary" "$@"
