FROM gitpod/workspace-full
SHELL ["/bin/bash", "-c"]

# Install custom tools, runtimes, etc.
# For example "bastet", a command-line tetris clone:
# RUN brew install bastet
#
# More information: https://www.gitpod.io/docs/config-docker/

# Install Lando
# https://docs.lando.dev/basics/installation.html#install-via-homebrew-third-party
RUN brew update && brew install --cask lando
